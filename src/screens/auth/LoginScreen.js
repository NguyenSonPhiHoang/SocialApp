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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = () => {
    const emailRegex = /^[\w.-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid email", "We only accept @gmail.com for now.");
      return;
    }

    setIsLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        Alert.alert("Login successful!", `Hello, ${user.email}`);
        setIsLoading(false);
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(error.message);
        setIsLoading(false);
        Alert.alert("Login failed!", error.message);
      });
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={{
          uri: "https://cdn-icons-png.flaticon.com/512/2919/2919600.png",
        }}
        style={styles.logo}
      />
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Log in to your account</Text>

      <View style={styles.inputContainer}>
        {/* Email input */}
        <View style={styles.inputWrapper}>
          <MaterialIcons name="mail" size={24} color="#777" style={styles.icon} />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.textInput}
          />
        </View>

        {/* Password input */}
        <View style={styles.inputWrapper}>
          <MaterialIcons name="lock" size={24} color="#777" style={styles.icon} />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            style={styles.textInput}
          />
          <TouchableOpacity onPress={togglePasswordVisibility} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <MaterialIcons
              name={isPasswordVisible ? "visibility" : "visibility-off"}
              size={24}
              color="#777"
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
          onPress={handleLogin}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f6fc",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 200,
    
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    gap: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  icon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#334155",
  },
  loginButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  errorMessage: {
    color: "red",
    textAlign: "center",
    marginTop: -10,
    marginBottom: 10,
  },
  registerText: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 20,
  },
  registerLink: {
    color: "#3b82f6",
    fontWeight: "700",
  },
});
