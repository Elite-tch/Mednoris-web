import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Create the transporter using environment variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #5C2E91; border-bottom: 2px solid #5C2E91; padding-bottom: 10px;">New Partnership Application</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Organization Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.organizationName}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Website:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.website || 'N/A'}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Contact Person:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.contactPerson}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Work Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.workEmail}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Organization Type:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.organizationType}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Country:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.country}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Areas of Interest:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.areasOfInterest?.join(', ') || 'None'}</td></tr>
        </table>

        <h3 style="color: #5C2E91; margin-top: 30px;">About the Organization</h3>
        <p style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">${data.about}</p>
        
        <h3 style="color: #5C2E91; margin-top: 20px;">Envisioned Partnership</h3>
        <p style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">${data.envision}</p>
        
        <h3 style="color: #5C2E91; margin-top: 20px;">Additional Information</h3>
        <p style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">${data.additionalInfo || 'N/A'}</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'hello.mednoristeam@gmail.com',
      subject: `Partnership Application: ${data.organizationName}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Nodemailer error:", error);
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
  }
}
