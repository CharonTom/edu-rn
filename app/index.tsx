// App.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// URL de base selon l'environnement
const BASE_URL =
  Platform.OS === "android"
    ? "http://10.26.128.192:8000/api" // Android Emulator
    : "http://localhost:8000/api"; // iOS Simulator / Web

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier le token au démarrage
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (token) setUserToken(token);
      } catch (err) {
        console.error("Erreur lecture token", err);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, []);

  const handleLogin = async () => {
    console.log("📤 Payload login", {
      email,
      password,
      device_name: Platform.OS,
    });

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password, device_name: Platform.OS }),
      });

      console.log("📥 Status HTTP:", response.status);

      if (response.ok) {
        // OK → on récupère le token en plain-text
        const token = await response.text();
        console.log("🔑 Token reçu:", token);
        await AsyncStorage.setItem("userToken", token);
        setUserToken(token);
      } else {
        // Erreur → on parse le JSON pour avoir les messages de validation ou d'exception
        const errData = await response.json();
        console.log("❌ Erreur body:", errData);

        if (errData.errors) {
          // Erreurs de validation 422
          Alert.alert(
            "Erreur de validation",
            Object.entries(errData.errors)
              .map(([field, msgs]: any) => `${field} : ${msgs.join(", ")}`)
              .join("\n")
          );
        } else {
          // Autres erreurs
          Alert.alert("Erreur", errData.message || "Une erreur est survenue");
        }
      }
    } catch (e: any) {
      console.error("⚠️ Exception réseau ou parsing", e);
      Alert.alert("Erreur réseau", e.message);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    setUserToken(null);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Écran de connexion
  if (!userToken) {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button title="Se connecter" onPress={handleLogin} />
      </View>
    );
  }

  // Écran d'accueil
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Bienvenue !</Text>
      <Button title="Se déconnecter" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  welcome: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
});
