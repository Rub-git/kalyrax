import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: { email: email.toLowerCase(), used: false },
      data: { used: true },
    });

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expiresAt,
      },
    });

    // Build reset link
    const baseUrl = process.env.NEXTAUTH_URL || 'https://kalyrax.com';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // Send email
    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = 'Kalyrax';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #1e3a8a;">
          <h1 style="color: #1e3a8a; margin: 0;">Kalyrax</h1>
        </div>
        <div style="padding: 30px 20px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #555; line-height: 1.6;">We received a request to reset the password for your account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #777; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          <p style="color: #777; font-size: 14px;">If the button doesn't work, copy this link into your browser:</p>
          <p style="color: #1e3a8a; font-size: 12px; word-break: break-all;">${resetLink}</p>
        </div>
        <div style="padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} Kalyrax. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      const hostname = appUrl ? new URL(appUrl).hostname : 'kalyrax.com';
      await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_API_KEY,
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_PASSWORD_RESET,
          subject: 'Reset your Kalyrax password',
          body: htmlBody,
          is_html: true,
          recipient_email: email.toLowerCase(),
          sender_email: `noreply@${hostname}`,
          sender_alias: appName,
        }),
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
