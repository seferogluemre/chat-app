import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ]).start(() => animate());
    };

    animate();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface MessageSkeletonProps {
  isOwn?: boolean;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ isOwn = false }) => {
  return (
    <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
      {!isOwn && (
        <SkeletonLoader
          width={32}
          height={32}
          borderRadius={16}
          style={styles.avatarSkeleton}
        />
      )}
      
      <View style={styles.messageBubbleSkeleton}>
        {!isOwn && (
          <SkeletonLoader width={80} height={12} style={styles.nameSkeleton} />
        )}
        
        <SkeletonLoader 
          width={isOwn ? 150 : 180} 
          height={16} 
          style={styles.textSkeleton} 
        />
        <SkeletonLoader 
          width={Math.random() * 100 + 50} 
          height={16} 
          style={styles.textSkeleton} 
        />
        
        <SkeletonLoader width={40} height={10} style={styles.timeSkeleton} />
      </View>
    </View>
  );
};

export const ChatSkeleton: React.FC = () => {
  return (
    <View style={styles.chatContainer}>
      {Array.from({ length: 8 }).map((_, index) => (
        <MessageSkeleton key={index} isOwn={index % 3 === 0} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E1E1',
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatarSkeleton: {
    marginRight: 8,
    marginTop: 4,
  },
  messageBubbleSkeleton: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  nameSkeleton: {
    marginBottom: 4,
  },
  textSkeleton: {
    marginBottom: 2,
  },
  timeSkeleton: {
    marginTop: 4,
  },
  chatContainer: {
    paddingVertical: 16,
  },
});
