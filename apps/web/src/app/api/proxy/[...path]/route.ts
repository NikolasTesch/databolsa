import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

const ALLOWED_FIRST_SEGMENTS = new Set(['assets', 'transactions', 'portfolio']);

async function handler(request: NextRequest, { params }: { params: { path: string[] } }) {
  const segments = params.path;

  if (segments.some((s) => s === '.' || s === '..')) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  if (!ALLOWED_FIRST_SEGMENTS.has(segments[0])) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const path = `/${segments.join('/')}`;
  const search = request.nextUrl.search;
  const url = `${API_URL}${path}${search}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const text = await request.text();
      if (text) body = text;
    } catch {
      // sem body
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: request.method,
      headers,
      body,
    });
  } catch {
    return NextResponse.json({ message: 'Upstream unavailable' }, { status: 502 });
  }

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  let resBody: unknown;
  try {
    resBody = await res.json();
  } catch {
    resBody = null;
  }

  return NextResponse.json(resBody, { status: res.status });
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
