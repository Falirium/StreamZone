'use server';

import { requestOtp, verifyOtp } from '@/lib/auth/user-auth';
import { userOtpRequestSchema, userOtpVerifySchema } from '@/lib/validation';
import { headers } from 'next/headers';

export async function submitEmailForOtp(formData: FormData) {
  const rawEmail = formData.get('email') as string;
  const parsed = userOtpRequestSchema.safeParse({ email: rawEmail });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid email address' };
  }

  try {
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                      headersList.get('x-real-ip') || 
                      '127.0.0.1';

    const result = await requestOtp(parsed.data.email, ipAddress);
    return result;
  } catch (error) {
    console.error('[Auth Email Request]', error);
    return { success: false, error: 'Failed to request OTP' };
  }
}

export async function submitOtpForVerification(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    code: formData.get('code') as string,
  };

  const parsed = userOtpVerifySchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  try {
    const result = await verifyOtp(parsed.data.email, parsed.data.code);
    return result;
  } catch (error) {
    console.error('[Auth OTP Verification]', error);
    return { success: false, error: 'Failed to verify OTP' };
  }
}
