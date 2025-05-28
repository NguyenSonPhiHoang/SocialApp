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
} from 'react-native';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchPosts, handleLike, handleAddComment } from '../../logic/feed/home';

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


// Comment Item Component
const CommentItem = ({ comment, fadeAnim }) => (
  <Animated.View style={[styles.commentContainer, { opacity: fadeAnim }]}>
    <Image
      source={{ uri: comment.avatar || 'https://randomuser.me/api/portraits/thumb/men/1.jpg' }}
      style={styles.commentAvatar}
    />
    <View style={styles.commentContent}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Text style={styles.commentUsername}>
          <Text>{comment.username}</Text>
          <Text>: </Text>
        </Text>
        <Text style={styles.commentText}>{comment.text}</Text>
      </View>
      <Text style={styles.commentTime}>
        <Text>{comment.createdAt ? moment(comment.createdAt).fromNow() : 'now'}</Text>
      </Text>
    </View>
  </Animated.View>
);

// Post Item Component
const PostItem = ({ post, onLike, onAddComment }) => {
  const [commentText, setCommentText] = useState('');
  const likeScaleAnim = useRef(new Animated.Value(1)).current;
  const commentFadeAnims = useRef([]).current;

  // Sync commentFadeAnims with current comments
  useEffect(() => {
    // Ensure we have animation values for all comments
    while (commentFadeAnims.length < post.comments.length) {
      commentFadeAnims.push(new Animated.Value(1));
    }
    // Remove excess animation values if comments were removed
    if (commentFadeAnims.length > post.comments.length) {
      commentFadeAnims.splice(post.comments.length);
    }
  }, [post.comments.length]);

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

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
        <View>
          <Text style={styles.username}>
            <Text>{post.username}</Text>
          </Text>
          <Text style={styles.timestamp}>
            <Text>{moment(post.createdAt).fromNow()}</Text>
          </Text>
        </View>
      </View>
      <Text style={styles.content}>
        <Text>{post.content}</Text>
      </Text>
      {post.images && post.images.length > 0 && (
        <View style={styles.postImagesContainer}>
          {post.images.length === 1 && (
            <Image source={{ uri: post.images[0] }} style={styles.postImageSingle} />
          )}
          {post.images.length === 2 && (
            <View style={styles.postImagesTwoContainer}>
              <Image source={{ uri: post.images[0] }} style={styles.postImageTwo} />
              <Image source={{ uri: post.images[1] }} style={styles.postImageTwo} />
            </View>
          )}
          {post.images.length >= 3 && (
            <View style={styles.postImagesThreeContainer}>
              <Image source={{ uri: post.images[0] }} style={styles.postImageThreeMain} />
              <View style={styles.postImagesThreeRight}>
                <Image source={{ uri: post.images[1] }} style={styles.postImageThreeSmall} />
                <View style={styles.postImageThreeBottomContainer}>
                  <Image source={{ uri: post.images[2] }} style={styles.postImageThreeSmall} />
                  {post.images.length > 3 && (
                    <View style={styles.postImageMoreOverlay}>
                      <Text style={styles.postImageMoreText}>
                        <Text>+{post.images.length - 3}</Text>
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      )}
      <View style={styles.postFooter}>
        <Text style={styles.likes}>
          <Text>{post.likes}</Text>
          <Text>{' '}</Text>
          <Text>{post.likes === 1 ? 'Like' : 'Likes'}</Text>
        </Text>
        {post.comments.length > 0 && (
          <View style={styles.commentsSection}>
            <Text style={styles.commentCount}>
              <Text>{post.comments.length}</Text>
              <Text>{' '}</Text>
              <Text>{post.comments.length === 1 ? 'Comment' : 'Comments'}</Text>
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
                name={post.liked ? 'heart' : 'heart-outline'}
                size={20}
                color={post.liked ? '#FF3040' : '#555'}
              />
              <Text style={[styles.actionText, post.liked && { color: '#FF3040' }]}>
                <Text>Like</Text>
              </Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonComment]}>
            <Ionicons name="chatbubble-outline" size={20} color="#555" />
            <Text style={styles.actionText}>
              <Text>Comment</Text>
            </Text>
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

  useEffect(() => {
    fetchPosts({ setIsLoading, setPosts });
  }, []);
  const handleLoadMore = () => {};
  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts({ setIsLoading, setPosts }).then(() => setRefreshing(false));
  };
  
  const handleLikePress = (postId) => {
    handleLike({ postId, setPosts });
  };
  
  const handleAddCommentPress = (postId, text, fadeAnim) => {
    handleAddComment({ postId, text, fadeAnim, setPosts, userName: 'Current User' });
  };
    const renderFooter = () => null;
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No posts available</Text>
    </View>
  );  const renderItem = useCallback(
    ({ item }) => (
      <PostItem
        post={item}
        onLike={handleLikePress}
        onAddComment={handleAddCommentPress}
      />
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DeBug Social</Text>
        <View style={styles.headerIcons}>
          {/* Icons are wrapped in Text components for consistency */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingTop: 40,
    backgroundColor: '#1877F2',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  headerIcon: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
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
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 85,
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
  },  postImage: {
    width: '100%',
    height: 280,
  },
  // Multiple images layout styles
  postImagesContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  postImageSingle: {
    width: '100%',
    height: 280,
  },
  postImagesTwoContainer: {
    flexDirection: 'row',
    height: 200,
    gap: 2,
  },
  postImageTwo: {
    flex: 1,
    height: '100%',
  },
  postImagesThreeContainer: {
    flexDirection: 'row',
    height: 200,
    gap: 2,
  },
  postImageThreeMain: {
    flex: 2,
    height: '100%',
  },
  postImagesThreeRight: {
    flex: 1,
    height: '100%',
    gap: 2,
  },
  postImageThreeSmall: {
    width: '100%',
    flex: 1,
  },
  postImageThreeBottomContainer: {
    position: 'relative',
    flex: 1,
  },
  postImageMoreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImageMoreText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
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
  },  commentContent: {
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
  commentTime: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
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
  },  actionButtonLike: {
    backgroundColor: '#FFE8EA',
  },  actionButtonComment: {
    backgroundColor: '#E8F5E9',
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