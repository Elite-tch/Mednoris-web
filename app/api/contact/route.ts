import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #5C2E91; border-bottom: 2px solid #5C2E91; padding-bottom: 10px;">New Contact Message</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 30%;"><strong>Name:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="mailto:${data.email}" style="color: #F39200;">${data.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Subject:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.subject}</td>
          </tr>
        </table>

        <h3 style="color: #5C2E91; margin-top: 30px;">Message</h3>
        <p style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; line-height: 1.7;">${data.message}</p>

        <p style="font-size: 12px; color: #999; margin-top: 30px;">This message was sent via the Mednoris website contact form.</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'hello.mednoristeam@gmail.com',
      replyTo: data.email,
      subject: `Contact: ${data.subject}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact email error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}
