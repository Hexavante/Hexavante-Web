// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { GET } from "../route";
let directory: string | undefined;
afterEach(async () => { vi.restoreAllMocks(); if (directory) await rm(directory, { recursive: true, force: true }); directory = undefined; });
it.each(["exams", "exam-questions"])("serve imagens novas da pasta %s", async folder => {
 directory = await mkdtemp(path.join(tmpdir(), "hexavante-upload-test-"));
 vi.spyOn(process, "cwd").mockReturnValue(directory);
 await mkdir(path.join(directory, "public/uploads/" + folder), { recursive: true });
 await writeFile(path.join(directory, "public/uploads/" + folder + "/new.webp"), "image-bytes");
 const response = await GET(new Request("http://localhost/uploads/exams/new.webp"), { params: Promise.resolve({ path: [folder, "new.webp"] }) });
 expect(response.status).toBe(200);
 expect(response.headers.get("content-type")).toBe("image/webp");
 expect(await response.text()).toBe("image-bytes");
});
it.each([["..", "secret"], ["exams", "../secret"], ["private", "secret"]])("rejeita caminho fora das pastas públicas %j", async (...segments) => {
 const response = await GET(new Request("http://localhost/uploads/test"), { params: Promise.resolve({ path: segments }) });
 expect(response.status).toBe(404);
});
