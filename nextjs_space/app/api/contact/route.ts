import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    const appUrl = process.env.NEXTAUTH_URL || '';
    const hostname = appUrl ? new URL(appUrl).hostname : 'kalyrax.com';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject || 'No subject'}</p>
          <p style="margin: 10px 0;"><strong>Message:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #1e3a8a;">
            ${message.replace(/\n/g, '<br/>')}
          </div>
        </div>
        <p style="color: #666; font-size: 12px;">Submitted at: ${new Date().toLocaleString()}</p>
      </div>
    `;

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: process.env.NOTIF_ID_CONTACT_FORM_SUBMISSION,
        subject: `[Kalyrax Contact] ${subject || 'New message'} from ${name}`,
        body: htmlBody,
        is_html: true,
        recipient_email: 'soporte@prospectosdigitales.com',
        reply_to: email,
        sender_email: `noreply@${hostname}`,
        sender_alias: 'Kalyrax',
      }),
    });

    const result = await response.json();
    if (!result.success && !result.notification_disabled) {
      throw new Error(result.message || 'Failed to send');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
