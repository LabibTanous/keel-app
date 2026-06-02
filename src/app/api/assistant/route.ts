import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { system, conversation } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'not_configured' }, { status: 503 });
    }

    const logInstructions = `
When the user describes paying for something, spending money, or receiving/earning money, include an ACTION block at the END of your reply (on its own line, after the human text):

For expenses: ACTION_LOG:{"type":"expense","amount":500,"currency":"AED","category":"rent","date":"2026-06-02"}
For income received: ACTION_LOG:{"type":"income_received","amount":10000,"currency":"AED","date":"2026-06-02"}
For expected income: ACTION_LOG:{"type":"income_expected","amount":10000,"currency":"AED","date":"2026-06-02"}

Rules:
- Only include ACTION_LOG when user clearly describes a specific transaction (amount must be present)
- Use today's date if no date mentioned: ${new Date().toISOString().slice(0, 10)}
- Use AED if no currency mentioned (user is UAE-based)
- category: infer from context (rent, food, transport, software, other)
- Parse amounts: "3k" = 3000, "40k" = 40000, "3,500" = 3500
- For confirmation messages after logging, do NOT include another ACTION_LOG`;

    // Groq uses OpenAI-compatible chat completions format.
    // System prompt goes as first message with role "system".
    const messages = [
      { role: 'system', content: system + '\n' + logInstructions },
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
    const rawReply = (data?.choices?.[0]?.message?.content ?? '').trim();
    const actionMatch = rawReply.match(/ACTION_LOG:(\{[^}]+\})/);
    let action = null;
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
      } catch {
        // Malformed JSON in ACTION_LOG — ignore
      }
    }
    const reply = rawReply.replace(/\nACTION_LOG:\{[^}]+\}/g, '').trim()
      || "Done — I've logged that for you.";
    return NextResponse.json({ reply, action });
  } catch {
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
