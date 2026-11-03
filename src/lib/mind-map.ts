// A plain-text outline keeps the map readable in clients that only display descriptions.
const heading = "## Mapa mental";

export function splitMindMap(value?: string | null) {
  const text = value ?? "";
  const match = /(?:^|\n\n)## Mapa mental\n((?:- [^\n]+\n)*- [^\n]+)$/.exec(text);
  if (!match) return { description: text, topics: [] as string[] };
  return { description: text.slice(0, match.index), topics: match[1].split("\n").map(line => line.slice(2)) };
}

export function lessonContent(form: FormData) {
  const description = String(form.get("description") ?? "");
  if (!form.has("mindMap")) return description;
  const topics = String(form.get("mindMap") ?? "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!topics.length) return description;
  if (topics.length > 30 || topics.some(topic => topic.length > 240)) {
    throw new Error("Use até 30 ramos no mapa mental, com até 240 caracteres por ramo.");
  }
  return [description.trimEnd(), heading + "\n" + topics.map(topic => "- " + topic).join("\n")].filter(Boolean).join("\n\n");
}
