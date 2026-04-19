const BYTES_PER_MB = 1024 * 1024;

const FALLBACK_MAX_ATTACHMENT_MB = 18;

export const BLOCKED_ATTACHMENT_EXTENSIONS = [
  'ade',
  'adp',
  'apk',
  'appx',
  'bat',
  'cab',
  'chm',
  'cmd',
  'com',
  'cpl',
  'diagcab',
  'diagcfg',
  'diagpkg',
  'dll',
  'dmg',
  'ex',
  'ex_',
  'exe',
  'hta',
  'img',
  'ins',
  'iso',
  'isp',
  'jar',
  'jnlp',
  'js',
  'jse',
  'lib',
  'lnk',
  'mde',
  'msc',
  'msi',
  'msix',
  'msp',
  'mst',
  'nsh',
  'pif',
  'ps1',
  'scr',
  'sct',
  'shb',
  'sys',
  'vb',
  'vbe',
  'vbs',
  'vxd',
  'wsc',
  'wsf',
  'wsh',
] as const;

export function getMaxAttachmentBytes() {
  const configuredMb = Number(process.env.NEXT_PUBLIC_MAX_ATTACHMENT_MB);
  const maxMb = Number.isFinite(configuredMb) && configuredMb > 0
    ? configuredMb
    : FALLBACK_MAX_ATTACHMENT_MB;

  return Math.floor(maxMb * BYTES_PER_MB);
}

export function getEstimatedJsonPayloadBytes(rawAttachmentBytes: number) {
  return Math.ceil(rawAttachmentBytes * 4 / 3) + 256 * 1024;
}

export function formatBytes(bytes: number) {
  if (bytes < BYTES_PER_MB) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;
}

export function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex < 0) return '';
  return fileName.slice(dotIndex + 1).toLowerCase();
}

export function isBlockedAttachmentName(fileName: string) {
  return BLOCKED_ATTACHMENT_EXTENSIONS.includes(
    getFileExtension(fileName) as (typeof BLOCKED_ATTACHMENT_EXTENSIONS)[number]
  );
}
