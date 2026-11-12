import React, { useState } from "react";
import { XStack } from "tamagui";
import {
  Page,
  Panel,
  Heading,
  Body,
  Field,
  Button,
  SelectField,
  date,
  money,
} from "../components/ui";
import { Badge, ErrorState, ScreenList, Status } from "../components/states";
import { usePaged } from "../services/usePaged";
import { api, message } from "../services/api";
export function NotificationsScreen({ navigation }: any) {
  const list = usePaged<any>("/notifications");
  const [error, setError] = useState("");
  return (
    <ScreenList
      {...list}
      error={error || list.error}
      onRetry={() => {
        setError("");
        list.refresh();
      }}
      onMore={list.next}
      header={
        <>
          <Heading>Thông báo của bạn</Heading>
          <Body>
            Nhắc giờ nhận, giờ trả và cập nhật chuyến đi. Chỉ là thông báo trong
            ứng dụng.
          </Body>
        </>
      }
      renderItem={(n) => (
        <Panel>
          <Badge
            label={n.read_at ? "Đã đọc" : "Chưa đọc"}
            tone={n.read_at ? "neutral" : "green"}
          />
          <Heading small>{n.title}</Heading>
          <Body>{n.body}</Body>
          <Body>{date(n.created_at)}</Body>
          <Button
            title={n.rental_id ? "Mở chuyến đi" : "Đánh dấu đã đọc"}
            secondary
            onPress={async () => {
              try {
                await api.patch(`/notifications/${n.id}/read`);
                list.refresh();
                if (n.rental_id)
                  navigation.navigate("Rental", { id: n.rental_id });
              } catch (e) {
                setError(message(e));
              }
            }}
          />
        </Panel>
      )}
    />
  );
}
export function SupportScreen({ navigation, route }: any) {
  const list = usePaged<any>("/support"),
    [id, setId] = useState(String(route.params?.rental_id ?? "")),
    [kind, setKind] = useState("OTHER"),
    [description, setDescription] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <ScreenList
      {...list}
      onRetry={list.refresh}
      onMore={list.next}
      header={
        <>
          <Heading>Hỗ trợ chuyến đi</Heading>
          <Panel form>
            <Field
              label="Mã đơn thuê"
              value={id}
              onChangeText={setId}
              keyboardType="numeric"
            />
            <SelectField
              label="Vấn đề cần hỗ trợ"
              value={kind}
              items={[
                { id: "OTHER", name: "Câu hỏi khác" },
                { id: "BILLING", name: "Hóa đơn mô phỏng" },
                { id: "DAMAGE", name: "Xe hỏng / sự cố an toàn" },
              ]}
              onChange={setKind}
            />
            <Field
              label="Mô tả vấn đề (10–2000 ký tự)"
              value={description}
              onChangeText={setDescription}
            />
            {kind === "DAMAGE" && (
              <Body>
                Báo hỏng sẽ đưa xe đã nhận sang bảo trì và hủy miễn phí các lịch
                giữ chỗ tiếp theo. Dừng sử dụng xe nếu không an toàn. Bạn vẫn có
                thể trả xe đang thuê.
              </Body>
            )}
            {!!error && <Body error>{error}</Body>}
            {!!notice && <Badge label={notice} />}
            <Button
              title={busy ? "Đang gửi…" : "Gửi yêu cầu hỗ trợ"}
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                setError("");
                try {
                  await api.post("/support", {
                    rental_id: Number(id),
                    kind,
                    description,
                  });
                  setDescription("");
                  setNotice("Đã gửi yêu cầu.");
                  list.refresh();
                } catch (e) {
                  setError(message(e));
                } finally {
                  setBusy(false);
                }
              }}
            />
          </Panel>
          <Heading small>Lịch sử yêu cầu</Heading>
        </>
      }
      renderItem={(t) => (
        <Panel>
          <XStack justifyContent="space-between" flexWrap="wrap" gap={8}>
            <Heading small>Yêu cầu #{t.id}</Heading>
            <Status status={t.status} />
          </XStack>
          <Body>
            Đơn #{t.rental_id} ·{" "}
            {t.kind === "DAMAGE"
              ? "Sự cố xe"
              : t.kind === "BILLING"
                ? "Hóa đơn"
                : "Hỗ trợ khác"}
          </Body>
          <Body>{t.description}</Body>
          {!!t.response && (
            <>
              <Badge label="Phản hồi hỗ trợ" />
              <Body>{t.response}</Body>
            </>
          )}
          <Body>Cập nhật {date(t.updated_at)}</Body>
          <Button
            title="Xem chuyến đi liên quan"
            secondary
            onPress={() => navigation.navigate("Rental", { id: t.rental_id })}
          />
        </Panel>
      )}
    />
  );
}
export function CouponsScreen() {
  return <PublicCoupons />;
}
function PublicCoupons() {
  const [items, setItems] = React.useState<any[]>([]),
    [error, setError] = React.useState("");
  const load = () =>
    api
      .get("/coupons")
      .then((r) => setItems(r.data))
      .catch((e) => setError(message(e)));
  React.useEffect(() => {
    void load();
  }, []);
  return (
    <Page narrow>
      <Heading>Mã ưu đãi trong demo</Heading>
      <Body>
        Nhập mã tại bước đặt thuê. Hạn mức theo người dùng và toàn hệ thống được
        kiểm tra lại khi xác nhận.
      </Body>
      {!!error && <ErrorState message={error} onRetry={() => void load()} />}{" "}
      {items.map((c) => (
        <Panel key={c.id}>
          <Badge label={c.is_demo ? "Mã dữ liệu demo" : "Mã đang hiệu lực"} />
          <Heading small>{c.code}</Heading>
          <Body>
            {c.kind === "PERCENT"
              ? `Giảm ${c.value}%`
              : `Giảm ${money(c.value)}`}{" "}
            · Tối đa {money(c.max_discount)}
          </Body>
          <Body>
            Tiền thuê tối thiểu {money(c.min_subtotal)} · Mỗi người tối đa{" "}
            {c.per_user_limit} lượt{"\n"}Hết hạn {date(c.ends_at)}
          </Body>
        </Panel>
      ))}
    </Page>
  );
}
const resources = [
  { id: "bikes", name: "Chiếc xe" },
  { id: "models", name: "Mẫu xe" },
  { id: "types", name: "Loại xe" },
  { id: "stations", name: "Trạm" },
  { id: "rentals", name: "Đơn thuê" },
  { id: "support", name: "Hỗ trợ" },
  { id: "coupons", name: "Mã giảm giá" },
];
const fields: Record<
  string,
  {
    key: string;
    label: string;
    kind?: "number" | "boolean" | "date";
    value: string;
  }[]
> = {
  stations: [
    { key: "name", label: "Tên trạm", value: "" },
    { key: "address", label: "Địa chỉ minh họa", value: "" },
    { key: "latitude", label: "Vĩ độ", kind: "number", value: "10.77" },
    { key: "longitude", label: "Kinh độ", kind: "number", value: "106.7" },
    {
      key: "active",
      label: "Hoạt động (true / false)",
      kind: "boolean",
      value: "true",
    },
  ],
  types: [
    { key: "name", label: "Tên loại xe", value: "" },
    { key: "description", label: "Mô tả", value: "" },
    {
      key: "active",
      label: "Hoạt động (true / false)",
      kind: "boolean",
      value: "true",
    },
  ],
  models: [
    { key: "name", label: "Tên mẫu xe", value: "" },
    { key: "type_id", label: "ID loại xe", kind: "number", value: "1" },
    {
      key: "brand",
      label: "Thương hiệu hoặc nguồn demo",
      value: "Bộ sưu tập demo",
    },
    { key: "description", label: "Mô tả", value: "" },
    {
      key: "specifications",
      label: "Thông số (JSON object)",
      value: '{"khung":"Hợp kim — thông số demo"}',
    },
    {
      key: "active",
      label: "Hoạt động (true / false)",
      kind: "boolean",
      value: "true",
    },
    {
      key: "image_path",
      label: "Ảnh chính đã có trong media (tùy chọn)",
      value: "",
    },
  ],
  bikes: [
    { key: "code", label: "Mã xe duy nhất", value: "" },
    { key: "bike_model_id", label: "ID mẫu xe", kind: "number", value: "1" },
    { key: "station_id", label: "ID trạm", kind: "number", value: "1" },
    {
      key: "price_per_hour",
      label: "Giá / giờ (VNĐ)",
      kind: "number",
      value: "20000",
    },
    {
      key: "status",
      label: "Trạng thái (ACTIVE / MAINTENANCE)",
      value: "ACTIVE",
    },
  ],
  coupons: [
    { key: "code", label: "Mã giảm giá", value: "" },
    { key: "kind", label: "Loại giảm (PERCENT / FIXED)", value: "PERCENT" },
    { key: "value", label: "Giá trị giảm", kind: "number", value: "10" },
    {
      key: "max_discount",
      label: "Giảm tối đa (VNĐ)",
      kind: "number",
      value: "25000",
    },
    {
      key: "min_subtotal",
      label: "Tiền thuê tối thiểu (VNĐ)",
      kind: "number",
      value: "20000",
    },
    {
      key: "starts_at",
      label: "Bắt đầu (ISO 8601)",
      kind: "date",
      value: new Date().toISOString(),
    },
    {
      key: "ends_at",
      label: "Kết thúc (ISO 8601)",
      kind: "date",
      value: new Date(Date.now() + 30 * 86400000).toISOString(),
    },
    {
      key: "max_uses",
      label: "Lượt toàn hệ thống",
      kind: "number",
      value: "100",
    },
    {
      key: "per_user_limit",
      label: "Lượt mỗi người",
      kind: "number",
      value: "1",
    },
    {
      key: "active",
      label: "Hoạt động (true / false)",
      kind: "boolean",
      value: "true",
    },
  ],
  support: [
    {
      key: "status",
      label: "Trạng thái (OPEN / IN_PROGRESS / RESOLVED)",
      value: "IN_PROGRESS",
    },
    { key: "response", label: "Nội dung phản hồi", value: "" },
  ],
};
export function AdminScreen() {
  const [resource, setResource] = useState("bikes"),
    [stats, setStats] = useState<any>(null),
    [edit, setEdit] = useState<any>(null),
    [values, setValues] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const list = usePaged<any>(`/admin/${resource}`, {}, 10),
    loadStats = () =>
      api
        .get("/admin/stats")
        .then((r) => setStats(r.data))
        .catch((e) => setError(message(e)));
  React.useEffect(() => {
    void loadStats();
  }, []);
  const open = (row: any) => {
    setEdit(row ?? {});
    setValues(
      Object.fromEntries(
        (fields[resource] ?? []).map((f) => [
          f.key,
          row?.[f.key] === undefined ? f.value : String(row[f.key]),
        ]),
      ),
    );
    setNotice("");
    setError("");
  };
  return (
    <ScreenList
      {...list}
      onRetry={() => {
        list.refresh();
        void loadStats();
      }}
      onMore={list.next}
      header={
        <>
          <Badge label="Khu vực quản trị" />
          <Heading>Điều hành đội xe</Heading>
          <Body>
            Số liệu tính từ database đang kết nối. Doanh thu là tiền mô phỏng.
          </Body>
          {stats && (
            <>
              <XStack flexWrap="wrap" gap={16}>
                {[
                  ["Đơn thuê", stats.rentals],
                  ["Chiếc xe", stats.bikes],
                  ["Trạm", stats.stations],
                  ["Hỗ trợ chưa xong", stats.open_tickets],
                ].map(([label, value]) => (
                  <Panel key={label}>
                    <Body>{label}</Body>
                    <Heading small>{value}</Heading>
                  </Panel>
                ))}
              </XStack>
              <Panel>
                <Body>Tiền mô phỏng từ đơn hoàn thành</Body>
                <Heading small>{money(stats.simulated_revenue)}</Heading>
                <Body>Xe được thuê nhiều</Body>
                {stats.popular.map((p: any) => (
                  <Body key={p.bike_id}>
                    Xe #{p.bike_id} · {p.name} · {p.count} chuyến hoàn thành
                  </Body>
                ))}
              </Panel>
            </>
          )}
          <SelectField
            label="Danh mục quản lý"
            value={resource}
            items={resources}
            onChange={(v) => {
              setResource(v);
              setEdit(null);
              setNotice("");
              setError("");
            }}
          />
          {resource !== "rentals" && resource !== "support" && (
            <Button title="Tạo bản ghi" onPress={() => open(null)} />
          )}
          <Button
            title="Chạy kiểm tra hết hạn và nhắc giờ"
            secondary
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              try {
                const r = await api.post("/admin/tasks/run");
                setNotice(
                  `Đã xử lý ${r.data.expired} đơn hết hạn, kiểm tra ${r.data.checked} đơn.`,
                );
                list.refresh();
                void loadStats();
              } catch (e) {
                setError(message(e));
              } finally {
                setBusy(false);
              }
            }}
          />
          {!!notice && <Badge label={notice} />}{" "}
          {!!error && <Body error>{error}</Body>}
          {edit && (
            <Panel form>
              <Heading small>
                {edit.id ? `Cập nhật #${edit.id}` : "Thêm mới"}
              </Heading>
              {fields[resource]?.map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  value={values[f.key] ?? ""}
                  onChangeText={(v) =>
                    setValues((old) => ({ ...old, [f.key]: v }))
                  }
                  keyboardType={f.kind === "number" ? "numeric" : "default"}
                />
              ))}
              <Body>
                Không xóa dữ liệu có lịch sử. Vô hiệu hóa bằng active=false.
                Chuyển xe bảo trì sẽ hủy miễn phí các lịch giữ chỗ; không chỉnh
                xe đang thuê ở đây.
              </Body>
              <Button
                title={busy ? "Đang lưu…" : "Lưu thay đổi quản trị"}
                disabled={busy}
                onPress={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    const body = Object.fromEntries(
                      fields[resource]
                        .filter((f) => f.key !== "image_path")
                        .map((f) => [
                          f.key,
                          f.kind === "number"
                            ? Number(values[f.key])
                            : f.kind === "boolean"
                              ? values[f.key] === "true"
                              : values[f.key],
                        ]),
                    );
                    const r = await api.request({
                      url: `/admin/${resource}${edit.id ? "/" + edit.id : ""}`,
                      method: edit.id ? "PATCH" : "POST",
                      data: body,
                    });
                    if (resource === "models" && values.image_path)
                      await api.put(`/admin/models/${r.data.id}/images`, {
                        path: values.image_path,
                        alt_text: values.name,
                        sort_order: 0,
                      });
                    setEdit(null);
                    setNotice("Đã lưu thay đổi.");
                    list.refresh();
                    void loadStats();
                  } catch (e) {
                    setError(message(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              <Button
                title="Đóng biểu mẫu"
                secondary
                onPress={() => setEdit(null)}
              />
            </Panel>
          )}
        </>
      }
      renderItem={(row) => (
        <Panel>
          <Heading small>
            #{row.id} ·{" "}
            {row.name ??
              row.code ??
              (resource === "rentals"
                ? `Đơn của user ${row.user_id}`
                : `Hỗ trợ đơn ${row.rental_id}`)}
          </Heading>
          {row.status && <Status status={row.status} />}
          <Body>
            {resource === "bikes"
              ? `Mẫu #${row.bike_model_id} · Trạm #${row.station_id} · ${money(row.price_per_hour)}/giờ`
              : resource === "rentals"
                ? `${date(row.planned_start_at)} · ${money(row.final_total ?? row.estimated_total)}`
                : (row.description ??
                  row.address ??
                  (row.active === false ? "Đã vô hiệu hóa" : "Đang hoạt động"))}
          </Body>
          {resource !== "rentals" && (
            <Button title="Sửa bản ghi" secondary onPress={() => open(row)} />
          )}
        </Panel>
      )}
    />
  );
}
