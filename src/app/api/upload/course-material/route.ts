import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isInstructor } from "@/lib/permissions";
import { rateLimitUpload, extractClientIp } from "@/lib/rate-limit";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !isInstructor(session.user.roles)) return Response.json({error:"Não autorizado."},{status:403});
    const ip = extractClientIp(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip"));
    if (!rateLimitUpload(ip)) return Response.json({error:"Limite de uploads atingido. Tente novamente mais tarde."},{status:429});
    const data = await request.formData();
    const moduleId = data.get("moduleId");
    if (typeof moduleId !== "string" || !moduleId) return Response.json({error:"Selecione um módulo do curso."},{status:400});
    const owned = await prisma.module.findFirst({where:{id:moduleId,course:{instructors:{some:{userId:session.user.id}}}},select:{id:true}});
    if (!owned) return Response.json({error:"Sem permissão para adicionar material neste curso."},{status:403});
    const file = data.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) return Response.json({error:"Selecione um arquivo .pdf."},{status:400});
    if (!file.size || file.size > 5 * 1024 * 1024) return Response.json({error:"O PDF deve ter até 5 MB e não pode estar vazio."},{status:400});
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.subarray(0,5).toString("ascii") !== "%PDF-") return Response.json({error:"O arquivo não possui um cabeçalho PDF válido."},{status:400});
    const filename = randomUUID() + ".pdf";
    const directory = path.join(process.cwd(),"public","uploads","courses","materials");
    await mkdir(directory,{recursive:true});
    await writeFile(path.join(directory,filename),buffer,{flag:"wx"});
    return Response.json({url:"/uploads/courses/materials/"+filename});
  } catch (error) {
    console.error("[upload/course-material]",error);
    return Response.json({error:"Não foi possível enviar o PDF. Tente novamente."},{status:500});
  }
}
