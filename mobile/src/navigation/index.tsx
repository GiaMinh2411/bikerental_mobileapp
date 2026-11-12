import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppDispatch, useAppSelector } from "../store";
import { restore, signedOut } from "../slices/session";
import { clearPrivate } from "../slices/data";
import { onExpired } from "../services/api";
import { AuthScreen } from "../screens/Auth";
import {
  HomeScreen,
  ModelsScreen,
  ModelScreen,
  StationsScreen,
  StationScreen,
  FavoritesScreen,
} from "../screens/CatalogUpgrade";
import {
  BookingScreen,
  ConfirmScreen,
  RentalsScreen,
  RentalScreen,
} from "../screens/RentalsUpgrade";
import {
  NotificationsScreen,
  SupportScreen,
  CouponsScreen,
  AdminScreen,
} from "../screens/Features";
import { AdviceScreen } from "../screens/Advice";
import { AccountScreen, SettingsScreen } from "../screens/Account";
import { colors } from "../theme/config";
import { Page, Body } from "../components/ui";
const Stack = createNativeStackNavigator(),
  Tabs = createBottomTabNavigator();
const tabItems = [
  ["Home", "Trang chủ", "bicycle-outline", HomeScreen],
  ["Stations", "Trạm xe", "location-outline", StationsScreen],
  ["Rentals", "Đơn thuê", "receipt-outline", RentalsScreen],
  ["Favorites", "Yêu thích", "heart-outline", FavoritesScreen],
  ["Account", "Tài khoản", "person-outline", AccountScreen],
] as const;
function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { minHeight: 68, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      {tabItems.map(([name, title, icon, component]) => (
        <Tabs.Screen
          key={name}
          name={name}
          component={component}
          options={{
            title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs.Navigator>
  );
}
export function Navigation() {
  const { user, ready } = useAppSelector((s) => s.session),
    dispatch = useAppDispatch();
  useEffect(() => {
    onExpired(() => {
      dispatch(signedOut());
      dispatch(clearPrivate());
    });
    void dispatch(restore());
  }, [dispatch]);
  if (!ready)
    return (
      <Page>
        <Body>Đang mở ứng dụng…</Body>
      </Page>
    );
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.ground },
          headerTintColor: colors.ink,
          contentStyle: { backgroundColor: colors.ground },
        }}
      >
        {!user ? (
          <>
            <Stack.Screen
              name="Login"
              component={AuthScreen}
              options={{ title: "Bike Rental" }}
            />
            <Stack.Screen
              name="Register"
              component={AuthScreen}
              options={{ title: "Đăng ký" }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ title: "Bike Rental", headerBackVisible: false }}
            />
            <Stack.Screen
              name="Models"
              component={ModelsScreen}
              options={{ title: "Danh sách xe" }}
            />
            <Stack.Screen
              name="Model"
              component={ModelScreen}
              options={{ title: "Chi tiết xe" }}
            />
            <Stack.Screen
              name="Station"
              component={StationScreen}
              options={{ title: "Chi tiết trạm" }}
            />
            <Stack.Screen
              name="Booking"
              component={BookingScreen}
              options={{ title: "Đặt thuê" }}
            />
            <Stack.Screen
              name="Confirm"
              component={ConfirmScreen}
              options={{ title: "Xác nhận" }}
            />
            <Stack.Screen
              name="Rental"
              component={RentalScreen}
              options={{ title: "Chi tiết đơn" }}
            />
            <Stack.Screen
              name="Advice"
              component={AdviceScreen}
              options={{ title: "Tư vấn chọn xe" }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: "Thông tin" }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: "Thông báo" }}
            />
            <Stack.Screen
              name="Support"
              component={SupportScreen}
              options={{ title: "Hỗ trợ" }}
            />
            <Stack.Screen
              name="Coupons"
              component={CouponsScreen}
              options={{ title: "Mã giảm giá" }}
            />
            {user.role === "ADMIN" && (
              <Stack.Screen
                name="Admin"
                component={AdminScreen}
                options={{ title: "Quản trị" }}
              />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
