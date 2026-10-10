"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4">
          <div className="max-w-md rounded-xl border border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl shadow-black/30">
            <h2 className="mb-4 text-2xl font-bold text-white">Algo deu errado</h2>
            <p className="mb-6 text-slate-400">
              Ocorreu um erro inesperado. Por favor, tente recarregar a página.
            </p>
            <button onClick={() => window.location.reload()} className="hx-btn-primary px-6">
              Recarregar página
            </button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-slate-500">
                  Detalhes do erro
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-slate-950/70 p-4 text-xs text-red-200">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
