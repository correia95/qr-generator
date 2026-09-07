# qr-generator

QR Code Generator. Build a **static** QR code for a link, Wi-Fi network, email,
SMS, phone number, plain text or a contact card (MECARD). Live preview, custom
colours, adjustable error-correction and quiet margin, download as PNG or SVG,
copy image to clipboard. Everything runs in the browser; nothing is uploaded and
the codes never expire.

**Live:** https://qr-generator.correia95.workers.dev/

## Stack

- React 18 + TypeScript + Vite
- [`qrcode`](https://www.npmjs.com/package/qrcode) for encoding/rendering (the one
  runtime dependency beyond React) — bundled, no network calls
- Static-assets Cloudflare Worker

## Payload formats

[`src/payload.ts`](src/payload.ts) composes the encoded string:

| Mode | Format |
|------|--------|
| Link | URL, `https://` auto-prefixed |
| Wi-Fi | `WIFI:S:ssid;T:WPA;P:pass;;` (escaped) |
| Email | `mailto:` with encoded subject/body |
| SMS | `SMSTO:number:message` |
| Phone | `tel:number` |
| Contact | `MECARD:N:…;TEL:…;EMAIL:…;;` (escaped) |

Verified in Node: escaping of `\ ; , : "` in Wi-Fi / MECARD, `mailto` encoding.

## Develop / deploy

```bash
npm install
npm run dev
npm run deploy
```
