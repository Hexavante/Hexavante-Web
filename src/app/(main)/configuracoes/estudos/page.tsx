"use client";

import { useState, useEffect } from "react";
import { Sliders, GitFork, Network, ListTree, Calendar, Sparkles, Check, Save } from "lucide-react";
import { getStudyPreferences, updateStudyPreferences, StudyPreferences } from "@/lib/go-api";
import { useToast } from "@/components/ui/toast";

export default function StudyPreferencesPage() {
  const [prefs, setPrefs] = useState<StudyPreferences>({
    userId: "",
    diagramType: "auto",
    detailLevel: "intermediate",
    autoSuggest: true,
    animations: true,
    autoSaveNotes: true,
    updatedAt: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getStudyPreferences().then((res) => {
      if (res.success && res.data) {
        setPrefs(res.data);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (updated: Partial<StudyPreferences>) => {
    const nextState = { ...prefs, ...updated };
    setPrefs(nextState);
    setSaving(true);
    const res = await updateStudyPreferences(nextState);
    setSaving(false);
    if (res.success) {
      toast("Preferências salvas com sucesso!", "success");
    } else {
      toast("Erro ao salvar preferências.", "error");
    }
  };

  const diagramOptions = [
    { id: "auto", label: "Automático (recomendado)", desc: "O sistema escolhe o melhor formato conforme o assunto", icon: Sparkles },
    { id: "flowchart", label: "Fluxograma", desc: "Ideal para passos, regras e caminhos de decisão", icon: GitFork },
    { id: "mindmap", label: "Mapa Mental", desc: "Melhor para conexões e teias conceituais", icon: Network },
    { id: "timeline", label: "Linha do Tempo", desc: "Ideal para eventos históricos e sequências temporais", icon: Calendar },
    { id: "sequence", label: "Sequência", desc: "Perfeito para interações entre participantes ou sistemas", icon: ListTree },
  ];

  const detailOptions = [
    { id: "simple", label: "Simples", desc: "Passos essenciais e visão direta" },
    { id: "intermediate", label: "Intermediário", desc: "Equilíbrio entre síntese e contexto" },
    { id: "advanced", label: "Avançado", desc: "Mais relações, nuances e profundidade" },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="h-64 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white">
          <Sliders className="h-6 w-6 text-emerald-400" />
          Personalização de Estudos & Visual Learning
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Você tem total controle sobre como o conteúdo é representado. Escolha seu estilo favorito para diagramas e anotações.
        </p>
      </div>

      <div className="space-y-6">
        {/* Seletor de Tipo de Diagrama */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-base font-semibold text-white">Estilo de Diagrama Padrão</h2>
          <p className="mb-4 text-xs text-slate-400">
            Formato inicial exibido durante as aulas explicativas (você pode alternar a qualquer momento na aula).
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {diagramOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = prefs.diagramType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSave({ diagramType: opt.id as any })}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10 text-white shadow-lg"
                      : "border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className={`mt-0.5 rounded-lg p-2 ${isSelected ? "bg-emerald-500 text-black" : "bg-white/10 text-slate-400"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{opt.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nível de Detalhamento */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-base font-semibold text-white">Nível de Detalhamento dos Diagramas</h2>
          <p className="mb-4 text-xs text-slate-400">
            Define a profundidade das caixas conceituais e notas geradas.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {detailOptions.map((opt) => {
              const isSelected = prefs.detailLevel === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSave({ detailLevel: opt.id as any })}
                  className={`flex flex-col justify-between rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                      : "border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{opt.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Outros Controles (Autosave, Animações, Sugestões) */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-base font-semibold text-white">Controles do Caderno & Fluidez</h2>
          <div className="mt-4 divide-y divide-white/5">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-white">Salvamento Automático das Smart Notes</p>
                <p className="text-xs text-slate-400">Sincroniza suas notas em milissegundos enquanto você digita</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.autoSaveNotes}
                onChange={(e) => handleSave({ autoSaveNotes: e.target.checked })}
                className="h-5 w-5 accent-emerald-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-white">Sugestões Automáticas de Estilo</p>
                <p className="text-xs text-slate-400">Recomenda o melhor diagrama dependendo se o tema é lógica, história ou redes</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.autoSuggest}
                onChange={(e) => handleSave({ autoSuggest: e.target.checked })}
                className="h-5 w-5 accent-emerald-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-white">Animações de Transição</p>
                <p className="text-xs text-slate-400">Anima nós e conexões nos fluxogramas para maior conforto visual</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.animations}
                onChange={(e) => handleSave({ animations: e.target.checked })}
                className="h-5 w-5 accent-emerald-500 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
