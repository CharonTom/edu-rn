// QrScannerScreen.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

const BASE_URL =
  Platform.OS === "android"
    ? "http://10.26.128.192:8000/api"
    : "http://localhost:8000/api";

// On définit ici l’URL fixe de signin
const SIGNIN_URL = `${BASE_URL}/signin`;

type Props = { onSignOut: () => void };

export default function QrScannerScreen({ onSignOut }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Récupère le token stocké
  useEffect(() => {
    AsyncStorage.getItem("userToken").then(setToken);
  }, []);

  // Demande la permission caméra
  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) requestPermission();
  }, [permission]);

  const handleScanned = async () => {
    if (scanned || !token) return;
    setScanned(true);

    try {
      // POST explicite vers /signin
      const res = await fetch(SIGNIN_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();
      if (res.ok) {
        Alert.alert("Succès", json.message);
      } else {
        Alert.alert("Erreur", json.message || "Échec du scan");
      }
    } catch (e: any) {
      Alert.alert("Erreur réseau", e.message);
    } finally {
      // Réautoriser un nouveau scan après 3 s
      setTimeout(() => setScanned(false), 3000);
    }
  };

  // États de chargement / permission
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>La permission caméra est requise.</Text>
        <Button title="Autoriser" onPress={requestPermission} />
      </View>
    );
  }
  if (!token) {
    return (
      <View style={styles.center}>
        <Text>Connecte-toi d’abord pour accéder au scanner.</Text>
      </View>
    );
  }

  // Affichage du scanner
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        // On ne passe plus data ici, on déclenche toujours SIGNIN_URL
        onBarcodeScanned={() => handleScanned()}
      >
        <View style={styles.controls}>
          <Button
            title="Flip"
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          />
        </View>
        {scanned && (
          <View style={styles.overlay}>
            <Text style={styles.text}>Scan effectué !</Text>
            <Button title="Re-scanner" onPress={() => setScanned(false)} />
          </View>
        )}
      </CameraView>

      <View style={styles.logout}>
        <Button title="Se déconnecter" onPress={onSignOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  controls: {
    position: "absolute",
    top: 30,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 5,
    padding: 5,
  },
  overlay: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 20,
    borderRadius: 10,
  },
  text: { color: "white", marginBottom: 10, textAlign: "center" },
  logout: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
