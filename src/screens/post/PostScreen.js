import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');
const PRIVACY_OPTIONS = [
  { id: 'public', label: 'Công khai', icon: 'public' },
  { id: 'friends', label: 'Bạn bè', icon: 'people' },
  { id: 'private', label: 'Riêng tư', icon: 'lock' },
];

export default function PostScreen() {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [selectedPrivacy, setSelectedPrivacy] = useState(PRIVACY_OPTIONS[0]);
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigation = useNavigation();
  const scalePost = useRef(new Animated.Value(1)).current;

  const pickImages = async () => {
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

  const takePhoto = async () => {
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

  const handlePost = async () => {
    if (!content && images.length === 0) {
      Alert.alert('Cảnh báo', 'Vui lòng nhập nội dung hoặc chọn ảnh');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newPost = {
      id: Date.now().toString(),
      username: 'Người dùng',
      avatar: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
      content,
      images,
      privacy: selectedPrivacy.id,
      createdAt: new Date().toISOString(),
    };

    setIsLoading(false);
    setShowSuccessModal(true);
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    setContent('');
    setImages([]);
    navigation.navigate('Home', { newPost: true });
  };

  const animateButton = (scale) => {
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

  const removeImage = (uriToRemove) => {
    setImages(prev => prev.filter(uri => uri !== uriToRemove));
  };

  const renderImageItem = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedImage(item)}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item }} style={styles.imageItem} resizeMode="cover" />
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={(e) => {
            e.stopPropagation();
            removeImage(item);
          }}
        >
          <Icon name="close" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Tạo bài viết</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Nội dung bài viết */}
          <TextInput
            style={styles.input}
            placeholder="Hôm nay bạn thấy thế nào?"
            placeholderTextColor="#9CA3AF"
            multiline
            value={content}
            onChangeText={setContent}
          />

          {/* Chọn chế độ riêng tư */}
          <View style={styles.privacyContainer}>
            <TouchableOpacity
              style={styles.privacySelect}
              onPress={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
            >
              <Icon name={selectedPrivacy.icon} size={20} color="#2563EB" />
              <Text style={styles.privacySelectText}>{selectedPrivacy.label}</Text>
              <Icon 
                name={showPrivacyDropdown ? 'arrow-drop-up' : 'arrow-drop-down'} 
                size={20} 
                color="#2563EB" 
              />
            </TouchableOpacity>

            {showPrivacyDropdown && (
              <View style={styles.dropdownMenu}>
                {PRIVACY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.dropdownOption,
                      selectedPrivacy.id === option.id && styles.selectedOption,
                    ]}
                    onPress={() => {
                      setSelectedPrivacy(option);
                      setShowPrivacyDropdown(false);
                    }}
                  >
                    <Icon name={option.icon} size={20} color="#2563EB" />
                    <Text style={styles.dropdownOptionText}>{option.label}</Text>
                    {selectedPrivacy.id === option.id && (
                      <Icon name="check" size={20} color="#2563EB" style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Danh sách ảnh đã chọn */}
          {images.length > 0 && (
            <FlatList
              data={images}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              style={styles.imageList}
              showsHorizontalScrollIndicator={false}
            />
          )}

          {/* Các nút chọn ảnh */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
              <Icon name="photo-library" size={20} color="#2563EB" />
              <Text style={styles.iconText}>Chọn ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addImageButton} onPress={takePhoto}>
              <Icon name="photo-camera" size={20} color="#2563EB" />
              <Text style={styles.iconText}>Chụp ảnh</Text>
            </TouchableOpacity>
          </View>

          {/* Nút đăng bài */}
          <TouchableOpacity
            onPress={() => {
              handlePost();
              animateButton(scalePost);
            }}
            disabled={(!content && images.length === 0) || isLoading}
          >
            <Animated.View
              style={[
                styles.postButton,
                (!content && images.length === 0) && styles.disabledButton,
                { transform: [{ scale: scalePost }] },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.postButtonText}>Đăng bài</Text>
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal xem ảnh lớn */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imageModalOverlay}>
          <Image 
            source={{ uri: selectedImage }} 
            style={styles.fullImage} 
            resizeMode="contain"
          />
          <View style={styles.imageModalButtons}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setSelectedImage(null)}
            >
              <Icon name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal thông báo thành công */}
      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <Icon name="check-circle" size={48} color="#4BB543" />
            </View>
            <Text style={styles.successTitle}>Đăng bài thành công!</Text>
            <Text style={styles.successText}>Bài viết của bạn đã được đăng lên</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleSuccessConfirm}
            >
              <Text style={styles.successButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F0F4F8',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  input: {
    minHeight: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlignVertical: 'top',
  },
  privacyContainer: {
    position: 'relative',
    marginBottom: 16,
    zIndex: 1,
  },
  privacySelect: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    minWidth: 150,
  },
  privacySelectText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
    minWidth: 150,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 150,
  },
  selectedOption: {
    backgroundColor: '#F5F8FF',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  imageList: {
    marginBottom: 16,
    maxHeight: 140,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  imageItem: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  addImageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  iconText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  postButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width - 40,
    height: width - 40,
  },
  imageModalButtons: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: 20,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  successModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});