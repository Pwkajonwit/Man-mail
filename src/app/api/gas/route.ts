import { NextRequest, NextResponse } from 'next/server';

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
    const upstreamResponse = await fetch(getGasUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'text/plain;charset=UTF-8',
      },
      body: await request.text(),
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
