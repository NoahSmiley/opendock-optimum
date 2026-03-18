export interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionResponse {
  user: User | null;
  csrfToken: string;
}

export interface AuthResponse {
  user: User;
  csrfToken: string;
}
