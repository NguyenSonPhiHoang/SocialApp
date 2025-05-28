import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';

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
          };
        }
      }
      posts.push({
        id: docSnap.id,
        ...data,
        image: data.images && data.images.length > 0 ? data.images[0] : null,
        avatar: userInfo.avatar || '',
        username: userInfo.name || data.userName || data.userEmail || 'Unknown',
        userEmail: userInfo.email || data.userEmail || '',
        comments: data.comments || [],
        likes: data.likes || 0,
        liked: data.liked || false,
        shares: data.shares || 0,
        createdAt: data.createdAt ? data.createdAt.toDate && data.createdAt.toDate() : new Date(),
      });
    }
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

export const handleLike = ({ postId, setPosts }) => {
  setPosts((prevPosts) =>
    prevPosts.map((post) =>
      post.id === postId
        ? {
            ...post,
            liked: !post.liked,
            likes: post.liked ? post.likes - 1 : post.likes + 1,
            likedUsers: post.liked
              ? post.likedUsers.filter((user) => user !== 'Current User')
              : [...post.likedUsers, 'Current User'],
          }
        : post
    )
  );
};

export const handleAddComment = ({ postId, text, fadeAnim, setPosts }) => {
  setPosts((prevPosts) =>
    prevPosts.map((post) =>
      post.id === postId
        ? {
            ...post,
            comments: [
              ...post.comments,
              {
                id: `${postId}-${post.comments.length}`,
                username: 'Current User',
                text,
                createdAt: new Date(),
              },
            ],
          }
        : post
    )
  );
};

export const handleShare = ({ postId, setPosts }) => {
  setPosts((prevPosts) =>
    prevPosts.map((post) =>
      post.id === postId
        ? { ...post, shares: post.shares + 1 }
        : post
    )
  );
};

