import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

interface ParsedTransaction {
  date: string;       // YYYY-MM-DD
  description: string;
  amount: number;     // positive = credit (income), negative = debit (expense)
  currency: string;
  type: 'income' | 'expense' | 'unknown';
  category?: string;
}

function parseCSV(text: string): ParsedTransaction[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));

  // Try to find column indices for date, description, amount
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('تاريخ'));
  const descIdx = headers.findIndex(h =>
    h.includes('desc') || h.includes('narr') || h.includes('particular') || h.includes('detail') || h.includes('رمز')
  );
  const amtIdx = headers.findIndex(h =>
    h.includes('amount') || h.includes('credit') || h.includes('debit') || h.includes('مبلغ')
  );
  const creditIdx = headers.findIndex(h => h === 'credit' || h === 'cr' || h.includes('credit amount'));
  const debitIdx = headers.findIndex(h => h === 'debit' || h === 'dr' || h.includes('debit amount'));
  const ccyIdx = headers.findIndex(h => h === 'currency' || h === 'ccy' || h === 'curr' || h.includes('currency'));

  const KNOWN_CCY = ['AED', 'USD', 'EUR', 'GBP', 'SAR'];

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
    if (cols.length < 2) continue;

    const rawDate = dateIdx >= 0 ? cols[dateIdx] : '';
    const desc = descIdx >= 0 ? cols[descIdx] : cols[1] || '';

    // Try to parse date
    let date = '';
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        date = d.toISOString().slice(0, 10);
      }
    }
    if (!date) continue;

    // Parse amounts
    let amount = 0;
    if (creditIdx >= 0 && debitIdx >= 0) {
      const credit = parseFloat(cols[creditIdx]?.replace(/[^0-9.]/g, '') || '0') || 0;
      const debit = parseFloat(cols[debitIdx]?.replace(/[^0-9.]/g, '') || '0') || 0;
      amount = credit > 0 ? credit : -debit;
    } else if (amtIdx >= 0) {
      const raw = cols[amtIdx]?.replace(/[^0-9.-]/g, '') || '0';
      amount = parseFloat(raw) || 0;
    }

    if (Math.abs(amount) < 0.01) continue;

    // Read the currency column when present; default to AED (home currency) when absent.
    let currency = 'AED';
    if (ccyIdx >= 0 && cols[ccyIdx]) {
      const raw = cols[ccyIdx].toUpperCase().replace(/[^A-Z]/g, '');
      if (KNOWN_CCY.includes(raw)) currency = raw;
    }

    const type: ParsedTransaction['type'] = amount > 0 ? 'income' : 'expense';

    transactions.push({ date, description: desc, amount, currency, type });
  }

  return transactions;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 });

      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // CSV parsing (in-server)
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        const text = new TextDecoder().decode(bytes);
        const transactions = parseCSV(text);
        return NextResponse.json({ transactions, method: 'csv' });
      }

      // PDF parsing via Claude
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
          return NextResponse.json({ error: 'pdf_requires_anthropic_key', transactions: [] });
        }

        const base64 = Buffer.from(bytes).toString('base64');

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4000,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: { type: 'base64', media_type: 'application/pdf', data: base64 },
                },
                {
                  type: 'text',
                  text: `Extract ALL transactions from this bank statement.
Return ONLY a JSON array (no other text) like:
[{"date":"2026-01-15","description":"Salary deposit","amount":15000,"currency":"AED","type":"income"},
 {"date":"2026-01-20","description":"Grocery store","amount":-450,"currency":"AED","type":"expense"}]

Rules:
- amount is positive for credits/income, negative for debits/expenses
- date must be YYYY-MM-DD format
- currency: use AED if not specified, USD/EUR/GBP if clearly stated
- type: "income" if credit/deposit, "expense" if debit/payment, "unknown" if unclear
- Include ALL transactions you can find, not just a sample
- If you cannot read or parse the document, return []`,
                },
              ],
            }],
          }),
        });

        if (!res.ok) {
          return NextResponse.json({ error: 'claude_error', transactions: [] }, { status: 502 });
        }

        const data = await res.json() as { content?: Array<{ text?: string }> };
        const text = (data.content?.[0]?.text ?? '').trim();

        try {
          const match = text.match(/\[[\s\S]*\]/);
          const transactions: ParsedTransaction[] = match ? JSON.parse(match[0]) as ParsedTransaction[] : [];
          return NextResponse.json({ transactions, method: 'pdf_claude' });
        } catch {
          return NextResponse.json({ error: 'parse_error', transactions: [], raw: text.slice(0, 200) });
        }
      }

      return NextResponse.json({ error: 'unsupported_format', transactions: [] }, { status: 400 });
    }

    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'server', transactions: [] }, { status: 500 });
  }
}
