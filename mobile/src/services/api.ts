import axios from "axios";
import { tokenStorage } from "../utils/token";
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
export const api = axios.create({ baseURL: API_URL, timeout: 15000 });
let expired = () => {};
export const onExpired = (fn: () => void) => {
  expired = fn;
};
api.interceptors.request.use(async (c) => {
  const token = await tokenStorage.get();
  if (token) c.headers.Authorization = `Bearer ${token}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  async (e) => {
    if (e.response?.status === 401 && !e.config?.url?.startsWith("/auth/")) {
      await tokenStorage.clear();
      expired();
    }
    return Promise.reject(e);
  },
);
export const media = (p?: string) =>
  p ? `${API_URL.replace(/\/$/, "")}/${p.replace(/^\//, "")}` : undefined;
export const message = (e: unknown) =>
  axios.isAxiosError(e)
    ? (e.response?.data?.message ??
      "Không kết nối được máy chủ. Kiểm tra API URL và mạng.")
    : e instanceof Error
      ? e.message
      : "Có lỗi xảy ra.";
