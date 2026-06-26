/** Shared API request/response types */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

// Admin session payload
export interface AdminSessionData {
  adminId: string;
  email: string;
  name: string;
  role: string;
}

// User session payload
export interface UserSessionData {
  userId: string;
  email: string;
  phone: string;
}

// Admin login request
export interface AdminLoginRequest {
  email: string;
  password: string;
}

// User OTP request
export interface UserOtpRequest {
  phone: string;
}

// User OTP verify request
export interface UserOtpVerifyRequest {
  phone: string;
  code: string;
}
