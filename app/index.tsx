import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import LoginScreen from "./LoginScreen";
import QrScannerScreen from "./QrScanner";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("userToken")
      .then((t) => setToken(t))
      .finally(() => setLoading(false));
  }, []);

  const handleSignIn = (newToken: string) => {
    setToken(newToken);
  };
  const handleSignOut = () => {
    AsyncStorage.removeItem("userToken").then(() => setToken(null));
  };

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return token ? (
    <QrScannerScreen onSignOut={handleSignOut} />
  ) : (
    <LoginScreen onSignIn={handleSignIn} />
  );
}
