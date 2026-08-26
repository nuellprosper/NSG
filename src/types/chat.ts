import { Timestamp } from 'firebase/firestore';

export interface Reaction {
  emoji: string;
  userId: string;
  username: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderHandle: string;
  senderName?: string;
  text: string;
  timestamp: any; // Can be Timestamp or FieldValue or Date
  type: 'text' | 'image' | 'audio' | 'missed_call';
  callType?: 'voice' | 'video';
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  encrypted?: boolean;
  mediaUrl?: string;
  seenBy?: string[];
  isViewOnce?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isSharedNote?: boolean;
  sharedAccessType?: 'readonly' | 'editable';
  noteTitle?: string;
  noteContent?: string;
  starredBy?: string[]; // Users who bookmarked this message
  reactions?: Reaction[]; // Floating Reaction collection
  duration?: number; // Voice message duration in seconds
  isOmniResponse?: boolean;
}

export interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group';
  members: string[]; // Handles/UIDs
  photoURL?: string;
  lastMessage?: string;
  lastMessageSender?: string;
  updatedAt: any;
  unreadCount?: number;
  isOmni?: boolean;
  unreadBy?: string[];
  isPinned?: boolean;
  description?: string;
  admin?: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  fullName: string;
  photoURL?: string;
  points?: number;
  streak?: number;
  rank?: string;
  level?: string;
  faculty?: string;
  department?: string;
  university?: string;
  about?: string;
  email?: string;
  readReceipts?: boolean;
  lastSeen?: any;
}

export interface CallState {
  type: 'voice' | 'video' | null;
  status: 'idle' | 'connecting' | 'connected' | 'disconnected';
  chatName?: string;
  isMuted?: boolean;
  isVideoMuted?: boolean;
  duration?: number;
}

export interface TypingState {
  [chatId: string]: {
    [username: string]: boolean;
  };
}
