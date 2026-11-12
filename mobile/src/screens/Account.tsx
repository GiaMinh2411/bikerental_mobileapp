import React, { useState } from "react";
import { Page, Heading, Body, Panel, Field, Button } from "../components/ui";
import { useAppDispatch, useAppSelector } from "../store";
import { api, message } from "../services/api";
import { signedOut, updated } from "../slices/session";
import { clearPrivate } from "../slices/data";
import { tokenStorage } from "../utils/token";
export function AccountScreen({ navigation }: any) {
  const user = useAppSelector((s) => s.session.user)!;
  const dispatch = useAppDispatch();
  const [name, setName] = useState(user.full_name),
    [phone, setPhone] = useState(user.phone),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  return (
    <Page narrow>
      <Heading>Tài khoản của bạn</Heading>
      <Body>{user.email}</Body>
      <Panel>
        <Field
          label="Họ tên"
          value={name}
          onChangeText={setName}
          error={
            error && name.trim().length < 2
              ? "Họ tên có ít nhất 2 ký tự."
              : undefined
          }
        />
        <Field
          label="Số điện thoại (không bắt buộc)"
          value={phone}
          onChangeText={setPhone}
        />
        {!!error && <Body error>{error}</Body>}
        {!!notice && <Body>{notice}</Body>}
        <Button
          title={busy ? "Đang lưu…" : "Lưu hồ sơ"}
          disabled={busy}
          onPress={async () => {
            setBusy(true);
            setError("");
            setNotice("");
            try {
              const r = await api.patch("/me", { full_name: name, phone });
              dispatch(updated(r.data));
              setNotice("Đã lưu hồ sơ.");
            } catch (e) {
              setError(message(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      </Panel>
      <Button
        title="Cài đặt và thông tin"
        secondary
        onPress={() => navigation.navigate("Settings")}
      />
      <Button
        title="Thông báo chuyến đi"
        secondary
        onPress={() => navigation.navigate("Notifications")}
      />
      <Button
        title="Mã giảm giá"
        secondary
        onPress={() => navigation.navigate("Coupons")}
      />
      <Button
        title="Yêu cầu hỗ trợ"
        secondary
        onPress={() => navigation.navigate("Support")}
      />
      {user.role === "ADMIN" && (
        <Button
          title="Quản trị đội xe"
          onPress={() => navigation.navigate("Admin")}
        />
      )}
      <Button
        title="Đăng xuất"
        secondary
        onPress={async () => {
          await tokenStorage.clear();
          dispatch(clearPrivate());
          dispatch(signedOut());
        }}
      />
    </Page>
  );
}
export function SettingsScreen() {
  return (
    <Page narrow>
      <Heading>Thông tin ứng dụng</Heading>
      <Panel>
        <Heading small>Bike Rental · 1.0.0</Heading>
        <Body>
          Bài tập React Native + Expo, Express và SQLite. Các trạm, xe, thông số
          và mức giá đều là dữ liệu minh họa. Không thu tiền thật.
        </Body>
        <Body>
          Giờ Việt Nam (UTC+7). Tối thiểu 1 giờ, làm tròn lên. Trả xe về trạm
          nhận.
        </Body>
        <Body>
          Ứng dụng tôn trọng cài đặt giảm chuyển động. Chỉ bạn và nhân sự hỗ trợ
          có quyền phù hợp mới truy cập được các yêu cầu liên quan. Hủy trước
          khi nhận miễn phí; không đến nhận đúng hạn sẽ giải phóng chỗ.
        </Body>
      </Panel>
    </Page>
  );
}
