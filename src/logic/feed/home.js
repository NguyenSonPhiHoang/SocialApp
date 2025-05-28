import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, arrayUnion, increment, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const fetchPosts = async ({ setIsLoading, setPosts }) => {
  setIsLoading(true);
  try {
    const q = query(collection(db, 'feeds'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const posts = [];
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      let userInfo = { name: '', avatar: '', email: '' };
      if (data.userId) {
        const userDoc = await getDoc(doc(db, 'users', data.userId));
        if (userDoc.exists()) {
          const u = userDoc.data();
          userInfo = {
            name: u.name || '',
            avatar: u.avatar || '',
            email: u.email || '',
          };        }
      }      // Process comments to include user info
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
                avatar: cu.avatar || '',
              };
            }
          }          processedComments.push({
            ...comment,
            username: commentUserInfo.name || comment.username || 'Unknown User',
            avatar: commentUserInfo.avatar || comment.avatar,
            createdAt: comment.createdAt ? 
              (comment.createdAt.toDate ? comment.createdAt.toDate() : 
               comment.createdAt instanceof Date ? comment.createdAt : 
               new Date(comment.createdAt)) : 
              new Date(),
          });
        }
      }      posts.push({
        id: docSnap.id,
        ...data,
        images: data.images || [],
        image: data.images && data.images.length > 0 ? data.images[0] : null, // Keep for backward compatibility
        avatar: userInfo.avatar || '',
        username: userInfo.name || data.userName || data.userEmail || 'Unknown',
        userEmail: userInfo.email || data.userEmail || '',
        comments: processedComments,
        likes: data.likes || 0,
        likedBy: data.likedBy || [],
        liked: data.likedBy && data.likedBy.includes(getAuth().currentUser?.uid) || false,
        shares: data.shares || 0,
        createdAt: data.createdAt ? data.createdAt.toDate && data.createdAt.toDate() : new Date(),
      });    }
    setPosts(posts);
  } catch (error) {
    setPosts([]);
  } finally {
    setIsLoading(false);
  }
};

export const handleLoadMore = ({ isLoading, hasMore, setPage }) => {
  if (!isLoading && hasMore) {
    let timeout;
    clearTimeout(timeout);
    timeout = setTimeout(() => setPage((prevPage) => prevPage + 1), 300);
  }
};

export const onRefresh = ({ setRefreshing, setPosts, setPage, setHasMore, fetchPosts }) => {
  setRefreshing(true);
  setPosts([]);
  setPage(1);
  setHasMore(true);
  fetchPosts(1).then(() => setRefreshing(false));
};

export const handleLike = async ({ postId, setPosts }) => {
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;
  
  if (!currentUserId) {
    return;
  }

  // Optimistic update
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
    
    // Get current post data to check if user already liked
    const postDoc = await getDoc(postRef);
    if (postDoc.exists()) {
      const postData = postDoc.data();
      const likedBy = postData.likedBy || [];
      const isLiked = likedBy.includes(currentUserId);
      
      if (isLiked) {
        // Remove like
        await updateDoc(postRef, {
          likedBy: arrayRemove(currentUserId),
          likes: increment(-1),
        });
      } else {
        // Add like
        await updateDoc(postRef, {
          likedBy: arrayUnion(currentUserId),
          likes: increment(1),
        });
      }
    }
  } catch (error) {
    // Revert optimistic update on error
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
    console.error('Error updating like:', error);
  }
};

export const handleAddComment = async ({ postId, text, fadeAnim, setPosts, userName }) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser || !text.trim()) {
    return;
  }

  // Get current user info from Firestore
  let currentUserInfo = { name: '', avatar: '' };
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      currentUserInfo = {
        name: userData.name || '',
        avatar: userData.avatar || '',
      };    }
  } catch (error) {
    console.error('Error fetching user info:', error);
  }const timestamp = Date.now();
  
  const newComment = {
    id: `${currentUser.uid}-${timestamp}`,
    userId: currentUser.uid,
    username: currentUserInfo.name || userName || currentUser.displayName || currentUser.email || 'Unknown User',
    avatar: currentUserInfo.avatar || '',
    text: text.trim(),
    createdAt: new Date(timestamp),
  };

  // Optimistic update
  setPosts((prevPosts) =>
    prevPosts.map((post) =>
      post.id === postId
        ? {
            ...post,
            comments: [...post.comments, newComment],
          }
        : post
    )
  );  try {
    const postRef = doc(db, 'feeds', postId);
    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
    });  } catch (error) {
    // Revert optimistic update on error
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

