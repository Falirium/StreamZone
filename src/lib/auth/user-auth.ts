import { db } from '@/lib/db';
import { getUserSession } from './session';
import { OTP_LENGTH, OTP_EXPIRY_MINUTES } from '@/lib/constants';
import { sendOtpEmail } from '@/lib/mail';
import type { UserSessionData } from '@/types/api';

function generateOtp(): string {
  return Array.from({ length: OTP_LENGTH }, () =>
    Math.floor(Math.random() * 10)
  ).join('');
}

export async function requestOtp(
  email: string,
  ipAddress?: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Cooldown Rate Limit (60 seconds per email)
  const lastOtp = await db.userOtp.findFirst({
    where: {
      email,
      createdAt: { gte: new Date(Date.now() - 60 * 1000) },
    },
  });

  if (lastOtp) {
    return { success: false, error: 'Please wait 60 seconds before requesting another code.' };
  }

  // 2. IP Rate Limit (5 OTPs per hour per IP)
  if (ipAddress) {
    const hourlyIpOtpsCount = await db.userOtp.count({
      where: {
        ipAddress,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    if (hourlyIpOtpsCount >= 5) {
      return { success: false, error: 'Too many OTP requests from this IP. Please try again in an hour.' };
    }
  }

  // Invalidate any existing unused OTPs for this email
  await db.userOtp.updateMany({
    where: { email, verified: false },
    data: { verified: true }, // mark as used/expired
  });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Find existing user by email (optional)
  const user = await db.user.findUnique({ where: { email } });

  await db.userOtp.create({
    data: {
      email,
      code,
      expiresAt,
      ipAddress,
      userId: user?.id ?? null,
    },
  });

  // Trigger automated email delivery via SMTP relay
  const mailSuccess = await sendOtpEmail(email, code);
  if (!mailSuccess) {
    return { success: false, error: 'Failed to deliver OTP email. Please try again later.' };
  }

  return { success: true };
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string; user?: UserSessionData }> {
  // 1. Find the latest unverified OTP that hasn't expired for this email
  const otp = await db.userOtp.findFirst({
    where: {
      email,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    return { success: false, error: 'Invalid or expired code' };
  }

  // 2. Increment attempts IMMEDIATELY on lookup before checking the code
  const updatedOtp = await db.userOtp.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 } },
  });

  if (updatedOtp.attempts > 5) { // MAX_OTP_ATTEMPTS = 5
    return { success: false, error: 'Too many attempts. Request a new code.' };
  }

  // 3. Verify matching code
  if (otp.code !== code) {
    return { success: false, error: 'Invalid code' };
  }

  // Mark OTP as verified
  await db.userOtp.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  // Find or create user
  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    user = await db.user.create({
      data: {
        email,
        profile: {
          create: {},
        },
      },
    });
  }

  // Create session
  const session = await getUserSession();
  session.user = {
    userId: user.id,
    email: user.email,
    phone: user.phone || '', // phone is optional now
  };
  await session.save();

  return { success: true, user: session.user };
}

export async function logoutUser(): Promise<void> {
  const session = await getUserSession();
  session.destroy();
}

export async function requireUser(): Promise<UserSessionData> {
  const session = await getUserSession();
  if (!session.user) {
    throw new Error('Unauthorized: User session required');
  }
  return session.user;
}

export async function getCurrentUser(): Promise<UserSessionData | null> {
  const session = await getUserSession();
  return session.user ?? null;
}
