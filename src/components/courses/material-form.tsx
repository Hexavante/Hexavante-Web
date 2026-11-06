"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addMaterialAction } from "@/app/actions/course";
import { parseUploadResponse } from "@/lib/upload-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
export function MaterialForm({courseId,moduleId}:{courseId:string;moduleId:string}) {
  const router=useRouter();
  const [mode,setMode]=useState<"file"|"url">("file");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const uploaded=useRef<{file:File;url:string}|null>(null);
  const submitting=useRef(false);
  return <Card padding="sm">
    <h4 className="mb-3 text-sm font-semibold">Adicionar material PDF</h4>
    <form className="space-y-3" onSubmit={async event=>{
      event.preventDefault();if(submitting.current)return;
      const form=event.currentTarget;const data=new FormData(form);
      submitting.current=true;setBusy(true);setError("");setMessage("");
      try {
        if(mode==="file") {
          const file=data.get("file");
          if(!(file instanceof File)||!file.size)throw new Error("Selecione um arquivo PDF.");
          if(file.size>5*1024*1024)throw new Error("O limite do PDF é de 5 MB.");
          if(!file.name.toLowerCase().endsWith(".pdf"))throw new Error("Selecione um arquivo .pdf.");
          if(uploaded.current?.file!==file){
            const body=new FormData();body.set("file",file);body.set("moduleId",moduleId);
            const response=await fetch("/api/upload/course-material",{method:"POST",body});
            const result=await parseUploadResponse(response);
            if(!response.ok||!result.url)throw new Error(result.error??"Falha ao enviar PDF.");
            uploaded.current={file,url:result.url};
          }
          data.set("fileUrl",uploaded.current.url);
        }
        data.delete("file");data.set("fileType","pdf");
        const result=await addMaterialAction(courseId,moduleId,{success:false},data);
        if(!result.success)throw new Error(result.error??"Não foi possível adicionar o material.");
        form.reset();uploaded.current=null;setMessage("Material PDF adicionado ao módulo.");router.refresh();
      }catch(e){setError(e instanceof Error?e.message:"Não foi possível adicionar o PDF.");}
      finally{submitting.current=false;setBusy(false);}
    }}>
      <fieldset disabled={busy} className="space-y-3">
        <label className="block text-sm">Título do material<Input name="title" required minLength={2} placeholder="Ex.: Apostila da aula" /></label>
        <div className="flex gap-2" role="group" aria-label="Origem do PDF">
          <Button type="button" variant={mode==="file"?"default":"outline"} aria-pressed={mode==="file"} onClick={()=>setMode("file")}>Enviar arquivo PDF</Button>
          <Button type="button" variant={mode==="url"?"default":"outline"} aria-pressed={mode==="url"} onClick={()=>setMode("url")}>Usar link</Button>
        </div>
        {mode==="file"?<label className="block text-sm">Arquivo PDF<Input name="file" type="file" accept=".pdf,application/pdf" required onChange={()=>{uploaded.current=null;setError("");}}/><span className="text-xs text-slate-400">Selecione um PDF de até 5 MB. Ele ficará disponível nos materiais do módulo.</span></label>:<label className="block text-sm">URL do PDF<Input name="fileUrl" type="url" required placeholder="https://..."/></label>}
        <Button type="submit" size="sm">{busy?"Enviando e salvando…":"Adicionar material"}</Button>
      </fieldset>
      {error&&<p role="alert" className="text-sm text-red-400">{error}</p>}
      {message&&<p role="status" className="text-sm text-emerald-400">{message}</p>}
    </form>
  </Card>;
}
