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
import { useTheme } from '../../context/ThemeContext';
import {
  pickImages,
  takePhoto,
  handlePost,
  handleSuccessConfirm,
  animateButton,
  removeImage
} from '../../logic/post/post';

const { width } = Dimensions.get('window');

export default function PostScreen() {
  const [content, setContent] = useState('');  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigation = useNavigation();
  const scalePost = useRef(new Animated.Value(1)).current;
  const { colors } = useTheme();

  const styles = getStyles(colors);

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
          {/* Header */}          <View style={styles.header}>
            <Text style={styles.headerText}>Tạo bài viết</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Nội dung bài viết */}            <TextInput
            style={styles.input}
            placeholder="Hôm nay bạn thấy thế nào?"
            placeholderTextColor={colors.placeholder}
            multiline
            value={content}
            onChangeText={setContent}
          />
          {/* Danh sách ảnh đã chọn */}
          {images.length > 0 && (
            <FlatList
              data={images}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setSelectedImage(item)}>
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: item }} style={styles.imageItem} resizeMode="cover" />
                    <TouchableOpacity 
                      style={styles.removeButton} 
                      onPress={(e) => {
                        e.stopPropagation();
                        removeImage(item, setImages);
                      }}
                    >
                      <Icon name="close" size={18} color="#FFF" />
                    </TouchableOpacity>
                    {/* Nếu muốn hiển thị tên file ảnh hoặc số thứ tự, hãy bọc text trong <Text> tại đây */}
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              style={styles.imageList}
              showsHorizontalScrollIndicator={false}
            />
          )}

          {/* Các nút chọn ảnh */}          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.addImageButton} onPress={() => pickImages(setImages)}>
              <Icon name="photo-library" size={20} color={colors.primary} />
              <Text style={styles.iconText}>Chọn ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addImageButton} onPress={() => takePhoto(setImages)}>
              <Icon name="photo-camera" size={20} color={colors.primary} />
              <Text style={styles.iconText}>Chụp ảnh</Text>
            </TouchableOpacity>
          </View>

          {/* Nút đăng bài */}          <TouchableOpacity
            onPress={() => {
              handlePost({ content, images, setIsLoading, setShowSuccessModal });
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
              onPress={() => handleSuccessConfirm({ setShowSuccessModal, setContent, setImages, navigation })}
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

const getStyles = (colors) => StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.inputBackground,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  imageList: {
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  postButton: {
    backgroundColor: colors.buttonBackground,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.buttonText,
  },
  disabledButton: {
    backgroundColor: colors.textMuted,
    opacity: 0.6,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
    backgroundColor: colors.cardBackground,
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
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: colors.buttonBackground,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.buttonText,
  },
});