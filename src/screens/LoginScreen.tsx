import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
} from "react-native";

import logo from "../assets/logo.jpg";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import useToastStore from "../stores/toastStore";
import useAuthActions from "../hooks/useAuthActions";

export default function LoginScreen({ navigation }: any) {
    const { login } = useAuthActions();
    const showToast = useToastStore((state) => state.showToast);

    const [email, setEmail] = useState("admin.disdikbud@kuningankab.go.id");
    const [password, setPassword] = useState("adminpass");
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
                <Image
                    source={logo}
                    style={styles.logo}
                />
            </View>

            <Text style={styles.title}>Pelayanan Publik</Text>
            <Text style={styles.subtitle}>Kuningan Melesat</Text>

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
        alignItems: "center",
        justifyContent: "center",
        marginTop: 60,
        marginBottom: 10,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        textAlign: "center",
        color: "#0F172A",
        marginTop: 20,
    },
    slogan: {
        fontSize: 16,
        fontWeight: "600",
        color: "#64748B",
        textAlign: "center",
        marginTop: 8,
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 14,
        textAlign: "center",
        color: "#64748B",
        marginBottom: 20,
    },
});
