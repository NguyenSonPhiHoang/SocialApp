import { getFirestore, doc, updateDoc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore'; // Import setDoc
import { getAuth } from 'firebase/auth';

/**
 * Lấy thông tin người dùng và thống kê từ Firestore
 * @returns {Promise<{user: object, posts: array}>}
 */
export const fetchUserProfileData = async () => {
  const auth = getAuth();
  const db = getFirestore();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Chưa đăng nhập');

  // Lấy thông tin user
  const userRef = doc(db, 'users', currentUser.uid);
  const userSnap = await getDoc(userRef);

  // Initialize userData and ensure a default structure even if document doesn't exist yet
  let userData = userSnap.exists() ? userSnap.data() : {
      name: '',
      username: '',
      bio: '',
      avatar: 'https://i.pravatar.cc/150?img=3', // Default avatar
      posts: 0,
      likes: 0,
      email: currentUser.email || '', // Fallback to auth email
  };

  // Lấy bài viết của user
  const postsQuery = query(collection(db, 'feeds'), where('userId', '==', currentUser.uid));
  const postsSnap = await getDocs(postsQuery);
  const userPosts = [];
  let totalLikes = 0;
  postsSnap.forEach(docSnap => {
    const post = docSnap.data();
    userPosts.push({ id: docSnap.id, ...post });
    totalLikes += post.likes || 0;
  });

  // Update post count and total likes for the profile display
  userData.posts = userPosts.length;
  userData.likes = totalLikes;


  return {
    user: {
      name: userData.name || '',
      username: userData.username || '',
      bio: userData.bio || '',
      avatar: userData.avatar || 'https://i.pravatar.cc/150?img=3', // Fallback for safety
      posts: userPosts.length, // Ensure this is accurate based on fetched posts
      email: userData.email || currentUser.email || '',
      likes: totalLikes, // Ensure this is accurate based on fetched posts
    },
    posts: userPosts,
  };
};


/**
 * Cập nhật thông tin cá nhân người dùng lên Firestore
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.bio
 * @param {string} [params.avatar]
 * @param {function} params.setSaving
 * @param {function} params.setUser
 * @param {function} params.setEditModalVisible
 */
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
    if (typeof bio === 'string') updateData.bio = bio.trim(); // bio can be empty string
    if (typeof avatar === 'string' && avatar.trim() !== '') updateData.avatar = avatar.trim();

    if (Object.keys(updateData).length === 0) {
      throw new Error('Không có dữ liệu để cập nhật');
    }

    // Use setDoc with { merge: true } to create if not exists, or update if exists
    await setDoc(userRef, updateData, { merge: true });

    // After updating, fetch the latest data from Firestore to ensure UI is in sync
    // This is good because `setDoc` with `merge` doesn't return the full document.
    const userSnap = await getDoc(userRef);
    const updatedUserData = userSnap.exists() ? userSnap.data() : {};

    // Update the local state with the newly fetched data
    setUser((prev) => ({
      ...prev,
      // Merge only the fields that were updated, or all fields if we fetched the full doc
      name: updatedUserData.name || prev.name,
      email: updatedUserData.email || prev.email,
      bio: updatedUserData.bio || prev.bio,
      avatar: updatedUserData.avatar || prev.avatar,
      // Keep other fields like posts, likes, username as they are not updated by this function
    }));


    setEditModalVisible(); // This will close the edit modal and show the success modal
  } catch (e) {
    console.error("Error in handleSave:", e); // Log the full error for debugging
    alert('Có lỗi xảy ra khi lưu thông tin!\n' + (e?.message || 'Lỗi không xác định'));
  } finally {
    setSaving(false);
  }
};  