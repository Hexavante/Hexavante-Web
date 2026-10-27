import { BookOpenCheck, Sparkles, Target } from "lucide-react";
import Image from "next/image";
import styles from "./login-shell.module.css";

type Props = { children: React.ReactNode; variant?: "login" | "register" };

export function AuthPageShell({ children, variant = "login" }: Props) {
  const isRegister = variant === "register";

  return (
    <main className={styles.page}>
      <div
        className={`${styles.card} ${isRegister ? styles.registerCard : ""}`}
      >
        <section className={styles.story} aria-label="Aprenda com a Hexavante">
          <svg
            className={styles.art}
            viewBox="0 0 620 760"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="login-wave" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#203c97" />
                <stop offset=".55" stopColor="#1679dc" />
                <stop offset="1" stopColor="#39c5ef" />
              </linearGradient>
              <linearGradient id="login-ribbon" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#69def3" />
                <stop offset="1" stopColor="#1684ec" />
              </linearGradient>
            </defs>
            <path
              d="M0 0H310L490 185Q625 315 480 445Q395 520 465 610L615 760H0Z"
              fill="#249ad8"
              opacity=".32"
            />
            <path
              d="M0 0H275L455 190Q585 310 447 433Q357 520 435 610L575 760H0Z"
              fill="url(#login-wave)"
            />
            <path
              d="M325 -80L465 60Q530 125 565 65Q590 25 550 -20L455 -110Z"
              fill="url(#login-ribbon)"
            />
            <path
              d="M520 580Q460 520 430 575Q410 610 450 650L570 780H690Z"
              fill="url(#login-ribbon)"
            />
          </svg>
          <div className={styles.brand}>
            <Image
              src="/brand/hexavante-logo.webp"
              alt=""
              width={38}
              height={38}
              priority
            />
            <span>HEXAVANTE</span>
          </div>
          <Image
            className={styles.watermark}
            src="/brand/hexavante-logo.webp"
            alt=""
            width={330}
            height={330}
            aria-hidden="true"
          />
          <div className={styles.storyContent}>
            <p className={styles.eyebrow}>
              {isRegister ? "Sua jornada começa aqui" : "Estude no seu ritmo"}
            </p>
            <h2>
              {isRegister ? (
                <>
                  Grandes sonhos. <br />
                  Novos caminhos. <br />
                  <span>Seu começo.</span>
                </>
              ) : (
                <>
                  Seu próximo <br />
                  passo começa <br />
                  <span>agora.</span>
                </>
              )}
            </h2>
            <p className={styles.description}>
              {isRegister
                ? "Um espaço para aprender, descobrir seus próximos passos e transformar metas em conquistas."
                : "Retome sua rotina, acompanhe seu progresso e siga aprendendo com a Hexavante."}
            </p>
            <ul className={styles.benefits}>
              <li>
                <BookOpenCheck aria-hidden="true" /> Trilhas para o seu objetivo
              </li>
              <li>
                <Target aria-hidden="true" /> Progresso claro a cada etapa
              </li>
              <li>
                <Sparkles aria-hidden="true" /> Uma experiência feita para você
              </li>
            </ul>
          </div>
        </section>
        <section
          className={styles.formPanel}
          aria-label={isRegister ? "Crie sua conta" : "Acesse sua conta"}
        >
          <div className={styles.dots} aria-hidden="true" />
          <div className={styles.formContent}>{children}</div>
          <span className={styles.orb} aria-hidden="true" />
        </section>
      </div>
    </main>
  );
}
