import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const transporter = nodemailer.createTransport({
      service: "gmail",
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
        : "";

    const typeLabels: Record<string, string> = {
      bug: "Bug Report",
      suggestion: "Suggestion",
      general: "General Feedback",
      other: "Other",
    };

    const typeLabel = data.type ? typeLabels[data.type] ?? data.type : "Not specified";
    const imageRows = (data.images ?? [])
      .map(
        (img: { url: string; name: string }, i: number) =>
          `<li style="margin-bottom:6px"><a href="${img.url}" style="color:#8c6a9f">${img.name || `Image ${i + 1}`}</a></li>`
      )
      .join("");

    const htmlContent = `
      <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#333;">
        <div style="background:#34254e;padding:24px 32px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">New Feedback Submission</h1>
          <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;">via Mednoris feedback widget</p>
        </div>

        <div style="background:#f8f7fb;padding:24px 32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
          <table style="width:100%;border-collapse:collapse;">
            ${row("Feedback ID", data.docId ?? "")}
            ${row("Type", typeLabel)}
            ${row("Submitted By", data.submittedBy ?? "anonymous")}
            ${row("Role", data.submittedByRole ?? "")}
            ${row("Hospital", data.hospitalSlug ?? "")}
            ${row("Page", data.pageUrl ?? "")}
          </table>

          <h2 style="color:#34254e;font-size:16px;border-bottom:2px solid #8c6a9f;padding-bottom:8px;margin-top:28px;">
            Message
          </h2>
          <p style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e5e7eb;line-height:1.7;white-space:pre-wrap;">${data.message ?? ""}</p>

          ${
            imageRows
              ? `<h2 style="color:#34254e;font-size:16px;border-bottom:2px solid #8c6a9f;padding-bottom:8px;margin-top:28px;">Attachments</h2><ul style="padding-left:20px;margin:0;">${imageRows}</ul>`
              : ""
          }

          <p style="font-size:12px;color:#999;margin-top:30px;">Submitted via the Mednoris in-app feedback widget.</p>
        </div>
      </div>
    `;

    const notifyEmail =
      process.env.FEEDBACK_NOTIFY_EMAIL ?? "hello.mednoristeam@gmail.com";

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: notifyEmail,
      subject: `[Mednoris Feedback] ${typeLabel} — ${data.submittedBy ?? "anonymous"}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback notify error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
