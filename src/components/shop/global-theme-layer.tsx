import { EquippedTheme } from "@/components/shop/equipped-theme";
import { ThemeStyles } from "@/components/shop/theme-styles";

type Props = {
  themeId: string | null;
  themeClassName: string;
};

/** Aplica tema equipado em todas as rotas (inclui auth e manutenção quando logado). */
export function GlobalThemeLayer({ themeId, themeClassName }: Props) {
  return (
    <>
      <ThemeStyles />
      <EquippedTheme themeId={themeId} themeClassName={themeClassName} />
    </>
  );
}
