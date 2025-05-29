import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Modal, TextInput, ActivityIndicator, ScrollView, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getFirestore, doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { fetchUserProfileData, handleSave } from '../../logic/profile/profile';

const ProfileScreen = () => {
  const [user, setUser] = useState({
    name: '',
    username: '',
    bio: '',
    avatar: '',
    posts: 0,
    email: '',
    likes: 0,
  });
  const [posts, setPosts] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successModal, setSuccessModal] = useState(false);

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

  // Hàm lưu thông tin lên Firestore (sử dụng logic chung)
  const handleSaveProfile = async () => {
    await handleSave({
      name: editName,
      email: editEmail,
      bio: editBio,
      avatar: editAvatar,
      setSaving,
      setUser: (newUser) => setUser(prev => ({ ...prev, ...newUser })),
      setEditModalVisible: () => {
        setEditModalVisible(false);
        setSuccessModal(true);
        // Sau khi cập nhật, load lại dữ liệu từ Firestore để đảm bảo đồng bộ UI
        setTimeout(() => {
          loadUserData();
        }, 500);
      },
    });
  };

  // Khi mở modal chỉnh sửa, điền thông tin hiện tại
  const openEditModal = () => {
    setEditName(user.name);
    setEditBio(user.bio);
    setEditEmail(user.email);
    setEditAvatar(user.avatar);
    setEditModalVisible(true);
  };

  // Thay đổi avatar (chỉ nhập URL, có thể tích hợp chọn ảnh sau)
  // Nếu muốn chọn ảnh từ thiết bị, cần thêm logic upload ảnh lên storage và lấy URL

  if (loading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator size="large" color="#e1306c" />
      </View>
    );
  }

  // Khi modal thành công đóng, reload lại dữ liệu từ Firestore để đảm bảo thông tin mới nhất
  const handleSuccessClose = () => {
    setSuccessModal(false);
    loadUserData(); // Lấy lại thông tin mới nhất từ Firestore
  };

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
      </View>
      {/* Name, Email, Description */}
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <Text style={styles.bio}>{user.bio}</Text>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.posts}</Text>
          <Text style={styles.statLabel}>Bài đăng</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.likes}</Text>
          <Text style={styles.statLabel}>Lượt thích</Text>
        </View>
      </View>
      {/* Edit Button */}
      <TouchableOpacity
        onPress={openEditModal}
        style={styles.editBtn}
      >
        <MaterialIcons name="edit" size={20} color="#3b82f6" style={{marginRight: 6}} />
        <Text style={styles.editBtnText}>Chỉnh sửa thông tin</Text>
      </TouchableOpacity>
      {/* User's Posts Grid */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {item.images && item.images[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.postImage} />
            ) : (
              <View style={styles.postPlaceholder}>
                <Text style={styles.postTitle}>{item.title?.slice(0, 2) || 'No'}</Text>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 30 }}
        style={{ flexGrow: 0, alignSelf: 'stretch', marginTop: 12 }}
      />
      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Tên"
            />
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Email"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Sở thích/Mô tả"
              multiline
            />
            <TextInput
              style={styles.input}
              value={editAvatar}
              onChangeText={setEditAvatar}
              placeholder="Avatar URL"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Lưu</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal thông báo thành công */}
      <Modal
        visible={successModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center' }]}>
            <MaterialIcons name="check-circle" size={60} color="#4BB543" style={{marginBottom: 12}} />
            <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 8}}>Cập nhật thành công!</Text>
            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: 10, width: 120 }]}
              onPress={handleSuccessClose}
            >
              <Text style={styles.saveBtnText}>OK</Text>
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
    backgroundColor: '#fff',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 10,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#e1306c',
    backgroundColor: '#fff',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#22223b',
    marginTop: 8,
    textAlign: 'center',
  },
  email: {
    color: '#64748b',
    fontSize: 15,
    marginTop: 2,
    textAlign: 'center',
  },
  bio: {
    color: '#22223b',
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
    color: '#22223b',
    marginBottom: 1,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 1,
  },
  editBtn: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignSelf: 'center',
    width: '60%',
  },
  editBtnText: {
    color: '#22223b',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '92%',
    backgroundColor: '#fff',
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
    color: '#22223b',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#f2f6fc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#334155',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e7ef',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: '#e1306c',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: '#e0e7ef',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 15,
  },
  postCard: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  postPlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cbd5e1',
  },
  postTitle: {
    color: '#334155',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;