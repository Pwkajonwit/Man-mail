export interface GasResponse<T = unknown> {
  status?: string;
  message?: string;
  data?: T;
}

function summarizeHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}

export async function fetchGasJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<GasResponse<T>> {
  const response = await fetch(input, init);
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const json = JSON.parse(text) as GasResponse<T>;
    if (!response.ok) {
      throw new Error(json.message || `Request failed: ${response.status} ${response.statusText}`);
    }
    return json;
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const json = JSON.parse(trimmed) as GasResponse<T>;
    if (!response.ok) {
      throw new Error(json.message || `Request failed: ${response.status} ${response.statusText}`);
    }
    return json;
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}. ${trimmed.slice(0, 140)}`);
  }

  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    throw new Error(
      `Apps Script returned HTML instead of JSON. Check NEXT_PUBLIC_GAS_URL and deploy permissions. ${summarizeHtml(trimmed)}`
    );
  }

  throw new Error(`Unexpected API response. ${trimmed.slice(0, 140)}`);
}
