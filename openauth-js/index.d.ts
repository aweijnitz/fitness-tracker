export function authorize(): Promise<string>;
export function token(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}>;
export function refresh(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}>;
export function logout(): Promise<void>;
