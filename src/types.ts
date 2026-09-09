export type StoryMode = 'standard' | 'story' | 'child' | 'facts' | 'guide' | 'compare';

export interface MonumentKnowledgeDoc {
  id: string;
  name: string;
  location: string;
  state?: string;
  unesco_year?: number | null;
  unescoStatus?: boolean;
  history?: string[];
  architecture?: string;
  facts?: string[];
  builtBy?: string;
  era?: string;
  century?: string;
  content: string;
  isCustom?: boolean;
  uploadedAt?: string;
  highlights?: string[];
  thumbnailDescription?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: StoryMode;
  monumentName?: string;
  monumentLocation?: string;
  isNotFound?: boolean;
}

export interface ChatRequestPayload {
  message: string;
  mode?: StoryMode;
  monumentId?: string;
  customKnowledgeDocs?: MonumentKnowledgeDoc[];
}

export interface ChatResponsePayload {
  reply: string;
  isNotFound: boolean;
  monumentName?: string;
  monumentLocation?: string;
}

export interface BookmarkItem {
  id: string;
  messageId?: string;
  monumentName: string;
  monumentLocation?: string;
  mode?: StoryMode;
  title: string;
  content: string;
  savedAt: number;
}
