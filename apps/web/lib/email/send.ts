import { getResend, FROM_EMAIL } from "./resend";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email via Resend. Fails silently with console.error
 * so notification emails never break app functionality.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to send email:", err);
    return false;
  }
}
