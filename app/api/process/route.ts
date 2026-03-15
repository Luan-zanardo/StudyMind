import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import AdmZip from "adm-zip";

export const dynamic = "force-dynamic";

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
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API_KEY não configurada" }, { status: 500 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });

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

    // Prompt ajustado para Tópicos Citados e Explicados
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

    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (err: any) {
    return NextResponse.json({ error: "Erro na IA", details: err.message }, { status: 500 });
  }
}
