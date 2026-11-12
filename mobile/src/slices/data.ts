import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, message } from "../services/api";
import { Model, Station, Rental } from "../types";
export const loadData = createAsyncThunk(
  "data/load",
  async (_arg, { getState, rejectWithValue }) => {
    try {
      const signed = !!(getState() as { session: { user: unknown } }).session
        .user;
      const [models, stations, types, favorites, rentals] = await Promise.all([
        api.get("/catalog", { params: { limit: 6 } }),
        api.get<Station[]>("/stations"),
        api.get<{ id: number; name: string }[]>("/types"),
        signed ? api.get<Model[]>("/favorites") : Promise.resolve({ data: [] }),
        signed
          ? api.get("/my-rentals", { params: { limit: 3, group: "current" } })
          : Promise.resolve({ data: { items: [] } }),
      ]);
      return {
        models: models.data.items,
        stations: stations.data,
        types: types.data,
        favorites: favorites.data,
        rentals: rentals.data.items,
      };
    } catch (e) {
      return rejectWithValue(message(e));
    }
  },
);
const slice = createSlice({
  name: "data",
  initialState: {
    models: [] as Model[],
    stations: [] as Station[],
    types: [] as { id: number; name: string }[],
    favorites: [] as Model[],
    rentals: [] as Rental[],
    pending: false,
    error: "",
  },
  reducers: {
    clearPrivate: (s) => {
      s.favorites = [];
      s.rentals = [];
    },
  },
  extraReducers: (b) =>
    b
      .addCase(loadData.pending, (s) => {
        s.pending = true;
        s.error = "";
      })
      .addCase(loadData.fulfilled, (s, a) => {
        Object.assign(s, a.payload);
        s.pending = false;
      })
      .addCase(loadData.rejected, (s, a) => {
        s.pending = false;
        s.error = String(a.payload);
      }),
});
export const { clearPrivate } = slice.actions;
export default slice.reducer;
