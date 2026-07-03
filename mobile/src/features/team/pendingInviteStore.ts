import { create } from 'zustand';

type PendingInviteState = {
  code: string | null;
  setCode: (code: string | null) => void;
};

/**
 * Kullanıcı oturum açmadan bir davet linkine tıklarsa kod burada bekletilir;
 * OTP doğrulaması bitince otp.tsx bu kodu okuyup daveti otomatik kabul eder.
 */
export const usePendingInviteStore = create<PendingInviteState>((set) => ({
  code: null,
  setCode: (code) => set({ code }),
}));
