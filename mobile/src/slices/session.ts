import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, message } from "../services/api";
import { tokenStorage } from "../utils/token";
import { User } from "../types";
export const restore = createAsyncThunk("session/restore", async () => {
  if (!(await tokenStorage.get())) return null;
  return (await api.get<User>("/me")).data;
});
export const authenticate = createAsyncThunk(
  "session/auth",
  async (
    d: { email: string; password: string; full_name?: string },
    { rejectWithValue },
  ) => {
    try {
      const r = await api.post(
        d.full_name ? "/auth/register" : "/auth/login",
        d,
      );
      await tokenStorage.set(r.data.token);
      return r.data.user as User;
    } catch (e) {
      return rejectWithValue(message(e));
    }
  },
);
const slice = createSlice({
  name: "session",
  initialState: {
    user: null as User | null,
    ready: false,
    pending: false,
    error: "",
  },
  reducers: {
    signedOut: (s) => {
      s.user = null;
      s.error = "";
    },
    updated: (s, a) => {
      s.user = a.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(restore.pending, (s) => {
      s.pending = true;
    })
      .addCase(restore.fulfilled, (s, a) => {
        s.user = a.payload;
        s.ready = true;
        s.pending = false;
      })
      .addCase(restore.rejected, (s) => {
        s.ready = true;
        s.pending = false;
      });
    b.addCase(authenticate.pending, (s) => {
      s.pending = true;
      s.error = "";
    })
      .addCase(authenticate.fulfilled, (s, a) => {
        s.pending = false;
        s.user = a.payload;
      })
      .addCase(authenticate.rejected, (s, a) => {
        s.pending = false;
        s.error = String(a.payload ?? "Không đăng nhập được.");
      });
  },
});
export const { signedOut, updated } = slice.actions;
export default slice.reducer;
