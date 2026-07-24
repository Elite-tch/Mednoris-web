import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { type, email, name, doctorName, consultationType, slot, dashboardPath } = payload;

    if (!email || !email.includes('@')) {
      console.log('Skipping user email: Invalid or missing email address.', email);
      return NextResponse.json({ success: true, skipped: true, reason: 'Invalid email' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let subject = '';
    let htmlContent = '';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (type === 'appointment_confirmed') {
      subject = 'Appointment Confirmed — Mednoris';
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: linear-gradient(135deg, #5C2E91, #7B4CC4); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Appointment Confirmed </h1>
            <p style="color: rgba(255,255,255,0.85); margin-top: 8px;">Your consultation has been scheduled.</p>
          </div>
          <p style="font-size: 16px;">Hi <strong>${name || 'Patient'}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Your appointment has been confirmed. Here are the details:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; width: 40%;"><strong>Doctor</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">${doctorName || 'Your Doctor'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;"><strong>Type</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">${consultationType || 'Consultation'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0;"><strong>Slot</strong></td>
              <td style="padding: 12px 0;">${slot || 'As scheduled'}</td>
            </tr>
          </table>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${baseUrl}/patient/dashboard/appointments" style="background-color: #5C2E91; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Appointment
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">Mednoris — Your health, connected.</p>
        </div>
      `;
    } else if (type === 'chat_activity') {
      subject = 'You have new activity on Mednoris';
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: #f8f7fb; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 24px; border: 2px solid #e8e0f5;">
            <div style="font-size: 40px; margin-bottom: 12px;">💬</div>
            <h1 style="color: #5C2E91; margin: 0; font-size: 22px;">You have new activity</h1>
            <p style="color: #666; margin-top: 8px;">Someone sent you a message on Mednoris.</p>
          </div>
          <p style="font-size: 16px;">Hi <strong>${name || 'there'}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">You've received a new message. Check your dashboard to view it and reply.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${baseUrl}${dashboardPath || '/patient/dashboard/chat'}" style="background-color: #5C2E91; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">Mednoris — Your health, connected.</p>
        </div>
      `;
    } else if (type === 'appointment_canceled') {
      subject = 'Appointment Canceled — Mednoris';
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: #fdf5f5; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 24px; border: 2px solid #fce8e8;">
            <div style="font-size: 40px; margin-bottom: 12px;">🚫</div>
            <h1 style="color: #d32f2f; margin: 0; font-size: 22px;">Appointment Canceled</h1>
            <p style="color: #666; margin-top: 8px;">Your upcoming consultation has been canceled.</p>
          </div>
          <p style="font-size: 16px;">Hi <strong>${name || 'Patient'}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Your appointment with <strong>${doctorName || 'your doctor'}</strong> for <strong>${slot || 'the scheduled time'}</strong> has been canceled.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${baseUrl}/patient/dashboard/appointments" style="background-color: #d32f2f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Appointments
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">Mednoris — Your health, connected.</p>
        </div>
      `;
    } else {
      return NextResponse.json({ success: false, error: 'Unknown notification type' }, { status: 400 });
    }

    await transporter.sendMail({
      from: `"Mednoris" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User notification error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send notification email' }, { status: 500 });
  }
}
