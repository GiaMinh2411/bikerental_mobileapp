import * as SecureStore from "expo-secure-store";
export const tokenStorage = {
  get: () => SecureStore.getItemAsync("bike-token"),
  set: (v: string) => SecureStore.setItemAsync("bike-token", v),
  clear: () => SecureStore.deleteItemAsync("bike-token"),
};
