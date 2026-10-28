"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  FileText,
  FolderOpen,
  NotebookPen,
  Plus,
  Save,
  Search,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import {
  loadNotebookAction,
  saveNotebookPageAction,
} from "@/app/actions/notebook";
import type {
  NotebookData,
  NotebookPageInput,
  NotebookResult,
} from "@/lib/notebook";
import styles from "./course-notebook.module.css";

type Props = { initial: NotebookResult<NotebookData> };
export function CourseNotebook({ initial }: Props) {
  const [data, setData] = useState<NotebookData>(
    initial.success ? initial.data : { courses: [], pages: [] },
  );
  const [error, setError] = useState(initial.success ? "" : initial.error);
  const [unavailable, setUnavailable] = useState(!initial.success);
  const [courseId, setCourseId] = useState(
    initial.success ? (initial.data.courses[0]?.id ?? "") : "",
  );
  const [draft, setDraft] = useState<NotebookPageInput | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const course = data.courses.find((item) => item.id === courseId);
  const coursePages = data.pages.filter((page) => page.courseId === courseId);
  const pages = coursePages.filter((page) =>
    `${page.title} ${page.content}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest("a[href]")
      )
        return;
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
    !busy &&
    (!dirty ||
      window.confirm("Há alterações não salvas. Descartar e continuar?"));
  const selectCourse = (id: string) => {
    if (id === courseId || !canSwitch()) return;
    setCourseId(id);
    setDraft(null);
    setDirty(false);
    setSearch("");
    setError("");
    setSaved(false);
  };
  const newPage = () => {
    if (!course || !canSwitch()) return;
    setDraft({
      id: crypto.randomUUID(),
      courseId,
      title: "",
      content: "",
      version: null,
    });
    setDirty(false);
    setSearch("");
    setError("");
    setSaved(false);
  };
  const save = async () => {
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const result = await saveNotebookPageAction(draft);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setData((current) => ({
        ...current,
        pages: [
          result.data,
          ...current.pages.filter((page) => page.id !== result.data.id),
        ],
      }));
      setDraft(result.data);
      setDirty(false);
      setSaved(true);
    } catch {
      setError(
        "A conexão falhou. Seu texto continua aqui; tente salvar novamente.",
      );
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
        setCourseId(result.data.courses[0]?.id ?? "");
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
            Uma divisória para cada curso. Suas ideias, dúvidas e descobertas,
            página por página.
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
          <button
            className={styles.primary}
            disabled={busy}
            onClick={() => void retry()}
          >
            {busy ? "Abrindo…" : "Tentar novamente"}
          </button>
        </div>
      ) : data.courses.length === 0 ? (
        <div className={styles.empty}>
          <NotebookPen size={36} />
          <h2>Seu próximo curso merece uma divisória</h2>
          <p>
            Ao se matricular em um curso, ele aparece aqui. Depois, é só criar
            suas páginas.
          </p>
          <Link className={styles.primary} href="/courses">
            Explorar cursos <ArrowUpRight size={16} />
          </Link>
        </div>
      ) : (
        <div className={styles.notebook}>
          <aside className={styles.dividers} aria-label="Divisórias por curso">
            <div className={styles.sideTitle}>
              <span>MINHAS DIVISÓRIAS</span>
              <span>{data.courses.length}</span>
            </div>
            <nav>
              {data.courses.map((item, index) => (
                <button
                  key={item.id}
                  disabled={busy}
                  aria-pressed={courseId === item.id}
                  onClick={() => selectCourse(item.id)}
                  className={courseId === item.id ? styles.selectedCourse : ""}
                >
                  <span className={styles.courseNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {
                        data.pages.filter((page) => page.courseId === item.id)
                          .length
                      }{" "}
                      páginas
                    </small>
                  </span>
                  <BookOpen size={17} />
                </button>
              ))}
            </nav>
            <p className={styles.sideHint}>
              Escreva livremente sobre o curso, sem precisar abrir uma aula.
            </p>
          </aside>
          <section
            className={styles.workspace}
            aria-label={`Caderno de ${course?.title}`}
          >
            <div className={styles.courseHeader}>
              <div>
                <span className={styles.eyebrow}>DIVISÓRIA DO CURSO</span>
                <h2>{course?.title}</h2>
                <p>
                  {coursePages.length}{" "}
                  {coursePages.length === 1
                    ? "página para revisitar"
                    : "páginas para revisitar"}
                </p>
              </div>
              <button
                disabled={busy}
                onClick={newPage}
                className={styles.primary}
              >
                <Plus size={17} /> Nova página
              </button>
            </div>
            <div className={styles.pagesLayout}>
              <aside
                className={styles.pages}
                aria-label="Páginas desta divisória"
              >
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
                      onClick={() => {
                        if (draft?.id !== page.id && canSwitch()) {
                          setDraft(page);
                          setDirty(false);
                          setError("");
                          setSaved(false);
                        }
                      }}
                    >
                      <FileText size={16} />
                      <span>
                        <strong>{page.title}</strong>
                        <small>
                          {page.content.slice(0, 75) || "Página em branco"}
                        </small>
                        <time>
                          {new Date(page.updatedAt).toLocaleDateString("pt-BR")}
                        </time>
                      </span>
                    </button>
                  ))}
                  {pages.length === 0 && (
                    <p className={styles.listEmpty}>
                      {search
                        ? "Nenhuma página encontrada."
                        : "Sua primeira página começa com uma ideia."}
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
                      <FileText size={14} />{" "}
                      {draft.version === null
                        ? "NOVA PÁGINA"
                        : "PÁGINA DO CADERNO"}
                    </span>
                    <span role="status">
                      {busy
                        ? "Salvando…"
                        : dirty
                          ? "Alterações não salvas"
                          : saved
                            ? "Salvo na sua conta"
                            : ""}
                    </span>
                  </div>
                  <label className={styles.titleLabel}>
                    Título da página
                    <input
                      autoFocus={draft.version === null}
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
                  <label className={styles.contentLabel}>
                    Suas anotações
                    <textarea
                      disabled={busy}
                      maxLength={50000}
                      value={draft.content}
                      placeholder="O que você quer guardar sobre este curso? Anote conceitos, exemplos, dúvidas e ideias…"
                      onChange={(event) => {
                        setDraft({ ...draft, content: event.target.value });
                        setDirty(true);
                        setSaved(false);
                      }}
                    />
                  </label>
                  <footer>
                    <span>
                      {draft.content.length.toLocaleString("pt-BR")} / 50.000
                      caracteres
                    </span>
                    <button
                      className={styles.primary}
                      type="submit"
                      disabled={
                        busy ||
                        !draft.title.trim() ||
                        (!dirty && draft.version !== null)
                      }
                    >
                      {saved && !dirty ? (
                        <Check size={16} />
                      ) : (
                        <Save size={16} />
                      )}
                      {busy ? "Salvando…" : "Salvar página"}
                    </button>
                  </footer>
                  {error && (
                    <p className={styles.error} role="alert">
                      {error}
                    </p>
                  )}
                </form>
              ) : (
                <div className={styles.blank}>
                  <FolderOpen size={40} />
                  <span className={styles.eyebrow}>ESCREVA DO SEU JEITO</span>
                  <h3>
                    {coursePages.length
                      ? "Qual página vamos abrir?"
                      : "Um novo curso, muitas ideias"}
                  </h3>
                  <p>
                    {coursePages.length
                      ? "Escolha uma página ao lado para continuar suas anotações."
                      : "Crie sua primeira página. Pode ser um resumo, uma dúvida ou aquele exemplo que fez tudo fazer sentido."}
                  </p>
                  <button className={styles.secondary} onClick={newPage}>
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
