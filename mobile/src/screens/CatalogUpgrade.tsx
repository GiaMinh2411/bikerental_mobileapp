import React, { useEffect, useState } from "react";
import { View, useWindowDimensions, Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Page,
  Heading,
  Body,
  Button,
  Panel,
  Photo,
  BikeGrid,
  BikeCard,
  Field,
  Chips,
  Entrance,
  money,
  SelectField,
  date,
} from "../components/ui";
import {
  Badge,
  Empty,
  ErrorState,
  ScreenList,
  Skeleton,
  Status,
} from "../components/states";
import { useAppDispatch, useAppSelector } from "../store";
import { loadData } from "../slices/data";
import { Model } from "../types";
import { api, message } from "../services/api";
import { usePaged } from "../services/usePaged";
import { localInput, parseLocal } from "../utils/time";
import { colors as c } from "../theme/config";
export function HomeScreen({ navigation }: any) {
  const d = useAppSelector((s) => s.data),
    user = useAppSelector((s) => s.session.user),
    dispatch = useAppDispatch(),
    { width } = useWindowDimensions();
  const [q, setQ] = useState(""),
    [station, setStation] = useState(0),
    [start, setStart] = useState(localInput(new Date(Date.now() + 15 * 60000))),
    [end, setEnd] = useState(localInput(new Date(Date.now() + 135 * 60000))),
    [error, setError] = useState("");
  useEffect(() => {
    void dispatch(loadData());
  }, [dispatch]);
  const search = (type = 0) => {
    try {
      const s = parseLocal(start),
        e = parseLocal(end);
      if (+new Date(s) < Date.now() || e <= s)
        throw new Error(
          "Chọn giờ bắt đầu trong tương lai và kết thúc sau bắt đầu.",
        );
      setError("");
      navigation.navigate("Models", {
        q,
        station: station || undefined,
        type: type || undefined,
        start: s,
        end: e,
      });
    } catch (e) {
      setError(message(e));
    }
  };
  return (
    <Page>
      <XStack justifyContent="space-between" alignItems="center" gap={12}>
        <YStack gap={4} flex={1}>
          <Body>TP. Hồ Chí Minh · Trạm minh họa</Body>
          <Heading>Chọn xe cho chuyến đi của bạn</Heading>
        </YStack>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở thông báo"
          onPress={() => navigation.navigate("Notifications")}
          style={{
            padding: 12,
            backgroundColor: "white",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: c.line,
          }}
        >
          <Ionicons name="notifications-outline" size={24} color={c.forest} />
        </Pressable>
      </XStack>
      <Entrance>
        <XStack flexWrap="wrap" gap={24}>
          <View style={{ width: width >= 900 ? "61%" : "100%" }}>
            <Panel>
              <Field
                label="Bạn muốn tìm xe nào?"
                value={q}
                onChangeText={setQ}
              />
              <SelectField
                label="Trạm nhận và trả"
                value={station}
                items={[{ id: 0, name: "Tất cả trạm" }, ...d.stations]}
                onChange={setStation}
              />
              <XStack flexWrap="wrap" gap={12}>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Field
                    label="Nhận · YYYY-MM-DD HH:mm"
                    value={start}
                    onChangeText={setStart}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Field
                    label="Trả · YYYY-MM-DD HH:mm"
                    value={end}
                    onChangeText={setEnd}
                  />
                </View>
              </XStack>
              {!!error && <Body error>{error}</Body>}
              <Button title="Tìm xe còn lịch" onPress={() => search()} />
              <Body>Giờ Việt Nam · Tối thiểu 1 giờ · Thanh toán mô phỏng</Body>
            </Panel>
          </View>
          <View style={{ flex: 1, minWidth: 260 }}>
            <YStack gap={16}>
              <Panel>
                <Badge label="Trợ lý chọn xe" />
                <Heading small>Chọn theo nhu cầu và ngân sách</Heading>
                <Body>
                  Gợi ý từ xe còn lịch tại trạm. Kết quả ghi rõ AI hay bộ lọc dự
                  phòng.
                </Body>
                <Button
                  title="Nhờ AI chọn xe"
                  secondary
                  onPress={() => navigation.navigate("Advice")}
                />
              </Panel>
              {d.rentals[0] && (
                <Panel>
                  <Status status={d.rentals[0].status} />
                  <Heading small>{d.rentals[0].bike.model.name}</Heading>
                  <Body>
                    {date(d.rentals[0].planned_start_at)} ·{" "}
                    {d.rentals[0].pickup.name}
                  </Body>
                  <Button
                    title="Tiếp tục chuyến đi"
                    onPress={() =>
                      navigation.navigate("Rental", { id: d.rentals[0].id })
                    }
                  />
                </Panel>
              )}
            </YStack>
          </View>
        </XStack>
      </Entrance>
      <Heading small>Bạn muốn đi xe gì?</Heading>
      <Chips items={d.types} value={-1} onChange={(id) => search(Number(id))} />
      <XStack justifyContent="space-between" alignItems="center">
        <Heading small>Khám phá danh mục xe</Heading>
        <Button
          title="Xem tất cả xe"
          secondary
          onPress={() => navigation.navigate("Models")}
        />
      </XStack>
      {d.pending && !d.models.length ? (
        <Skeleton />
      ) : d.error ? (
        <ErrorState
          message={d.error}
          onRetry={() => void dispatch(loadData())}
        />
      ) : (
        <BikeGrid
          models={d.models}
          onSelect={(m) => navigation.navigate("Model", { id: m.id })}
        />
      )}
      <Heading small>Trạm trong bộ dữ liệu</Heading>
      <XStack gap={16} flexWrap="wrap">
        {d.stations.slice(0, 3).map((s) => (
          <View key={s.id} style={{ flex: 1, minWidth: 240 }}>
            <Panel>
              <Ionicons name="location-outline" color={c.forest} size={24} />
              <Heading small>{s.name}</Heading>
              <Body>{s.address}</Body>
              <Body>{s._count?.bikes ?? 0} xe trong dữ liệu trạm</Body>
              <Button
                title="Xem trạm và xe"
                secondary
                onPress={() => navigation.navigate("Station", { id: s.id })}
              />
            </Panel>
          </View>
        ))}
      </XStack>
      <Body>
        Xin chào {user?.full_name}. Giá, ảnh xe và địa điểm trong ứng dụng phục
        vụ demo học tập.
      </Body>
    </Page>
  );
}
export function ModelsScreen({ navigation, route }: any) {
  const initial = route.params ?? {},
    d = useAppSelector((s) => s.data);
  const [q, setQ] = useState(initial.q ?? ""),
    [debounced, setDebounced] = useState(q),
    [type, setType] = useState(initial.type ?? 0),
    [station, setStation] = useState(initial.station ?? 0),
    [min, setMin] = useState(""),
    [max, setMax] = useState(""),
    [sort, setSort] = useState("price_asc"),
    [start, setStart] = useState(
      initial.start ? localInput(new Date(initial.start)) : "",
    ),
    [end, setEnd] = useState(
      initial.end ? localInput(new Date(initial.end)) : "",
    ),
    [times, setTimes] = useState({ start: initial.start, end: initial.end }),
    [error, setError] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const params = {
    q: debounced,
    type: type || undefined,
    station: station || undefined,
    min: min ? Number(min) : undefined,
    max: max ? Number(max) : undefined,
    sort,
    ...times,
  };
  const list = usePaged<Model>("/catalog", params);
  const tags = [
    ...(q ? [{ id: "q", name: `Tên: ${q} ×` }] : []),
    ...(type
      ? [
          {
            id: "type",
            name: `${d.types.find((t) => t.id === type)?.name ?? "Loại xe"} ×`,
          },
        ]
      : []),
    ...(station
      ? [
          {
            id: "station",
            name: `${d.stations.find((s) => s.id === station)?.name ?? "Trạm"} ×`,
          },
        ]
      : []),
    ...(min || max
      ? [{ id: "price", name: `${min || 0}–${max || "∞"} đ ×` }]
      : []),
    ...(times.start ? [{ id: "time", name: "Có lọc lịch thuê ×" }] : []),
  ];
  return (
    <ScreenList
      grid
      {...list}
      onRetry={list.refresh}
      onMore={list.next}
      renderItem={(m) => (
        <BikeCard
          model={m}
          onPress={() =>
            navigation.navigate("Model", {
              id: m.id,
              start: times.start,
              end: times.end,
              station: station || undefined,
            })
          }
        />
      )}
      header={
        <>
          <Heading>Tìm xe đạp</Heading>
          <Panel>
            <Field label="Tìm theo tên xe" value={q} onChangeText={setQ} />
            <XStack flexWrap="wrap" gap={16}>
              <View style={{ flex: 1, minWidth: 240 }}>
                <SelectField
                  label="Loại xe"
                  value={type}
                  items={[{ id: 0, name: "Tất cả loại xe" }, ...d.types]}
                  onChange={setType}
                />
              </View>
              <View style={{ flex: 1, minWidth: 240 }}>
                <SelectField
                  label="Trạm"
                  value={station}
                  items={[{ id: 0, name: "Tất cả trạm" }, ...d.stations]}
                  onChange={setStation}
                />
              </View>
              <View style={{ flex: 1, minWidth: 240 }}>
                <SelectField
                  label="Sắp xếp"
                  value={sort}
                  items={[
                    { id: "price_asc", name: "Giá tăng dần" },
                    { id: "price_desc", name: "Giá giảm dần" },
                    { id: "name", name: "Tên xe" },
                  ]}
                  onChange={setSort}
                />
              </View>
            </XStack>
            <XStack flexWrap="wrap" gap={12}>
              <View style={{ flex: 1, minWidth: 180 }}>
                <Field
                  label="Giá từ / giờ (VNĐ)"
                  value={min}
                  onChangeText={setMin}
                  error={
                    min && !/^\d+$/.test(min)
                      ? "Nhập giá không âm."
                      : min && max && Number(min) > Number(max)
                        ? "Giá từ không được lớn hơn giá đến."
                        : undefined
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, minWidth: 180 }}>
                <Field
                  label="Giá đến / giờ (VNĐ)"
                  value={max}
                  onChangeText={setMax}
                  error={
                    max && !/^\d+$/.test(max) ? "Nhập giá không âm." : undefined
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, minWidth: 220 }}>
                <Field
                  label="Nhận · YYYY-MM-DD HH:mm"
                  value={start}
                  onChangeText={setStart}
                />
              </View>
              <View style={{ flex: 1, minWidth: 220 }}>
                <Field
                  label="Trả · YYYY-MM-DD HH:mm"
                  value={end}
                  onChangeText={setEnd}
                />
              </View>
            </XStack>
            <Button
              title="Áp dụng giờ thuê"
              secondary
              onPress={() => {
                try {
                  if (!start && !end) {
                    setTimes({ start: undefined, end: undefined });
                    return;
                  }
                  const s = parseLocal(start),
                    e = parseLocal(end);
                  if (+new Date(s) < Date.now() || e <= s)
                    throw new Error("Khoảng thuê không hợp lệ.");
                  setTimes({ start: s, end: e });
                  setError("");
                } catch (e) {
                  setError(message(e));
                }
              }}
            />
            {!!error && <Body error>{error}</Body>}
          </Panel>
          {!!tags.length && (
            <Chips
              items={tags}
              value=""
              onChange={(id) => {
                if (id === "q") setQ("");
                if (id === "type") setType(0);
                if (id === "station") setStation(0);
                if (id === "price") {
                  setMin("");
                  setMax("");
                }
                if (id === "time") {
                  setStart("");
                  setEnd("");
                  setTimes({ start: undefined, end: undefined });
                }
              }}
            />
          )}
        </>
      }
    />
  );
}
export function ModelScreen({ navigation, route }: any) {
  const [m, setM] = useState<Model | null>(null),
    [index, setIndex] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  const dispatch = useAppDispatch();
  const reviews = usePaged<{
    id: number;
    rating: number;
    content: string;
    is_demo: boolean;
    created_at: string;
  }>(`/models/${route.params.id}/reviews`, {}, 5);
  const load = () =>
    api
      .get(`/models/${route.params.id}`)
      .then((r) => {
        setM(r.data);
        setError("");
      })
      .catch((e) => setError(message(e)));
  useEffect(() => {
    void load();
    void api
      .get(`/favorite-status/${route.params.id}`)
      .then((r) => setSaved(r.data.saved))
      .catch(() => setSaved(false));
  }, [route.params.id]);
  if (!m)
    return (
      <Page>
        {error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : (
          <Skeleton />
        )}
      </Page>
    );
  return (
    <Page>
      <Badge label={m.type.name} />
      <Heading>{m.name}</Heading>
      <Photo
        path={m.images[index]?.path}
        alt={m.images[index]?.alt_text ?? m.name}
        large
      />
      {m.images.length > 1 && (
        <Chips
          items={m.images.map((_, i) => ({
            id: i,
            name: i === 0 ? "Ảnh chính" : `Góc ${i + 1}`,
          }))}
          value={index}
          onChange={setIndex}
        />
      )}
      <Panel>
        <Heading small>
          Từ {money(Math.min(...m.bikes.map((b) => b.price_per_hour)))} / giờ
        </Heading>
        <Body>{m.description}</Body>
        <XStack flexWrap="wrap" gap={12}>
          <Button
            title="Chọn giờ thuê"
            onPress={() => navigation.navigate("Booking", { ...route.params })}
          />
          <Button
            title={saved ? "Bỏ yêu thích" : "Lưu yêu thích"}
            secondary
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              try {
                await api.request({
                  url: `/favorites/${m.id}`,
                  method: saved ? "DELETE" : "PUT",
                });
                setSaved(!saved);
                void dispatch(loadData());
              } catch (e) {
                setError(message(e));
              } finally {
                setBusy(false);
              }
            }}
          />
        </XStack>
        {!!error && <Body error>{error}</Body>}
        <Body>
          Tối thiểu 1 giờ, làm tròn lên. Quá giờ giữ nguyên đơn giá. Hủy trước
          nhận xe miễn phí. Nhận từ 15 phút trước đến 30 phút sau giờ đặt; trả
          tại trạm nhận.
        </Body>
      </Panel>
      <Heading small>Thông số và điều kiện</Heading>
      <Panel>
        {Object.entries(JSON.parse(m.specifications)).map(([key, value]) => (
          <XStack key={key} flexWrap="wrap" gap={8}>
            <Text color={c.ink} fontWeight="600" minWidth={130}>
              {(
                {
                  loai: "Loại xe",
                  mau: "Màu",
                  khung: "Khung",
                  doi_tuong: "Đối tượng",
                  ghi_chu: "Lưu ý",
                  banh: "Bánh xe",
                  tay_lai: "Tay lái",
                } as Record<string, string>
              )[key] ?? key}
            </Text>
            <Body>{String(value)}</Body>
          </XStack>
        ))}
      </Panel>
      <Heading small>Trạm và lịch trống</Heading>
      <Body>Chọn trạm, nhập giờ để kiểm tra số xe còn lịch tại máy chủ.</Body>
      <XStack flexWrap="wrap" gap={16}>
        {Array.from(new Set(m.bikes.map((b) => b.station_id))).map((id) => (
          <View key={id} style={{ flex: 1, minWidth: 250 }}>
            <Panel>
              <Heading small>
                {m.bikes.find((b) => b.station_id === id)!.station.name}
              </Heading>
              <Button
                title="Kiểm tra lịch tại trạm"
                secondary
                onPress={() =>
                  navigation.navigate("Booking", {
                    ...route.params,
                    station: id,
                  })
                }
              />
            </Panel>
          </View>
        ))}
      </XStack>
      <Heading small>Đánh giá sau chuyến đi · {reviews.total}</Heading>
      {reviews.loading && !reviews.items.length ? (
        <Skeleton />
      ) : !reviews.items.length ? (
        <Empty
          title="Chưa có đánh giá"
          body="Chỉ người hoàn thành chuyến đi mới được gửi đánh giá."
        />
      ) : (
        reviews.items.map((r) => (
          <Panel key={r.id}>
            <Badge
              label={`${r.rating}/5${r.is_demo ? " · Dữ liệu demo" : ""}`}
            />
            <Body>{r.content}</Body>
            <Body>{date(r.created_at)}</Body>
          </Panel>
        ))
      )}
      {reviews.error && (
        <ErrorState message={reviews.error} onRetry={reviews.refresh} />
      )}{" "}
      {reviews.more && (
        <Button title="Xem thêm đánh giá" secondary onPress={reviews.next} />
      )}
    </Page>
  );
}
export function StationsScreen({ navigation }: any) {
  const d = useAppSelector((s) => s.data);
  return (
    <Page>
      <Heading>Chọn trạm nhận xe</Heading>
      <Body>
        Các địa điểm minh họa, không phải điểm kinh doanh thực tế. Xe được trả
        tại trạm nhận.
      </Body>
      <XStack flexWrap="wrap" gap={16}>
        {d.stations.map((s) => (
          <View key={s.id} style={{ flex: 1, minWidth: 260 }}>
            <Panel>
              <Ionicons name="location-outline" size={26} color={c.forest} />
              <Heading small>{s.name}</Heading>
              <Body>{s.address}</Body>
              <Body>{s._count?.bikes ?? 0} xe trong danh mục trạm</Body>
              <Button
                title="Xem trạm và xe"
                secondary
                onPress={() => navigation.navigate("Station", { id: s.id })}
              />
            </Panel>
          </View>
        ))}
      </XStack>
    </Page>
  );
}
export function StationScreen({ navigation, route }: any) {
  const d = useAppSelector((s) => s.data),
    s = d.stations.find((s) => s.id === route.params.id),
    list = usePaged<Model>("/catalog", { station: route.params.id });
  return (
    <ScreenList
      grid
      {...list}
      onRetry={list.refresh}
      onMore={list.next}
      header={
        <>
          <Heading>{s?.name ?? "Chi tiết trạm"}</Heading>
          <Body>{s?.address}</Body>
          <Button
            title="Lọc xe tại trạm này"
            onPress={() =>
              navigation.navigate("Models", { station: route.params.id })
            }
          />
        </>
      }
      renderItem={(m) => (
        <BikeCard
          model={m}
          onPress={() =>
            navigation.navigate("Model", { id: m.id, station: route.params.id })
          }
        />
      )}
    />
  );
}
export function FavoritesScreen({ navigation }: any) {
  const list = usePaged<Model>("/my-favorites");
  return (
    <ScreenList
      grid
      {...list}
      onRetry={list.refresh}
      onMore={list.next}
      emptyTitle="Chưa lưu xe yêu thích"
      header={
        <>
          <Heading>Xe đã lưu</Heading>
          <Body>Lưu những mẫu xe bạn muốn thử cho chuyến đi tiếp theo.</Body>
        </>
      }
      renderItem={(m) => (
        <BikeCard
          model={m}
          onPress={() => navigation.navigate("Model", { id: m.id })}
        />
      )}
    />
  );
}
