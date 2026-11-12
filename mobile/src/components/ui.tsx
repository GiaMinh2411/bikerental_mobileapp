import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  AccessibilityInfo,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
  Modal,
} from "react-native";
import { Text, YStack, XStack } from "tamagui";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors as c } from "../theme/config";
import { media } from "../services/api";
import { Model } from "../types";
export const money = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n,
  );
export const date = (v: string) =>
  new Date(v).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
export function Page({
  children,
  narrow = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.ground }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
      >
        <YStack
          width="100%"
          maxWidth={narrow ? 680 : 1120}
          alignSelf="center"
          gap={20}
        >
          {children}
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function Heading({
  children,
  small = false,
}: {
  children: React.ReactNode;
  small?: boolean;
}) {
  const { width } = useWindowDimensions();
  return (
    <Text
      role="heading"
      color={c.ink}
      fontSize={small ? 22 : width < 640 ? 30 : 36}
      fontWeight="800"
      lineHeight={
        Platform.OS === "web" ? 1.2 : small ? 29 : width < 640 ? 38 : 44
      }
    >
      {children}
    </Text>
  );
}
export function Body({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <Text
      color={error ? c.error : c.muted}
      fontSize={16}
      lineHeight={Platform.OS === "web" ? 1.5 : 24}
    >
      {children}
    </Text>
  );
}
export function Panel({
  children,
  form = false,
}: {
  children: React.ReactNode;
  form?: boolean;
}) {
  return (
    <YStack
      padding={20}
      gap={16}
      backgroundColor="white"
      borderWidth={1}
      borderColor={c.line}
      borderRadius={16}
      maxWidth={form ? 680 : undefined}
      width={form ? "100%" : undefined}
      alignSelf={form ? "center" : undefined}
    >
      {children}
    </YStack>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: secondary ? c.line : c.forest,
        backgroundColor: secondary ? c.white : c.forest,
        opacity: disabled ? 0.45 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <Text
        fontSize={16}
        fontWeight="700"
        color={secondary ? c.forest : "white"}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  secure = false,
  error,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  secure?: boolean;
  error?: string;
  keyboardType?: "default" | "email-address" | "numeric";
}) {
  return (
    <YStack gap={6}>
      <Text color={c.ink} fontSize={15} fontWeight="600">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={{
          minHeight: 48,
          borderWidth: 1,
          borderColor: error ? c.error : c.line,
          backgroundColor: "white",
          borderRadius: 10,
          padding: 12,
          fontSize: 16,
          color: c.ink,
        }}
      />
      {!!error && <Body error>{error}</Body>}
    </YStack>
  );
}
export function Chips({
  items,
  value,
  onChange,
}: {
  items: { id: number | string; name: string }[];
  value: number | string;
  onChange: (id: any) => void;
}) {
  return (
    <XStack flexWrap="wrap" gap={8}>
      {items.map((i) => (
        <Pressable
          key={i.id}
          accessibilityRole="button"
          accessibilityState={{ selected: value === i.id }}
          onPress={() => onChange(i.id)}
          style={{
            minHeight: 44,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: value === i.id ? c.forest : c.line,
            backgroundColor: value === i.id ? c.forest : "white",
          }}
        >
          <Text color={value === i.id ? "white" : c.ink}>{i.name}</Text>
        </Pressable>
      ))}
    </XStack>
  );
}
export function Photo({
  path,
  alt,
  large = false,
}: {
  path?: string;
  alt: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [path]);
  return (
    <Image
      accessibilityLabel={alt}
      source={failed ? require("../../assets/icon.png") : { uri: media(path) }}
      onError={() => setFailed(true)}
      resizeMode="contain"
      style={{
        width: "100%",
        aspectRatio: large ? 1.5 : 1.4,
        maxHeight: large ? 380 : 420,
        backgroundColor: "#F0F2ED",
        borderRadius: 12,
      }}
    />
  );
}
export function BikeCard({
  model,
  onPress,
}: {
  model: Model;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem xe ${model.name}`}
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 16,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: c.line,
        overflow: "hidden",
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Photo
        path={model.images[0]?.path.replace(".webp", "-thumb.webp")}
        alt={model.name}
      />
      <YStack padding={16} gap={8}>
        <Text color={c.muted} fontSize={13}>
          {model.type.name}
        </Text>
        <Text color={c.ink} fontSize={19} fontWeight="700">
          {model.name}
        </Text>
        <Text color={c.forest} fontSize={18} fontWeight="800">
          {money(
            model.matched_rate ??
              Math.min(...model.bikes.map((b) => b.price_per_hour)),
          )}{" "}
          / giờ
        </Text>
        <XStack gap={6} alignItems="center">
          <Ionicons name="location-outline" size={15} color={c.muted} />
          <Text color={c.muted} fontSize={13}>
            {model.bikes[0]?.station.name ?? "Chọn trạm khi đặt"}
          </Text>
        </XStack>
        {!!model.review_count && (
          <XStack gap={6} alignItems="center">
            <Ionicons name="star" size={14} color="#916014" />
            <Text color={c.muted} fontSize={13}>
              {model.rating_average?.toFixed(1)} · {model.review_count} đánh giá
              {model.demo_review_count
                ? ` · ${model.demo_review_count} demo`
                : ""}
            </Text>
          </XStack>
        )}
      </YStack>
    </Pressable>
  );
}
export function SelectField({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { id: number | string; name: string }[];
  value: number | string;
  onChange: (v: any) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <YStack gap={8}>
      <Text fontSize={14} color={c.ink} fontWeight="600">
        {label}
      </Text>
      <Button
        title={items.find((i) => i.id === value)?.name ?? "Chọn một mục"}
        secondary
        onPress={() => setOpen(true)}
      />
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15,35,25,.35)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 600,
              maxHeight: "80%",
              alignSelf: "center",
              backgroundColor: c.ground,
              borderRadius: 20,
              padding: 20,
            }}
          >
            <ScrollView keyboardShouldPersistTaps="handled">
              <YStack gap={10}>
                <Heading small>{label}</Heading>
                {items.map((i) => (
                  <Button
                    key={i.id}
                    title={i.name}
                    secondary={value !== i.id}
                    onPress={() => {
                      onChange(i.id);
                      setOpen(false);
                    }}
                  />
                ))}
              </YStack>
            </ScrollView>
            <View style={{ paddingTop: 16 }}>
              <Button
                title="Đóng lựa chọn"
                secondary
                onPress={() => setOpen(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </YStack>
  );
}
export function BikeGrid({
  models,
  onSelect,
}: {
  models: Model[];
  onSelect: (m: Model) => void;
}) {
  const { width } = useWindowDimensions();
  const columns = width >= 1000 ? 3 : width >= 640 ? 2 : 1;
  return (
    <XStack flexWrap="wrap" gap={16}>
      {models.map((m) => (
        <View
          key={m.id}
          style={{
            width: columns === 1 ? "100%" : columns === 2 ? "48.5%" : "32%",
          }}
        >
          <BikeCard model={m} onPress={() => onSelect(m)} />
        </View>
      ))}
    </XStack>
  );
}
export function Entrance({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!reduced) {
        opacity.setValue(0.6);
        animation = Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        });
        animation.start();
      }
    });
    return () => animation?.stop();
  }, [opacity]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
