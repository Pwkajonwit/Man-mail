import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #312E81 0%, #4F46E5 45%, #7C3AED 100%)',
          color: '#F8FAFC',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top right, rgba(56, 189, 248, 0.28), transparent 34%), radial-gradient(circle at bottom left, rgba(165, 180, 252, 0.22), transparent 30%)',
          }}
        />
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            padding: '64px 72px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: 660,
              gap: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                fontSize: 28,
                fontWeight: 700,
                color: '#BFDBFE',
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                ✉
              </div>
              MAN Email
            </div>
            <div
              style={{
                fontSize: 68,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -2,
              }}
            >
              Email Management
            </div>
            <div
              style={{
                fontSize: 30,
                lineHeight: 1.4,
                color: '#E0E7FF',
              }}
            >
              Manage contacts, prepare templates, and send outbound emails with attachments from one dashboard.
            </div>
          </div>
          <div
            style={{
              width: 330,
              height: 330,
              display: 'flex',
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 88,
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 220,
                height: 168,
                borderRadius: 36,
                background: '#F8FAFC',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 164,
                height: 118,
                borderRadius: 26,
                background: '#E0E7FF',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 92,
                height: 14,
                borderRadius: 999,
                background: '#4338CA',
                transform: 'translate(-38px, -18px) rotate(28deg)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 92,
                height: 14,
                borderRadius: 999,
                background: '#4338CA',
                transform: 'translate(38px, -18px) rotate(-28deg)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 76,
                height: 12,
                borderRadius: 999,
                background: '#6366F1',
                transform: 'translate(-50px, 44px) rotate(-40deg)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 76,
                height: 12,
                borderRadius: 999,
                background: '#6366F1',
                transform: 'translate(50px, 44px) rotate(40deg)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 112,
                height: 112,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                background: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 100%)',
                color: '#F8FAFC',
                fontSize: 72,
                fontWeight: 900,
                transform: 'translate(84px, 86px)',
              }}
            >
              →
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
