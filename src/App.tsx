import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { MODES, buildPayload, emptyFields, hint, type Fields, type Mode } from './payload';

type EC = 'L' | 'M' | 'Q' | 'H';

const FIELD = (
  label: string,
  value: string,
  onChange: (v: string) => void,
  props: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {},
) => (
  <label className="f">
    <span>{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} {...props} />
  </label>
);

export default function App() {
  const [mode, setMode] = useState<Mode>('url');
  const [f, setF] = useState<Fields>(emptyFields);
  const [ec, setEc] = useState<EC>('M');
  const [fg, setFg] = useState('#111111');
  const [bg, setBg] = useState('#ffffff');
  const [margin, setMargin] = useState(2);
  const [size, setSize] = useState(512);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const set = (patch: Partial<Fields>) => setF((prev) => ({ ...prev, ...patch }));

  const payload = useMemo(() => buildPayload(mode, f), [mode, f]);
  const tooLong = payload.length > 2000;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!payload || tooLong) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = size;
        canvas.height = size;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, size, size);
      }
      return;
    }
    QRCode.toCanvas(canvas, payload, {
      errorCorrectionLevel: ec,
      margin,
      width: size,
      color: { dark: fg, light: bg },
    }).catch(() => {});
  }, [payload, ec, fg, bg, margin, size, tooLong]);

  const download = async (kind: 'png' | 'svg') => {
    if (!payload || tooLong) return;
    let href: string;
    let name: string;
    if (kind === 'png') {
      href = canvasRef.current!.toDataURL('image/png');
      name = 'qr-code.png';
    } else {
      const svg = await QRCode.toString(payload, {
        type: 'svg',
        errorCorrectionLevel: ec,
        margin,
        color: { dark: fg, light: bg },
      });
      href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      name = 'qr-code.svg';
    }
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copyPng = async () => {
    if (!payload || tooLong) return;
    try {
      const blob: Blob = await new Promise((res) =>
        canvasRef.current!.toBlob((b) => res(b!), 'image/png'),
      );
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard image not supported */
    }
  };

  return (
    <div className="app">
      <header>
        <h1>QR Code Generator</h1>
        <p className="tag">
          Make a QR code for a link, Wi-Fi network, contact card and more. It updates as you type and
          downloads as a sharp PNG or SVG. Nothing is uploaded — the code is built in your browser.
        </p>
      </header>

      <div className="tabs">
        {MODES.map((m) => (
          <button key={m.id} className={mode === m.id ? 'on' : ''} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid">
        <div className="left">
          <div className="inputs">
            {mode === 'url' &&
              FIELD('Website address', f.url, (v) => set({ url: v }), {
                placeholder: 'example.com',
                autoCapitalize: 'off',
                autoCorrect: 'off',
                inputMode: 'url',
              })}

            {mode === 'text' && (
              <label className="f">
                <span>Text</span>
                <textarea
                  value={f.text}
                  onChange={(e) => set({ text: e.target.value })}
                  rows={4}
                  placeholder="Anything you like"
                />
              </label>
            )}

            {mode === 'wifi' && (
              <>
                {FIELD('Network name (SSID)', f.wifiSsid, (v) => set({ wifiSsid: v }), {
                  placeholder: 'MyWiFi',
                  autoCapitalize: 'off',
                })}
                <label className="f">
                  <span>Security</span>
                  <select
                    value={f.wifiAuth}
                    onChange={(e) => set({ wifiAuth: e.target.value as Fields['wifiAuth'] })}
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">No password</option>
                  </select>
                </label>
                {f.wifiAuth !== 'nopass' &&
                  FIELD('Password', f.wifiPassword, (v) => set({ wifiPassword: v }), {
                    autoCapitalize: 'off',
                    autoCorrect: 'off',
                  })}
                <label className="cb">
                  <input
                    type="checkbox"
                    checked={f.wifiHidden}
                    onChange={(e) => set({ wifiHidden: e.target.checked })}
                  />
                  <span>Hidden network</span>
                </label>
              </>
            )}

            {mode === 'email' && (
              <>
                {FIELD('To', f.emailTo, (v) => set({ emailTo: v }), {
                  placeholder: 'name@example.com',
                  inputMode: 'email',
                  autoCapitalize: 'off',
                })}
                {FIELD('Subject', f.emailSubject, (v) => set({ emailSubject: v }))}
                <label className="f">
                  <span>Message</span>
                  <textarea
                    value={f.emailBody}
                    onChange={(e) => set({ emailBody: e.target.value })}
                    rows={3}
                  />
                </label>
              </>
            )}

            {mode === 'sms' && (
              <>
                {FIELD('Phone number', f.smsTo, (v) => set({ smsTo: v }), {
                  placeholder: '+61400000000',
                  inputMode: 'tel',
                })}
                <label className="f">
                  <span>Message</span>
                  <textarea
                    value={f.smsBody}
                    onChange={(e) => set({ smsBody: e.target.value })}
                    rows={3}
                  />
                </label>
              </>
            )}

            {mode === 'phone' &&
              FIELD('Phone number', f.phone, (v) => set({ phone: v }), {
                placeholder: '+61 400 000 000',
                inputMode: 'tel',
              })}

            {mode === 'contact' && (
              <>
                {FIELD('Name', f.cName, (v) => set({ cName: v }))}
                {FIELD('Phone', f.cPhone, (v) => set({ cPhone: v }), { inputMode: 'tel' })}
                {FIELD('Email', f.cEmail, (v) => set({ cEmail: v }), {
                  inputMode: 'email',
                  autoCapitalize: 'off',
                })}
                {FIELD('Organisation', f.cOrg, (v) => set({ cOrg: v }))}
                {FIELD('Website', f.cUrl, (v) => set({ cUrl: v }), { autoCapitalize: 'off' })}
              </>
            )}
          </div>

          <p className="hint">{hint(mode)}</p>

          <details className="opts">
            <summary>Style &amp; options</summary>
            <div className="optgrid">
              <label className="f">
                <span>Foreground</span>
                <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
              </label>
              <label className="f">
                <span>Background</span>
                <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
              </label>
              <label className="f">
                <span>Error correction</span>
                <select value={ec} onChange={(e) => setEc(e.target.value as EC)}>
                  <option value="L">Low (7%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
              </label>
              <label className="f">
                <span>Quiet margin: {margin}</span>
                <input
                  type="range"
                  min={0}
                  max={8}
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                />
              </label>
              <label className="f">
                <span>Export size: {size}px</span>
                <input
                  type="range"
                  min={128}
                  max={1024}
                  step={64}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                />
              </label>
            </div>
          </details>
        </div>

        <div className="right">
          <div className="qrbox" style={{ background: bg }}>
            <canvas ref={canvasRef} className="qr" />
            {!payload && <div className="ph">Fill in the form to see your QR code</div>}
            {tooLong && <div className="ph">That is too much data for a reliable QR code.</div>}
          </div>
          <div className="actions">
            <button onClick={() => download('png')} disabled={!payload || tooLong}>
              PNG
            </button>
            <button onClick={() => download('svg')} disabled={!payload || tooLong}>
              SVG
            </button>
            <button onClick={copyPng} disabled={!payload || tooLong}>
              {copied ? 'Copied' : 'Copy image'}
            </button>
          </div>
          {payload && !tooLong && (
            <p className="pv" title="Exact contents of the QR code">
              {payload.length} characters encoded
            </p>
          )}
        </div>
      </div>

      <section className="explainer">
        <h2>How QR codes work</h2>
        <p>
          A QR ("Quick Response") code is a 2D barcode that stores text — a URL, some words, or a
          small structured record. A camera reads the black-and-white grid and hands the text to the
          phone, which decides what to do with it: open a link, join a Wi-Fi network, start an email,
          and so on. There is no server in between and nothing about the scan is reported back to
          whoever made the code.
        </p>
        <h3>Which type should I choose?</h3>
        <table>
          <tbody>
            <tr><td>Link</td><td>Send someone to a web page, a menu, a form, a payment link.</td></tr>
            <tr><td>Text</td><td>Show a short message or a code with no action attached.</td></tr>
            <tr><td>Wi-Fi</td><td>Let guests join your network without typing the password.</td></tr>
            <tr><td>Email / SMS</td><td>Open a pre-filled message so people can contact you in one tap.</td></tr>
            <tr><td>Phone</td><td>Start a call — handy on posters and business cards.</td></tr>
            <tr><td>Contact</td><td>Share your details as a saveable contact card (MECARD).</td></tr>
          </tbody>
        </table>
        <h3>Error correction</h3>
        <p>
          QR codes carry redundant data so they still scan when partly damaged or obscured. Higher
          levels (Quartile or High) survive more wear and let you place a logo in the middle, at the
          cost of a denser code. Medium is a good default for screens and print. If a code will be
          small, printed on something that flexes, or partly covered, choose High.
        </p>
        <h3>Tips for a code that always scans</h3>
        <ul>
          <li>Keep good contrast — dark foreground on a light background, not the other way round.</li>
          <li>Leave the quiet margin (the empty border) in place; scanners need it.</li>
          <li>Print at least 2&nbsp;cm × 2&nbsp;cm; bigger if it will be scanned from a distance.</li>
          <li>Prefer a short URL — less data means a simpler, more forgiving code.</li>
          <li>Test it with a few different phones before you print a thousand copies.</li>
        </ul>
        <h3>Do these codes expire? Are they tracked?</h3>
        <p>
          No. This tool makes <em>static</em> codes: the text is encoded directly in the pattern, so
          the code works forever and records nothing. (Paid "dynamic" QR services encode a redirect
          link they can change and log — useful for analytics, but the code stops working if you stop
          paying.)
        </p>
        <footer>QR Code Generator · static codes · built in your browser · no sign-up</footer>
      </section>
    </div>
  );
}
