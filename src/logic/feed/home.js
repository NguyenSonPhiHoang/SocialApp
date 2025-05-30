import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, arrayUnion, increment, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Hàm lấy danh sách bài viết từ Firestore
export const fetchPosts = async ({ setIsLoading, setPosts }) => {
  setIsLoading(true);
  try {
    // Lấy danh sách bài viết, sắp xếp theo thời gian tạo mới nhất
    const q = query(collection(db, 'feeds'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const posts = [];
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      let userInfo = { name: '', avatar: '', email: '' };
      if (data.userId) {
        // Lấy thông tin người dùng cho từng bài viết
        const userDoc = await getDoc(doc(db, 'users', data.userId));
        if (userDoc.exists()) {
          const u = userDoc.data();
          userInfo = {
            name: u.name || '',
            avatar: u.avatar || require('../../assets/images/default-avatar.jpg'),
            email: u.email || '',
          };
        }
      }
      // Xử lý danh sách bình luận để bổ sung thông tin người dùng
      const processedComments = [];
      if (data.comments && data.comments.length > 0) {
        for (const comment of data.comments) {
          let commentUserInfo = { name: '', avatar: '' };
          if (comment.userId) {
            const commentUserDoc = await getDoc(doc(db, 'users', comment.userId));
            if (commentUserDoc.exists()) {
              const cu = commentUserDoc.data();
              commentUserInfo = {
                name: cu.name || '',
                avatar: cu.avatar || require('../../assets/images/default-avatar.jpg'),
              };
            }
          }
          processedComments.push({
            ...comment,
            username: commentUserInfo.name || comment.username || 'Người dùng',
            avatar: commentUserInfo.avatar || require('../../assets/images/default-avatar.jpg'),
            createdAt: comment.createdAt ? 
              (comment.createdAt.toDate ? comment.createdAt.toDate() : 
               comment.createdAt instanceof Date ? comment.createdAt : 
               new Date(comment.createdAt)) : 
              new Date(),
          });
        }
      }
      posts.push({
        id: docSnap.id,
        ...data,
        images: data.images || [],
        image: data.images && data.images.length > 0 ? data.images[0] : null, // Giữ lại cho tương thích cũ
        avatar: userInfo.avatar || require('../../assets/images/default-avatar.jpg'),
        username: userInfo.name || data.userName || data.userEmail || 'Không rõ',
        userEmail: userInfo.email || data.userEmail || '',
        comments: processedComments,
        likes: data.likes || 0,
        likedBy: data.likedBy || [],
        liked: data.likedBy && data.likedBy.includes(getAuth().currentUser?.uid) || false,
        shares: data.shares || 0,
        createdAt: data.createdAt ? data.createdAt.toDate && data.createdAt.toDate() : new Date(),
      });
    }
    setPosts(posts);
    return Promise.resolve();
  } catch (error) {
    setPosts([]);
    return Promise.reject(error);
  } finally {
    setIsLoading(false);
  }
};

// Hàm xử lý tải thêm bài viết khi cuộn trang
export const handleLoadMore = ({ isLoading, hasMore, setPage }) => {
  if (!isLoading && hasMore) {
    let timeout;
    clearTimeout(timeout);
    timeout = setTimeout(() => setPage((prevPage) => prevPage + 1), 300);
  }
};

// Hàm làm mới danh sách bài viết
export const onRefresh = ({ setRefreshing, setPosts, setPage, setHasMore, fetchPosts }) => {
  setRefreshing(true);
  setPosts([]);
  setPage(1);
  setHasMore(true);
  fetchPosts(1).then(() => setRefreshing(false));
};

// Hàm xử lý like hoặc bỏ like bài viết
export const handleLike = async ({ postId, setPosts }) => {
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) {
    return;
  }
  // Cập nhật trên UI
  setPosts((prevPosts) =>
    prevPosts.map((post) => {
      if (post.id === postId) {
        const isCurrentlyLiked = post.likedBy.includes(currentUserId);
        const newLikedBy = isCurrentlyLiked 
          ? post.likedBy.filter(uid => uid !== currentUserId)
          : [...post.likedBy, currentUserId];
        return {
          ...post,
          liked: !isCurrentlyLiked,
          likes: newLikedBy.length,
          likedBy: newLikedBy,
        };
      }
      return post;
    })
  );
  try {
    const postRef = doc(db, 'feeds', postId);
    // Lấy dữ liệu bài viết hiện tại để kiểm tra trạng thái like
    const postDoc = await getDoc(postRef);
    if (postDoc.exists()) {
      const postData = postDoc.data();
      const likedBy = postData.likedBy || [];
      const isLiked = likedBy.includes(currentUserId);
      if (isLiked) {
        // Bỏ like
        await updateDoc(postRef, {
          likedBy: arrayRemove(currentUserId),
          likes: increment(-1),
        });
      } else {
        // Thêm like
        await updateDoc(postRef, {
          likedBy: arrayUnion(currentUserId),
          likes: increment(1),
        });
      }
    }
  } catch (error) {
    // Nếu lỗi, hoàn tác cập nhật
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isCurrentlyLiked = post.likedBy.includes(currentUserId);
          const newLikedBy = isCurrentlyLiked 
            ? post.likedBy.filter(uid => uid !== currentUserId)
            : [...post.likedBy, currentUserId];
          return {
            ...post,
            liked: !isCurrentlyLiked,
            likes: newLikedBy.length,
            likedBy: newLikedBy,
          };
        }
        return post;
      })
    );
    console.error('Lỗi khi cập nhật like:', error);
  }
};

// Hàm thêm bình luận vào bài viết
export const handleAddComment = async ({ postId, text, fadeAnim, setPosts, userName }) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser || !text.trim()) {
    return;
  }
  // Lấy thông tin người dùng hiện tại từ Firestore
  let currentUserInfo = { name: '', avatar: '' };
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      currentUserInfo = {
        name: userData.name || '',
        avatar: userData.avatar || require('../../assets/images/default-avatar.jpg'),
      };
    }
  } catch (error) {
    console.error('Lỗi khi lấy thông tin user:', error);
  }
  const timestamp = Date.now();
  const newComment = {
    id: `${currentUser.uid}-${timestamp}`,
    userId: currentUser.uid,
    username: currentUserInfo.name || userName || currentUser.displayName || currentUser.email || 'Người dùng',
    avatar: currentUserInfo.avatar || require('../../assets/images/default-avatar.jpg'),
    text: text.trim(),
    createdAt: new Date(timestamp),
  };
  // Cập nhật trên UI
  setPosts((prevPosts) =>
    prevPosts.map((post) =>
      post.id === postId
        ? {
            ...post,
            comments: [...post.comments, newComment],
          }
        : post
    )
  );
  try {
    const postRef = doc(db, 'feeds', postId);
    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
    });
  } catch (error) {
    // Nếu lỗi, hoàn tác cập nhật
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.filter(comment => comment.id !== newComment.id),
            }
          : post
      )
    );
  }
};

