import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

// Skeleton Loading Component with Shimmer Effect
const SkeletonPost = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const shimmerColor = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E0E0E0', '#D0D0D0'],
  });

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Animated.View style={[styles.postAvatar, { backgroundColor: shimmerColor }]} />
        <View>
          <Animated.View style={[styles.skeletonTextLine, { backgroundColor: shimmerColor }]} />
          <Animated.View style={[styles.skeletonTextLine, { width: '60%', backgroundColor: shimmerColor }]} />
        </View>
      </View>
      <Animated.View style={[styles.skeletonTextLine, { width: '90%', marginVertical: 10, backgroundColor: shimmerColor }]} />
      <Animated.View style={[styles.skeletonImage, { backgroundColor: shimmerColor }]} />
      <View style={styles.actionButtons}>
        <Animated.View style={[styles.actionButton, { backgroundColor: shimmerColor }]} />
        <Animated.View style={[styles.actionButton, { backgroundColor: shimmerColor }]} />
        <Animated.View style={[styles.actionButton, { backgroundColor: shimmerColor }]} />
      </View>
    </View>
  );
};

// Story Viewer Component
const StoryViewer = ({ story, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.storyViewer}>
          <Image source={{ uri: story.avatar }} style={styles.fullStoryImage} />
          <Text style={styles.storyUsername}>{story.username}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

// Stories Bar Component
const StoriesBar = ({ onStoryPress }) => {
  const stories = Array.from({ length: 10 }, (_, index) => ({
    id: `story-${index}`,
    username: `User ${index}`,
    avatar: `https://randomuser.me/api/portraits/thumb/men/${index}.jpg`,
    isNew: index % 2 === 0,
  }));

  return (
    <View style={styles.storiesContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false} // Ẩn thanh cuộn ngang
        scrollEventThrottle={16} // Tối ưu hóa sự kiện cuộn
        contentContainerStyle={styles.storiesScrollContent} // Kiểm soát nội dung bên trong
        style={styles.scrollViewStyle} // Áp dụng style để ẩn thanh cuộn
        bounces={false} // Tắt hiệu ứng kéo quá mức (bouncing) để tránh hiện thanh cuộn
      >
        {stories.map((story) => (
          <TouchableOpacity
            key={story.id}
            style={styles.storyItem}
            onPress={() => onStoryPress(story)}
          >
            <View style={[styles.storyAvatarContainer, story.isNew && styles.storyAvatarNew]}>
              <Image source={{ uri: story.avatar }} style={styles.storyAvatar} />
              {story.isNew && (
                <View style={styles.storyGradientBorder}>
                  <View style={styles.storyGradientInner} />
                </View>
              )}
              {story.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>New</Text>
                </View>
              )}
            </View>
            <Text style={styles.storyUsername} numberOfLines={1}>
              {story.username}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Create Post Component
const CreatePost = ({ onCreatePost }) => {
  const [postText, setPostText] = useState('');
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (postText.trim() || image) {
      onCreatePost(postText, image);
      setPostText('');
      setImage(null);
    }
  };

  return (
    <View style={styles.createPostContainer}>
      <Image
        source={{ uri: 'https://randomuser.me/api/portraits/thumb/men/1.jpg' }}
        style={styles.createPostAvatar}
      />
      <View style={styles.createPostInputWrapper}>
        <TextInput
          style={styles.createPostInput}
          placeholder="What's on your mind?"
          placeholderTextColor="#888"
          value={postText}
          onChangeText={setPostText}
        />
      </View>
      <TouchableOpacity style={styles.createPostButton} onPress={pickImage}>
        <Ionicons name="image-outline" size={20} color="#1877F2" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.createPostButton} onPress={handleSubmit}>
        <Ionicons name="send" size={20} color="#1877F2" />
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={styles.selectedImage} />}
    </View>
  );
};

// Comment Item Component
const CommentItem = ({ comment, fadeAnim }) => (
  <Animated.View style={[styles.commentContainer, { opacity: fadeAnim }]}>
    <Image
      source={{ uri: 'https://randomuser.me/api/portraits/thumb/men/1.jpg' }}
      style={styles.commentAvatar}
    />
    <View style={styles.commentContent}>
      <Text style={styles.commentUsername}>{comment.username}: </Text>
      <Text style={styles.commentText}>{comment.text}</Text>
    </View>
  </Animated.View>
);

// Post Item Component
const PostItem = ({ post, onLike, onAddComment, onShare }) => {
  const [commentText, setCommentText] = useState('');
  const likeScaleAnim = useRef(new Animated.Value(1)).current;
  const shareScaleAnim = useRef(new Animated.Value(1)).current;
  const commentFadeAnims = useRef(post.comments.map(() => new Animated.Value(0))).current;

  const handleLikePress = () => {
    Animated.sequence([
      Animated.timing(likeScaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likeScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onLike(post.id);
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      const newFadeAnim = new Animated.Value(0);
      commentFadeAnims.push(newFadeAnim);
      onAddComment(post.id, commentText, newFadeAnim);
      setCommentText('');
      Animated.timing(newFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleShare = () => {
    Animated.sequence([
      Animated.timing(shareScaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shareScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onShare(post.id);
  };

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
        <View>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.timestamp}>{moment(post.createdAt).fromNow()}</Text>
        </View>
      </View>
      <Text style={styles.content}>{post.content}</Text>
      {post.image && (
        <View style={styles.postImageContainer}>
          <Image source={{ uri: post.image }} style={styles.postImage} />
        </View>
      )}
      <View style={styles.postFooter}>
        <Text style={styles.likes}>{post.likes} {post.likes === 1 ? 'Like' : 'Likes'}</Text>
        {post.comments.length > 0 && (
          <View style={styles.commentsSection}>
            <Text style={styles.commentCount}>
              {post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}
            </Text>
            {post.comments.slice(0, 3).map((comment, index) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                fadeAnim={commentFadeAnims[index] || new Animated.Value(1)}
              />
            ))}
            {post.comments.length > 3 && (
              <TouchableOpacity>
                <Text style={styles.viewMoreComments}>View more comments</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={handleLikePress}>
            <Animated.View style={[styles.actionButton, styles.actionButtonLike, { transform: [{ scale: likeScaleAnim }] }]}>
              <Ionicons
                name={post.liked ? 'thumbs-up' : 'thumbs-up-outline'}
                size={20}
                color={post.liked ? '#1877F2' : '#555'}
              />
              <Text style={[styles.actionText, post.liked && { color: '#1877F2' }]}>Like</Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonComment]}>
            <Ionicons name="chatbubble-outline" size={20} color="#555" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Animated.View style={[styles.actionButton, styles.actionButtonShare, { transform: [{ scale: shareScaleAnim }] }]}>
              <Ionicons name="share-outline" size={20} color={post.shares > 0 ? '#D81B60' : '#555'} />
              <Text style={[styles.actionText, post.shares > 0 && { color: '#D81B60' }]}>Share</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#888"
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity onPress={handleAddComment}>
            <Ionicons name="send" size={20} color="#1877F2" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const HomeScreen = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  // Giả lập API
  const fetchPosts = async (pageNumber) => {
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

  useEffect(() => {
    if (hasMore) {
      fetchPosts(page);
    }
  }, [page]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      let timeout;
      clearTimeout(timeout);
      timeout = setTimeout(() => setPage((prevPage) => prevPage + 1), 300);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1).then(() => setRefreshing(false));
  };

  const handleLike = (postId) => {
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

  const handleAddComment = (postId, text, fadeAnim) => {
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

  const handleShare = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, shares: post.shares + 1 }
          : post
      )
    );
  };

  const handleCreatePost = (content, image) => {
    const newPost = {
      id: `post-${Date.now()}`,
      username: 'Current User',
      avatar: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
      content,
      image,
      createdAt: new Date(),
      likes: 0,
      liked: false,
      comments: [],
      likedUsers: [],
      shares: 0,
    };
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  const handleStoryPress = (story) => {
    setSelectedStory(story);
  };

  const closeStoryViewer = () => {
    setSelectedStory(null);
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No posts available</Text>
    </View>
  );

  const renderItem = useCallback(
    ({ item }) => (
      <PostItem
        post={item}
        onLike={handleLike}
        onAddComment={handleAddComment}
        onShare={handleShare}
      />
    ),
    [handleLike, handleAddComment, handleShare]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DeBug Social</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="search" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="chatbubbles-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* FlatList */}
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1877F2" />
        }
        ListHeaderComponent={
          <>
            <StoriesBar onStoryPress={handleStoryPress} />
            <CreatePost onCreatePost={handleCreatePost} />
            {isLoading && posts.length === 0 && (
              <View>
                <SkeletonPost />
                <SkeletonPost />
              </View>
            )}
          </>
        }
        contentContainerStyle={styles.listContent}
        initialNumToRender={5}
        windowSize={10}
      />
      {selectedStory && <StoryViewer story={selectedStory} onClose={closeStoryViewer} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 8,
    paddingTop: 30,
    backgroundColor: '#1877F2',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 175,
    marginRight: 10,
  },
  headerIcon: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
  },
  storiesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
    
  },
  scrollViewStyle: {
    overflow: 'hidden', 
    
  },
  storiesScrollContent: {
    paddingHorizontal: 8, 
    
    flexDirection: 'row', 
    
    alignItems: 'center', 
    
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 85,
    flexShrink: 1, 
    
  },
  storyAvatarContainer: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  storyAvatarNew: {
    backgroundColor: '#FFF',
  },
  storyAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  storyGradientBorder: {
    position: 'absolute',
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#F58529',
    padding: 2,
  },
  storyGradientInner: {
    flex: 1,
    borderRadius: 35,
    backgroundColor: '#FFF',
  },
  newBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF2D55',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  storyUsername: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
  createPostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  createPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  createPostInputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  createPostInput: {
    fontSize: 16,
    color: '#333',
  },
  createPostButton: {
    padding: 10,
  },
  selectedImage: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 10,
  },
  postContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginVertical: 8,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  content: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  postImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 280,
  },
  postFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 10,
  },
  likes: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
    fontWeight: '500',
  },
  commentCount: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  commentsSection: {
    marginBottom: 10,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 8,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  commentContent: {
    flexDirection: 'row',
    flex: 1,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  commentText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  viewMoreComments: {
    fontSize: 13,
    color: '#1877F2',
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  actionButtonLike: {
    backgroundColor: '#E3F2FD',
  },
  actionButtonComment: {
    backgroundColor: '#E8F5E9',
  },
  actionButtonShare: {
    backgroundColor: '#F3E5F5',
  },
  actionText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 5,
    fontWeight: '500',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 10,
    backgroundColor: '#F8F9FA',
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    padding: 8,
    color: '#333',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  listContent: {
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  storyViewer: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  fullStoryImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#1877F2',
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  skeletonTextLine: {
    height: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  skeletonImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
});

export default HomeScreen;