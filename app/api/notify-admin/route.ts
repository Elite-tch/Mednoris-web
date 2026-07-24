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
        <h2 style="color: #5C2E91; border-bottom: 2px solid #5C2E91; padding-bottom: 10px;">New Doctor Registration</h2>
        
        <p style="font-size: 16px;">A new doctor has completed their registration and is waiting for your verification.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 35%;"><strong>Name:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Specializations:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.specialty}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Database ID:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-family: monospace;">${data.doctorId}</td>
          </tr>
        </table>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/dashboard/doctors" style="background-color: #5C2E91; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View in Admin Dashboard
          </a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'hello.mednoristeam@gmail.com',
      subject: `Action Required: Verify Dr. ${data.doctorName}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin notification error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send notification email' }, { status: 500 });
  }
}
