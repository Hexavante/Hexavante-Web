"use client";

import { Download, FileText, FolderDown } from "lucide-react";

type Material = {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
};

type Props = {
  moduleTitle: string;
  materials: Material[];
};

export function ModuleMaterialsPanel({ moduleTitle, materials }: Props) {
  if (materials.length === 0) return null;

  function downloadAll() {
    for (const material of materials) {
      window.open(material.fileUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">Materiais do módulo</h3>
          <p className="mt-1 text-sm text-slate-400">{moduleTitle}</p>
        </div>
        {materials.length > 1 && (
          <button
            type="button"
            onClick={downloadAll}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-400/15"
          >
            <FolderDown className="h-4 w-4" />
            Baixar todos ({materials.length})
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {materials.map((mat) => (
          <li key={mat.id}>
            <a
              href={mat.fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-slate-950/30 px-3 py-3 text-sm transition hover:border-sky-400/30 hover:bg-sky-400/5"
            >
              <span className="flex min-w-0 items-center gap-2 text-slate-200">
                <FileText className="h-4 w-4 shrink-0 text-sky-300" />
                <span className="truncate">
                  {mat.title}{" "}
                  <span className="text-slate-500">({mat.fileType.toUpperCase()})</span>
                </span>
              </span>
              <Download className="h-4 w-4 shrink-0 text-slate-400" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
