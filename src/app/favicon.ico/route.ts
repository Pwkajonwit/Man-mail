export const runtime = 'edge';

export async function GET() {
  const svg = `
    <svg width="64" height="64" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="64" y1="48" x2="448" y2="464" gradientUnits="userSpaceOnUse">
          <stop stop-color="#4F46E5"/>
          <stop offset="1" stop-color="#7C3AED"/>
        </linearGradient>
        <linearGradient id="badge" x1="300" y1="290" x2="402" y2="392" gradientUnits="userSpaceOnUse">
          <stop stop-color="#38BDF8"/>
          <stop offset="1" stop-color="#2563EB"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="120" fill="url(#bg)"/>
      <rect x="88" y="120" width="336" height="252" rx="40" fill="#F8FAFC"/>
      <path d="M136 190C136 172.327 150.327 158 168 158H344C361.673 158 376 172.327 376 190V302C376 319.673 361.673 334 344 334H168C150.327 334 136 319.673 136 302V190Z" fill="#E0E7FF"/>
      <path d="M156 186L256 256L356 186" stroke="#4338CA" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M156 306L225 246" stroke="#6366F1" stroke-width="18" stroke-linecap="round"/>
      <path d="M356 306L287 246" stroke="#6366F1" stroke-width="18" stroke-linecap="round"/>
      <circle cx="370" cy="348" r="62" fill="url(#badge)"/>
      <path d="M344 348H389" stroke="#F8FAFC" stroke-width="18" stroke-linecap="round"/>
      <path d="M371 330L389 348L371 366" stroke="#F8FAFC" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M118 380H284" stroke="#C7D2FE" stroke-width="22" stroke-linecap="round"/>
      <path d="M118 420H228" stroke="#E0E7FF" stroke-width="22" stroke-linecap="round"/>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
