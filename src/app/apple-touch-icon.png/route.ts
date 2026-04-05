import React from 'react';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  const image = new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            width: 180,
            height: 180,
            display: 'flex',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
        },
        [
          React.createElement('div', {
            key: 'card',
            style: {
              position: 'absolute',
              left: 28,
              top: 36,
              width: 124,
              height: 96,
              borderRadius: 18,
              background: '#F8FAFC',
            },
          }),
          React.createElement('div', {
            key: 'mail-body',
            style: {
              position: 'absolute',
              left: 44,
              top: 50,
              width: 92,
              height: 64,
              borderRadius: 14,
              background: '#E0E7FF',
            },
          }),
          React.createElement('div', {
            key: 'mail-flap-left',
            style: {
              position: 'absolute',
              left: 50,
              top: 56,
              width: 36,
              height: 6,
              borderRadius: 999,
              background: '#4338CA',
              transform: 'rotate(28deg)',
              transformOrigin: 'left center',
            },
          }),
          React.createElement('div', {
            key: 'mail-flap-right',
            style: {
              position: 'absolute',
              left: 95,
              top: 56,
              width: 36,
              height: 6,
              borderRadius: 999,
              background: '#4338CA',
              transform: 'rotate(-28deg)',
              transformOrigin: 'right center',
            },
          }),
          React.createElement('div', {
            key: 'mail-line-left',
            style: {
              position: 'absolute',
              left: 50,
              top: 97,
              width: 28,
              height: 5,
              borderRadius: 999,
              background: '#6366F1',
              transform: 'rotate(-40deg)',
            },
          }),
          React.createElement('div', {
            key: 'mail-line-right',
            style: {
              position: 'absolute',
              left: 102,
              top: 97,
              width: 28,
              height: 5,
              borderRadius: 999,
              background: '#6366F1',
              transform: 'rotate(40deg)',
            },
          }),
          React.createElement(
            'div',
            {
              key: 'send-badge',
              style: {
                position: 'absolute',
                left: 107,
                top: 96,
                width: 46,
                height: 46,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                background: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 100%)',
                color: '#ffffff',
                fontSize: 26,
                fontWeight: 900,
              },
            },
            '→'
          ),
          React.createElement('div', {
            key: 'line-1',
            style: {
              position: 'absolute',
              left: 44,
              top: 142,
              width: 92,
              height: 8,
              borderRadius: 999,
              background: '#C7D2FE',
            },
          }),
          React.createElement('div', {
            key: 'line-2',
            style: {
              position: 'absolute',
              left: 44,
              top: 156,
              width: 62,
              height: 8,
              borderRadius: 999,
              background: '#E0E7FF',
            },
          }),
        ]
      )
    ),
    {
      width: 180,
      height: 180,
    }
  );

  return new Response(await image.arrayBuffer(), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
