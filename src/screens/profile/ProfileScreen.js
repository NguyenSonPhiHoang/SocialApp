import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Modal, TextInput, ActivityIndicator, ScrollView, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getFirestore, doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { fetchUserProfileData, handleSave } from '../../logic/profile/profile';
import { useTheme } from '../../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';

const ProfileScreen = ({ route }) => {
  const theme = useTheme();
  const [user, setUser] = useState({
    name: '',
    username: '',
    bio: '',
    avatar: '',
    posts: 0,
    email: '',
    likes: 0,
  });  const [posts, setPosts] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successModal, setSuccessModal] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  // Lấy thông tin user và bài viết từ Firestore
  const loadUserData = async () => {
    setLoading(true);
    try {
      const { user: userData, posts: userPosts } = await fetchUserProfileData();
      setUser(userData);
      setPosts(userPosts);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
    }
    setLoading(false);
  };
  useEffect(() => {
    loadUserData();
  }, []);

  // Load lại dữ liệu khi có refresh parameter từ navigation
  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.refresh) {
        loadUserData();
      }
    }, [route?.params?.refresh])
  );// Hàm lưu thông tin lên Firestore (sử dụng logic chung)
  const handleSaveProfile = async () => {
    await handleSave({
      name: editName,
      bio: editBio,
      setSaving,
      setUser: (newUser) => setUser(prev => ({ ...prev, ...newUser })),
      setEditModalVisible: () => {
        setEditModalVisible(false);
        setSuccessModal(true);
      },
    });
  };// Khi mở modal chỉnh sửa, điền thông tin hiện tại
  const openEditModal = () => {
    setEditName(user.name);
    setEditBio(user.bio);
    setEditModalVisible(true);
  };

  // Hàm xử lý khi nhấn vào avatar
  const handleAvatarPress = () => {
    setAvatarModalVisible(true);
  };

  // Hàm chụp ảnh
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Lỗi', 'Cần quyền truy cập camera để chụp ảnh');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        await updateAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    } finally {
      setAvatarModalVisible(false);
    }
  };

  // Hàm chọn ảnh từ thư viện
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để chọn ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        await updateAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    } finally {
      setAvatarModalVisible(false);
    }
  };  // Hàm cập nhật avatar
  const updateAvatar = async (imageUri) => {
    try {
      setSaving(true);
      await handleSave({
        avatar: imageUri,
        setSaving,
        setUser: (newUser) => setUser(prev => ({ ...prev, ...newUser })),
        setEditModalVisible: () => {
          setSuccessModal(true);
        },
      });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật avatar');
      setSaving(false);
    }
  };
  // Thay đổi avatar (chỉ nhập URL, có thể tích hợp chọn ảnh sau)
  // Nếu muốn chọn ảnh từ thiết bị, cần thêm logic upload ảnh lên storage và lấy URL
    if (loading) {
    return (
      <View style={[{flex:1, justifyContent:'center', alignItems:'center'}, {backgroundColor: theme.colors.background}]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  // Khi modal thành công đóng, đóng modal và load lại trang ProfileScreen
  const handleSuccessClose = () => {
    setSuccessModal(false);
    loadUserData(); // Load lại toàn bộ dữ liệu ProfileScreen
  };
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarTouchable}>
          <Image source={{ uri: user.avatar }} style={[styles.avatar, {borderColor: theme.colors.primary}]} />
          <View style={[styles.cameraIcon, {backgroundColor: theme.colors.primary}]}>
            <MaterialIcons name="camera-alt" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
      {/* Name, Email, Description */}
      <Text style={[styles.name, {color: theme.colors.text}]}>{user.name}</Text>
      <Text style={[styles.email, {color: theme.colors.textSecondary}]}>{user.email}</Text>
      <Text style={[styles.bio, {color: theme.colors.text}]}>{user.bio}</Text>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, {color: theme.colors.text}]}>{user.posts}</Text>
          <Text style={[styles.statLabel, {color: theme.colors.textSecondary}]}>Bài đăng</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, {color: theme.colors.text}]}>{user.likes}</Text>
          <Text style={[styles.statLabel, {color: theme.colors.textSecondary}]}>Lượt thích</Text>
        </View>
      </View>
      {/* Edit Button */}      <TouchableOpacity
        onPress={openEditModal}
        style={[styles.editBtn, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}
      >
        <MaterialIcons name="edit" size={20} color={theme.colors.primary} style={{marginRight: 6}} />
        <Text style={[styles.editBtnText, {color: theme.colors.text}]}>Chỉnh sửa thông tin</Text>
      </TouchableOpacity>{/* User's Posts Grid */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <View style={[styles.postCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
            {item.images && item.images[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.postImage} />
            ) : (
              <View style={[styles.postPlaceholder, {backgroundColor: theme.colors.border}]}>
                <Text style={[styles.postTitle, {color: theme.colors.text}]}>{item.title?.slice(0, 2) || 'No'}</Text>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 30 }}
        style={{ flexGrow: 0, alignSelf: 'stretch', marginTop: 12 }}
      />      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            <Text style={[styles.modalTitle, {color: theme.colors.text}]}>Chỉnh sửa thông tin</Text>            <TextInput
              style={[styles.input, {backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border, color: theme.colors.text}]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Tên"
              placeholderTextColor={theme.colors.placeholder}
            />
            <TextInput
              style={[styles.input, {backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border, color: theme.colors.text}]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Sở thích/Mô tả"
              placeholderTextColor={theme.colors.placeholder}
              multiline
            /><View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.saveBtn, {backgroundColor: theme.colors.buttonBackground}, saving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Lưu</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelBtn, {backgroundColor: theme.colors.border}]}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={[styles.cancelBtnText, {color: theme.colors.text}]}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>      {/* Modal thông báo thành công */}
      <Modal
        visible={successModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', backgroundColor: theme.colors.surface }]}>
            <MaterialIcons name="check-circle" size={60} color="#4BB543" style={{marginBottom: 12}} />
            <Text style={[{fontSize: 18, fontWeight: 'bold', marginBottom: 8}, {color: theme.colors.text}]}>Cập nhật thành công!</Text>            <TouchableOpacity
              style={[styles.saveBtn, {backgroundColor: theme.colors.buttonBackground}, { marginTop: 10, width: 120 }]}
              onPress={handleSuccessClose}
            >
              <Text style={styles.saveBtnText}>OK</Text>
            </TouchableOpacity>          </View>
        </View>
      </Modal>

      {/* Avatar Selection Modal */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.avatarModalContent, {backgroundColor: theme.colors.surface}]}>
            <Text style={[styles.avatarModalTitle, {color: theme.colors.text}]}>Thay đổi ảnh đại diện</Text>
            
            <TouchableOpacity
              style={[styles.avatarOption, {borderBottomColor: theme.colors.border}]}
              onPress={takePhoto}
            >
              <MaterialIcons name="camera-alt" size={24} color={theme.colors.primary} />
              <Text style={[styles.avatarOptionText, {color: theme.colors.text}]}>Chụp ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarOption}
              onPress={pickImage}
            >
              <MaterialIcons name="photo-library" size={24} color={theme.colors.primary} />
              <Text style={[styles.avatarOptionText, {color: theme.colors.text}]}>Chọn từ thư viện</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelAvatarBtn, {backgroundColor: theme.colors.border}, {backgroundColor: theme.colors.buttonBackground}]}
              onPress={() => setAvatarModalVisible(false)}
            >
              <Text style={[styles.cancelAvatarBtnText, {color: theme.colors.text}, ]}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },  avatarContainer: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 10,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    backgroundColor: '#fff',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 15,
    marginTop: 2,
    textAlign: 'center',
  },
  bio: {
    fontSize: 15,
    marginTop: 4,
    marginBottom: 10,
    textAlign: 'center',
    maxWidth: '90%',
    alignSelf: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '92%',
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'center',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  statNumber: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 13,
    marginTop: 1,
  },
  editBtn: {
    flexDirection: 'row',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    alignSelf: 'center',
    width: '60%',
  },
  editBtnText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },  modalContent: {
    width: '92%',
    borderRadius: 16,
    padding: 22,
    alignItems: 'stretch',
    shadowColor: '#22223b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },  saveBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },  cancelBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '700',
    fontSize: 15,
  },
  postCard: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },  postPlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },  postTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  avatarModalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'stretch',
    shadowColor: '#22223b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  avatarOptionText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  cancelAvatarBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelAvatarBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;