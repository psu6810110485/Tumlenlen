import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env";

export type EmailDeliveryMode = "gmail-smtp" | "sandbox-preview";

export interface SendPasswordResetEmailInput {
  toEmail: string;
  displayName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface SendPasswordResetEmailResult {
  deliveryMode: EmailDeliveryMode;
  messageId?: string;
  /** Returned ONLY in non-production sandbox mode when Gmail SMTP is not yet configured */
  previewResetUrl?: string;
}

export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends a password reset email via Gmail SMTP (using Google App Password).
 * - When GMAIL_USER and GMAIL_APP_PASSWORD are set -> sends real Gmail email.
 * - When not set in development/test -> logs clearly in sandbox mode and returns preview URL.
 * - When not set in production -> throws EmailDeliveryError (never leaks reset URLs in prod).
 */
export async function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput
): Promise<SendPasswordResetEmailResult> {
  const env = getServerEnv();

  if (!env.hasGmailSmtpConfig) {
    if (env.NODE_ENV === "production") {
      throw new EmailDeliveryError(
        "ยังไม่ได้ตั้งค่า GMAIL_USER และ GMAIL_APP_PASSWORD บนเซิร์ฟเวอร์"
      );
    }

    console.info(
      `[GmailMailer Sandbox] Password reset link for ${input.toEmail}: ${input.resetUrl}`
    );

    return {
      deliveryMode: "sandbox-preview",
      previewResetUrl: input.resetUrl,
    };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.GMAIL_USER.trim(),
      pass: env.GMAIL_APP_PASSWORD.trim(),
    },
  });

  const safeName = escapeHtml(input.displayName);
  const safeUrl = escapeHtml(input.resetUrl);
  const fromName = env.EMAIL_FROM_NAME.trim() || "Food Roulette";

  const subject = "รีเซ็ตรหัสผ่านบัญชี Food Roulette ของคุณ";
  const text = [
    `สวัสดีคุณ ${input.displayName},`,
    "",
    "เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี Food Roulette ของคุณ",
    `กรุณาคลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์จะหมดอายุภายใน ${input.expiresInMinutes} นาที):`,
    "",
    input.resetUrl,
    "",
    "หากคุณไม่ได้เป็นผู้ส่งคำขอนี้ สามารถละเว้นอีเมลฉบับนี้ได้อย่างปลอดภัย",
    "",
    `ทีมงาน ${fromName}`,
  ].join("\n");

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #1c1917; background-color: #fafaf9; border-radius: 16px; border: 1px solid #e7e5e4;">
      <h2 style="margin: 0 0 8px; color: #ea580c; font-size: 20px;">Food Roulette</h2>
      <p style="margin: 0 0 16px; font-size: 14px; color: #57534e;">คำขอรีเซ็ตรหัสผ่าน</p>
      <p style="font-size: 14px; line-height: 1.6;">สวัสดีคุณ <strong>${safeName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6;">
        เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี Food Roulette ของคุณ กรุณากดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่
        (ลิงก์นี้ใช้งานได้เพียงครั้งเดียวและจะหมดอายุภายใน <strong>${input.expiresInMinutes} นาที</strong>)
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${safeUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 12px;">
          ตั้งรหัสผ่านใหม่
        </a>
      </div>
      <p style="font-size: 12px; color: #78716c; word-break: break-all;">
        หากกดปุ่มไม่ได้ สามารถคัดลอกลิงก์นี้ไปเปิดในเบราว์เซอร์:<br/>
        <a href="${safeUrl}" style="color: #ea580c;">${safeUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 20px 0;" />
      <p style="font-size: 11px; color: #a8a29e; margin: 0;">
        หากคุณไม่ได้เป็นผู้ส่งคำขอนี้ ไม่จำเป็นต้องดำเนินการใดๆ รหัสผ่านเดิมของคุณจะยังคงปลอดภัย
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${env.GMAIL_USER.trim()}>`,
      to: input.toEmail,
      subject,
      text,
      html,
    });

    return {
      deliveryMode: "gmail-smtp",
      messageId: info.messageId,
    };
  } catch (err) {
    console.error("[GmailMailer] Failed to send email:", err);
    throw new EmailDeliveryError(
      "ไม่สามารถส่งอีเมลผ่าน Gmail SMTP ได้ กรุณาตรวจสอบ GMAIL_USER และ GMAIL_APP_PASSWORD"
    );
  }
}
