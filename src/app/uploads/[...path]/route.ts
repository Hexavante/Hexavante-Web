import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
};

// Fallback para arquivos enviados em runtime (o standalone só serve o
// que existia no boot). Protege contra path traversal.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  if (!segments?.length || segments.some((s) => !s || s === "." || s === ".." || s.includes("/") || s.includes("\\"))) {
    return new Response("Não encontrado", { status: 404 });
  }

  const allowedTop = new Set(["avatars", "banners", "courses", "tutorials", "exams", "questions"]);
  if (!allowedTop.has(segments[0]) || segments.length > 3) {
    return new Response("Não encontrado", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", ...segments);
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return new Response("Não encontrado", { status: 404 });
    const ext = path.extname(filePath).toLowerCase();
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Não encontrado", { status: 404 });
  }
}
