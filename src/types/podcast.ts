export type PodcastSpeaker = 'omni' | 'zeal' | 'user';

export type PodcastSourceType = 
  | 'note_text' 
  | 'text_section'
  | 'document' 
  | 'pdf' 
  | 'pdf_page' 
  | 'image' 
  | 'audio' 
  | 'audio_segment' 
  | 'folder';

export interface SourceNode {
  id: string;
  type: PodcastSourceType;
  name: string;
  folderId?: string;
  folderName?: string;
  sourceVersion: number;
  contentHash: string;
  pageNumber?: number;
  sectionTitle?: string;
  sectionIndex?: number;
  timestampStart?: number;
  timestampEnd?: number;
  extractedContent: string;
  summary?: string;
  mediaUrl?: string;
  processedAt: string;
  metadata?: Record<string, any>;
}

export type GraphRelationType = 
  | 'contains' 
  | 'derived_from' 
  | 'explains' 
  | 'questions' 
  | 'references' 
  | 'supports' 
  | 'affected_by';

export interface SourceGraphEdge {
  id: string;
  fromId: string;
  toId: string;
  relationType: GraphRelationType;
  metadata?: Record<string, any>;
}

export interface NoteSourceGraph {
  nodes: Record<string, SourceNode>;
  edges: SourceGraphEdge[];
  updatedAt: string;
}

export interface NoteKnowledgePack {
  noteId: string;
  noteTitle: string;
  noteVersion: number;
  noteText: string;
  sources: SourceNode[];
  topics: string[];
  keyDefinitions: string[];
  misconceptions: string[];
  visualObservations: string[];
  audioInsights: string[];
  sourceGraph: NoteSourceGraph;
  generatedAt: string;
}

export interface NotePodcastMessage {
  id: string;
  podcastId: string;
  speaker: PodcastSpeaker;
  text: string;
  replyToMessageId?: string;
  replyToSpeaker?: PodcastSpeaker;
  replyToTextSnippet?: string;
  sourceRefs?: string[]; // IDs of SourceNodes that directly support this message
  createdAt: string;
  generationType: 'initial' | 'incremental' | 'user_interaction' | 'regenerated';
  sourceVersion: number;
  isStale?: boolean;
  regeneratedFromId?: string;
  audioDurationSeconds?: number;
  audioUrl?: string;
}

export interface NotePodcast {
  podcastId: string;
  noteId: string;
  title: string;
  podcastVersion: number;
  materialMode: 'entire_note' | 'folder';
  selectedFolderId?: string;
  selectedFolderName?: string;
  sourceSnapshot: Array<{
    id: string;
    type: string;
    name: string;
    contentHash: string;
    version: number;
  }>;
  knowledgePackVersion: number;
  knowledgePack?: NoteKnowledgePack;
  messages: NotePodcastMessage[];
  sourceGraph: NoteSourceGraph;
  generationState: 'idle' | 'generating' | 'completed' | 'error';
  audioState?: {
    lastPlayedIndex?: number;
    lastPlayedTimeSeconds?: number;
    playbackSpeed?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MaterialStats {
  noteWordCount: number;
  textSectionsCount: number;
  documentCount: number;
  pdfCount: number;
  imageCount: number;
  audioCount: number;
  totalSources: number;
  folderName?: string;
  hasContent: boolean;
}

export interface GenerationProgressStep {
  step: 'reading_note' | 'processing_docs' | 'transcribing_audio' | 'understanding_images' | 'building_graph' | 'generating_discussion';
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  detail?: string;
}
