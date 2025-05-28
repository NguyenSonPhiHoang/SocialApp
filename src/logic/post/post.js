// Post creation logic
import { Alert, Platform, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export const pickImages = async (setImages) => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Cảnh báo', 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh. Vui lòng cấp quyền trong cài đặt thiết bị.');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 1,
  });
  if (!result.canceled && result.assets) {
    const selectedUris = result.assets.map(asset => asset.uri);
    setImages(prev => [...prev, ...selectedUris]);
  }
};

export const takePhoto = async (setImages) => {
  if (Platform.OS !== 'android') {
    Alert.alert('Lỗi', 'Tính năng này hiện chỉ hỗ trợ trên Android với custom client.');
    return;
  }
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Cảnh báo',
      'Ứng dụng cần quyền truy cập máy ảnh. Vui lòng cấp quyền trong Cài đặt > Ứng dụng > Quyền.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Mở Cài đặt', onPress: () => ImagePicker.requestCameraPermissionsAsync() }
      ]
    );
    return;
  }
  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets) {
      const photoUri = result.assets[0].uri;
      setImages(prev => [...prev, photoUri]);
      Alert.alert('Thành công', 'Ảnh đã được chụp và thêm vào danh sách.');
    }
  } catch (error) {
    Alert.alert('Lỗi', `Không thể chụp ảnh: ${error.message}`);
  }
};

export const handlePost = async ({ content, images, selectedPrivacy, setIsLoading, setShowSuccessModal }) => {
  if (!content && images.length === 0) {
    Alert.alert('Cảnh báo', 'Vui lòng nhập nội dung hoặc chọn ảnh');
    return;
  }
  setIsLoading(true);
  await new Promise(resolve => setTimeout(resolve, 2000));
  setIsLoading(false);
  setShowSuccessModal(true);
};

export const handleSuccessConfirm = ({ setShowSuccessModal, setContent, setImages, navigation }) => {
  setShowSuccessModal(false);
  setContent('');
  setImages([]);
  navigation.navigate('Home', { newPost: true });
};

export const animateButton = (scale) => {
  Animated.sequence([
    Animated.timing(scale, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }),
  ]).start();
};

export const removeImage = (uriToRemove, setImages) => {
  setImages(prev => prev.filter(uri => uri !== uriToRemove));
};
