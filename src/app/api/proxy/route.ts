import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { endpoint, method, body, headers } = await req.json();

    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    // Prepare payload safely: if body is already a JSON string, forward as-is
    let payload: string | undefined = undefined;
    const m = (method || 'GET').toUpperCase();
    if (m !== 'GET' && body !== undefined) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Decide content-type automatically if client didn't force one
    const baseHeaders: Record<string, string> = {
      ...(headers && typeof headers === 'object' ? (headers as any) : {}),
    };
    let outContentType = baseHeaders['Content-Type'] || baseHeaders['content-type'];
    if (!outContentType) {
      if (typeof payload === 'string') {
        // Try to detect if payload is valid JSON; if not, fall back to text/plain
        try {
          JSON.parse(payload);
          outContentType = 'application/json';
        } catch {
          outContentType = 'text/plain;charset=utf-8';
        }
      } else if (payload !== undefined) {
        outContentType = 'application/json';
      }
    }
    if (outContentType) baseHeaders['Content-Type'] = outContentType;

    const init: RequestInit = {
      method: m,
      headers: baseHeaders as HeadersInit,
      body: payload,
    };

    const targetRes = await fetch(endpoint, init);

    let data: any = null;
    const contentType = targetRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await targetRes.json();
    } else {
      data = await targetRes.text();
    }

    // Return response to the client (same-origin), avoiding CORS issues
    return NextResponse.json(
      {
        status: targetRes.status,
        response: data,
      },
      {
        status: 200,
      },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 0,
        response: { error: String(err) },
      },
      { status: 200 },
    );
  }
}
