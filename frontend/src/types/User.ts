export interface User {
  user_id?: number;
  name: string;
  surname?: string;
  email: string;
  password: string;
  phone_number?: string;
  postal_code?: string;
  username: string;
  role?: string;
  is_banned?: boolean;
  birthDate: string;
  created_at?: string;
}