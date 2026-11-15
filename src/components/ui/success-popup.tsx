"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { LottieAnimation } from "@/components/ui/lottie-animation";

type Props = {
  show: boolean;
  message?: string;
  onClose?: () => void;
};

export function SuccessPopup({ show, message = "Criado com sucesso!", onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setExiting(false);
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          onClose?.();
        }, 260);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!visible) return null;

  return (
    <div className="success-popup-overlay" onClick={() => { setExiting(true); setTimeout(() => { setVisible(false); onClose?.(); }, 260); }}>
      <div className={`success-popup-card hx-dark-surface ${exiting ? "exiting" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center">
          <LottieAnimation
            name="success"
            className="h-20 w-20"
            fallback={
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </span>
            }
          />
        </div>
        <p className="text-lg font-bold text-white">{message}</p>
        <p className="mt-1 text-sm text-slate-400">Você pode fechar esta janela.</p>
      </div>
    </div>
  );
}
