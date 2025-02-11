import React, { createContext, useContext, useState } from 'react';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

interface UserProfile {
  userId: string;
  username: string;
  followers: string[];
  following: string[];
  achievements: Achievement[];
  tipAccuracy: number;
  totalTips: number;
  reputation: number;
}

interface Tip {
  id: string;
  userId: string;
  username: string;
  match: string;
  prediction: string;
  odds: number;
  reasoning: string;
  likes: number;
  comments: Comment[];
  createdAt: Date;
  category: 'value' | 'high-risk' | 'safe' | 'trending';
  verified: boolean;
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: Date;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  winRate: number;
  profit: number;
  successfulTips: number;
  rank: number;
}

interface SocialContextType {
  tips: Tip[];
  leaderboard: LeaderboardEntry[];
  messages: Message[];
  userProfiles: UserProfile[];
  achievements: Achievement[];
  addTip: (tip: Omit<Tip, 'id' | 'likes' | 'comments' | 'createdAt' | 'verified'>) => void;
  likeTip: (tipId: string) => void;
  addComment: (tipId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  updateLeaderboard: (entry: Omit<LeaderboardEntry, 'rank'>) => void;
  sendMessage: (message: Omit<Message, 'id' | 'createdAt' | 'read'>) => void;
  markMessageAsRead: (messageId: string) => void;
  followUser: (followerId: string, followingId: string) => void;
  unfollowUser: (followerId: string, followingId: string) => void;
  verifyTip: (tipId: string) => void;
  awardAchievement: (userId: string, achievementId: string) => void;
  getUserProfile: (userId: string) => UserProfile | undefined;
  getUnreadMessageCount: (userId: string) => number;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first-tip',
      name: 'First Tip',
      description: 'Share your first betting tip',
      icon: '🎯',
    },
    {
      id: 'winning-streak',
      name: 'Hot Streak',
      description: 'Get 5 successful predictions in a row',
      icon: '🔥',
    },
    {
      id: 'community-leader',
      name: 'Community Leader',
      description: 'Reach 100 followers',
      icon: '👑',
    },
    // Add more achievements as needed
  ]);

  const addTip = (tip: Omit<Tip, 'id' | 'likes' | 'comments' | 'createdAt' | 'verified'>) => {
    const newTip: Tip = {
      ...tip,
      id: Math.random().toString(36).substring(7),
      likes: 0,
      comments: [],
      createdAt: new Date(),
      verified: false,
    };
    setTips((prev) => [newTip, ...prev]);
  };

  const likeTip = (tipId: string) => {
    setTips((prev) =>
      prev.map((tip) =>
        tip.id === tipId ? { ...tip, likes: tip.likes + 1 } : tip
      )
    );
  };

  const addComment = (tipId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    const newComment: Comment = {
      ...comment,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
    };
    setTips((prev) =>
      prev.map((tip) =>
        tip.id === tipId
          ? { ...tip, comments: [...tip.comments, newComment] }
          : tip
      )
    );
  };

  const updateLeaderboard = (entry: Omit<LeaderboardEntry, 'rank'>) => {
    setLeaderboard((prev) => {
      const newLeaderboard = prev.filter((e) => e.userId !== entry.userId);
      newLeaderboard.push({ ...entry, rank: 0 });
      
      // Sort by profit and update ranks
      return newLeaderboard
        .sort((a, b) => b.profit - a.profit)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
    });
  };

  const sendMessage = (message: Omit<Message, 'id' | 'createdAt' | 'read'>) => {
    const newMessage: Message = {
      ...message,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
      read: false,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const markMessageAsRead = (messageId: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId ? { ...message, read: true } : message
      )
    );
  };

  const followUser = (followerId: string, followingId: string) => {
    setUserProfiles((prev) =>
      prev.map((profile) => {
        if (profile.userId === followerId) {
          return {
            ...profile,
            following: [...profile.following, followingId],
          };
        }
        if (profile.userId === followingId) {
          return {
            ...profile,
            followers: [...profile.followers, followerId],
          };
        }
        return profile;
      })
    );
  };

  const unfollowUser = (followerId: string, followingId: string) => {
    setUserProfiles((prev) =>
      prev.map((profile) => {
        if (profile.userId === followerId) {
          return {
            ...profile,
            following: profile.following.filter((id) => id !== followingId),
          };
        }
        if (profile.userId === followingId) {
          return {
            ...profile,
            followers: profile.followers.filter((id) => id !== followerId),
          };
        }
        return profile;
      })
    );
  };

  const verifyTip = (tipId: string) => {
    setTips((prev) =>
      prev.map((tip) =>
        tip.id === tipId ? { ...tip, verified: true } : tip
      )
    );
  };

  const awardAchievement = (userId: string, achievementId: string) => {
    setUserProfiles((prev) =>
      prev.map((profile) => {
        if (profile.userId === userId) {
          const achievement = achievements.find((a) => a.id === achievementId);
          if (achievement && !profile.achievements.find((a) => a.id === achievementId)) {
            return {
              ...profile,
              achievements: [...profile.achievements, { ...achievement, unlockedAt: new Date() }],
            };
          }
        }
        return profile;
      })
    );
  };

  const getUserProfile = (userId: string) => {
    return userProfiles.find((profile) => profile.userId === userId);
  };

  const getUnreadMessageCount = (userId: string) => {
    return messages.filter(
      (message) => message.receiverId === userId && !message.read
    ).length;
  };

  return (
    <SocialContext.Provider
      value={{
        tips,
        leaderboard,
        messages,
        userProfiles,
        achievements,
        addTip,
        likeTip,
        addComment,
        updateLeaderboard,
        sendMessage,
        markMessageAsRead,
        followUser,
        unfollowUser,
        verifyTip,
        awardAchievement,
        getUserProfile,
        getUnreadMessageCount,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
}; 