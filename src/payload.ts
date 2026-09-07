// Compose the string that goes into a QR code from structured inputs.
// These formats are the de-facto standards that phone cameras recognise.

export type Mode = 'url' | 'text' | 'wifi' | 'email' | 'sms' | 'phone' | 'contact';

export interface Fields {
  url: string;
  text: string;
  // wifi
  wifiSsid: string;
  wifiPassword: string;
  wifiAuth: 'WPA' | 'WEP' | 'nopass';
  wifiHidden: boolean;
  // email
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  // sms
  smsTo: string;
  smsBody: string;
  // phone
  phone: string;
  // contact (MECARD — shorter and better supported than vCard for QR)
  cName: string;
  cPhone: string;
  cEmail: string;
  cOrg: string;
  cUrl: string;
}

export const emptyFields: Fields = {
  url: '',
  text: '',
  wifiSsid: '',
  wifiPassword: '',
  wifiAuth: 'WPA',
  wifiHidden: false,
  emailTo: '',
  emailSubject: '',
  emailBody: '',
  smsTo: '',
  smsBody: '',
  phone: '',
  cName: '',
  cPhone: '',
  cEmail: '',
  cOrg: '',
  cUrl: '',
};

// escape for WIFI: / MECARD: grammars — backslash-escape \ ; , : "
const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');

export function buildPayload(mode: Mode, f: Fields): string {
  switch (mode) {
    case 'url': {
      const v = f.url.trim();
      if (!v) return '';
      return /^[a-z][a-z0-9+.-]*:\/\//i.test(v) || /^(mailto:|tel:)/i.test(v) ? v : `https://${v}`;
    }
    case 'text':
      return f.text;
    case 'wifi': {
      if (!f.wifiSsid) return '';
      const parts = [`S:${esc(f.wifiSsid)}`];
      parts.push(`T:${f.wifiAuth}`);
      if (f.wifiAuth !== 'nopass') parts.push(`P:${esc(f.wifiPassword)}`);
      if (f.wifiHidden) parts.push('H:true');
      return `WIFI:${parts.join(';')};;`;
    }
    case 'email': {
      if (!f.emailTo.trim()) return '';
      const q: string[] = [];
      if (f.emailSubject) q.push(`subject=${encodeURIComponent(f.emailSubject)}`);
      if (f.emailBody) q.push(`body=${encodeURIComponent(f.emailBody)}`);
      return `mailto:${f.emailTo.trim()}${q.length ? `?${q.join('&')}` : ''}`;
    }
    case 'sms': {
      if (!f.smsTo.trim()) return '';
      return f.smsBody
        ? `SMSTO:${f.smsTo.trim()}:${f.smsBody}`
        : `SMSTO:${f.smsTo.trim()}`;
    }
    case 'phone': {
      if (!f.phone.trim()) return '';
      return `tel:${f.phone.trim().replace(/\s+/g, '')}`;
    }
    case 'contact': {
      if (!f.cName.trim() && !f.cPhone.trim()) return '';
      const parts: string[] = [];
      if (f.cName) parts.push(`N:${esc(f.cName)}`);
      if (f.cPhone) parts.push(`TEL:${esc(f.cPhone.replace(/\s+/g, ''))}`);
      if (f.cEmail) parts.push(`EMAIL:${esc(f.cEmail)}`);
      if (f.cOrg) parts.push(`ORG:${esc(f.cOrg)}`);
      if (f.cUrl) parts.push(`URL:${esc(f.cUrl)}`);
      return `MECARD:${parts.join(';')};;`;
    }
  }
}

export function hint(mode: Mode): string {
  switch (mode) {
    case 'url':
      return 'Opens a website when scanned. The https:// prefix is added if you leave it off.';
    case 'text':
      return 'Plain text — the scanner just shows it. Good for notes, codes or short messages.';
    case 'wifi':
      return 'Phones offer to join the network when this is scanned from the camera. Works on iOS 11+ and Android 10+.';
    case 'email':
      return 'Opens a new email to this address, optionally pre-filled with a subject and body.';
    case 'sms':
      return 'Opens a text message to this number with the message pre-filled.';
    case 'phone':
      return 'Starts a call to this number. Include the country code for reliability, e.g. +61 4…';
    case 'contact':
      return 'Adds a contact card (MECARD). Most camera apps recognise it and offer to save the contact.';
  }
}

export const MODES: { id: Mode; label: string }[] = [
  { id: 'url', label: 'Link' },
  { id: 'text', label: 'Text' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'phone', label: 'Phone' },
  { id: 'contact', label: 'Contact' },
];
