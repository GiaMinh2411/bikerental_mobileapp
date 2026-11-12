import React from "react";
import { Provider } from "react-redux";
import { TamaguiProvider } from "tamagui";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { store } from "./src/store";
import { config } from "./src/theme/config";
import { Navigation } from "./src/navigation";
export default function App() {
  return (
    <Provider store={store}>
      <TamaguiProvider config={config} defaultTheme="light">
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Navigation />
        </SafeAreaProvider>
      </TamaguiProvider>
    </Provider>
  );
}
