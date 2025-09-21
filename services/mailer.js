import nodemailer from "nodemailer";

/**
 * Mailer service
 * - Uses SMTP if env is configured
 * - Falls back to jsonTransport in development when SMTP is not configured (no real email is sent)
 */

const useJsonTransport =
  process.env.NODE_ENV !== "production" &&
  !process.env.SMTP_HOST &&
  !process.env.SMTP_USER;

const transporter = useJsonTransport
  ? nodemailer.createTransport({ jsonTransport: true })
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure:
        process.env.SMTP_SECURE === "true" ||
        Number(process.env.SMTP_PORT) === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });

export async function sendMail({ to, subject, text, html, replyTo }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from && !useJsonTransport) {
    throw new Error(
      "Email FROM address not configured. Set SMTP_FROM or SMTP_USER"
    );
  }
  if (!to) {
    throw new Error("Email TO address is required");
  }

  const info = await transporter.sendMail({
    from: from || "no-reply@example.com",
    to,
    subject,
    text,
    html,
    replyTo,
  });

  return info;
}

export default transporter;
