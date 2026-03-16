import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import AdmZip from "adm-zip";
import { createClient } from '@supabase/supabase-js'

export const dynamic = "force-dynamic";

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function extractPptxText(buffer: Buffer): Promise<string> {
  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    let fullText = "";
    for (const entry of zipEntries) {
      if (entry.entryName.startsWith("ppt/slides/slide") && entry.entryName.endsWith(".xml")) {
        const slideXml = entry.getData().toString("utf8");
        const cleanText = slideXml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        fullText += cleanText + "\n";
      }
    }
    return fullText;
  } catch (e) {
    throw new Error("Falha ao processar o arquivo PowerPoint.");
  }
}

export async function POST(req: NextRequest) {
  try {
    // Log environment variables to check if they are loaded
    console.log("NEXT_PUBLIC_GEMINI_API_KEY:", process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "Loaded" : "Not Loaded");
    console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Loaded" : "Not Loaded");
    console.log("SUPABASE_SERVICE_KEY:", process.env.SUPABASE_SERVICE_KEY ? "Loaded" : "Not Loaded");

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API_KEY não configurada" }, { status: 500 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    if (!userId) return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });

    // Check if file was already processed
    console.log("Checking for existing material for user:", userId, "file:", file.name);
    const { data: existingMaterial, error: existingError } = await supabase
      .from('processed_materials')
      .select('ai_content')
      .eq('user_id', userId)
      .eq('file_name', file.name)
      .single();

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 means no rows found (expected for new files)
      console.error("Supabase Existing Material Check Error:", existingError);
      throw new Error(`Erro ao verificar material existente: ${existingError.message}`);
    }

    if (existingMaterial) {
      console.log("Existing material found, returning cached content.");
      return NextResponse.json(existingMaterial.ai_content);
    }
    
    console.log("No existing material found, processing new file.");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let text = "";

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const pdfData = await pdf(buffer);
      text = pdfData.text;
    } else if (file.name.toLowerCase().endsWith(".pptx")) {
      text = await extractPptxText(buffer);
    }

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: "Conteúdo insuficiente" }, { status: 400 });
    }

    const prompt = `Atue como um tutor acadêmico de elite. Analise o conteúdo fornecido e gere:
    1. Um RESUMO ESTRUTURADO. Identifique os temas/tópicos centrais. Para cada tópico, dê um título curto e uma explicação profunda e detalhada.
    2. 5 questões de múltipla escolha (4 opções, indicar a correta de 0 a 3).
    3. 4 flashcards (frente/verso).

    RETORNE APENAS O JSON NO FORMATO:
    {
      "resumo": [
        { "topico": "Nome do Tópico 1", "explicacao": "Explicação completa e detalhada aqui..." },
        { "topico": "Nome do Tópico 2", "explicacao": "Explicação completa e detalhada aqui..." }
      ],
      "questoes": [{"enunciado": "...", "opcoes": ["...", "...", "...", "..."], "correta": 0}],
      "flashcards": [{"frente": "...", "verso": "..."}]
    }
    TEXTO: ${text.substring(0, 10000)}`;

    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listRes.json();
    const validModels = listData.models?.filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))?.map((m: any) => m.name) || [];
    const priority = ["models/gemini-1.5-flash", "models/gemini-1.5-flash-8b", "models/gemini-pro"];
    let targetModel = priority.find(p => validModels.includes(p)) || validModels[0];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const result = await response.json();
    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("IA não retornou JSON.");

    const aiContent = JSON.parse(jsonMatch[0]);

    // Sanitize file name for URL-safe storage key
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.\-_]/g, '-') // Replace problematic chars with hyphen
      .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .toLowerCase();

    // Upload file to Supabase Storage
    console.log("Attempting to upload file to Supabase Storage:", sanitizedFileName);
    const filePath = `${userId}/${sanitizedFileName}`;
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      throw new Error(`Falha no upload para o Supabase Storage: ${uploadError.message}`);
    }
    console.log("File uploaded to Supabase Storage successfully.");

    // Save metadata to database
    console.log("Attempting to insert into processed_materials with data for user:", userId);
    const { error: dbError } = await supabase
      .from('processed_materials')
      .insert({
        user_id: userId,
        file_name: file.name, // Keep original file name in DB for display
        file_path: filePath,
        ai_content: aiContent
      });

    if (dbError) {
      console.error("Supabase DB Insert Error:", dbError);
      throw new Error(`Falha ao salvar metadados no Supabase: ${dbError.message}`);
    }
    console.log("Successfully inserted into processed_materials.");

    return NextResponse.json(aiContent);

  } catch (err: any) {
    console.error("General API Error:", err);
    return NextResponse.json({ error: "Erro na IA", details: err.message }, { status: 500 });
  }
}
