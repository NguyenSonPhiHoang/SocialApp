// Home feed logic
export const fetchPosts = async ({ pageNumber, setIsLoading, setPosts, setHasMore }) => {
  try {
    setIsLoading(true);
    const mockPosts = Array.from({ length: 10 }, (_, index) => ({
      id: `${pageNumber}-${index}`,
      username: `User ${pageNumber}-${index}`,
      avatar: `https://randomuser.me/api/portraits/thumb/men/${pageNumber + index}.jpg`,
      content: `This is a sample post for item ${pageNumber}-${index}. Enjoy the social app!`,
      image: index % 2 === 0 ? `https://picsum.photos/400/300?random=${pageNumber + index}` : null,
      createdAt: new Date(Date.now() - (pageNumber * 10 + index) * 3600000),
      likes: Math.floor(Math.random() * 100),
      liked: false,
      comments: [],
      likedUsers: [`Friend ${index + 1}`, `Friend ${index + 2}`, `Friend ${index + 3}`],
      shares: 0,
    }));
    const sortedPosts = mockPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (mockPosts.length === 0) {
      setHasMore(false);
    } else {
      setPosts((prevPosts) => [...prevPosts, ...sortedPosts]);
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
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

