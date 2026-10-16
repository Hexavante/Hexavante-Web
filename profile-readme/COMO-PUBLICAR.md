# README do perfil GitHub

Este arquivo é o **README do perfil** (`nicolaskmazzini-coder/nicolaskmazzini-coder`), não do projeto Hexavante.

## Como publicar

### 1. Criar o repositório especial (se ainda não existir)

1. Acesse [github.com/new](https://github.com/new)
2. **Repository name:** `nicolaskmazzini-coder` — **igual ao seu username**
3. Marque **Public**
4. Pode marcar "Add a README" (você vai substituir o conteúdo)
5. Clique em **Create repository**

> GitHub só exibe README na página do perfil quando o repositório tem **exatamente o mesmo nome** do usuário.

### 2. Enviar o README

**Opção A — pela interface web**

1. Abra `https://github.com/nicolaskmazzini-coder/nicolaskmazzini-coder`
2. Edite `README.md`
3. Cole o conteúdo de `profile-readme/README.md` deste projeto
4. Commit

**Opção B — pelo terminal**

```bash
git clone https://github.com/nicolaskmazzini-coder/nicolaskmazzini-coder.git
cd nicolaskmazzini-coder
# Copie profile-readme/README.md do Hexavante para README.md aqui
git add README.md
git commit -m "docs: profile README bilíngue PT/EN"
git push origin main
```

### 3. Conferir

Abra [github.com/nicolaskmazzini-coder](https://github.com/nicolaskmazzini-coder) — o README deve aparecer abaixo do avatar.

## Personalizar depois

| O que | Onde |
|-------|------|
| Nome no banner | Linha do `capsule-render` no topo do README |
| Link do site | Badge `hexavante.com.br` (ajuste se mudar domínio) |
| LinkedIn / e-mail | Adicione badges na seção central após os links do GitHub |
| Tema dos stats | Parâmetro `theme=` nas URLs do github-readme-stats |

## Widgets usados

- [github-readme-stats](https://github.com/anuraghazra/github-readme-stats) — stats gerais e pin do repo
- [github-readme-streak-stats](https://github.com/DenverCoder1/github-readme-streak-stats) — sequência de commits
- [capsule-render](https://github.com/kyechan99/capsule-render) — banner do topo
- [komarev](https://komarev.com/) — contador de views do perfil
