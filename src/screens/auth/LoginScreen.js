import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { auth } from "../../../firebase";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Logo from "../../assets/images/logo.png";
import { useTheme } from '../../context/ThemeContext';
import { handleLogin, togglePasswordVisibility } from '../../logic/auth/login';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={Logo}
        style={styles.logo}
      />
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Log in to your account</Text>

      <View style={styles.inputContainer}>
        {/* Email input */}        <View style={styles.inputWrapper}>
          <MaterialIcons name="mail" size={24} color={colors.textMuted} style={styles.icon} />          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.textInput}
          />
        </View>

        {/* Password input */}
        <View style={styles.inputWrapper}>
          <MaterialIcons name="lock" size={24} color={colors.textMuted} style={styles.icon} />          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            style={styles.textInput}
          />
          <TouchableOpacity onPress={() => togglePasswordVisibility(setIsPasswordVisible)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <MaterialIcons
              name={isPasswordVisible ? "visibility" : "visibility-off"}
              size={24}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Error message */}
        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}

        {/* Login button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && {opacity: 0.7}]}
          onPress={() => handleLogin({ email, password, setIsLoading, setErrorMessage, navigation })}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Log In</Text>
          )}
        </TouchableOpacity>

        {/* Register */}
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerText}>
            Don’t have an account?{" "}
            <Text style={styles.registerLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 200,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: "center",
    resizeMode: "contain",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    gap: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: colors.text,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  loginButtonText: {
    color: colors.buttonText,
    fontSize: 18,
    fontWeight: "700",
  },
  errorMessage: {
    color: colors.error,
    textAlign: "center",
    marginTop: -10,
    marginBottom: 10,
  },
  registerText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 20,
  },
  registerLink: {
    color: colors.primary,
    fontWeight: "700",
  },
});