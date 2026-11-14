"use client";

import { useActionState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction, type ProfileActionResult } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { themeUi } from "@/lib/theme-ui";
import { Loader2, Check, AlertCircle } from "lucide-react";

type ProfileData = {
  fullName: string;
  bio: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  profileVisibility: string;
};

type Props = {
  profile: ProfileData;
};

const initialState: ProfileActionResult = { success: false };

export function ProfileEditForm({ profile }: Props) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const { toast } = useToast();
  const router = useRouter();
  const fieldIds = {
    fullName: useId(),
    bio: useId(),
    phone: useId(),
    city: useId(),
    state: useId(),
    profileVisibility: useId(),
  };

  useEffect(() => {
    if (state.success) {
      toast("Perfil atualizado! Seu nome foi atualizado em todo o app.", "success");
      router.refresh();
    } else if (state.error && !state.fieldErrors) {
      toast(state.error, "error");
    }
  }, [state, toast, router]);

  interface FieldConfig {
  name: keyof ProfileData;
  label: string;
  type: "text" | "textarea" | "tel" | "select";
  required: boolean;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  options?: { value: string; label: string }[];
}

const fieldConfigs: FieldConfig[] = [
    {
      name: "fullName",
      label: "Nome completo",
      type: "text",
      required: true,
      placeholder: "Seu nome completo",
    },
    {
      name: "bio",
      label: "Bio",
      type: "textarea",
      required: false,
      placeholder: "Conte um pouco sobre você e seus objetivos de estudo...",
      rows: 3,
    },
    {
      name: "phone",
      label: "Telefone",
      type: "tel",
      required: false,
      placeholder: "(11) 99999-9999",
    },
    {
      name: "city",
      label: "Cidade",
      type: "text",
      required: false,
      placeholder: "São Paulo",
    },
    {
      name: "state",
      label: "Estado (UF)",
      type: "text",
      required: false,
      placeholder: "SP",
      maxLength: 2,
    },
    {
      name: "profileVisibility",
      label: "Visibilidade do perfil",
      type: "select",
      required: false,
      options: [
        { value: "private", label: "Privado" },
        { value: "public", label: "Público" },
      ],
    },
  ];

  return (
    <Card padding="lg" className={cn(themeUi.cardEntrance, themeUi.hoverLift)}>
      <h2 className="text-lg font-bold text-white">Dados pessoais</h2>
      <p className="mt-1 text-sm text-slate-400">
        Atualize suas informações públicas e de contato.
      </p>

      <form action={formAction} className="mt-5 space-y-5" noValidate>
        {fieldConfigs.map((field) => {
          const fieldName = field.name as keyof ProfileData;
          const error = state.fieldErrors?.[fieldName];
          const hasError = Boolean(error);
          const fieldId = fieldIds[fieldName];

          return (
            <div
              key={fieldName}
              className={cn("transition-all duration-300", hasError && "animate-shake")}
            >
              <Label
                htmlFor={fieldId}
                className={cn("transition-colors", hasError && "text-red-300")}
              >
                {field.label}
              </Label>

              {field.type === "textarea" ? (
                <Textarea
                  id={fieldId}
                  name={fieldName}
                  rows={field.rows || 3}
                  defaultValue={(profile[fieldName] as string) ?? ""}
                  placeholder={field.placeholder}
                  required={field.required}
                  className={cn(
                    themeUi.inputFocus,
                    themeUi.transitionSmooth,
                    hasError && "border-red-400/50 focus-visible:border-red-400/60",
                  )}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? `${fieldId}-error` : undefined}
                />
              ) : field.type === "select" ? (
                <NativeSelect
                  id={fieldId}
                  name={fieldName}
                  defaultValue={profile[fieldName] as string}
                  className={cn(
                    themeUi.inputFocus,
                    themeUi.transitionSmooth,
                    hasError && "border-red-400/50 focus-visible:border-red-400/60",
                  )}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? `${fieldId}-error` : undefined}
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </NativeSelect>
              ) : (
                <Input
                  id={fieldId}
                  name={fieldName}
                  type={field.type}
                  defaultValue={(profile[fieldName] as string) ?? ""}
                  placeholder={field.placeholder}
                  required={field.required}
                  maxLength={field.maxLength}
                  className={cn(
                    themeUi.inputFocus,
                    themeUi.transitionSmooth,
                    hasError && "border-red-400/50 focus-visible:border-red-400/60",
                  )}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? `${fieldId}-error` : undefined}
                />
              )}

              {hasError && (
                <p
                  id={`${fieldId}-error`}
                  className="mt-1.5 flex items-center gap-1.5 text-xs text-red-300 "
                  role="alert"
                >
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}
            </div>
          );
        })}

        <div className="pt-2">
          <Button
            type="submit"
            disabled={pending}
            className={cn("w-full", themeUi.btnPress, themeUi.transitionSpring)}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                Salvar alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
