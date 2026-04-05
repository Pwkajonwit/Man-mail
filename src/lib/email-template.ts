export interface EmailTemplateFields {
  body: string;
  signature_name?: string;
  signature_title?: string;
  signature_phone?: string;
  signature_email?: string;
  signature_company?: string;
  image_url?: string;
}

export interface EmailTemplateRecord extends EmailTemplateFields {
  id?: string;
  title: string;
  subject: string;
}

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

export function createEmptyTemplate(): EmailTemplateRecord {
  return {
    title: '',
    subject: '',
    body: '',
    signature_name: '',
    signature_title: '',
    signature_phone: '',
    signature_email: '',
    signature_company: '',
    image_url: '',
  };
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeText(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

function normalizeField(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\r\n/g, '\n').trim();
}

function sanitizeAssetUrl(value?: string): string {
  const trimmed = normalizeField(value);
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return '';
}

export function formatBodyToHtml(value: string): string {
  const normalized = normalizeField(value);
  if (!normalized) return '';
  if (HTML_TAG_PATTERN.test(normalized)) return normalized;

  return `<div style="white-space:normal;">${escapeHtml(normalized).replace(/\n/g, '<br />')}</div>`;
}

export function buildEmailHtml(template: EmailTemplateFields): string {
  const bodyHtml = formatBodyToHtml(template.body || '');
  const imageUrl = sanitizeAssetUrl(template.image_url);
  const signatureName = normalizeField(template.signature_name);
  const signatureTitle = normalizeField(template.signature_title);
  const signatureCompany = normalizeField(template.signature_company);
  const signaturePhone = normalizeField(template.signature_phone);
  const signatureEmail = normalizeField(template.signature_email);

  const signatureLines = [
    signatureName,
    signatureTitle,
    signatureCompany,
    signaturePhone ? `Phone: ${signaturePhone}` : '',
    signatureEmail ? `Email: ${signatureEmail}` : '',
  ].filter(Boolean) as string[];

  const signatureHtml = signatureLines.length
    ? `
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #d8e1ec;color:#334155;">
        ${signatureLines
          .map((line, index) => {
            const weight = index === 0 ? 700 : 400;
            return `<div style="margin:0 0 4px;font-weight:${weight};">${escapeHtml(line)}</div>`;
          })
          .join('')}
      </div>
    `
    : '';

  const imageHtml = imageUrl
    ? `
      <div style="margin-top:20px;">
        <img
          src="${escapeHtml(imageUrl)}"
          alt="Template visual"
          style="max-width:100%;height:auto;border-radius:12px;border:1px solid #d8e1ec;display:block;"
        />
      </div>
    `
    : '';

  return `
    <div style="font-family:Arial,'Helvetica Neue',sans-serif;font-size:15px;line-height:1.7;color:#1f2937;">
      ${bodyHtml || '<p style="margin:0;">&nbsp;</p>'}
      ${imageHtml}
      ${signatureHtml}
    </div>
  `.trim();
}

export function buildTemplateExcerpt(template: EmailTemplateFields): string {
  const normalizedBody = normalizeField(template.body || '');
  const bodyText = HTML_TAG_PATTERN.test(normalizedBody) ? stripHtml(normalizedBody) : normalizeText(normalizedBody);
  const signatureParts = [
    normalizeField(template.signature_name),
    normalizeField(template.signature_company),
  ].filter(Boolean);

  return [bodyText, ...signatureParts].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}
