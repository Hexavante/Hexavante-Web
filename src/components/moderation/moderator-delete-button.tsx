"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Props = {
  action: () => Promise<{ success: boolean; error?: string; message?: string }>;
  label?: string;
  confirmMessage: string;
};

export function ModeratorDeleteButton({
  action,
  label = "Excluir",
  confirmMessage,
}: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(async () => {
          const result = await action();
          if (result.success) {
            toast(result.message ?? "Conteúdo removido.", "success");
            router.refresh();
          } else {
            toast(result.error ?? "Erro ao excluir.", "error");
          }
        });
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
