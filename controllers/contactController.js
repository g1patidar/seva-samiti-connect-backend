import asyncHandler from "../middlewares/asyncHandler.js";
import { sendMail } from "../services/mailer.js";

/**
 * POST /api/contact
 * Body: { name, email, phone?, subject, message, inquiryType? }
 */
export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message, inquiryType } = req.body || {};

  if (!name || !email || !subject || !message) {
    res.status(400);
    throw new Error("Missing required fields: name, email, subject, message");
  }

  const to =
    process.env.CONTACT_TO ||
    process.env.SMTP_USER ||
    "jeevanpatidar@5462gmail.com"; // fallback (especially useful with jsonTransport)

  const subjectLine = `[Go Seva Samiti] ${subject} — ${name}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6;">
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
      ${inquiryType ? `<p><strong>Inquiry Type:</strong> ${escapeHtml(inquiryType)}</p>` : ""}
      <p><strong>Message:</strong></p>
      <pre style="white-space: pre-wrap; background:#f6f6f6; padding:12px; border-radius:6px;">${escapeHtml(message)}</pre>
      <hr />
      <p style="color:#666; font-size:12px;">Submitted on ${new Date().toLocaleString()}</p>
    </div>
  `;

  const text = `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}\n` : ""}${inquiryType ? `Inquiry Type: ${inquiryType}\n` : ""}
Message:
${message}

Submitted on ${new Date().toLocaleString()}
`.trim();

  const info = await sendMail({
    to,
    subject: subjectLine,
    text,
    html,
    replyTo: email,
  });

  res.json({
    success: true,
    message: "Message sent successfully",
    id: info?.messageId || undefined,
    // if jsonTransport is used, response will be in info.message
    preview: info?.message || undefined,
  });
});

function escapeHtml(str = "") {
  const map = { "&": "&", "<": "<", ">": ">" };
  return String(str).replace(/[&<>]/g, (c) => map[c] || c);
}

export default submitContact;
