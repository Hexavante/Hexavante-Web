"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Check, X } from "lucide-react";
import { updateProfilePhotoAction } from "@/app/actions/profile";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { resizeImageFile } from "@/lib/resize-image";
import { cn } from "@/lib/cn";
import { themeUi } from "@/lib/theme-ui";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

type Props = {
  currentAvatar?: string;
  borderClassName?: string | null;
};

export function ProfilePhotoUpload({ currentAvatar, borderClassName }: Props) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const preview = localPreview ?? currentAvatar ?? null;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    const isAllowedType =
      ALLOWED_TYPES.includes(file.type) || /\.(jpe?g|png|gif|webp)$/i.test(file.name);

    if (!isAllowedType) {
      setError("Use uma imagem PNG, JPG, GIF ou WebP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("A imagem deve ter no máximo 5MB.");
      return;
    }

    const previousPreview = localPreview;
    const reader = new FileReader();
    reader.onload = (event) => setLocalPreview(event.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const resized = await resizeImageFile(file);
      const formData = new FormData();
      formData.append("file", resized);

      const result = await updateProfilePhotoAction(formData);
      if (!result.success) {
        setError(result.error || "Erro ao fazer upload da foto.");
        setLocalPreview(previousPreview);
        return;
      }

      if (result.avatarUrl) {
        setLocalPreview(result.avatarUrl);
      }
      setSuccess(true);
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Erro ao fazer upload da foto.",
      );
      setLocalPreview(previousPreview);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [localPreview, router]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = useCallback(async () => {
    setError(null);
    setSuccess(false);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", new Blob([""], { type: "application/octet-stream" }), "remove.png");
      const result = await updateProfilePhotoAction(formData);
      if (!result.success) {
        setError(result.error || "Erro ao remover foto.");
        return;
      }
      setLocalPreview(null);
      setSuccess(true);
      router.refresh();
    } catch (removeError) {
      setError(
        removeError instanceof Error ? removeError.message : "Erro ao remover foto.",
      );
    } finally {
      setUploading(false);
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="group relative">
        <Avatar
          src={preview}
          alt="Foto de perfil"
          size="xl"
          borderClassName={borderClassName}
          className={cn(themeUi.avatarHover, "transition-all duration-300")}
          overlay={
            <button
              type="button"
              onClick={handleClick}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 opacity-0 transition-opacity duration-200 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
              aria-label={preview ? "Alterar foto de perfil" : "Adicionar foto de perfil"}
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <Camera className="h-8 w-8 text-white" />
              )}
            </button>
          }
        />
        {preview && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 text-white text-xs opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-red-500 hover:scale-110"
            aria-label="Remover foto de perfil"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Selecionar foto de perfil"
        disabled={uploading}
      />

      <div className="flex items-center gap-3">
        <Button
          onClick={handleClick}
          disabled={uploading}
          variant="outline"
          className={cn("text-sm", themeUi.btnPress, themeUi.transitionSmooth)}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
              Enviando...
            </>
          ) : preview ? (
            "Alterar foto"
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" aria-hidden="true" />
              Adicionar foto
            </>
          )}
        </Button>

        {success && (
          <span className="inline-flex items-center gap-1.5 text-xs text-green-400 ">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Foto atualizada
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 text-center">PNG, JPG, GIF ou WebP (máx. 5MB)</p>

      {error && (
        <p
          className="max-w-56 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-center text-xs text-red-200 animate-shake"
        >
          {error}
        </p>
      )}
    </div>
  );
}
