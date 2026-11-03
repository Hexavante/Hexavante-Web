"use client";

import { MindMapField } from "./mind-map-field";
import { useActionState } from "react";
import type { ActionResult } from "@/app/actions/course";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  options?: { value: string; label: string }[];
};

type InlineFormProps = {
  title: string;
  fields: Field[];
  initialMindMap?: string;
  submitLabel: string;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
};

const initialState: ActionResult = { success: false };

export function InlineForm({ title, fields, submitLabel, action, initialMindMap }: InlineFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card padding="sm">
      <h4 className="mb-3 text-sm font-semibold text-white">{title}</h4>
      <form action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
              <Label className="text-xs">{field.label}</Label>
              {field.options ? (
                <NativeSelect
                  name={field.name}
                  defaultValue={field.defaultValue}
                  required={field.required ?? true}
                >
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </NativeSelect>
              ) : field.type === "textarea" ? (
                <Textarea
                  name={field.name}
                  defaultValue={field.defaultValue}
                  placeholder={field.placeholder}
                  rows={2}
                />
              ) : (
                <Input
                  name={field.name}
                  type={field.type ?? "text"}
                  defaultValue={field.defaultValue}
                  placeholder={field.placeholder}
                  required={field.required ?? true}
                />
              )}
            </div>
          ))}
        </div>
        {initialMindMap !== undefined && <MindMapField initial={initialMindMap} />}
        {state.error && <p className="text-sm text-red-400">{state.error}</p>}
        {state.success && <p className="text-sm text-emerald-400">Salvo com sucesso!</p>}
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Salvando..." : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
