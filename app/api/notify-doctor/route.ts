import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { type, doctorEmail, doctorName } = data;

    if (!doctorEmail || !doctorEmail.includes('@')) {
      console.log('Skipping doctor email: Invalid or missing email address.', doctorEmail);
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

    if (type === 'verified') {
      subject = 'Your Mednoris Account Has Been Verified!';
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: linear-gradient(135deg, #5C2E91, #7B4CC4); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Congratulations, ${doctorName}! </h1>
            <p style="color: rgba(255,255,255,0.85); margin-top: 8px;">Your doctor account has been verified.</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6;">Great news! The Mednoris team has reviewed your application and verified your account. You can now:</p>
          <ul style="line-height: 2; color: #555;">
            <li>Receive appointment bookings from patients</li>
            <li>Set your availability schedule</li>
            <li>Conduct virtual consultations</li>
            <li>Manage your professional profile</li>
          </ul>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/doctor/dashboard" style="background-color: #5C2E91; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Go to Your Dashboard
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">Mednoris — Connecting patients with trusted healthcare professionals.</p>
        </div>
      `;
    } else if (type === 'rejected') {
      subject = 'Mednoris Account Verification Update';
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: #f8f7fb; border-left: 4px solid #5C2E91; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #5C2E91; margin: 0 0 8px;">Account Verification Update</h2>
            <p style="margin: 0; color: #555;">Dear ${doctorName},</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6;">Thank you for registering on Mednoris. After reviewing your submitted documents, we were unable to verify your account at this time.</p>
          <p style="font-size: 16px; line-height: 1.6;">This may be due to:</p>
          <ul style="line-height: 2; color: #555;">
            <li>Incomplete or unclear documents</li>
            <li>Unrecognised medical license information</li>
            <li>Missing verification video</li>
          </ul>
          <p style="font-size: 16px; line-height: 1.6;">Please feel free to contact our support team at <a href="mailto:hello.mednoristeam@gmail.com" style="color: #5C2E91;">hello.mednoristeam@gmail.com</a> if you have any questions or would like to reapply with updated documents.</p>
          <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">Mednoris — Connecting patients with trusted healthcare professionals.</p>
        </div>
      `;
    } else if (type === 'new_appointment') {
      const { patientName, consultationType, slot, reason } = data;
      subject = `New Appointment Booked — ${patientName}`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: linear-gradient(135deg, #5C2E91, #7B4CC4); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 22px;">New Appointment Booked</h1>
            <p style="color: rgba(255,255,255,0.85); margin-top: 8px;">A patient has scheduled a consultation with you.</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; width: 40%;"><strong>Patient Name</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">${patientName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;"><strong>Consultation Type</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">${consultationType}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;"><strong>Scheduled Slot</strong></td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">${slot}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0;"><strong>Reason for Visit</strong></td>
              <td style="padding: 12px 0;">${reason}</td>
            </tr>
          </table>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/doctor/dashboard/appointments" style="background-color: #5C2E91; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Appointment
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">Mednoris — Connecting patients with trusted healthcare professionals.</p>
        </div>
      `;
    } else if (type === 'appointment_canceled') {
      const { patientName, slot } = data;
      subject = `Appointment Canceled — ${patientName}`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: #fdf5f5; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 24px; border: 2px solid #fce8e8;">
            <div style="font-size: 40px; margin-bottom: 12px;">🚫</div>
            <h1 style="color: #d32f2f; margin: 0; font-size: 22px;">Appointment Canceled</h1>
            <p style="color: #666; margin-top: 8px;">An upcoming consultation has been canceled.</p>
          </div>
          <p style="font-size: 16px;">Hi <strong>${doctorName || 'Doctor'}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Your appointment with <strong>${patientName || 'your patient'}</strong> for <strong>${slot || 'the scheduled time'}</strong> has been canceled.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/doctor/dashboard/appointments" style="background-color: #d32f2f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Appointments
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">Mednoris — Connecting patients with trusted healthcare professionals.</p>
        </div>
      `;
    } else {
      return NextResponse.json({ success: false, error: 'Unknown notification type' }, { status: 400 });
    }

    await transporter.sendMail({
      from: `"Mednoris" <${process.env.EMAIL_USER}>`,
      to: doctorEmail,
      subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Doctor notification error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send notification email' }, { status: 500 });
  }
}
