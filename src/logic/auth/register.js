// Register logic for authentication
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Alert } from "react-native";
import { auth, db } from "../../../firebase";

export const togglePasswordVisibility = (setIsPasswordVisible) => {
  setIsPasswordVisible((prev) => !prev);
};

export const handleRegister = async ({ name, email, password, setIsLoading, setErrorMessage, navigation }) => {
  if (!name.trim() || !email.trim() || !password) {
    Alert.alert("Thông báo", "Vui lòng nhập đầy đủ tên, email và mật khẩu.");
    return;
  }
  setIsLoading(true);
  setErrorMessage("");
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name,
      email,
      avatar: require('../../assets/images/default-avatar.jpg'),
      bio: '',
      username: '',
      createdAt: new Date(),
    });
    Alert.alert("Đăng ký thành công", "Bạn đã đăng ký tài khoản thành công!");
    setIsLoading(false);
    navigation.navigate("Login");
  } catch (error) {
    setErrorMessage(error.message);
    setIsLoading(false);
    Alert.alert("Lỗi đăng ký", error.message);
  }
};
