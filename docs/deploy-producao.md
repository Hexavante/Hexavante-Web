# Deploy em produção — Hexavante

Guia para publicar o Hexavante com domínio próprio: **VPS + Docker**, **DNS no seu IP** ou **Cloudflare Tunnel**.

| Idioma | Seção |
|--------|--------|
| 🇧🇷 | Este documento (português) |
| 🇺🇸 | [English summary](#english-summary) no final |

---

## Visão geral das arquiteturas

### A — VPS clássica (recomendada para produção estável)

```
Usuário → hexavante.com.br (DNS A → IP da VPS) → Nginx + SSL → Docker (Next.js + MariaDB)
```

### B — Cloudflare Tunnel (IP próprio / servidor local sem abrir portas)

```
Usuário → hexavante.com.br (DNS CNAME → Tunnel) → cloudflared → localhost:3000 (ou IP interno)
```

Útil para: máquina em casa, homelab, ou VPS onde você não quer expor a porta 3000 publicamente.

---

## 1. VPS com Docker (arquitetura A)

### 1.1 Contratar VPS

- Mínimo recomendado: **2 GB RAM**
- Exemplos: Hostinger, DigitalOcean, Contabo, Locaweb VPS
- Anote o **IP público** (ex.: `203.0.113.10`)

### 1.2 DNS apontando para o seu IP

No painel do domínio (`hexavante.com.br`):

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | `@` | IP da VPS | 300 |
| A | `www` | IP da VPS | 300 |

Aguarde propagação (5 min – 48 h). Teste: `ping hexavante.com.br`.

> Com **Cloudflare Proxy** (nuvem laranja), o IP visível será da Cloudflare; o origin continua sendo sua VPS.

### 1.3 Preparar a VPS (Ubuntu/Debian)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx git
sudo usermod -aG docker $USER
# logout/login para usar docker sem sudo
```

### 1.4 Clonar e configurar

```bash
git clone https://github.com/nicolaskmazzini-coder/Hexavante-Project.git hexavante
cd hexavante
cp .env.production.example .env.production
nano .env.production
```

Variáveis obrigatórias:

```env
AUTH_URL="https://hexavante.com.br"
AUTH_SECRET="..."          # openssl rand -base64 32
DB_ROOT_PASSWORD="..."
DB_PASSWORD="..."
```

### 1.5 Subir containers

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml logs -f app
```

O `docker-compose.prod.yml` expõe a app em `127.0.0.1:3000` — o Nginx na frente faz o proxy HTTPS.

Seed inicial (uma vez):

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

Sincronizar schema após atualizações:

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma db push
docker compose -f docker-compose.prod.yml exec app npx prisma generate

# Scripts incrementais (se necessário)
docker compose -f docker-compose.prod.yml exec app npm run db:economy
docker compose -f docker-compose.prod.yml exec app npm run db:social
docker compose -f docker-compose.prod.yml exec app npm run db:shop-expand
docker compose -f docker-compose.prod.yml exec app npm run db:direct-messages
```

### 1.6 Nginx + HTTPS (Let's Encrypt)

```bash
sudo cp deploy/nginx-hexavante.conf /etc/nginx/sites-available/hexavante.com.br
sudo ln -s /etc/nginx/sites-available/hexavante.com.br /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

sudo certbot --nginx -d hexavante.com.br -d www.hexavante.com.br
```

### 1.7 OAuth em produção

| Provedor | Callback |
|----------|----------|
| Google | `https://hexavante.com.br/api/auth/callback/google` |
| GitHub | `https://hexavante.com.br/api/auth/callback/github` |

No Google Cloud, adicione `https://hexavante.com.br` em **Origens JavaScript autorizadas**.

### 1.8 Atualizar após mudanças no código

```bash
cd ~/hexavante
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml exec app npx prisma generate
```

---

## 2. Cloudflare Tunnel (arquitetura B)

Publica o domínio **sem abrir porta 3000** na internet — o tráfego entra pela Cloudflare e o `cloudflared` encaminha para sua máquina.

### 2.1 Pré-requisitos

- Domínio na Cloudflare (DNS gerenciado por eles)
- App rodando localmente: `npm run dev` ou `npm run build && npm run start`
- Conta Cloudflare com **Zero Trust** (plano gratuito)

### 2.2 Instalar cloudflared

**Windows (PowerShell admin):**

```powershell
winget install Cloudflare.cloudflared
```

**Linux:**

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

### 2.3 Criar o tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create hexavante
```

Anote o **Tunnel ID** e o arquivo de credenciais gerado.

### 2.4 Configurar ingress

Crie `~/.cloudflared/config.yml` (ou `%USERPROFILE%\.cloudflared\config.yml` no Windows):

```yaml
tunnel: <TUNNEL_ID>
credentials-file: <CAMINHO_DO_JSON_DE_CREDENCIAIS>

ingress:
  - hostname: hexavante.com.br
    service: http://127.0.0.1:3000
  - hostname: www.hexavante.com.br
    service: http://127.0.0.1:3000
  - service: http_status:404
```

> Se o banco MariaDB estiver em outra máquina na rede (`100.x.x.x:3306`), apenas a app Next.js precisa estar acessível em `127.0.0.1:3000`; configure `DATABASE_URL` no `.env` apontando para o IP do banco.

### 2.5 DNS na Cloudflare

```bash
cloudflared tunnel route dns hexavante hexavante.com.br
cloudflared tunnel route dns hexavante www.hexavante.com.br
```

Ou manualmente no painel:

| Tipo | Nome | Conteúdo |
|------|------|----------|
| CNAME | `@` | `<TUNNEL_ID>.cfargotunnel.com` |
| CNAME | `www` | `<TUNNEL_ID>.cfargotunnel.com` |

### 2.6 Rodar o tunnel

```bash
cloudflared tunnel run hexavante
```

Para serviço persistente (Linux):

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### 2.7 Variáveis de ambiente com Tunnel

```env
AUTH_URL="https://hexavante.com.br"
DATABASE_URL="mysql://user:pass@100.x.x.x:3306/hexavante"
```

O Next.js usa `output: standalone` e `--max-http-header-size=65536` nos scripts `dev`/`start` para suportar cookies de sessão.

### 2.8 Checklist Tunnel

- [ ] `npm run dev` ou `npm start` ativo em `localhost:3000`
- [ ] `cloudflared tunnel run` sem erros
- [ ] `AUTH_URL` com `https://`
- [ ] Banco acessível da máquina que roda a app
- [ ] OAuth callbacks usam `https://hexavante.com.br`

---

## 3. Alternativa: Vercel (sem VPS)

1. Hospede MariaDB externamente (Railway, Aiven, VPS só para DB).
2. Importe o repo na [Vercel](https://vercel.com).
3. Configure `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`.
4. Adicione o domínio em **Domains** e ajuste DNS conforme indicado.

> Uploads locais em `public/uploads/` exigem storage persistente — em serverless prefira S3/R2 no futuro.

---

## Checklist final (qualquer arquitetura)

- [ ] `https://hexavante.com.br` abre a home
- [ ] Login e-mail/senha funciona
- [ ] OAuth Google/GitHub (se configurado)
- [ ] Cursos, simulados e loja carregam
- [ ] `AUTH_URL` usa `https://`
- [ ] Permissão de escrita em `public/uploads/` (capas e imagens)

---

## English summary

**Production options:**

1. **VPS + Docker + Nginx** — point DNS **A records** to your server IP; run `docker compose -f docker-compose.prod.yml up -d --build`.
2. **Cloudflare Tunnel** — no open ports; `cloudflared` forwards `hexavante.com.br` to `http://127.0.0.1:3000` on your machine.
3. **Vercel** — serverless frontend with external MariaDB.

Local setup: [instalacao-e-desenvolvimento.md](instalacao-e-desenvolvimento.md).

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| 502 Bad Gateway (Tunnel) | App local parada ou banco inacessível — reinicie `npm run dev` |
| 431 Request Header Fields Too Large | Cookies grandes; use `npm run dev`/`start` com header size aumentado (já no `package.json`) |
| OAuth redirect mismatch | `AUTH_URL` deve coincidir com a URL pública exata |
| Prisma schema drift | `npx prisma db push` + scripts `db:*` no container |
