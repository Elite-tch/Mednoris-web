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

    const row = (label: string, value: string) =>
      value
        ? `<tr>
            <td style="padding:10px 0;border-bottom:1px solid #eee;width:38%;vertical-align:top"><strong>${label}:</strong></td>
            <td style="padding:10px 0;border-bottom:1px solid #eee;">${value}</td>
           </tr>`
        : '';

    const htmlContent = `
      <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#333;">
        <div style="background:#34254e;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">🏥 New Hospital Demo Request</h1>
          <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;">via Mednoris Layer 2 landing page</p>
        </div>

        <div style="background:#f8f7fb;padding:24px 32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">

          <h2 style="color:#34254e;font-size:16px;border-bottom:2px solid #8c6a9f;padding-bottom:8px;margin-top:0;">
            1. Basic Contact Info
          </h2>
          <table style="width:100%;border-collapse:collapse;">
            ${row('Hospital / Clinic Name', data.hospitalName)}
            ${row('Contact Person', data.contactName)}
            ${row('Role / Title', data.role)}
            ${row('Email', data.email)}
            ${row('Phone (WhatsApp)', data.phone)}
          </table>

          <h2 style="color:#34254e;font-size:16px;border-bottom:2px solid #8c6a9f;padding-bottom:8px;margin-top:28px;">
            2. Facility Context
          </h2>
          <table style="width:100%;border-collapse:collapse;">
            ${row('Facility Type', (data.facilityType || []).join(', '))}
            ${row('Location', [data.city, data.stateRegion, data.country].filter(Boolean).join(', '))}
            ${row('Expected Staff Users', data.staffCount)}
          </table>

          <h2 style="color:#34254e;font-size:16px;border-bottom:2px solid #8c6a9f;padding-bottom:8px;margin-top:28px;">
            3. Current State
          </h2>
          <table style="width:100%;border-collapse:collapse;">
            ${row('Record-Keeping Method', (data.recordMethod || []).join(', '))}
            ${row('Uses EHR?', data.usesEhr)}
            ${data.usesEhr === 'Yes' ? row('EHR System', data.ehrName || 'Not specified') : ''}
            ${row('Patient Volume', data.patientVolume)}
          </table>

          <h2 style="color:#34254e;font-size:16px;border-bottom:2px solid #8c6a9f;padding-bottom:8px;margin-top:28px;">
            4. Intent &amp; Fit
          </h2>
          <table style="width:100%;border-collapse:collapse;">
            ${row('Biggest Challenge', data.biggestChallenge)}
            ${row('How They Heard', data.howHeard)}
          </table>

          ${data.preferredDate || data.comments ? `
          <h2 style="color:#34254e;font-size:16px;border-bottom:2px solid #8c6a9f;padding-bottom:8px;margin-top:28px;">
            5. Optional Details
          </h2>
          <table style="width:100%;border-collapse:collapse;">
            ${row('Preferred Demo Date/Time', data.preferredDate ? new Date(data.preferredDate).toLocaleString('en-GB') : '')}
            ${row('Additional Comments', data.comments)}
          </table>` : ''}

          <div style="margin-top:32px;padding:16px;background:#fff;border-radius:8px;border-left:4px solid #8c6a9f;">
            <p style="margin:0;font-size:13px;color:#666;">
              📌 This submission has been saved to the Mednoris Firebase database under the
              <strong> hospital_demo_requests</strong> collection with document ID:
              <code style="background:#f0e9fa;padding:2px 6px;border-radius:4px;">${data.docId || 'N/A'}</code>
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Mednoris Layer 2" <${process.env.EMAIL_USER}>`,
      to: 'hello.mednoristeam@gmail.com',
      subject: `🏥 Demo Request: ${data.hospitalName} — ${data.city || ''}, ${data.country || ''}`,
      html: htmlContent,
      replyTo: data.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Hospital demo notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification email' },
      { status: 500 }
    );
  }
}
