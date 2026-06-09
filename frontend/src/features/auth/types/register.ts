export interface RegisterFormData extends Record<string, unknown> {
  name: string;
  surname: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  postalCode: string;
  birthDate: string;
}

export interface GoogleAuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
    surname?: string;
    username: string;
    role: string;
    profilePicture?: string;
  };
}
