import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { imageBase64, mimeType } = await req.json();

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json({ error: 'vision_unavailable' }, { status: 503 });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 },
            },
            {
              type: 'text',
              text: 'Extract from this receipt: merchant name, total amount, currency, date. Reply ONLY with JSON: {"merchant":"...","amount":0,"currency":"AED","date":"YYYY-MM-DD"}. If you cannot read it clearly, return {"error":"unreadable"}.',
            },
          ],
        }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text: string = data.content?.[0]?.text ?? '';
      const match = text.match(/\{[^}]+\}/);
      const parsed = match ? JSON.parse(match[0]) : {};
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ error: 'vision_unavailable' }, { status: 503 });
  } catch {
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
