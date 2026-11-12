import React from "react";
import {
  FlatList,
  View,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, YStack, XStack } from "tamagui";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Body, Button, Heading, Panel } from "./ui";
import { colors as c } from "../theme/config";
export function Badge({
  label,
  tone = "green",
}: {
  label: string;
  tone?: "green" | "neutral" | "warning";
}) {
  return (
    <XStack
      alignSelf="flex-start"
      paddingHorizontal={10}
      paddingVertical={5}
      borderRadius={8}
      backgroundColor={
        tone === "green" ? c.mint : tone === "warning" ? "#FFF1DB" : "#EDF0EC"
      }
    >
      <Text color={c.ink} fontSize={13} fontWeight="600">
        {label}
      </Text>
    </XStack>
  );
}
export const statusText: Record<string, string> = {
  BOOKED: "Đã giữ chỗ",
  ONGOING: "Đang thuê",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
  OPEN: "Chờ xử lý",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
  ACTIVE: "Hoạt động",
  MAINTENANCE: "Bảo trì",
  EXTENDED: "Đã gia hạn",
  INCIDENT: "Đã báo sự cố",
};
export function Status({ status }: { status: string }) {
  return (
    <Badge
      label={statusText[status] ?? status}
      tone={
        ["EXPIRED", "MAINTENANCE", "OPEN"].includes(status)
          ? "warning"
          : status === "COMPLETED"
            ? "green"
            : "neutral"
      }
    />
  );
}
export function Empty({
  title = "Chưa có dữ liệu",
  body = "Thay đổi bộ lọc hoặc quay lại sau.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <Panel>
      <Ionicons name="bicycle-outline" size={30} color={c.forest} />
      <Heading small>{title}</Heading>
      <Body>{body}</Body>
    </Panel>
  );
}
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Panel>
      <Body error>{message}</Body>
      <Button title="Thử lại" secondary onPress={onRetry} />
    </Panel>
  );
}
export function Skeleton() {
  return (
    <YStack gap={12} accessibilityLabel="Đang tải dữ liệu">
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            height: i === 1 ? 140 : 18,
            backgroundColor: "#E6EBE4",
            borderRadius: 12,
            width: i === 3 ? "65%" : "100%",
          }}
        />
      ))}
    </YStack>
  );
}
export function ScreenList<T extends { id: number }>({
  header,
  items,
  renderItem,
  loading,
  error,
  onRetry,
  onMore,
  more,
  total,
  grid = false,
  emptyTitle,
}: {
  header: React.ReactNode;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onMore: () => void;
  more: boolean;
  total: number;
  grid?: boolean;
  emptyTitle?: string;
}) {
  const { width } = useWindowDimensions(),
    cols = grid ? (width >= 1000 ? 3 : width >= 640 ? 2 : 1) : 1;
  const container = Math.min(width, 1160) - 40,
    itemWidth = (container - 16 * (cols - 1)) / cols;
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: c.ground }}
    >
      <FlatList
        key={cols}
        data={items}
        keyExtractor={(i) => String(i.id)}
        numColumns={cols}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={9}
        windowSize={5}
        style={{ width: "100%", maxWidth: 1160, alignSelf: "center" }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}
        columnWrapperStyle={cols > 1 ? { gap: 16 } : undefined}
        ListHeaderComponent={
          <YStack gap={20} paddingBottom={8}>
            {header}
            <Body>{total} kết quả</Body>
          </YStack>
        }
        renderItem={({ item }) => (
          <View style={{ width: itemWidth }}>{renderItem(item)}</View>
        )}
        ListEmptyComponent={
          loading ? (
            <Skeleton />
          ) : !error ? (
            <Empty title={emptyTitle} />
          ) : undefined
        }
        ListFooterComponent={
          <YStack gap={12}>
            {!!error && <ErrorState message={error} onRetry={onRetry} />}{" "}
            {!!items.length && loading && <Body>Đang tải thêm…</Body>}
            {more && !loading && (
              <Button title="Tải thêm" secondary onPress={onMore} />
            )}
          </YStack>
        }
        onEndReachedThreshold={0.25}
        onEndReached={() => {
          if (more && !loading && !error) onMore();
        }}
        refreshing={loading && items.length > 0}
        onRefresh={onRetry}
      />
    </KeyboardAvoidingView>
  );
}
