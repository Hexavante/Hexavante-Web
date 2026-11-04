import { Eye, EyeOff } from "lucide-react";

type Props = { inputId: string; visible: boolean; onToggle: () => void };

export function PasswordToggle({ inputId, visible, onToggle }: Props) {
  const target = inputId === "confirmPassword" ? "confirmação da senha" : "senha";
  const label = (visible ? "Ocultar " : "Mostrar ") + target;
  return (
    <button type="button" aria-label={label} title={label} aria-controls={inputId}
      onClick={onToggle}
      className="absolute inset-y-0 right-0 z-10 grid w-12 place-items-center rounded-r-xl text-sky-200 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400">
      {visible ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
    </button>
  );
}
