"use client";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Eye,
  FileText,
  FolderOpen,
  Link2,
  NotebookPen,
  PenLine,
  Plus,
  Save,
  Search,
  StickyNote,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { loadNotebookAction, saveNotebookPageAction } from "@/app/actions/notebook";
import {
  findBacklinks,
  normalizeTitle,
  pendingLinkQuery,
  resolveLink,
  splitLinks,
  type NotebookData,
  type NotebookPageData,
  type NotebookPageInput,
  type NotebookResult,
} from "@/lib/notebook";
import styles from "./course-notebook.module.css";

type Props = { initial: NotebookResult<NotebookData> };
/** Divisória selecionada: id do curso ou `null` para "Anotações livres". */
type Division = string | null;

const MAX_SUGGESTIONS = 6;

export function CourseNotebook({ initial }: Props) {
  const [data, setData] = useState<NotebookData>(
    initial.success ? initial.data : { courses: [], pages: [] },
  );
  const [error, setError] = useState(initial.success ? "" : initial.error);
  const [unavailable, setUnavailable] = useState(!initial.success);
  const [division, setDivision] = useState<Division>(
    initial.success ? (initial.data.courses[0]?.id ?? null) : null,
  );
  const [draft, setDraft] = useState<NotebookPageInput | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const [reading, setReading] = useState(false);
  const [suggest, setSuggest] = useState<{ query: string; start: number; active: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const course = division ? data.courses.find((item) => item.id === division) : undefined;
  const divisionTitle = course?.title ?? "Anotações livres";
  const divisionPages = data.pages.filter((page) => page.courseId === division);
  const pages = divisionPages.filter((page) =>
    `${page.title} ${page.content}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const freeCount = data.pages.filter((page) => page.courseId === null).length;

  const suggestions = useMemo(() => {
    if (!suggest) return [];
    const q = normalizeTitle(suggest.query);
    return data.pages
      .filter((p) => p.id !== draft?.id && normalizeTitle(p.title).includes(q))
      .slice(0, MAX_SUGGESTIONS);
  }, [suggest, data.pages, draft?.id]);

  const backlinks = draft ? findBacklinks(data.pages, draft.title, draft.id) : [];

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest("a[href]")) return;
      if (!window.confirm("Há alterações não salvas. Sair sem salvar?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);

  const canSwitch = () =>
    !busy && (!dirty || window.confirm("Há alterações não salvas. Descartar e continuar?"));

  const resetEditor = () => {
    setDirty(false);
    setError("");
    setSaved(false);
    setSuggest(null);
  };

  const selectDivision = (id: Division) => {
    if (id === division || !canSwitch()) return;
    setDivision(id);
    setDraft(null);
    setSearch("");
    setReading(false);
    resetEditor();
  };

  const openPage = (page: NotebookPageData, { read = false } = {}) => {
    if (draft?.id === page.id) return;
    if (!canSwitch()) return;
    setDivision(page.courseId);
    setDraft(page);
    setReading(read);
    resetEditor();
  };

  const newPage = (title = "") => {
    if (!canSwitch()) return;
    setDraft({ id: crypto.randomUUID(), courseId: division, title, content: "", version: null });
    setSearch("");
    setReading(false);
    resetEditor();
  };

  /** Link clicado no modo leitura: abre a nota ou cria uma com esse título. */
  const followLink = (title: string) => {
    const target = resolveLink(data.pages, title);
    if (target) openPage(target, { read: true });
    else newPage(title);
  };

  const updateContent = (content: string, cursor: number) => {
    if (!draft) return;
    setDraft({ ...draft, content });
    setDirty(true);
    setSaved(false);
    const pending = pendingLinkQuery(content, cursor);
    setSuggest(pending ? { ...pending, active: 0 } : null);
  };

  const insertLink = (title: string) => {
    if (!draft || !suggest) return;
    const before = draft.content.slice(0, suggest.start);
    const after = draft.content.slice(textareaRef.current?.selectionStart ?? suggest.start + suggest.query.length);
    const closing = after.startsWith("]]") ? "" : "]]";
    const content = `${before}${title}${closing}${after}`;
    const cursor = before.length + title.length + 2;
    setDraft({ ...draft, content });
    setDirty(true);
    setSaved(false);
    setSuggest(null);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(cursor, cursor);
    });
  };

  const startLink = () => {
    if (!draft || reading) return;
    const el = textareaRef.current;
    const at = el?.selectionStart ?? draft.content.length;
    const content = `${draft.content.slice(0, at)}[[${draft.content.slice(at)}`;
    updateContent(content, at + 2);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + 2, at + 2);
    });
  };

  const onEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!suggest || suggestions.length === 0) {
      if (event.key === "Escape") setSuggest(null);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setSuggest({ ...suggest, active: (suggest.active + step + suggestions.length) % suggestions.length });
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      insertLink(suggestions[suggest.active].title);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setSuggest(null);
    }
  };

  const save = async () => {
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    setSaved(false);
    setSuggest(null);
    try {
      const result = await saveNotebookPageAction(draft);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const { page, relinked } = result.data;
      const changed = new Map([page, ...relinked].map((p) => [p.id, p]));
      setData((current) => ({
        ...current,
        pages: [page, ...relinked, ...current.pages.filter((p) => !changed.has(p.id))],
      }));
      setDraft(page);
      setDirty(false);
      setSaved(true);
    } catch {
      setError("A conexão falhou. Seu texto continua aqui; tente salvar novamente.");
    } finally {
      setBusy(false);
    }
  };

  const retry = async () => {
    setBusy(true);
    try {
      const result = await loadNotebookAction();
      if (result.success) {
        setData(result.data);
        setDivision(result.data.courses[0]?.id ?? null);
        setUnavailable(false);
        setError("");
      } else setError(result.error);
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell className={styles.root}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            <NotebookPen size={16} /> UM ESPAÇO PARA SUAS IDEIAS
          </span>
          <h1>Meu caderno</h1>
          <p>
            Anotações livres e uma divisória para cada curso. Ligue uma nota à outra escrevendo{" "}
            <code>[[</code> e o título.
          </p>
        </div>
        <Link className={styles.secondary} href="/anotacoes/aulas">
          Notas das aulas <ArrowUpRight size={16} />
        </Link>
      </header>
      {unavailable ? (
        <div className={styles.empty}>
          <BookOpen size={36} />
          <h2>Seu caderno está indisponível</h2>
          <p role="alert">{error}</p>
          <button className={styles.primary} disabled={busy} onClick={() => void retry()}>
            {busy ? "Abrindo…" : "Tentar novamente"}
          </button>
        </div>
      ) : (
        <div className={styles.notebook}>
          <aside className={styles.dividers} aria-label="Divisórias do caderno">
            <div className={styles.sideTitle}>
              <span>MINHAS DIVISÓRIAS</span>
              <span>{data.courses.length + 1}</span>
            </div>
            <nav>
              <button
                disabled={busy}
                aria-pressed={division === null}
                onClick={() => selectDivision(null)}
                className={division === null ? styles.selectedCourse : ""}
              >
                <StickyNote size={15} className={styles.freeIcon} />
                <span>
                  <strong>Anotações livres</strong>
                  <small>{freeCount} páginas</small>
                </span>
              </button>
              {data.courses.map((item, index) => (
                <button
                  key={item.id}
                  disabled={busy}
                  aria-pressed={division === item.id}
                  onClick={() => selectDivision(item.id)}
                  className={division === item.id ? styles.selectedCourse : ""}
                >
                  <span className={styles.courseNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{data.pages.filter((page) => page.courseId === item.id).length} páginas</small>
                  </span>
                  <BookOpen size={17} />
                </button>
              ))}
            </nav>
            {data.courses.length === 0 ? (
              <p className={styles.sideHint}>
                Ao se matricular em um curso, ele ganha uma divisória aqui.{" "}
                <Link href="/courses">Explorar cursos</Link>
              </p>
            ) : (
              <p className={styles.sideHint}>Escreva livremente, com ou sem curso.</p>
            )}
          </aside>
          <section className={styles.workspace} aria-label={`Caderno: ${divisionTitle}`}>
            <div className={styles.courseHeader}>
              <div>
                <span className={styles.eyebrow}>{course ? "DIVISÓRIA DO CURSO" : "SEM CURSO"}</span>
                <h2>{divisionTitle}</h2>
                <p>
                  {divisionPages.length}{" "}
                  {divisionPages.length === 1 ? "página para revisitar" : "páginas para revisitar"}
                </p>
              </div>
              <button disabled={busy} onClick={() => newPage()} className={styles.primary}>
                <Plus size={17} /> Nova página
              </button>
            </div>
            <div className={styles.pagesLayout}>
              <aside className={styles.pages} aria-label="Páginas desta divisória">
                <label className={styles.search}>
                  <Search size={15} />
                  <input
                    aria-label="Buscar páginas"
                    placeholder="Buscar nesta divisória"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <div className={styles.pageList}>
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      aria-pressed={draft?.id === page.id}
                      disabled={busy}
                      onClick={() => openPage(page)}
                    >
                      <FileText size={16} />
                      <span>
                        <strong>{page.title}</strong>
                        <small>{page.content.slice(0, 75) || "Página em branco"}</small>
                        <time>{new Date(page.updatedAt).toLocaleDateString("pt-BR")}</time>
                      </span>
                    </button>
                  ))}
                  {pages.length === 0 && (
                    <p className={styles.listEmpty}>
                      {search ? "Nenhuma página encontrada." : "Sua primeira página começa com uma ideia."}
                    </p>
                  )}
                </div>
              </aside>
              {draft ? (
                <form
                  className={styles.paper}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void save();
                  }}
                >
                  <div className={styles.paperTop}>
                    <span>
                      <FileText size={14} /> {draft.version === null ? "NOVA PÁGINA" : "PÁGINA DO CADERNO"}
                    </span>
                    <span role="status">
                      {busy ? "Salvando…" : dirty ? "Alterações não salvas" : saved ? "Salvo na sua conta" : ""}
                    </span>
                  </div>
                  <label className={styles.titleLabel}>
                    Título da página
                    <input
                      autoFocus={draft.version === null && !draft.title}
                      required
                      maxLength={120}
                      disabled={busy}
                      value={draft.title}
                      placeholder="Ex.: Classes e objetos"
                      onChange={(event) => {
                        setDraft({ ...draft, title: event.target.value });
                        setDirty(true);
                        setSaved(false);
                      }}
                    />
                  </label>
                  <div className={styles.editorTools} role="toolbar" aria-label="Modo da página">
                    <button
                      type="button"
                      aria-pressed={!reading}
                      onClick={() => setReading(false)}
                      className={!reading ? styles.toolActive : ""}
                    >
                      <PenLine size={14} /> Escrever
                    </button>
                    <button
                      type="button"
                      aria-pressed={reading}
                      onClick={() => {
                        setReading(true);
                        setSuggest(null);
                      }}
                      className={reading ? styles.toolActive : ""}
                    >
                      <Eye size={14} /> Ler
                    </button>
                    {!reading && (
                      <button type="button" onClick={startLink} disabled={busy} className={styles.toolLink}>
                        <Link2 size={14} /> Inserir link
                      </button>
                    )}
                  </div>
                  {reading ? (
                    <div className={styles.reader} aria-label="Leitura da página">
                      {draft.content.trim() ? (
                        splitLinks(draft.content).map((segment, index) => {
                          if (segment.type === "text") return <span key={index}>{segment.text}</span>;
                          const exists = Boolean(resolveLink(data.pages, segment.title));
                          return (
                            <button
                              type="button"
                              key={index}
                              className={exists ? styles.noteLink : styles.missingLink}
                              title={exists ? `Abrir “${segment.title}”` : `Criar a nota “${segment.title}”`}
                              onClick={() => followLink(segment.title)}
                            >
                              {segment.title}
                            </button>
                          );
                        })
                      ) : (
                        <span className={styles.readerEmpty}>Página em branco.</span>
                      )}
                    </div>
                  ) : (
                    <div className={styles.editorWrap}>
                      <label className={styles.contentLabel}>
                        Suas anotações
                        <textarea
                          ref={textareaRef}
                          disabled={busy}
                          maxLength={50000}
                          value={draft.content}
                          placeholder="Anote conceitos, exemplos, dúvidas e ideias… Escreva [[ para ligar a outra nota."
                          aria-autocomplete="list"
                          aria-expanded={Boolean(suggest && suggestions.length)}
                          aria-controls="notebook-link-suggestions"
                          onKeyDown={onEditorKeyDown}
                          onBlur={() => setTimeout(() => setSuggest(null), 150)}
                          onChange={(event) =>
                            updateContent(event.target.value, event.target.selectionStart ?? event.target.value.length)
                          }
                        />
                      </label>
                      {suggest && (
                        <div
                          id="notebook-link-suggestions"
                          role="listbox"
                          aria-label="Ligar a uma nota"
                          className={styles.suggestions}
                        >
                          {suggestions.length > 0 ? (
                            suggestions.map((page, index) => (
                              <button
                                type="button"
                                role="option"
                                key={page.id}
                                aria-selected={index === suggest.active}
                                className={index === suggest.active ? styles.suggestionActive : ""}
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  insertLink(page.title);
                                }}
                              >
                                <FileText size={13} /> {page.title}
                              </button>
                            ))
                          ) : (
                            <p>
                              {suggest.query.trim()
                                ? `Nenhuma nota com “${suggest.query.trim()}”. Feche com ]] para criar o link.`
                                : "Você ainda não tem outras notas para ligar."}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <footer>
                    <span>{draft.content.length.toLocaleString("pt-BR")} / 50.000 caracteres</span>
                    <button
                      className={styles.primary}
                      type="submit"
                      disabled={busy || !draft.title.trim() || (!dirty && draft.version !== null)}
                    >
                      {saved && !dirty ? <Check size={16} /> : <Save size={16} />}
                      {busy ? "Salvando…" : "Salvar página"}
                    </button>
                  </footer>
                  {error && (
                    <p className={styles.error} role="alert">
                      {error}
                    </p>
                  )}
                  {backlinks.length > 0 && (
                    <section className={styles.backlinks} aria-label="Mencionada em">
                      <span className={styles.eyebrow}>
                        <Link2 size={12} /> MENCIONADA EM
                      </span>
                      <ul>
                        {backlinks.map((page) => (
                          <li key={page.id}>
                            <button type="button" onClick={() => openPage(page, { read: true })}>
                              {page.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </form>
              ) : (
                <div className={styles.blank}>
                  <FolderOpen size={40} />
                  <span className={styles.eyebrow}>ESCREVA DO SEU JEITO</span>
                  <h3>{divisionPages.length ? "Qual página vamos abrir?" : course ? "Um novo curso, muitas ideias" : "Uma ideia solta já vale uma página"}</h3>
                  <p>
                    {divisionPages.length
                      ? "Escolha uma página ao lado para continuar suas anotações."
                      : "Crie sua primeira página. Pode ser um resumo, uma dúvida ou aquele exemplo que fez tudo fazer sentido."}
                  </p>
                  <button className={styles.secondary} onClick={() => newPage()}>
                    <Plus size={16} /> Criar uma página
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}
