// Chat message interfaces - matching existing hook types
export interface CourseMessage {
  id: number;
  senderId: string;
  displayName: string;
  content: string;
  isAnonymous: boolean;
  timestamp: string;
  courseId: number;
  editedAt?: string;
  isDeleted: boolean;
}

export interface PrivateMessage {
  id: number;
  senderId: number;
  senderName: string;
  recipientId: number;
  recipientName: string;
  content: string;
  timestamp: string;
  editedAt?: string;
  isRead: boolean;
}

export interface ChatUser {
  id: number;
  username: string;
  displayName: string;
}

export interface Course {
  id: number;
  name: string;
}

export type MessageType = CourseMessage | PrivateMessage;

// Connection states
export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

// Message result types
export interface MessageResult {
  success: boolean;
  error?: string;
}

// Chat props
export interface ChatProps {
  wsBase: string;
  selectedCourse?: number;
  buddy?: ChatUser;
  markCourseMessageAsRead?: (messageId: number) => Promise<void>;
}

// Component props
export interface ChatHeaderProps {
  buddy?: ChatUser;
  currentCourse?: Course;
  connectionState: ConnectionState;
  messagesCount: number;
  connectedUsers: number;
}

export interface MessageListProps {
  messages: CourseMessage[] | PrivateMessage[];
  currentUserId: string | null;
  isLoading: boolean;
  onEditMessage: (messageId: number, content: string) => void;
  onDeleteMessage: (messageId: number) => Promise<void>;
}

export interface MessageInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  placeholder: string;
  buddy?: ChatUser;
  currentCourse?: Course;
  isAnonymous?: boolean;
  anonymousName?: string;
  onAnonymousModeChange?: (checked: boolean) => void;
}

export interface MessageItemProps {
  message: CourseMessage | PrivateMessage;
  isOwnMessage: boolean;
  onEditMessage: (messageId: number, content: string) => void;
  onDeleteMessage: (messageId: number) => Promise<void>;
}
