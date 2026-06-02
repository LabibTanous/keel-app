import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Receives inbound email webhooks from Postmark/SendGrid/etc.
// Email routing setup: configure your email provider to POST to /api/inbound-email
// Postmark: https://postmarkapp.com/developer/user-guide/inbound/parse-an-email

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Postmark inbound format
    const from = payload.From || payload.from || '';
    const subject = payload.Subject || payload.subject || '';
    const textBody = payload.TextBody || payload.text || '';
    const attachments = payload.Attachments || payload.attachments || [];

    // Log for now — future: parse PDF attachments and extract transactions
    console.log('[inbound-email] received from:', from, 'subject:', subject);
    console.log('[inbound-email] attachments:', attachments.length);

    // Suppress unused variable warnings — retained for future implementation
    void textBody;

    // TODO:
    // 1. Verify the email is from a trusted Keel user (match From to a Convex user)
    // 2. Download and parse PDF/CSV attachments
    // 3. Send to Claude for transaction extraction
    // 4. Save transactions to Convex for that user

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'parse_error' }, { status: 400 });
  }
}
