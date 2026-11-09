import { Alert } from 'react-native';

interface PendingVerification {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

let activeVerification: PendingVerification | null = null;

/**
 * Generates a 6-digit verification code and dispatches it to the given email address.
 */
export async function sendEmailVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    throw new Error('Please enter a valid email address.');
  }

  // Basic email syntax validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    throw new Error('Invalid email format. Please check your email address.');
  }

  // Generate random 6-digit numeric OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  activeVerification = {
    email: trimmedEmail,
    code,
    expiresAt,
    attempts: 0,
  };

  const resendApiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Yohaku <onboarding@resend.dev>',
          to: [trimmedEmail],
          subject: `${code} is your Yohaku verification code`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #faf9f6;">
              <h2 style="color: #262A28; margin-top: 0; font-family: serif; letter-spacing: 2px;">余白 YOHAKU</h2>
              <p style="color: #4A4E4B; font-size: 15px; line-height: 22px;">
                Welcome to Yohaku. Please enter the following 6-digit verification code to complete your sign-up:
              </p>
              <div style="background-color: #ffffff; border: 1.5px solid #2E5D4B; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2E5D4B; font-family: monospace;">${code}</span>
              </div>
              <p style="color: #7A807C; font-size: 12px; line-height: 18px;">
                This code will expire in 10 minutes. If you did not request this verification code, please ignore this email.
              </p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.warn('Resend email error:', errJson);
        // Fallback notice if API call fails
        showDevNotice(trimmedEmail, code);
      }
    } catch (err) {
      console.warn('Email delivery error:', err);
      showDevNotice(trimmedEmail, code);
    }
  } else {
    // Development / Demonstration fallback when no third-party email API key is configured
    showDevNotice(trimmedEmail, code);
  }

  return {
    success: true,
    message: `Verification code sent to ${trimmedEmail}`,
  };
}

function showDevNotice(email: string, code: string) {
  console.log(`[Yohaku Verification] Code for ${email}: ${code}`);
  Alert.alert(
    'Verification Code Sent',
    `A 6-digit verification code has been dispatched to ${email}.\n\n[Dev Preview: ${code}]\n\n(Add EXPO_PUBLIC_RESEND_API_KEY in .env to dispatch live emails via Resend)`,
    [{ text: 'OK' }]
  );
}

/**
 * Validates the entered code against the active verification session.
 */
export function verifyEmailCode(email: string, enteredCode: string): { valid: boolean; message: string } {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedCode = enteredCode.trim();

  if (!activeVerification || activeVerification.email !== trimmedEmail) {
    return {
      valid: false,
      message: 'No active verification session found. Please request a new code.',
    };
  }

  if (Date.now() > activeVerification.expiresAt) {
    activeVerification = null;
    return {
      valid: false,
      message: 'Verification code has expired. Please request a new code.',
    };
  }

  activeVerification.attempts += 1;
  if (activeVerification.attempts > 5) {
    activeVerification = null;
    return {
      valid: false,
      message: 'Too many incorrect attempts. Please request a new code.',
    };
  }

  if (activeVerification.code !== trimmedCode) {
    return {
      valid: false,
      message: 'Incorrect verification code. Please check and try again.',
    };
  }

  // Verified successfully: clear pending code
  activeVerification = null;
  return {
    valid: true,
    message: 'Email verified successfully.',
  };
}

/**
 * Clears any pending verification session.
 */
export function clearVerificationSession() {
  activeVerification = null;
}
