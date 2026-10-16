/**
 * PostCSS config.
 *
 * @tailwindcss/postcss (v4) já inclui autoprefixing nativo via Lightning CSS.
 * Listamos autoprefixer explicitamente como segunda linha de defesa para
 * garantir prefixos em builds que não passem pelo pipeline Tailwind (ex: CSS
 * globais importados diretamente), e para que a intenção fique clara para
 * outros devs.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};

export default config;
