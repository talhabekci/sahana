import axios, { isAxiosError } from 'axios';

import { useAuthStore } from '@/features/auth/store';

/** api-conventions.md §4 hata zarfı */
export type ApiFailure = {
  message: string;
  code: string;
  errors?: Record<string, string[]>;
};

const BaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1';

export const Api = axios.create({
  baseURL: BaseUrl,
  headers: { Accept: 'application/json' },
  timeout: 15000,
});

Api.interceptors.request.use((Config) => {
  const Token = useAuthStore.getState().token;

  if (Token != null) {
    Config.headers.Authorization = `Bearer ${Token}`;
  }

  return Config;
});

/** Her hatayı API zarfına normalize eder; ağ hatasında anlaşılır mesaj döner. */
export function toApiFailure(Error_: unknown): ApiFailure {
  if (isAxiosError(Error_) && Error_.response?.data != null && typeof Error_.response.data === 'object') {
    const Data = Error_.response.data as Partial<ApiFailure>;

    if (typeof Data.message === 'string') {
      return {
        message: Data.message,
        code: typeof Data.code === 'string' ? Data.code : 'unknown',
        errors: Data.errors,
      };
    }
  }

  return { message: 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.', code: 'network_error' };
}
