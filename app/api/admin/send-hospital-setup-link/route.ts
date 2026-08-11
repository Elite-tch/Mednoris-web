import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email, hospitalName, contactName, setupLink } = await req.json();

    if (!email || !setupLink) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlContent = `
      <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#333;">
        <div style="background:#34254e;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Welcome to Mednoris B2B</h1>
          <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;">Your Hospital Workspace is Ready</p>
        </div>

        <div style="background:#f8f7fb;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;line-height:1.6;margin-top:0;">
            Hello ${contactName || 'there'},
          </p>
          <p style="font-size:16px;line-height:1.6;">
            Your dedicated workspace for <strong>${hospitalName}</strong> has been successfully provisioned by our team.
          </p>
          
          <div style="margin:32px 0;text-align:center;">
            <a href="${setupLink}" style="background:#8c6a9f;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">
              Activate Workspace Now
            </a>
          </div>

          <p style="font-size:16px;line-height:1.6;">
            Or copy and paste this secure setup link into your browser:
            <br />
            <code style="display:block;margin-top:12px;padding:12px;background:#fff;border:1px solid #ddd;border-radius:6px;color:#333;">
              ${setupLink}
            </code>
          </p>

          <p style="font-size:14px;line-height:1.6;color:#666;margin-top:32px;">
            Please complete this setup as soon as possible to secure your admin account. If you did not request this, please contact us immediately.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Mednoris" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Activate your Mednoris Workspace: ${hospitalName}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send setup link error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send setup link email' },
      { status: 500 }
    );
  }
}
