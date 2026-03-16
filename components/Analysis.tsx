"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Award, FileText, Clock, Trash2, ChevronDown, ChevronUp, Loader2, CheckCircle2, Circle } from "lucide-react";

interface StudySession {
  id: string;
  created_at: string;
  score: number;
  total: number;
  topic: string;
}

interface GroupedData {
  [topic: string]: {
    sessions: StudySession[];
    totalQuestions: number;
    totalCorrect: number;
    lastDate: string;
  };
}

export default function Analysis({ user }: { user: any }) {
  const [history, setHistory] = useState<StudySession[]>([]);
  const [completedStatus, setCompletedStatus] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      const { data: historyData } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (historyData) setHistory(historyData);

      const { data: statusData } = await supabase
        .from("material_status")
        .select("topic, is_completed")
        .eq("user_id", user.id);

      if (statusData) {
        const statusMap = statusData.reduce((acc, status) => {
          acc[status.topic] = status.is_completed;
          return acc;
        }, {} as { [key: string]: boolean });
        setCompletedStatus(statusMap);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const toggleTopicCompletion = async (topic: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const isCurrentlyCompleted = completedStatus[topic] || false;
    const newStatus = !isCurrentlyCompleted;

    setCompletedStatus(prev => ({ ...prev, [topic]: newStatus }));

    await supabase.from("material_status").upsert(
      { user_id: user.id, topic: topic, is_completed: newStatus },
      { onConflict: 'user_id, topic' }
    );
  };

  const clearHistory = async () => {
    if (confirm("Deseja realmente apagar todo o histórico de estudos?")) {
      await supabase.from("study_sessions").delete().eq("user_id", user.id);
      setHistory([]);
    }
  };

  if (loading) return <div className="h-[400px] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

  const grouped: GroupedData = history.reduce((acc: GroupedData, curr) => {
    if (!acc[curr.topic]) {
      acc[curr.topic] = { sessions: [], totalQuestions: 0, totalCorrect: 0, lastDate: curr.created_at };
    }
    acc[curr.topic].sessions.push(curr);
    acc[curr.topic].totalQuestions += curr.total;
    acc[curr.topic].totalCorrect += curr.score;
    return acc;
  }, {});

  const topics = Object.keys(grouped);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black tracking-tighter text-white">Histórico de Materiais</h2>
        <button onClick={clearHistory} className="text-zinc-600 hover:text-red-400 text-xs font-black uppercase tracking-widest transition flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Limpar Tudo
        </button>
      </div>

      {topics.length > 0 ? (
        <div className="grid gap-6">
          {topics.map((topic) => {
            const data = grouped[topic];
            const accuracy = (data.totalCorrect / data.totalQuestions) * 100;
            const isExpanded = expandedTopic === topic;
            const isCompleted = completedStatus[topic] || false;

            let topicBorderClass = "border-white/5 hover:border-white/10";
            if (isCompleted) {
              topicBorderClass = "!border-emerald-500";
            } else if (isExpanded) {
              topicBorderClass = "border-indigo-500/50 bg-white/[0.05]";
            }

            return (
              <div 
                key={topic} 
                className={`bg-white/[0.03] border rounded-[2.5rem] transition-all overflow-hidden ${topicBorderClass}`}
              >
                <div className="w-full flex flex-col justify-between gap-4 px-6 py-4 md:flex-row md:items-center md:gap-6 md:p-8">
                    {/* --- Mobile Layout --- */}
                    <div className="md:hidden flex flex-col gap-4">
                        {/* First Line: Icon + Title */}
                        <div className="flex items-center gap-3" onClick={() => setExpandedTopic(isExpanded ? null : topic)}>
                            {/* File Icon */}
                            <div className="relative flex-shrink-0">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${isCompleted ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10"}`}>
                                    <FileText className={`w-5 h-5 ${isCompleted ? "text-emerald-500" : "text-zinc-600"}`} />
                                </div>
                            </div>
                            {/* Topic Title */}
                            <h3 className="text-base font-bold text-white truncate max-w-[calc(100%-70px)]">{topic}</h3>
                        </div>

                        {/* Second Line: Checklist + Attempts + Accuracy + Expand Button */}
                        <div className="flex items-center justify-between">
                            {/* Checklist Control */}
                            <div
                                className="cursor-pointer flex-shrink-0"
                                onClick={(e) => toggleTopicCompletion(topic, e)}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-300
                                    ${isCompleted ? "bg-emerald-500 border-emerald-500" : "bg-white/5 border-white/10"}`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-zinc-600" />
                                    )}
                                </div>
                            </div>

                            {/* Attempts */}
                            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">
                                {data.sessions.length} Tentativas
                            </p>

                            {/* Accuracy + Expand Button */}
                            <div className="flex items-center gap-4">
                                <div className="text-right min-w-[60px]">
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Média</p>
                                    <p className={`text-base font-black ${accuracy >= 70 ? 'text-emerald-400' : 'text-indigo-400'}`}>{accuracy.toFixed(0)}%</p>
                                </div>

                                <button onClick={() => setExpandedTopic(isExpanded ? null : topic)} className="p-1 hover:bg-white/5 rounded-lg transition">
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- Desktop Layout --- */}
                    <div className="hidden md:flex w-full md:flex-row md:items-center justify-between gap-6 p-4 md:p-8"> {/* Original desktop layout, slightly adjusted padding */}
                        <div className="flex items-center gap-2 md:gap-5 flex-1" onClick={() => setExpandedTopic(isExpanded ? null : topic)}>
                            {/* Checklist Control */}
                            <div 
                                className="cursor-pointer flex-shrink-0" 
                                onClick={(e) => toggleTopicCompletion(topic, e)}
                            >
                                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border transition-all duration-300
                                    ${isCompleted ? "bg-emerald-500 border-emerald-500" : "bg-white/5 border-white/10"}`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7 text-white" />
                                    ) : (
                                        <Circle className="w-5 h-5 md:w-7 md:h-7 text-zinc-600" />
                                    )}
                                </div>
                            </div>

                            {/* File Icon */}
                            <div className="relative">
                                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border transition-colors ${isCompleted ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10"}`}>
                                    <FileText className={`w-5 h-5 md:w-7 md:h-7 ${isCompleted ? "text-emerald-500" : "text-zinc-600"}`} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white md:text-xl truncate md:max-w-md">{topic}</h3>
                                {/* Re-adding the Tentativas text for desktop, as it was removed for mobile simplicity */}
                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">
                                    {data.sessions.length} Tentativas
                                </p>
                            </div>
                        </div>

                        {/* Right Side: Average Score, Expand Button */}
                        <div className="flex items-center gap-8">
                            <div className="text-right min-w-[80px]">
                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Média</p>
                                <p className={`text-2xl font-black ${accuracy >= 70 ? 'text-emerald-400' : 'text-indigo-400'}`}>{accuracy.toFixed(0)}%</p>
                            </div>

                            <button onClick={() => setExpandedTopic(isExpanded ? null : topic)} className="p-2 hover:bg-white/5 rounded-lg transition">
                                {isExpanded ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
                            </button>
                        </div>
                    </div>
                </div>

                {isExpanded && (
                  <div className="px-8 pb-8 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="h-px bg-white/5 mb-6" />
                    {data.sessions.map((session, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <Clock className="w-4 h-4 text-zinc-700" />
                          <span className="text-sm font-medium text-zinc-400">{new Date(session.created_at).toLocaleDateString('pt-BR')} às {new Date(session.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className="text-sm font-bold text-white">{session.score} / {session.total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 border-dashed rounded-[3rem] p-10 text-center">
          <Award className="w-16 h-16 text-zinc-800 mx-auto mb-6 opacity-20" />
          <h3 className="text-xl font-bold text-zinc-500 mb-2">Sem histórico</h3>
          <p className="text-zinc-600 font-medium mx-auto md:max-w-xs">As sessões e seu histórico de estudos serão salvos na sua conta.</p>
        </div>
      )}
    </div>
  );
}