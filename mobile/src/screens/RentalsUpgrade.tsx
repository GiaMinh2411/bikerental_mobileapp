import React, { useEffect, useRef, useState } from "react";
import { YStack, XStack, Text } from "tamagui";
import {
  Page,
  Heading,
  Body,
  Panel,
  Field,
  Button,
  Photo,
  Chips,
  money,
  date,
  SelectField,
} from "../components/ui";
import {
  Badge,
  Status,
  ScreenList,
  Skeleton,
  ErrorState,
} from "../components/states";
import { useAppDispatch, useAppSelector } from "../store";
import { loadData } from "../slices/data";
import { api, message } from "../services/api";
import { usePaged } from "../services/usePaged";
import { Booking, Model, Rental } from "../types";
import { localInput, parseLocal, requestKey } from "../utils/time";
export { localInput, parseLocal } from "../utils/time";
export function BookingScreen({ navigation, route }: any) {
  const data = useAppSelector((s) => s.data),
    [m, setM] = useState<Model | null>(null),
    [station, setStation] = useState(route.params.station ?? 0),
    [start, setStart] = useState(
      route.params.start
        ? localInput(new Date(route.params.start))
        : localInput(new Date(Date.now() + 10 * 60000)),
    ),
    [end, setEnd] = useState(
      route.params.end
        ? localInput(new Date(route.params.end))
        : localInput(new Date(Date.now() + 70 * 60000)),
    ),
    [code, setCode] = useState(""),
    [quote, setQuote] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [fields, setFields] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    void api
      .get(`/models/${route.params.id}`)
      .then((r) => {
        if (alive) {
          setM(r.data);
          if (!station) setStation(r.data.bikes[0]?.station_id ?? 0);
        }
      })
      .catch((e) => setError(message(e)));
    return () => {
      alive = false;
    };
  }, [route.params.id]);
  useEffect(() => {
    setQuote(null);
  }, [station, start, end, code]);
  const input = (): Booking => ({
    model_id: route.params.id,
    station_id: station,
    start: parseLocal(start),
    end: parseLocal(end),
    coupon_code: code.trim() || undefined,
  });
  if (!m)
    return (
      <Page narrow>
        {error ? (
          <ErrorState message={error} onRetry={() => navigation.goBack()} />
        ) : (
          <Skeleton />
        )}
      </Page>
    );
  return (
    <Page narrow>
      <Badge label="Bước 1 / 2 · Kiểm tra lịch" />
      <Heading>Đặt thuê xe</Heading>
      <Panel>
        <Photo path={m.images[0]?.path} alt={m.name} />
        <Heading small>{m.name}</Heading>
        <Body>
          Từ{" "}
          {money(
            m.min_price || Math.min(...m.bikes.map((b) => b.price_per_hour)),
          )}{" "}
          / giờ
        </Body>
      </Panel>
      <Panel>
        <SelectField
          label="Trạm nhận và trả"
          value={station}
          items={data.stations.filter((s) =>
            m.bikes.some((b) => b.station_id === s.id),
          )}
          onChange={setStation}
        />
        <Field
          label="Bắt đầu · YYYY-MM-DD HH:mm · giờ Việt Nam"
          value={start}
          onChangeText={setStart}
          error={fields.start}
        />
        <Field
          label="Kết thúc · YYYY-MM-DD HH:mm · giờ Việt Nam"
          value={end}
          onChangeText={setEnd}
          error={fields.end}
        />
        <Chips
          items={[
            { id: 1, name: "Thuê 1 giờ" },
            { id: 2, name: "Thuê 2 giờ" },
            { id: 4, name: "Thuê 4 giờ" },
          ]}
          value={0}
          onChange={(hours) => {
            try {
              setEnd(
                localInput(
                  new Date(
                    +new Date(parseLocal(start)) + Number(hours) * 3600000,
                  ),
                ),
              );
            } catch (e) {
              setError(message(e));
            }
          }}
        />
        <Field
          label="Mã giảm giá (không bắt buộc)"
          value={code}
          onChangeText={setCode}
        />
        {!!error && <Body error>{error}</Body>}
        <Button
          title={busy ? "Đang kiểm tra…" : "Kiểm tra lịch và giá"}
          disabled={busy}
          onPress={async () => {
            const f: Record<string, string> = {};
            let s = "",
              e = "";
            try {
              s = parseLocal(start);
              if (+new Date(s) < Date.now())
                f.start = "Giờ bắt đầu phải ở tương lai.";
            } catch (err) {
              f.start = message(err);
            }
            try {
              e = parseLocal(end);
              if (s && e <= s) f.end = "Giờ trả phải sau giờ nhận.";
            } catch (err) {
              f.end = message(err);
            }
            setFields(f);
            if (Object.keys(f).length) return;
            setBusy(true);
            setError("");
            try {
              setQuote((await api.post("/availability", input())).data);
            } catch (e) {
              setError(message(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      </Panel>
      <Panel>
        <Heading small>Quy tắc trước khi đặt</Heading>
        <Body>
          Giữ chỗ ngay sau xác nhận. Hủy miễn phí trước khi nhận xe; lượt mã
          được hoàn. Không đến nhận trong 30 phút sau giờ đặt hoặc hết khoảng
          thuê: đơn tự hết hạn.
        </Body>
        <Body>
          Nhận sớm tối đa 15 phút. Tối thiểu 1 giờ và làm tròn lên. Phí thực tế
          theo giờ nhận/trả, quá giờ cùng đơn giá. Trả tại trạm nhận; không có
          đặt cọc.
        </Body>
      </Panel>
      {quote && (
        <Panel>
          <Badge label={`${quote.available} xe còn lịch`} />
          <PriceBreakdown
            subtotal={quote.estimated_subtotal}
            discount={quote.estimated_discount}
            total={quote.estimated_total}
          />
          <Body>
            Đơn giá chốt: {money(quote.hourly_rate)} / giờ. Thanh toán mô phỏng,
            không thu tiền thật.
          </Body>
          <Button
            title="Xem xác nhận đặt thuê"
            onPress={() =>
              navigation.navigate("Confirm", {
                input: input(),
                quote,
                name: m.name,
              })
            }
          />
        </Panel>
      )}
    </Page>
  );
}
export function PriceBreakdown({
  subtotal,
  discount,
  total,
}: {
  subtotal: number;
  discount: number;
  total: number;
}) {
  return (
    <YStack gap={12}>
      <XStack justifyContent="space-between">
        <Body>Tiền thuê</Body>
        <Text fontSize={16}>{money(subtotal ?? total)}</Text>
      </XStack>
      <XStack justifyContent="space-between">
        <Body>Giảm giá</Body>
        <Text color="#164D3C" fontSize={16}>
          −{money(discount ?? 0)}
        </Text>
      </XStack>
      <XStack justifyContent="space-between">
        <Body>Phí khác</Body>
        <Text fontSize={16}>{money(0)}</Text>
      </XStack>
      <XStack
        justifyContent="space-between"
        flexWrap="wrap"
        gap={8}
        borderTopWidth={1}
        borderColor="#D7DFD8"
        paddingTop={12}
      >
        <Heading small>Tổng mô phỏng</Heading>
        <Heading small>{money(total)}</Heading>
      </XStack>
    </YStack>
  );
}
export function ConfirmScreen({ navigation, route }: any) {
  const { input, quote, name } = route.params,
    stations = useAppSelector((s) => s.data.stations),
    dispatch = useAppDispatch(),
    key = useRef(requestKey()),
    locked = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Page narrow>
      <Badge label="Bước 2 / 2 · Xác nhận" />
      <Heading>Chuyến đi đã sẵn sàng</Heading>
      <Panel>
        <Heading small>{name}</Heading>
        <Body>{stations.find((s) => s.id === input.station_id)?.name}</Body>
        <Body>
          Nhận: {date(input.start)}
          {"\n"}Trả: {date(input.end)}
        </Body>
        <PriceBreakdown
          subtotal={quote.estimated_subtotal}
          discount={quote.estimated_discount}
          total={quote.estimated_total}
        />
        <Body>{quote.policy}</Body>
        <Body>
          Xác nhận đặt xe và thanh toán mô phỏng khi trả. Không có giao dịch
          tiền thật.
        </Body>
        {!!error && <Body error>{error}</Body>}
        <Button
          title={busy ? "Đang giữ chỗ…" : "Xác nhận đặt xe mô phỏng"}
          disabled={busy}
          onPress={async () => {
            if (locked.current) return;
            locked.current = true;
            setBusy(true);
            setError("");
            try {
              const r = await api.post("/rentals", {
                ...input,
                request_key: key.current,
              });
              void dispatch(loadData());
              navigation.replace("Rental", { id: r.data.id });
            } catch (e) {
              setError(message(e));
            } finally {
              locked.current = false;
              setBusy(false);
            }
          }}
        />
      </Panel>
    </Page>
  );
}
export function RentalsScreen({ navigation }: any) {
  const [group, setGroup] = useState("current"),
    list = usePaged<Rental>("/my-rentals", { group });
  return (
    <ScreenList
      {...list}
      onRetry={list.refresh}
      onMore={list.next}
      header={
        <>
          <Heading>Chuyến đi của bạn</Heading>
          <Chips
            items={[
              { id: "current", name: "Đang diễn ra" },
              { id: "history", name: "Lịch sử" },
            ]}
            value={group}
            onChange={setGroup}
          />
        </>
      }
      emptyTitle="Chưa có chuyến đi trong mục này"
      renderItem={(r) => (
        <Panel>
          <Status status={r.status} />
          <Heading small>{r.bike.model.name}</Heading>
          <Body>
            #{r.id} · {r.pickup.name}
            {"\n"}
            {date(r.planned_start_at)} → {date(r.planned_end_at)}
          </Body>
          <Heading small>{money(r.final_total ?? r.estimated_total)}</Heading>
          <Button
            title="Xem đơn thuê"
            secondary
            onPress={() => navigation.navigate("Rental", { id: r.id })}
          />
        </Panel>
      )}
    />
  );
}
export function RentalScreen({ navigation, route }: any) {
  const dispatch = useAppDispatch(),
    [r, setR] = useState<Rental | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [newEnd, setNewEnd] = useState(""),
    [extensionQuote, setExtensionQuote] = useState<any>(null),
    [rating, setRating] = useState(5),
    [content, setContent] = useState(""),
    [confirmCancel, setConfirmCancel] = useState(false);
  const extendKey = useRef(requestKey());
  const load = async () => {
    const result = (await api.get(`/rentals/${route.params.id}`)).data;
    setR(result);
    if (!newEnd)
      setNewEnd(
        localInput(new Date(+new Date(result.planned_end_at) + 3600000)),
      );
    if (result.review) {
      setRating(result.review.rating);
      setContent(result.review.content);
    }
  };
  useEffect(() => {
    void load().catch((e) => setError(message(e)));
  }, [route.params.id]);
  const mutate = async (path: string, body?: unknown) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.post(path, body);
      await load();
      void dispatch(loadData());
      setNotice("Đã cập nhật chuyến đi.");
      return true;
    } catch (e) {
      setError(message(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  if (!r)
    return (
      <Page narrow>
        {error ? (
          <ErrorState
            message={error}
            onRetry={() => void load().catch((e) => setError(message(e)))}
          />
        ) : (
          <Skeleton />
        )}
      </Page>
    );
  return (
    <Page narrow>
      <XStack justifyContent="space-between" flexWrap="wrap" gap={12}>
        <Heading>Chuyến đi #{r.id}</Heading>
        <Status status={r.status} />
      </XStack>
      <Photo path={r.bike.model.images[0]?.path} alt={r.bike.model.name} />
      <Heading small>{r.bike.model.name}</Heading>
      <Body>
        Nhận và trả: {r.pickup.name}
        {"\n"}Dự kiến: {date(r.planned_start_at)} → {date(r.planned_end_at)}
      </Body>
      {r.actual_start_at && <Body>Đã nhận: {date(r.actual_start_at)}</Body>}
      {r.actual_end_at && <Body>Đã trả: {date(r.actual_end_at)}</Body>}
      {!!error && (
        <ErrorState
          message={error}
          onRetry={() => void load().catch((e) => setError(message(e)))}
        />
      )}{" "}
      {!!notice && <Badge label={notice} />}
      <Panel>
        <Heading small>
          {r.status === "COMPLETED" ? "Hóa đơn mô phỏng" : "Chi phí dự kiến"}
        </Heading>
        <PriceBreakdown
          subtotal={
            r.final_subtotal ?? r.estimated_subtotal ?? r.estimated_total
          }
          discount={r.final_discount ?? r.estimated_discount ?? 0}
          total={r.final_total ?? r.estimated_total}
        />
        <Body>
          {money(r.hourly_rate)} / giờ ·{" "}
          {r.coupon_code ? `Mã ${r.coupon_code}` : "Không dùng mã"}
          {"\n"}Tối thiểu 1 giờ, làm tròn lên. Phí thực tế từ lúc nhận đến lúc
          trả, quá giờ cùng đơn giá. Không thu tiền thật.
        </Body>
      </Panel>
      {r.status === "BOOKED" && (
        <Panel>
          <Heading small>Bước tiếp theo: nhận xe</Heading>
          <Body>
            Nhận từ 15 phút trước đến 30 phút sau giờ đặt và trước giờ kết thúc.
            Nếu xe chưa về trạm, liên hệ hỗ trợ.
          </Body>
          <Button
            title="Nhận xe mô phỏng"
            disabled={busy}
            onPress={() => void mutate(`/rentals/${r.id}/pickup`)}
          />
          {!confirmCancel ? (
            <Button
              title="Hủy đơn thuê"
              secondary
              onPress={() => setConfirmCancel(true)}
            />
          ) : (
            <>
              <Body>
                Hủy miễn phí và giải phóng chỗ, hoàn lượt mã. Bạn muốn hủy đơn
                này?
              </Body>
              <Button
                title="Xác nhận hủy đơn"
                secondary
                disabled={busy}
                onPress={() => void mutate(`/rentals/${r.id}/cancel`)}
              />
              <Button
                title="Giữ đơn thuê"
                secondary
                onPress={() => setConfirmCancel(false)}
              />
            </>
          )}
        </Panel>
      )}
      {r.status === "ONGOING" && (
        <>
          <Panel>
            <Heading small>Kết thúc chuyến đi</Heading>
            <Button
              title="Trả xe và thanh toán mô phỏng"
              disabled={busy}
              onPress={() => void mutate(`/rentals/${r.id}/return`)}
            />
          </Panel>
          <Panel>
            <Heading small>Cần thêm thời gian?</Heading>
            <Field
              label="Giờ trả mới · YYYY-MM-DD HH:mm"
              value={newEnd}
              onChangeText={(v) => {
                setNewEnd(v);
                setExtensionQuote(null);
                extendKey.current = requestKey();
              }}
            />
            <Button
              title="Xem phí gia hạn"
              secondary
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                setError("");
                try {
                  setExtensionQuote(
                    (
                      await api.post(`/rentals/${r.id}/extension-quote`, {
                        end: parseLocal(newEnd),
                      })
                    ).data,
                  );
                } catch (e) {
                  setError(message(e));
                } finally {
                  setBusy(false);
                }
              }}
            />
            {extensionQuote && (
              <>
                <Body>
                  Dự kiến thêm {money(extensionQuote.additional_total)} · Tổng
                  mới {money(extensionQuote.estimated_total)}
                </Body>
                <Button
                  title="Xác nhận gia hạn"
                  disabled={busy}
                  onPress={() =>
                    void mutate(`/rentals/${r.id}/extend`, {
                      end: parseLocal(newEnd),
                      request_key: extendKey.current,
                    })
                  }
                />
              </>
            )}
          </Panel>
        </>
      )}
      <Panel>
        <Heading small>Diễn biến chuyến đi</Heading>
        {r.events?.length ? (
          r.events.map((e) => (
            <YStack
              key={e.id}
              gap={5}
              borderLeftWidth={2}
              borderColor="#D7DFD8"
              paddingLeft={14}
            >
              <Status status={e.kind} />
              <Body>{e.note}</Body>
              <Body>{date(e.created_at)}</Body>
            </YStack>
          ))
        ) : (
          <Body>Đơn từ phiên bản trước. Trạng thái hiện tại: {r.status}.</Body>
        )}
      </Panel>
      {r.status === "COMPLETED" && (
        <Panel>
          <Heading small>
            {r.review ? "Đánh giá của bạn" : "Chia sẻ trải nghiệm thuê"}
          </Heading>
          <Body>
            Một đánh giá mỗi đơn hoàn thành. Được sửa trong 7 ngày sau khi gửi.
          </Body>
          <Chips
            items={[1, 2, 3, 4, 5].map((id) => ({ id, name: `${id}/5` }))}
            value={rating}
            onChange={setRating}
          />
          <Field
            label="Nội dung đánh giá (5–1000 ký tự)"
            value={content}
            onChangeText={setContent}
          />
          <Button
            title={r.review ? "Cập nhật đánh giá" : "Gửi đánh giá"}
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              setError("");
              try {
                await api.put(`/rentals/${r.id}/review`, { rating, content });
                await load();
                setNotice("Đã lưu đánh giá.");
              } catch (e) {
                setError(message(e));
              } finally {
                setBusy(false);
              }
            }}
          />
        </Panel>
      )}
      <Button
        title="Báo sự cố hoặc yêu cầu hỗ trợ"
        secondary
        onPress={() => navigation.navigate("Support", { rental_id: r.id })}
      />
      <Button
        title="Làm mới đơn thuê"
        secondary
        onPress={() => void load().catch((e) => setError(message(e)))}
      />
    </Page>
  );
}
