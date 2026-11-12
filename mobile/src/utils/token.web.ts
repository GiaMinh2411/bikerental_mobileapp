// Session storage limits persistence to this browser tab; any same-origin XSS can read it.
export const tokenStorage = {
  get: async () => sessionStorage.getItem("bike-token"),
  set: async (v: string) => {
    sessionStorage.setItem("bike-token", v);
  },
  clear: async () => {
    sessionStorage.removeItem("bike-token");
  },
};
