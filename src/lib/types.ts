export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  interests: string[];
  role: 'user' | 'moderator' | 'admin';
  created_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  type: 'story' | 'reel';
  caption: string;
  media_url: string;
  media_kind: 'image' | 'video' | 'audio';
  expires_at: string | null;
  created_at: string;
  author?: Profile;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
};

export type ConversationParticipant = {
  conversation_id: string;
  user_id: string;
  profile?: Profile;
  last_read_at: string;
};

export type Conversation = {
  id: string;
  created_at: string;
  participants: ConversationParticipant[];
  last_message?: Message | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  read_at: string | null;
};

export type MediaContent = {
  id: string;
  title: string;
  creator_credit: string;
  category: 'music' | 'video' | 'book';
  description: string;
  license: 'Domaine public' | 'Creative Commons' | 'Créateur indépendant' | 'Partenaire';
  media_kind: 'image' | 'video' | 'audio';
  media_url: string;
  cover_url: string | null;
  book_url: string | null;
  uploader_id: string | null;
  duration_seconds: number | null;
  created_at: string;
  is_favorite?: boolean;
  progress?: number | null;
};

export type Report = {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'message' | 'profile' | 'media';
  target_id: string;
  reason: string;
  status: 'open' | 'reviewing' | 'removed' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
};

export type Usage = {
  media_plays: number;
  media_limit: number;
  books_opened: number;
  books_limit: number;
};
