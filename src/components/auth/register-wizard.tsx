"use client";

import { useActionState, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  UserRound,
  GraduationCap,
} from "lucide-react";
import type { ActionResult } from "@/app/actions/auth";
import { Alert } from "@/components/ui/alert";
import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";
import { siteUrl } from "@/lib/site-url";
import styles from "./login-shell.module.css";

type Props = {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  callbackUrl: string;
  socialOptions?: React.ReactNode;
};

const initialState: ActionResult = { success: false };
const interests = [
  "ENEM",
  "Vestibulares",
  "Programação",
  "Idiomas",
  "Concursos",
  "Desenvolvimento pessoal",
];

export function RegisterWizard({ action, callbackUrl, socialOptions }: Props) {
  const [step, setStep] = useState(1);
  const [state, formAction, pending] = useActionState(async (prev: ActionResult, data: FormData) => {
    const result = await action(prev, data);
    const profileFields = ["username", "fullName", "email", "birthDate"];
    if (profileFields.some((name) => result.fieldErrors?.[name])) setStep(1);
    return result;
  }, initialState);
  const [accountType, setAccountType] = useState<"STUDENT" | "INSTRUCTOR">(
    "STUDENT",
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [studyGoal, setStudyGoal] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (state.success && state.redirectTo)
      window.location.assign(state.redirectTo);
  }, [state.success, state.redirectTo]);

  const next = (form: HTMLFormElement) => {
    const fields =
      step === 1 ? ["username", "fullName", "email", "birthDate"] : [];
    for (const name of fields) {
      const field = form.elements.namedItem(name) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;
      if (field && !field.reportValidity()) return;
    }
    setStep((current) => Math.min(3, current + 1));
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : current.length < 6
          ? [...current, interest]
          : current,
    );
  };

  return (
    <div className={styles.wizard}>
      <div className="mb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-300">
          Faça parte da Hexavante
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
          Vamos começar?
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Conte um pouco sobre você para personalizarmos sua jornada.
        </p>
      </div>

      <ol className={styles.steps} aria-label="Etapas do cadastro">
        {["Seu perfil", "Seu caminho", "Segurança"].map((label, index) => {
          const current = index + 1;
          return (
            <li
              key={label}
              aria-current={current === step ? "step" : undefined}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                  current < step
                    ? "bg-emerald-400 text-slate-950"
                    : current === step
                      ? "bg-sky-400 text-white"
                      : "bg-slate-700 text-slate-300",
                )}
              >
                {current < step ? <Check className="h-3.5 w-3.5" /> : current}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  current === step ? "text-white" : "text-slate-400",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <input type="hidden" name="accountType" value={accountType} />
        <input
          type="hidden"
          name="studyInterests"
          value={selectedInterests.join(",")}
        />

        <div className={step === 1 ? "space-y-4" : "hidden"}>
          <Field
            name="username"
            label="Nome de usuário"
            placeholder="seu_usuario"
          />
          <Field
            name="fullName"
            label="Nome completo"
            placeholder="Como quer ser chamado?"
          />
          <Field
            name="email"
            label="E-mail"
            type="email"
            placeholder="voce@email.com"
          />
          <Field name="birthDate" label="Data de nascimento" type="date" />
        </div>

        <div className={step === 2 ? "space-y-5" : "hidden"}>
          <div>
            <Label>Como você quer usar a Hexavante?</Label>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Choice
                active={accountType === "STUDENT"}
                icon={UserRound}
                title="Quero aprender"
                description="Estudar e acompanhar meu progresso"
                onClick={() => setAccountType("STUDENT")}
              />
              <Choice
                active={accountType === "INSTRUCTOR"}
                icon={GraduationCap}
                title="Quero ensinar"
                description="Publicar conteúdos e criar trilhas"
                onClick={() => setAccountType("INSTRUCTOR")}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="studyGoal">Seu principal objetivo</Label>
            <select
              id="studyGoal"
              name="studyGoal"
              value={studyGoal}
              onChange={(event) => setStudyGoal(event.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none transition focus:border-sky-400"
            >
              <option value="">Selecione uma opção</option>
              <option value="ENEM">Preparar para o ENEM</option>
              <option value="VESTIBULAR">Vestibulares</option>
              <option value="SCHOOL">Ir melhor na escola</option>
              <option value="CAREER">Evoluir na carreira</option>
              <option value="OTHER">Outro objetivo</option>
            </select>
          </div>
          <div>
            <Label>Assuntos que mais interessam você</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {interests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={selectedInterests.includes(interest)}
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    selectedInterests.includes(interest)
                      ? "border-sky-400 bg-sky-400/20 text-sky-100"
                      : "border-white/10 bg-slate-900 text-slate-300 hover:border-white/25",
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          {accountType === "INSTRUCTOR" && (
            <p className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-sm leading-6 text-sky-100">
              Seu acesso de instrutor será liberado ao criar a conta. Você
              poderá criar cursos, tutoriais e salas ao vivo.
            </p>
          )}
        </div>

        <div className={step === 3 ? "space-y-4" : "hidden"}>
          <Field
            name="password"
            label="Crie uma senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
          />
          <Field
            name="confirmPassword"
            label="Confirme sua senha"
            type="password"
            placeholder="Repita a senha"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="phone"
              label="Telefone (opcional)"
              required={false}
              placeholder="(11) 99999-9999"
            />
            <Field
              name="city"
              label="Cidade (opcional)"
              required={false}
              placeholder="Sua cidade"
            />
          </div>
          <Field
            name="state"
            label="Estado (opcional)"
            required={false}
            placeholder="SP"
          />
          <div className="flex items-start gap-2 pt-1">
            <Checkbox id="terms" name="terms" required checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5" />
            <Label
              htmlFor="terms"
              className="cursor-pointer text-xs font-normal leading-5 text-slate-300"
            >
              Li e aceito os{" "}
              <AppLink href={siteUrl("/termos")} target="_blank" rel="noopener noreferrer">Termos de Uso</AppLink> e a{" "}
              <AppLink href="/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</AppLink>.
            </Label>
          </div>
        </div>

        {state.error && <Alert variant="danger">
          {state.error}
          {state.fieldErrors && <ul className="mt-1 list-disc pl-4">
            {Object.entries(state.fieldErrors).map(([name, message]) => (
              <li key={name}>{fieldLabels[name] ?? name}: {message}</li>
            ))}
          </ul>}
        </Alert>}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => setStep((current) => current - 1)}
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button
              type="button"
              className="h-11 flex-1"
              onClick={(event) => next(event.currentTarget.form!)}
              key="continue"
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button key="submit" type="submit" disabled={pending} className="h-11 flex-1">
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Criando...
                </>
              ) : (
                <>
                  Criar conta <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </form>
      {step === 1 && <div className="mt-6">{socialOptions}</div>}
      <p className="mt-7 text-center text-sm text-slate-400">
        Já tem uma conta?{" "}
        <AppLink
          href={
            callbackUrl === "/"
              ? "/login"
              : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
          }
        >
          Entrar
        </AppLink>
      </p>
    </div>
  );
}

const fieldLabels: Record<string, string> = {
  username: "Nome de usuário", fullName: "Nome completo", email: "E-mail", birthDate: "Nascimento",
  password: "Senha", confirmPassword: "Confirmação de senha", terms: "Termos de uso",
  phone: "Telefone", city: "Cidade", state: "Estado",
};

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required = true,
  minLength,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  const [value, setValue] = useState("");
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        pattern={name === "username" ? "[a-zA-Z0-9_]{3,30}" : undefined}
        aria-describedby={name === "username" ? "username-help" : undefined}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        type={type}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className="mt-1 h-11"
      />
      {name === "username" && <p id="username-help" className="mt-1 text-xs text-slate-400">Use de 3 a 30 letras sem acento, números ou sublinhado (_).</p>}
    </div>
  );
}
function Choice({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof UserRound;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl border p-3 text-left transition",
        active
          ? "border-sky-400 bg-sky-400/15"
          : "border-white/10 bg-slate-900 hover:border-white/25",
      )}
    >
      <Icon
        className={cn("h-4 w-4", active ? "text-sky-300" : "text-slate-400")}
      />
      <p className="mt-2 text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-4 text-slate-400">{description}</p>
    </button>
  );
}
