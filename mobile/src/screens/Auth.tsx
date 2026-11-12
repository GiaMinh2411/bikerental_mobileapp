import React, { useState } from "react";
import { YStack } from "tamagui";
import { Page, Heading, Body, Panel, Field, Button } from "../components/ui";
import { useAppDispatch, useAppSelector } from "../store";
import { authenticate } from "../slices/session";
export function AuthScreen({ navigation, route }: any) {
  const register = route.name === "Register";
  const [email, setEmail] = useState("demo1@bike.example"),
    [password, setPassword] = useState("Demo12345!"),
    [name, setName] = useState(""),
    [submitted, setSubmitted] = useState(false);
  const { pending, error } = useAppSelector((s) => s.session);
  const dispatch = useAppDispatch();
  const errors = {
    email: !/^\S+@\S+\.\S+$/.test(email) ? "Nhập địa chỉ email hợp lệ." : "",
    password: password.length < 8 ? "Mật khẩu có ít nhất 8 ký tự." : "",
    name:
      register && name.trim().length < 2
        ? "Nhập họ tên có ít nhất 2 ký tự."
        : "",
  };
  return (
    <Page>
      <YStack maxWidth={460} width="100%" alignSelf="center" gap={24}>
        <Heading>Bike Rental</Heading>
        <Body>Thuê xe đạp, khám phá thành phố.</Body>
        <Panel>
          <Heading small>{register ? "Tạo tài khoản" : "Đăng nhập"}</Heading>
          {register && (
            <Field
              label="Họ tên"
              value={name}
              onChangeText={setName}
              error={submitted ? errors.name : undefined}
            />
          )}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={submitted ? errors.email : undefined}
          />
          <Field
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secure
            error={submitted ? errors.password : undefined}
          />
          {!!error && <Body error>{error}</Body>}
          <Button
            title={
              pending ? "Đang xử lý…" : register ? "Tạo tài khoản" : "Đăng nhập"
            }
            disabled={pending}
            onPress={() => {
              setSubmitted(true);
              if (!Object.values(errors).some(Boolean))
                void dispatch(
                  authenticate({
                    email,
                    password,
                    ...(register ? { full_name: name } : {}),
                  }),
                );
            }}
          />
          <Button
            title={register ? "Về đăng nhập" : "Đăng ký tài khoản"}
            secondary
            onPress={() => navigation.navigate(register ? "Login" : "Register")}
          />
        </Panel>
        <Body>
          Tài khoản demo: demo1@bike.example • Demo12345!{"\n"}Nhận xe, trả xe
          và thanh toán đều là mô phỏng.
        </Body>
      </YStack>
    </Page>
  );
}
