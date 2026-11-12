import React, { useState } from "react";
import {
  Page,
  Heading,
  Body,
  Panel,
  Field,
  Button,
  Chips,
  BikeGrid,
} from "../components/ui";
import { useAppSelector } from "../store";
import { api, message } from "../services/api";
import { localInput, parseLocal } from "../utils/time";
import { Model } from "../types";
export function AdviceScreen({ navigation }: any) {
  const data = useAppSelector((s) => s.data);
  const [purpose, setPurpose] = useState("Đi dạo trong thành phố"),
    [budget, setBudget] = useState("50000"),
    [station, setStation] = useState(1),
    [type, setType] = useState(0),
    [start, setStart] = useState(localInput(new Date(Date.now() + 15 * 60000))),
    [hours, setHours] = useState("2"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [fields, setFields] = useState<Record<string, string>>({}),
    [result, setResult] = useState<{
      mode: string;
      explanation: string;
      models: Model[];
      fallback_reason?: string | null;
    } | null>(null);
  return (
    <Page narrow>
      <Heading>Chọn xe cùng trợ lý</Heading>
      <Body>Gợi ý dùng xe trong danh mục và lịch trống từ máy chủ.</Body>
      <Panel>
        <Field
          label="Bạn muốn dùng xe để làm gì?"
          value={purpose}
          onChangeText={setPurpose}
          error={fields.purpose}
        />
        <Field
          label="Ngân sách / giờ (VNĐ)"
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
          error={fields.budget}
        />
        <Field
          label="Bắt đầu · YYYY-MM-DD HH:mm · giờ Việt Nam"
          value={start}
          onChangeText={setStart}
          error={fields.start}
        />
        <Field
          label="Thời lượng (giờ)"
          value={hours}
          onChangeText={setHours}
          keyboardType="numeric"
          error={fields.hours}
        />
        <Body>Trạm mong muốn</Body>
        <Chips items={data.stations} value={station} onChange={setStation} />
        <Body>Loại xe ưu tiên</Body>
        <Chips
          items={[{ id: 0, name: "Tất cả" }, ...data.types]}
          value={type}
          onChange={setType}
        />
        {!!error && <Body error>{error}</Body>}
        <Button
          title={busy ? "Đang chọn xe…" : "Tìm xe phù hợp"}
          disabled={busy}
          onPress={async () => {
            const errors: Record<string, string> = {};
            if (purpose.trim().length < 2 || purpose.length > 300)
              errors.purpose = "Nhập mục đích từ 2 đến 300 ký tự.";
            if (!Number.isInteger(+budget) || +budget <= 0)
              errors.budget = "Nhập ngân sách nguyên dương bằng VNĐ.";
            if (!Number.isFinite(+hours) || +hours <= 0 || +hours > 168)
              errors.hours = "Thời lượng từ trên 0 đến 168 giờ.";
            try {
              if (+new Date(parseLocal(start)) < Date.now())
                errors.start = "Chọn thời gian trong tương lai.";
            } catch (e) {
              errors.start = message(e);
            }
            setFields(errors);
            if (Object.keys(errors).length) return;
            setBusy(true);
            setError("");
            try {
              if (!Number.isFinite(+hours) || +hours <= 0 || +hours > 168)
                throw new Error("Thời lượng từ trên 0 đến 168 giờ.");
              const s = parseLocal(start);
              const r = await api.post("/advice", {
                purpose,
                budget: Number(budget),
                station_id: station,
                type_id: type || undefined,
                start: s,
                end: new Date(
                  +new Date(s) + Number(hours) * 3600000,
                ).toISOString(),
              });
              setResult(r.data);
            } catch (e) {
              setError(message(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      </Panel>
      {result && (
        <>
          <Heading small>{result.mode}</Heading>
          <Body>{result.explanation}</Body>
          {result.mode === "Gợi ý theo bộ lọc" && (
            <Body>
              Đang dùng bộ lọc từ dữ liệu xe, chưa có kết quả Gemini hợp lệ.{" "}
              {result.fallback_reason === "NOT_CONFIGURED"
                ? "Trợ lý AI chưa được cấu hình."
                : result.fallback_reason === "NO_CANDIDATES"
                  ? "Thử tăng ngân sách, đổi loại xe, trạm hoặc khoảng thuê."
                  : "Dịch vụ AI tạm thời chưa phản hồi phù hợp."}
            </Body>
          )}
          {!result.models.length && (
            <Body>
              Không có xe phù hợp. Hãy tăng ngân sách hoặc đổi trạm, giờ thuê.
            </Body>
          )}
          <BikeGrid
            models={result.models}
            onSelect={(m) => navigation.navigate("Model", { id: m.id })}
          />
        </>
      )}
    </Page>
  );
}
