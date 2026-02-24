export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    refreshToken?: string;
    type: string;
    expiresIn: number;
    admin: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
  timestamp?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
}

export interface AdminInfo {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}
