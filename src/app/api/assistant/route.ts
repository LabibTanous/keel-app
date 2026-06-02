import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { system, conversation } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'not_configured' }, { status: 503 });
    }

    // Groq uses OpenAI-compatible chat completions format.
    // System prompt goes as first message with role "system".
    const messages = [
      { role: 'system', content: system },
      ...(conversation as { role: string; content: string }[])
        .filter((m, i) => !(i === 0 && m.role === 'assistant')),
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 400,
        messages,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'upstream' }, { status: 502 });
    }
    const data = await res.json();
    const reply = (data?.choices?.[0]?.message?.content ?? '').trim();
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
