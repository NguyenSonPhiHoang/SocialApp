import { signInWithEmailAndPassword } from "firebase/auth";
import { Alert } from "react-native";
import { auth } from "../../../firebase";

// Hàm xử lý đăng nhập người dùng
export const handleLogin = async ({ email, password, setIsLoading, setErrorMessage, navigation }) => {
  // Kiểm tra định dạng email, chỉ chấp nhận @gmail.com
  const emailRegex = /^[\w.-]+@gmail\.com$/;
  if (!emailRegex.test(email)) {
    Alert.alert("Email không hợp lệ", "Chúng tôi chỉ chấp nhận @gmail.com ở thời điểm hiện tại.");
    return;
  }
  setIsLoading(true);
  try {
    // Đăng nhập với email và mật khẩu qua Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setIsLoading(false);
    setErrorMessage("");
    navigation.replace("HomeTabs"); // Chuyển hướng sang trang chính
  } catch (error) {
    setErrorMessage(error.message);
    setIsLoading(false);
    Alert.alert("Đăng nhập thất bại!", error.message);
  }
};

// Hàm chuyển đổi trạng thái hiển thị mật khẩu
export const togglePasswordVisibility = (setIsPasswordVisible) => {
  setIsPasswordVisible((prev) => !prev);
};
