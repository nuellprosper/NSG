import { 
  SourceNode, 
  SourceGraphEdge, 
  NoteSourceGraph, 
  NotePodcastMessage 
} from '../../types/podcast';

/**
 * Initializes a new empty or populated Note Source Graph
 */
export function buildInitialSourceGraph(sources: SourceNode[]): NoteSourceGraph {
  const nodes: Record<string, SourceNode> = {};
  const edges: SourceGraphEdge[] = [];

  sources.forEach(src => {
    nodes[src.id] = src;
  });

  // Automatically wire hierarchical parent-child relationships
  sources.forEach(src => {
    if (src.metadata?.parentSourceId && nodes[src.metadata.parentSourceId]) {
      edges.push({
        id: `edge_${src.metadata.parentSourceId}_${src.id}`,
        fromId: src.metadata.parentSourceId,
        toId: src.id,
        relationType: 'contains'
      });
    }
    if (src.metadata?.parentPdfId && nodes[src.metadata.parentPdfId]) {
      edges.push({
        id: `edge_${src.metadata.parentPdfId}_${src.id}`,
        fromId: src.metadata.parentPdfId,
        toId: src.id,
        relationType: 'contains'
      });
    }
    if (src.metadata?.parentAudioId && nodes[src.metadata.parentAudioId]) {
      edges.push({
        id: `edge_${src.metadata.parentAudioId}_${src.id}`,
        fromId: src.metadata.parentAudioId,
        toId: src.id,
        relationType: 'contains'
      });
    }
  });

  return {
    nodes,
    edges,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Links a generated message to one or more source nodes
 */
export function linkMessageToSources(
  graph: NoteSourceGraph,
  messageId: string,
  sourceRefs: string[]
): NoteSourceGraph {
  const updatedEdges = [...graph.edges];

  sourceRefs.forEach(srcId => {
    const edgeId = `edge_support_${srcId}_${messageId}`;
    if (!updatedEdges.some(e => e.id === edgeId)) {
      updatedEdges.push({
        id: edgeId,
        fromId: srcId,
        toId: messageId,
        relationType: 'supports',
        metadata: { linkedAt: new Date().toISOString() }
      });
    }
  });

  return {
    ...graph,
    edges: updatedEdges,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Forward lookup: finds all SourceNodes supporting a given message
 */
export function getSourcesForMessage(
  graph: NoteSourceGraph,
  message: NotePodcastMessage
): SourceNode[] {
  const sourceIds = new Set<string>();

  // Direct sourceRefs on the message
  if (message.sourceRefs && message.sourceRefs.length > 0) {
    message.sourceRefs.forEach(id => sourceIds.add(id));
  }

  // Graph edges pointing to this message
  graph.edges.forEach(edge => {
    if (edge.toId === message.id && (edge.relationType === 'supports' || edge.relationType === 'explains')) {
      sourceIds.add(edge.fromId);
    }
  });

  const directSources: SourceNode[] = [];
  sourceIds.forEach(id => {
    if (graph.nodes[id]) {
      directSources.push(graph.nodes[id]);
      // If this is a child node (like pdf_page), also check if parent node exists
      const parentId = graph.nodes[id].metadata?.parentSourceId || graph.nodes[id].metadata?.parentPdfId || graph.nodes[id].metadata?.parentAudioId;
      if (parentId && graph.nodes[parentId] && !sourceIds.has(parentId)) {
        // Parent available for broader context
      }
    }
  });

  return directSources;
}

/**
 * Reverse lookup: finds all message IDs that depend on or reference a given source
 */
export function getMessagesForSource(
  graph: NoteSourceGraph,
  sourceId: string,
  messages: NotePodcastMessage[]
): NotePodcastMessage[] {
  const dependentMessageIds = new Set<string>();

  // Check direct edges
  graph.edges.forEach(edge => {
    if (edge.fromId === sourceId && (edge.relationType === 'supports' || edge.relationType === 'explains')) {
      dependentMessageIds.add(edge.toId);
    }
  });

  // Check child nodes of this source (e.g. pages in this PDF or segments of this audio)
  const childNodeIds = new Set<string>();
  graph.edges.forEach(edge => {
    if (edge.fromId === sourceId && edge.relationType === 'contains') {
      childNodeIds.add(edge.toId);
    }
  });

  childNodeIds.forEach(childId => {
    graph.edges.forEach(edge => {
      if (edge.fromId === childId && (edge.relationType === 'supports' || edge.relationType === 'explains')) {
        dependentMessageIds.add(edge.toId);
      }
    });
  });

  // Check message.sourceRefs
  messages.forEach(msg => {
    if (msg.sourceRefs && (msg.sourceRefs.includes(sourceId) || msg.sourceRefs.some(ref => childNodeIds.has(ref)))) {
      dependentMessageIds.add(msg.id);
    }
  });

  return messages.filter(m => dependentMessageIds.has(m.id));
}

export interface SourceDiffResult {
  added: SourceNode[];
  modified: SourceNode[];
  deleted: string[]; // IDs of deleted sources
  unchanged: SourceNode[];
}

/**
 * Compares current sources against a previous snapshot to detect incremental changes
 */
export function detectSourceChanges(
  previousSnapshot: Array<{ id: string; contentHash: string; name: string }>,
  currentSources: SourceNode[]
): SourceDiffResult {
  const prevMap = new Map(previousSnapshot.map(s => [s.id, s.contentHash]));
  const currentMap = new Map(currentSources.map(s => [s.id, s]));

  const added: SourceNode[] = [];
  const modified: SourceNode[] = [];
  const unchanged: SourceNode[] = [];
  const deleted: string[] = [];

  currentSources.forEach(src => {
    if (!prevMap.has(src.id)) {
      added.push(src);
    } else if (prevMap.get(src.id) !== src.contentHash) {
      modified.push(src);
    } else {
      unchanged.push(src);
    }
  });

  previousSnapshot.forEach(prev => {
    if (!currentMap.has(prev.id)) {
      deleted.push(prev.id);
    }
  });

  return { added, modified, deleted, unchanged };
}

/**
 * Finds all message IDs affected by changed or deleted sources
 */
export function findAffectedMessages(
  graph: NoteSourceGraph,
  changedSourceIds: string[],
  messages: NotePodcastMessage[]
): string[] {
  const affectedIds = new Set<string>();

  changedSourceIds.forEach(srcId => {
    const dependentMsgs = getMessagesForSource(graph, srcId, messages);
    dependentMsgs.forEach(m => affectedIds.add(m.id));
  });

  return Array.from(affectedIds);
}
