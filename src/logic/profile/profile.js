import { getFirestore, doc, updateDoc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';

// Hàm lấy thông tin cá nhân và thống kê của người dùng từ Firestore
export const fetchUserProfileData = async () => {
  const auth = getAuth();
  const db = getFirestore();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Chưa đăng nhập');

  // Lấy thông tin user
  const userRef = doc(db, 'users', currentUser.uid);
  const userSnap = await getDoc(userRef);
  // Khởi tạo dữ liệu mặc định nếu chưa có
  let userData = userSnap.exists() ? userSnap.data() : {
      name: '',
      username: '',
      bio: '',
      avatar: require('../../assets/images/default-avatar.jpg'), // Ảnh đại diện mặc định
      posts: 0,
      likes: 0,
      email: currentUser.email || '', // Lấy email từ auth nếu chưa có
  };

  // Lấy danh sách bài viết của user
  const postsQuery = query(collection(db, 'feeds'), where('userId', '==', currentUser.uid));
  const postsSnap = await getDocs(postsQuery);
  const userPosts = [];
  let totalLikes = 0;
  postsSnap.forEach(docSnap => {
    const post = docSnap.data();
    userPosts.push({ id: docSnap.id, ...post });
    totalLikes += post.likes || 0;
  });

  // Cập nhật số lượng bài viết và tổng số lượt thích
  userData.posts = userPosts.length;
  userData.likes = totalLikes;

  return {
    user: {
      name: userData.name || '',
      username: userData.username || '',
      bio: userData.bio || '',
      avatar: userData.avatar || require('../../assets/images/default-avatar.jpg'), // Đảm bảo luôn có avatar
      posts: userPosts.length, // Đảm bảo số lượng bài viết chính xác
      email: userData.email || currentUser.email || '',
      likes: totalLikes, // Đảm bảo tổng số lượt thích chính xác
    },
    posts: userPosts,
  };
};

// Hàm cập nhật thông tin cá nhân người dùng lên Firestore
export const handleSave = async ({ name, email, bio, avatar, setSaving, setUser, setEditModalVisible }) => {
  setSaving(true);
  try {
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Chưa đăng nhập');
    }

    const userRef = doc(db, 'users', currentUser.uid);

    const updateData = {};
    if (typeof name === 'string' && name.trim() !== '') updateData.name = name.trim();
    if (typeof email === 'string' && email.trim() !== '') updateData.email = email.trim();
    if (typeof bio === 'string') updateData.bio = bio.trim(); // bio có thể là chuỗi rỗng
    if (typeof avatar === 'string' && avatar.trim() !== '') updateData.avatar = avatar.trim();

    if (Object.keys(updateData).length === 0) {
      throw new Error('Không có dữ liệu để cập nhật');
    }

    // Sử dụng setDoc với { merge: true } để tạo mới nếu chưa có hoặc cập nhật nếu đã tồn tại
    await setDoc(userRef, updateData, { merge: true });

    // Sau khi cập nhật, lấy lại dữ liệu mới nhất từ Firestore để đồng bộ UI
    const userSnap = await getDoc(userRef);
    const updatedUserData = userSnap.exists() ? userSnap.data() : {};

    // Cập nhật lại state với dữ liệu mới
    setUser((prev) => ({
      ...prev,
      name: updatedUserData.name || prev.name,
      email: updatedUserData.email || prev.email,
      bio: updatedUserData.bio || prev.bio,
      avatar: updatedUserData.avatar || prev.avatar,
      // Các trường khác như posts, likes, username giữ nguyên
    }));

    setEditModalVisible(); // Đóng modal chỉnh sửa và hiển thị modal thành công
  } catch (e) {
    console.error("Lỗi trong handleSave:", e);
    alert('Có lỗi xảy ra khi lưu thông tin!\n' + (e?.message || 'Lỗi không xác định'));
  } finally {
    setSaving(false);
  }
};

// Custom hook quản lý toàn bộ logic cho ProfileScreen
export function useProfileLogic({ navigation, route }) {
  const [user, setUser] = useState({
    name: '',
    username: '',
    bio: '',
    avatar: require('../../assets/images/default-avatar.jpg'),
    posts: 0,
    email: '',
    likes: 0,
  });
  const [posts, setPosts] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successModal, setSuccessModal] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  // Đăng xuất
  const handleLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(getAuth());
              navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Lấy dữ liệu user và bài viết
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

  // Load lại khi có refresh param
  useEffect(() => {
    if (route?.params?.refresh) {
      loadUserData();
    }
    // eslint-disable-next-line
  }, [route?.params?.refresh]);

  // Lưu thông tin
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
  };

  // Mở modal chỉnh sửa
  const openEditModal = () => {
    setEditName(user.name);
    setEditBio(user.bio);
    setEditModalVisible(true);
  };

  // Xử lý avatar
  const handleAvatarPress = () => setAvatarModalVisible(true);

  // Chụp ảnh
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

  // Chọn ảnh từ thư viện
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
  };

  // Cập nhật avatar
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

  // Đóng modal thành công và reload
  const handleSuccessClose = () => {
    setSuccessModal(false);
    loadUserData();
  };

  return {
    user, posts, loading, saving,
    editModalVisible, setEditModalVisible,
    editName, setEditName,
    editBio, setEditBio,
    successModal, setSuccessModal,
    avatarModalVisible, setAvatarModalVisible,
    handleLogout, openEditModal, handleAvatarPress,
    handleSaveProfile, handleSuccessClose,
    takePhoto, pickImage, loadUserData
  };
}