// Register logic for authentication
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Alert } from "react-native";
import { auth, db } from "../../../firebase";

// Hàm chuyển đổi trạng thái hiển thị mật khẩu
export const togglePasswordVisibility = (setIsPasswordVisible) => {
  setIsPasswordVisible((prev) => !prev);
};

// Hàm xử lý đăng ký tài khoản mới
export const handleRegister = async ({ name, email, password, setIsLoading, setErrorMessage, navigation }) => {
  // Kiểm tra các trường bắt buộc
  if (!name.trim() || !email.trim() || !password) {
    Alert.alert("Thông báo", "Vui lòng nhập đầy đủ tên, email và mật khẩu.");
    return;
  }
  setIsLoading(true);
  setErrorMessage("");
  try {
    // Đăng ký tài khoản mới với Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Lưu thông tin người dùng vào Firestore
    await setDoc(doc(db, "users", user.uid), {
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
    navigation.navigate("Login"); // Chuyển hướng về trang đăng nhập
  } catch (error) {
    setErrorMessage(error.message);
    setIsLoading(false);
    Alert.alert("Lỗi đăng ký", error.message);
  }
};
