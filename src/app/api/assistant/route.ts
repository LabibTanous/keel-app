import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { system, conversation } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'not_configured' }, { status: 503 });
    }

    // Anthropic requires the first message to be from the user.
    // Strip any leading assistant messages (e.g. the greeting).
    const messages = (conversation as { role: string; content: string }[])
      .filter((m, i) => !(i === 0 && m.role === 'assistant'));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system,
        messages,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'upstream' }, { status: 502 });
    }
    const data = await res.json();
    const reply = (data?.content ?? [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('\n')
      .trim();
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
