import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
} from "react-native";

import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import useToastStore from "../stores/toastStore";
import useAuthActions from "../hooks/useAuthActions";

export default function LoginScreen({ navigation }: any) {
    const { login } = useAuthActions();
    const showToast = useToastStore((state) => state.showToast);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        // Validation
        if (!email.trim()) {
            showToast("Email tidak boleh kosong", "error");
            return;
        }
        if (!password.trim()) {
            showToast("Kata sandi tidak boleh kosong", "error");
            return;
        }

        setLoading(true);

        const result = await login({ email, password });

        setLoading(false);

        if (result.success) {
            showToast("Login Berhasil", "success");
            navigation.replace("Main");
        } else {
            showToast(result.message || "Email atau kata sandi salah", "error");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.iconCircle}>
                {/* <Icon name="shield-checkmark" size={40} color="#2563EB" /> */}
            </View>

            <Text style={styles.title}>Hallo!,</Text>
            <Text style={styles.subtitle}>
                selamat datang kembali...
            </Text>

            <InputField
                label="Email"
                icon="mail"
                placeholder="nama@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <InputField
                label="Kata Sandi"
                icon="lock-closed"
                placeholder="Masukkan kata sandi"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
                rightIcon={showPass ? "eye" : "eye-off"}
                onRightIconPress={() => setShowPass(!showPass)}
            />

            <PrimaryButton
                title="Masuk"
                loading={loading}
                onPress={handleLogin}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        padding: 20,
    },
    iconCircle: {
        alignSelf: "center",
        width: 90,
        height: 90,
        borderRadius: 45,
        // backgroundColor: "#FFF",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 80,
        marginBottom: 20,
        // elevation: 3,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        textAlign: "center",
        color: "#0F172A",
    },
    subtitle: {
        fontSize: 14,
        textAlign: "center",
        color: "#64748B",
        marginVertical: 12,
    },
});
