"use client";

import { useActionState, useEffect, useState } from "react";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import type { ActionResult } from "@/app/actions/auth";
import { PasswordToggle } from "./password-toggle";
import { AppLink } from "@/components/ui/app-link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

type Field = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  /** renderiza como checkbox de aceite (ex: termos) */
  checkbox?: boolean;
  /** agrupa com o próximo campo half em 2 colunas */
  half?: boolean;
};

type AuthFormProps = {
  title: string;
  subtitle: string;
  fields: Field[];
  submitLabel: string;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  footer?: React.ReactNode;
  callbackUrl?: string;
  formKind: "login" | "register";
  embedded?: boolean;
};

const validationSchemas = {
  login: loginSchema,
  register: registerSchema,
} as const;

const initialState: ActionResult = { success: false };

const fieldIcons: Record<string, typeof Mail> = {
  email: Mail,
  password: Lock,
};

function groupFields(fields: Field[]): { field: Field; index: number }[][] {
  const rows: { field: Field; index: number }[][] = [];
  let i = 0;
  while (i < fields.length) {
    const field = fields[i];
    if (field.half && fields[i + 1]?.half) {
      rows.push([
        { field, index: i },
        { field: fields[i + 1], index: i + 1 },
      ]);
      i += 2;
    } else {
      rows.push([{ field, index: i }]);
      i += 1;
    }
  }
  return rows;
}

export function AuthForm({
  title,
  subtitle,
  fields,
  submitLabel,
  action,
  footer,
  callbackUrl = "/",
  formKind,
  embedded = false,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});

  const fieldErrors = { ...clientErrors, ...state.fieldErrors };
  const pendingLabel = formKind === "login" ? "Entrando..." : "Aguarde...";

  useEffect(() => {
    if (state.success && state.redirectTo) {
      window.location.assign(state.redirectTo);
    }
  }, [state.success, state.redirectTo]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const validationSchema = validationSchemas[formKind];
    const raw = Object.fromEntries(fields.map((field) => [field.name, formData.get(field.name)]));
    const parsed = validationSchema.safeParse(raw);

    if (!parsed.success) {
      event.preventDefault();
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !errors[key]) errors[key] = issue.message;
      }
      setClientErrors(errors);
      const firstInvalid = fields.find((field) => errors[field.name]);
      if (firstInvalid) {
        const control = event.currentTarget.elements.namedItem(firstInvalid.name);
        if (control instanceof HTMLElement) control.focus();
      }
      return;
    }

    setClientErrors({});
  };

  const togglePassword = (name: string) =>
    setVisiblePasswords((prev) => ({ ...prev, [name]: !prev[name] }));

  const renderField = (field: Field, index: number) => {
    if (field.checkbox) {
      return (
        <div key={field.name} className=" ">
          <div className="flex items-start gap-2">
            <Checkbox id={field.name} name={field.name} className="mt-0.5" />
            <Label htmlFor={field.name} className="text-xs font-normal leading-5 text-slate-300 cursor-pointer">
              Li e aceito os{" "}
              <AppLink href="/privacidade">Termos de Uso</AppLink> e a{" "}
              <AppLink href="/privacidade">Política de Privacidade</AppLink>.
            </Label>
          </div>
          {fieldErrors[field.name] && (
            <p className="mt-1 text-xs text-red-300">{fieldErrors[field.name]}</p>
          )}
        </div>
      );
    }

    const Icon = formKind === "login" ? fieldIcons[field.name] : undefined;
    const isPassword = (field.type ?? "text") === "password";
    const showPassword = Boolean(visiblePasswords[field.name]);

    return (
      <div key={field.name} className=" min-w-0">
        <Label htmlFor={field.name}>{field.label}</Label>
        <div className="relative">
          {Icon ? (
            <Icon
              className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
          ) : null}
          <Input
            id={field.name}
            name={field.name}
            value={values[field.name] ?? ""}
            onChange={(event) => setValues((previous) => ({ ...previous, [field.name]: event.target.value }))}
            autoComplete={isPassword ? (formKind === "login" ? "current-password" : "new-password") : field.name === "email" ? "email" : field.name === "username" ? "username" : undefined}
            type={isPassword && showPassword ? "text" : (field.type ?? "text")}
            required={field.required ?? true}
            placeholder={field.placeholder}
            aria-invalid={Boolean(fieldErrors[field.name])}
            aria-describedby={fieldErrors[field.name] ? `${field.name}-error` : undefined}
            className={cn(
              "h-11 transition",
              Icon && "pl-10",
              isPassword && "pr-12",
              fieldErrors[field.name] && "border-red-400/50 focus-visible:border-red-400/60",
            )}
          />
          {isPassword ? (
            <PasswordToggle inputId={field.name} visible={showPassword} onToggle={() => togglePassword(field.name)} />
          ) : null}
        </div>
        {fieldErrors[field.name] && (
          <p id={`${field.name}-error`} role="alert" className="mt-1 text-xs text-red-300">{fieldErrors[field.name]}</p>
        )}
        {formKind === "login" && field.name === "password" && (
          <p className="mt-2 text-right text-sm">
            <AppLink href="/recuperar-senha">Esqueceu a senha?</AppLink>
          </p>
        )}
      </div>
    );
  };

  const rows = groupFields(fields);

  const formContent = (
    <>
      <div className={embedded ? "mb-6" : "mb-7"}>
        <p className=" text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{embedded && formKind === "login" ? "Bem-vindo de volta" : "Hexavante"}</p>
        <h1 className={cn(" mt-2 font-black tracking-tight text-white", embedded && formKind === "login" ? "text-3xl" : "text-2xl")}>{title}</h1>
        <p className=" mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>
      </div>

      <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        {rows.map((row) =>
          row.length > 1 ? (
            <div key={row.map((c) => c.field.name).join("-")} className="grid gap-4 sm:grid-cols-2">
              {row.map(({ field, index }) => renderField(field, index))}
            </div>
          ) : (
            <div key={row[0].field.name}>{renderField(row[0].field, row[0].index)}</div>
          ),
        )}

        {formKind === "login" && (
          <div className=" flex items-center gap-2">
            <Checkbox id="rememberMe" name="rememberMe" />
            <Label htmlFor="rememberMe" className="text-sm font-normal text-slate-300 cursor-pointer">
              Lembrar-me
            </Label>
          </div>
        )}

        {state.error && (
          <Alert variant={Object.keys(fieldErrors).length ? "warning" : "danger"}>
            {state.error}
          </Alert>
        )}

        <div className=" ">
          <Button type="submit" disabled={pending} className="hx-lift mt-2 h-11 w-full" size="lg">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {pendingLabel}
              </>
            ) : (
              <>{submitLabel}{embedded && formKind === "login" && <ArrowRight className="h-4 w-4" aria-hidden="true" />}</>
            )}
          </Button>
        </div>
      </form>

      {footer && <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>}
    </>
  );

  if (embedded) {
    return <div className="w-full">{formContent}</div>;
  }

  return (
    <Card className=" w-full max-w-md p-8 shadow-2xl shadow-black/30 backdrop-blur">
      {formContent}
    </Card>
  );
}
