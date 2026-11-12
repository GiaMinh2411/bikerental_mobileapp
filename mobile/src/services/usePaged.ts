import { useRef, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { api, message } from "./api";
import { PageData } from "../types";
export function usePaged<T>(
  path: string,
  params: Record<string, unknown> = {},
  limit = 12,
) {
  const key = JSON.stringify(params),
    request = useRef(0),
    busy = useRef(false),
    page = useRef(0);
  const [items, setItems] = useState<T[]>([]),
    [total, setTotal] = useState(0),
    [more, setMore] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(
    async (reset = false) => {
      if (busy.current && !reset) return;
      const seq = ++request.current;
      busy.current = true;
      setLoading(true);
      setError("");
      if (reset) {
        page.current = 0;
        setItems([]);
      }
      try {
        const result = (
          await api.get<PageData<T>>(path, {
            params: {
              ...JSON.parse(key),
              page: reset ? 1 : page.current + 1,
              limit,
            },
          })
        ).data;
        if (seq !== request.current) return;
        setItems((old) => (reset ? result.items : [...old, ...result.items]));
        setTotal(result.total);
        setMore(result.has_more);
        page.current = result.page;
      } catch (e) {
        if (seq === request.current) setError(message(e));
      } finally {
        if (seq === request.current) {
          busy.current = false;
          setLoading(false);
        }
      }
    },
    [path, key, limit],
  );
  useFocusEffect(
    useCallback(() => {
      void load(true);
      return () => {
        request.current++;
        busy.current = false;
      };
    }, [load]),
  );
  return {
    items,
    total,
    more,
    loading,
    error,
    refresh: () => void load(true),
    next: () => {
      if (more && !busy.current) void load(false);
    },
  };
}
