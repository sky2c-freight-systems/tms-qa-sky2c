import { sendMail } from "@/lib/mailer";
import type { OtpPurpose } from "@/lib/otp";

const PURPOSE_COPY: Record<OtpPurpose, { subject: string; action: string }> = {
  REGISTER: { subject: "Verify your email — Vhaul4u Customer Portal", action: "complete your registration" },
  LOGIN: { subject: "Your login code — Vhaul4u Customer Portal", action: "log in" },
};

/** Sends the OTP code by email — the only delivery channel available until an SMS
 * provider is wired up (see otp.ts's header comment). */
export async function sendOtpEmail(email: string, code: string, purpose: OtpPurpose): Promise<void> {
  const { subject, action } = PURPOSE_COPY[purpose];
  await sendMail({
    to: email,
    subject,
    text: `Your verification code is ${code}. Enter this code to ${action}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
  });
}
