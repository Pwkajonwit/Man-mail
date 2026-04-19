import { NextRequest, NextResponse } from 'next/server';
import {
  formatBytes,
  getEstimatedJsonPayloadBytes,
  getMaxAttachmentBytes,
} from '@/lib/attachments';

const MAX_PROXY_BODY_BYTES = getEstimatedJsonPayloadBytes(getMaxAttachmentBytes());

function getGasUrl() {
  const url = process.env.NEXT_PUBLIC_GAS_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_GAS_URL is not configured');
  }
  return url;
}

export async function GET(request: NextRequest) {
  try {
    const upstreamUrl = new URL(getGasUrl());
    request.nextUrl.searchParams.forEach((value, key) => {
      upstreamUrl.searchParams.set(key, value);
    });

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
    });

    const text = await upstreamResponse.text();
    return new NextResponse(text, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Proxy request failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_PROXY_BODY_BYTES) {
      return NextResponse.json(
        {
          status: 'error',
          message: `Request is too large (${formatBytes(contentLength)}). Attachment payload limit is ${formatBytes(MAX_PROXY_BODY_BYTES)}.`,
        },
        { status: 413 }
      );
    }

    const body = await request.text();
    const bodyBytes = new TextEncoder().encode(body).byteLength;
    if (bodyBytes > MAX_PROXY_BODY_BYTES) {
      return NextResponse.json(
        {
          status: 'error',
          message: `Request is too large (${formatBytes(bodyBytes)}). Attachment payload limit is ${formatBytes(MAX_PROXY_BODY_BYTES)}.`,
        },
        { status: 413 }
      );
    }

    const upstreamResponse = await fetch(getGasUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body,
      cache: 'no-store',
    });

    const text = await upstreamResponse.text();
    return new NextResponse(text, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Proxy request failed' },
      { status: 500 }
    );
  }
}
