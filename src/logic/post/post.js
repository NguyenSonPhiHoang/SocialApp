// Post creation logic
import { Alert, Platform, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

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
  try {
    // Get current user
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      Alert.alert('Lỗi', 'Bạn cần đăng nhập để đăng bài.');
      return;
    }
    // Upload images to Firebase Storage and get URLs
    let imageUrls = [];
    if (images.length > 0) {
      const storage = getStorage();
      for (const imgUri of images) {
        const response = await fetch(imgUri);
        const blob = await response.blob();
        const filename = `${user.uid}_${Date.now()}_${Math.floor(Math.random()*10000)}.jpg`;
        const storageRef = ref(storage, `feeds/${user.uid}/${filename}`);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }
    }    // Save post to Firestore
    await addDoc(collection(db, 'feeds'), {
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || '',
      content,
      images: imageUrls,
      privacy: selectedPrivacy.id,
      createdAt: serverTimestamp(),
      likes: 0,
      likedBy: [],
      comments: [],
      shares: 0,
    });
    setIsLoading(false);
    setShowSuccessModal(true);
  } catch (error) {
    setIsLoading(false);
    Alert.alert('Lỗi', error.message || 'Đăng bài thất bại');
  }
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
