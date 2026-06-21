# 📲 Social QR — PWA

PWA para gerar links e QR Codes estilizados para múltiplas redes sociais.

## Funcionalidades

- ✅ WhatsApp, Telegram, Instagram, Facebook, Messenger, X, Snapchat
- ✅ Gera link direto para cada rede social
- ✅ QR Code estilizado com `qr-code-styling`
- ✅ Tela dedicada de estilização (cores, formas, gradientes, logo)
- ✅ Exportação em PNG (alta qualidade) e SVG
- ✅ Funciona como destino de compartilhamento (Web Share Target API)
- ✅ Funciona 100% offline (Service Worker)
- ✅ Apenas funciona instalado como PWA
- ✅ Material Design 3 com `@material/web`
- ✅ Modo claro/escuro
- ✅ Histórico de QR Codes gerados (localStorage)

## Tecnologias

- HTML5 / CSS3 / JavaScript (Vanilla)
- [`@material/web`](https://github.com/material-components/material-web) (Material Design 3)
- [`qr-code-styling`](https://qr-code-styling.com/) v1.6
- Service Worker (Cache First + Network First)
- Web App Manifest com `share_target`
- PWA com `display: standalone`

## Redes sociais suportadas

| Rede | Campos | Link gerado |
|---|---|---|
| WhatsApp | Número + Mensagem | `https://wa.me/...` |
| Telegram | Username + Mensagem | `https://t.me/...` |
| Instagram | Username | `https://instagram.com/...` |
| Facebook | Perfil/ID | `https://facebook.com/...` |
| Messenger | Username + Mensagem | `https://m.me/...` |
| X (Twitter) | Username + Tweet | `https://x.com/intent/tweet?...` |
| Snapchat | Username | `https://snapchat.com/add/...` |

## Como usar

1. Faça deploy em qualquer servidor com HTTPS (Vercel, Netlify, GitHub Pages, etc.)
2. Abra no Chrome Android → menu → "Adicionar à tela inicial"
3. Abra o app instalado
4. Selecione a rede social, preencha os dados e clique em **Gerar QR Code**
5. Compartilhe texto de qualquer app e escolha **Social QR** no menu de compartilhar

## Deploy rápido (GitHub Pages)

1. Ative GitHub Pages no repositório (Settings → Pages → branch `main`, pasta `/root`)
2. Acesse `https://AlerrandroV.github.io/social-qr-pwa/`
3. ⚠️ Para o `share_target` funcionar, o `start_url` no manifest deve corresponder ao caminho real

## Estrutura de arquivos

```
social-qr-pwa/
├── index.html
├── style.css
├── app.js
├── sw.js
├── manifest.webmanifest
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    ├── whatsapp.svg
    ├── telegram.svg
    ├── instagram.svg
    ├── facebook.svg
    ├── messenger.svg
    ├── x.svg
    └── snapchat.svg
```
