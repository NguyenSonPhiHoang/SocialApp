// Login logic for authentication
import { signInWithEmailAndPassword } from "firebase/auth";
import { Alert } from "react-native";
import { auth } from "../../../firebase";

export const handleLogin = async ({ email, password, setIsLoading, setErrorMessage, navigation }) => {
  const emailRegex = /^[\w.-]+@gmail\.com$/;
  if (!emailRegex.test(email)) {
    Alert.alert("Invalid email", "We only accept @gmail.com for now.");
    return;
  }
  setIsLoading(true);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setIsLoading(false);
    setErrorMessage("");
    navigation.replace("HomeTabs");
  } catch (error) {
    setErrorMessage(error.message);
    setIsLoading(false);
    Alert.alert("Login failed!", error.message);
  }
};

export const togglePasswordVisibility = (setIsPasswordVisible) => {
  setIsPasswordVisible((prev) => !prev);
};
