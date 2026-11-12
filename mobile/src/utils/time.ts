export const localInput = (d: Date) =>
  new Date(+d + 7 * 3600000).toISOString().slice(0, 16).replace("T", " ");
export function parseLocal(v: string) {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(v))
    throw new Error("Dùng YYYY-MM-DD HH:mm, giờ Việt Nam.");
  const d = new Date(v.replace(" ", "T") + ":00+07:00");
  if (!Number.isFinite(+d) || localInput(d) !== v)
    throw new Error("Ngày giờ không tồn tại.");
  return d.toISOString();
}
export const requestKey = () =>
  `op-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
