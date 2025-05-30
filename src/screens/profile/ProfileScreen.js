import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { 
  useProfileLogic 
} from '../../logic/profile/profile';

// Màn hình hồ sơ cá nhân chỉ xử lý giao diện, toàn bộ logic được tách sang logic/profile/profile.js
const ProfileScreen = ({ route }) => {
  const theme = useTheme();
  const navigation = useNavigation();
  // Sử dụng custom hook để lấy toàn bộ logic và state liên quan đến profile
  const {
    user, posts, loading, saving,
    editModalVisible, setEditModalVisible,
    editName, setEditName,
    editBio, setEditBio,
    successModal, setSuccessModal,
    avatarModalVisible, setAvatarModalVisible,
    handleLogout, openEditModal, handleAvatarPress,
    handleSaveProfile, handleSuccessClose,
    takePhoto, pickImage, loadUserData
  } = useProfileLogic({ navigation, route });

  if (loading) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: theme.colors.background}]}> 
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}> 
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarTouchable}>
          <Image 
            source={typeof user.avatar === 'string' ? { uri: user.avatar } : user.avatar} 
            style={[styles.avatar, {borderColor: theme.colors.primary}]} 
          />
          <View style={[styles.cameraIcon, {backgroundColor: theme.colors.primary}]}> 
            <MaterialIcons name="camera-alt" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Tên, Email, Mô tả */}
      <Text style={[styles.name, {color: theme.colors.text}]}>{user.name}</Text>
      <Text style={[styles.email, {color: theme.colors.textSecondary}]}>{user.email}</Text>
      <Text style={[styles.bio, {color: theme.colors.text}]}>{user.bio}</Text>

      {/* Thống kê */}
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

      {/* Nút Chỉnh sửa */}
      <TouchableOpacity
        onPress={openEditModal}
        style={[styles.editBtn, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}
      >
        <MaterialIcons name="edit" size={20} color={theme.colors.primary} style={{marginRight: 6}} />
        <Text style={[styles.editBtnText, {color: theme.colors.text}]}>Chỉnh sửa thông tin</Text>
      </TouchableOpacity>

      {/* Danh sách bài viết của người dùng */}
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
                <Text style={[styles.postTitle, {color: theme.colors.text}]}>
                  {item.title?.slice(0, 2) || 'No'}
                </Text>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 30 }}
        style={{ flexGrow: 0, alignSelf: 'stretch', marginTop: 12 }}
      />

      {/* Modal chỉnh sửa thông tin */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            <Text style={[styles.modalTitle, {color: theme.colors.text}]}>Chỉnh sửa thông tin</Text>
            
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.inputBackground, 
                borderColor: theme.colors.border, 
                color: theme.colors.text
              }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Tên"
              placeholderTextColor={theme.colors.placeholder}
            />
            
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.inputBackground, 
                borderColor: theme.colors.border, 
                color: theme.colors.text
              }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Sở thích/Mô tả"
              placeholderTextColor={theme.colors.placeholder}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.saveBtn, {backgroundColor: theme.colors.buttonBackground}, saving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Lưu</Text>
                )}
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
      </Modal>

      {/* Modal thông báo thành công */}
      <Modal
        visible={successModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', backgroundColor: theme.colors.surface }]}>
            <MaterialIcons name="check-circle" size={60} color="#4BB543" style={{marginBottom: 12}} />
            <Text style={[styles.successTitle, {color: theme.colors.text}]}>
              Cập nhật thành công!
            </Text>
            
            <TouchableOpacity
              style={[styles.saveBtn, {backgroundColor: theme.colors.buttonBackground}, { marginTop: 10, width: 120 }]}
              onPress={handleSuccessClose}
            >
              <Text style={styles.saveBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal chọn ảnh đại diện */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.avatarModalContent, {backgroundColor: theme.colors.surface}]}>
            <Text style={[styles.avatarModalTitle, {color: theme.colors.text}]}>
              Thay đổi ảnh đại diện
            </Text>
            
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
              style={[styles.cancelAvatarBtn, {backgroundColor: theme.colors.buttonBackground}]}
              onPress={() => setAvatarModalVisible(false)}
            >
              <Text style={[styles.cancelAvatarBtnText, {color: '#fff'}]}>Hủy</Text>
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
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  avatarContainer: {
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
  },
  modalContent: {
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
  successTitle: {
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 8
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
  },
  saveBtn: {
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
  },
  postPlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postTitle: {
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