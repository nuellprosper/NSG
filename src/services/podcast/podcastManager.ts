import { 
  NotePodcast, 
  NotePodcastMessage, 
  NoteKnowledgePack, 
  SourceNode, 
  GenerationProgressStep 
} from '../../types/podcast';
import { NoteItem } from '../../components/NotesVaultHome';
import { 
  processNoteText, 
  processDocumentOrPdfSource, 
  processImageSource, 
  processAudioSource, 
  calculateContentHash 
} from './sourceProcessor';
import { 
  buildInitialSourceGraph, 
  linkMessageToSources, 
  detectSourceChanges 
} from './sourceGraphEngine';
import { 
  generateInitialPodcastDiscussion, 
  generateIncrementalUpdateDiscussion, 
  GeneratedTurn 
} from './orchestrator';

/**
 * Checks if the note or its attachments have changed since the podcast was generated
 */
export function checkForMaterialChanges(
  podcast: NotePodcast | null | undefined,
  note: NoteItem
): boolean {
  if (!podcast || !podcast.sourceSnapshot || podcast.sourceSnapshot.length === 0) {
    return false;
  }

  const currentNoteHash = calculateContentHash(note.content || '');
  const snapshotNote = podcast.sourceSnapshot.find(s => s.type === 'note_text');
  if (snapshotNote && snapshotNote.contentHash !== currentNoteHash) {
    return true;
  }

  const currentAttsCount = (note.attachments?.length || 0) + (note.images?.length || 0) + (note.audioRecordings?.length || 0);
  const snapshotAttsCount = podcast.sourceSnapshot.filter(s => s.type !== 'note_text').length;

  return currentAttsCount !== snapshotAttsCount;
}

/**
 * Complete pipeline for extracting sources, building source graph, and generating discussion
 */
export async function runPodcastGenerationPipeline(
  note: NoteItem,
  userNotes: NoteItem[] = [],
  mode: 'entire_note' | 'folder' = 'entire_note',
  folderId?: string,
  folderName?: string,
  onProgress?: (step: GenerationProgressStep) => void,
  onInterimSave?: (podcast: NotePodcast) => Promise<void>
): Promise<NotePodcast> {
  const podcastId = `pod_${note.id}_${Date.now()}`;
  const now = new Date().toISOString();

  // 1. Reading note content
  if (onProgress) {
    onProgress({
      step: 'reading_note',
      label: 'Reading note content and structuring topics...',
      status: 'in_progress',
      detail: `Extracting core text from "${note.title || 'Note'}"`
    });
  }

  let textSourceNodes: SourceNode[] = [];
  if (mode === 'folder' && folderId) {
    const targetFolder = userNotes.find(n => n.id === folderId);
    if (targetFolder) {
      textSourceNodes = processNoteText(targetFolder.id, targetFolder.title, targetFolder.content || '');
    }
  } else {
    textSourceNodes = processNoteText(note.id, note.title, note.content || '');
  }

  const allSources: SourceNode[] = [...textSourceNodes];

  // 2. Processing documents & PDFs
  if (onProgress) {
    onProgress({
      step: 'processing_docs',
      label: 'Extracting text and analyzing PDF documents...',
      status: 'in_progress'
    });
  }

  const attachments = note.attachments || [];
  for (const att of attachments) {
    const docNodes = await processDocumentOrPdfSource(att, note.id, note.folder);
    allSources.push(...docNodes);
  }

  // 3. Transcribing audio recordings
  if (onProgress) {
    onProgress({
      step: 'transcribing_audio',
      label: 'Transcribing voice recordings with Google 3.1 Flash...',
      status: 'in_progress'
    });
  }

  const audioList = note.audioRecordings || [];
  for (const aud of audioList) {
    const audNodes = await processAudioSource(aud, note.id, note.folder);
    allSources.push(...audNodes);
  }

  // 4. Understanding visual diagrams & images
  if (onProgress) {
    onProgress({
      step: 'understanding_images',
      label: 'Extracting formulas, diagrams, and visual insights with Gemini Vision...',
      status: 'in_progress'
    });
  }

  const imageList = note.images || [];
  for (const imgUrl of imageList) {
    const imgNodes = await processImageSource({ url: imgUrl, name: 'Attached Image' }, note.id, note.folder);
    allSources.push(...imgNodes);
  }

  // 5. Building source graph & knowledge pack
  if (onProgress) {
    onProgress({
      step: 'building_graph',
      label: 'Building grounded source graph and bidirectional citations...',
      status: 'in_progress',
      detail: `Mapped ${allSources.length} source nodes`
    });
  }

  let sourceGraph = buildInitialSourceGraph(allSources);

  const knowledgePack: NoteKnowledgePack = {
    noteId: note.id,
    noteTitle: note.title || 'Untitled Note',
    noteVersion: 1,
    noteText: note.content || '',
    sources: allSources,
    topics: [],
    keyDefinitions: [],
    misconceptions: [],
    visualObservations: [],
    audioInsights: [],
    sourceGraph,
    generatedAt: now
  };

  // Snapshot for incremental update detection
  const sourceSnapshot = allSources.map(s => ({
    id: s.id,
    type: s.type,
    name: s.name,
    contentHash: s.contentHash,
    version: s.sourceVersion
  }));

  // Initial podcast shell
  let currentPodcast: NotePodcast = {
    podcastId,
    noteId: note.id,
    title: `${note.title || 'Study'} Podcast`,
    podcastVersion: 1,
    materialMode: mode,
    selectedFolderId: folderId,
    selectedFolderName: folderName,
    sourceSnapshot,
    knowledgePackVersion: 1,
    knowledgePack,
    messages: [],
    sourceGraph,
    generationState: 'generating',
    createdAt: now,
    updatedAt: now
  };

  if (onInterimSave) {
    await onInterimSave(currentPodcast);
  }

  // 6. Generating Omni and Zeal discussion
  if (onProgress) {
    onProgress({
      step: 'generating_discussion',
      label: 'Creating Omni and Zeal conversational study dialogue...',
      status: 'in_progress'
    });
  }

  const generatedTurns = await generateInitialPodcastDiscussion(
    knowledgePack,
    async (batchTurns: GeneratedTurn[]) => {
      // Progressively append and save turns
      const newMessages: NotePodcastMessage[] = batchTurns.map((turn, tIdx) => {
        const msgId = `msg_${turn.speaker}_${Date.now()}_${tIdx}`;
        // Link to graph
        sourceGraph = linkMessageToSources(sourceGraph, msgId, turn.sourceRefs);

        return {
          id: msgId,
          podcastId,
          speaker: turn.speaker,
          text: turn.text,
          sourceRefs: turn.sourceRefs,
          createdAt: new Date().toISOString(),
          generationType: 'initial',
          sourceVersion: 1
        };
      });

      currentPodcast = {
        ...currentPodcast,
        messages: [...currentPodcast.messages, ...newMessages],
        sourceGraph,
        updatedAt: new Date().toISOString()
      };

      if (onInterimSave) {
        await onInterimSave(currentPodcast);
      }
    }
  );

  currentPodcast = {
    ...currentPodcast,
    generationState: 'completed',
    updatedAt: new Date().toISOString()
  };

  if (onInterimSave) {
    await onInterimSave(currentPodcast);
  }

  if (onProgress) {
    onProgress({
      step: 'generating_discussion',
      label: 'Podcast discussion ready!',
      status: 'completed'
    });
  }

  return currentPodcast;
}

/**
 * Incrementally updates an existing podcast when new material is detected
 */
export async function runIncrementalPodcastUpdate(
  existingPodcast: NotePodcast,
  note: NoteItem,
  userNotes: NoteItem[] = [],
  onProgress?: (step: GenerationProgressStep) => void,
  onSave?: (podcast: NotePodcast) => Promise<void>
): Promise<NotePodcast> {
  const now = new Date().toISOString();

  // Extract current sources
  const currentSources: SourceNode[] = [];
  const textNodes = processNoteText(note.id, note.title, note.content || '');
  currentSources.push(...textNodes);

  for (const att of note.attachments || []) {
    const docNodes = await processDocumentOrPdfSource(att, note.id, note.folder);
    currentSources.push(...docNodes);
  }
  for (const aud of note.audioRecordings || []) {
    const audNodes = await processAudioSource(aud, note.id, note.folder);
    currentSources.push(...audNodes);
  }
  for (const imgUrl of note.images || []) {
    const imgNodes = await processImageSource({ url: imgUrl, name: 'Attached Image' }, note.id, note.folder);
    currentSources.push(...imgNodes);
  }

  // Detect differences
  const diff = detectSourceChanges(existingPodcast.sourceSnapshot || [], currentSources);

  if (diff.added.length === 0 && diff.modified.length === 0) {
    return existingPodcast;
  }

  const itemsToDiscuss = [...diff.added, ...diff.modified];

  // Update Source Graph
  let updatedGraph = { ...existingPodcast.sourceGraph };
  itemsToDiscuss.forEach(src => {
    updatedGraph.nodes[src.id] = src;
  });

  const knowledgePack: NoteKnowledgePack = {
    noteId: note.id,
    noteTitle: note.title,
    noteVersion: existingPodcast.podcastVersion + 1,
    noteText: note.content || '',
    sources: Object.values(updatedGraph.nodes),
    topics: [],
    keyDefinitions: [],
    misconceptions: [],
    visualObservations: [],
    audioInsights: [],
    sourceGraph: updatedGraph,
    generatedAt: now
  };

  // Generate incremental discussion turns
  const newTurns = await generateIncrementalUpdateDiscussion(
    itemsToDiscuss,
    knowledgePack,
    existingPodcast.messages
  );

  const newMessages: NotePodcastMessage[] = newTurns.map((turn, tIdx) => {
    const msgId = `msg_inc_${turn.speaker}_${Date.now()}_${tIdx}`;
    updatedGraph = linkMessageToSources(updatedGraph, msgId, turn.sourceRefs);

    return {
      id: msgId,
      podcastId: existingPodcast.podcastId,
      speaker: turn.speaker,
      text: turn.text,
      sourceRefs: turn.sourceRefs,
      createdAt: new Date().toISOString(),
      generationType: 'incremental',
      sourceVersion: existingPodcast.podcastVersion + 1
    };
  });

  const updatedSnapshot = currentSources.map(s => ({
    id: s.id,
    type: s.type,
    name: s.name,
    contentHash: s.contentHash,
    version: s.sourceVersion
  }));

  const updatedPodcast: NotePodcast = {
    ...existingPodcast,
    podcastVersion: existingPodcast.podcastVersion + 1,
    messages: [...existingPodcast.messages, ...newMessages],
    sourceGraph: updatedGraph,
    sourceSnapshot: updatedSnapshot,
    knowledgePack,
    updatedAt: now
  };

  if (onSave) {
    await onSave(updatedPodcast);
  }

  return updatedPodcast;
}
