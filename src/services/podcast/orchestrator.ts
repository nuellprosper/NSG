import { 
  NoteKnowledgePack, 
  NotePodcastMessage, 
  PodcastSpeaker, 
  SourceNode 
} from '../../types/podcast';
import { getAiInstance, MODEL_NAME } from '../../utils';

export interface GeneratedTurn {
  speaker: 'omni' | 'zeal';
  text: string;
  sourceRefs: string[];
}

/**
 * Conservative intent detector to distinguish direct address to Zeal vs incidental word usage
 * e.g. "I have the zeal to study" -> FALSE
 * e.g. "Zeal, what do you think?" -> TRUE
 * e.g. "@Zeal explain this" -> TRUE
 */
export function detectAddressedSpeaker(
  input: string,
  replyToSpeaker?: PodcastSpeaker
): { speaker: 'omni' | 'zeal' | 'both' | 'contextual'; isExplicit: boolean } {
  const clean = input.trim();
  const lower = clean.toLowerCase();

  const hasAtOmni = /@omni\b/i.test(clean);
  const hasAtZeal = /@zeal\b/i.test(clean);

  if (hasAtOmni && hasAtZeal) {
    return { speaker: 'both', isExplicit: true };
  }
  if (hasAtOmni) {
    return { speaker: 'omni', isExplicit: true };
  }
  if (hasAtZeal) {
    return { speaker: 'zeal', isExplicit: true };
  }

  // Check for both-AI direct conversational phrases
  if (
    /(omni\s+and\s+zeal|zeal\s+and\s+omni|both\s+of\s+you|you\s+two)/i.test(lower)
  ) {
    return { speaker: 'both', isExplicit: true };
  }

  // Conservative regex for direct addressing at start of sentence or after punctuation
  // Matches: "Zeal," or "Zeal:" or "Hey Zeal," or "Zeal what do you think"
  // Does NOT match: "the zeal", "with zeal", "great zeal", "her zeal", "my zeal"
  const directZealRegex = /(^|[.!?]\s*)(hey\s+|dear\s+)?zeal\s*([,:\?]|(\s+(what|why|how|do|can|could|did|is|are|tell|give|look|explain|think|argue))\b)/i;
  // Non-incidental filter
  const incidentalZealFilter = /\b(the|with|much|great|such|showed|having|have|has|their|his|her|our|my|no|religious|academic)\s+zeal\b/i;

  const isDirectZeal = directZealRegex.test(clean) && !incidentalZealFilter.test(clean);

  const directOmniRegex = /(^|[.!?]\s*)(hey\s+|dear\s+)?omni\s*([,:\?]|(\s+(what|why|how|do|can|could|did|is|are|tell|give|look|explain|think|break))\b)/i;
  const isDirectOmni = directOmniRegex.test(clean);

  if (isDirectOmni && isDirectZeal) {
    return { speaker: 'both', isExplicit: true };
  }
  if (isDirectOmni) {
    return { speaker: 'omni', isExplicit: true };
  }
  if (isDirectZeal) {
    return { speaker: 'zeal', isExplicit: true };
  }

  // If user swiped or clicked reply to a specific AI message
  if (replyToSpeaker === 'zeal') {
    return { speaker: 'zeal', isExplicit: false };
  }
  if (replyToSpeaker === 'omni') {
    return { speaker: 'omni', isExplicit: false };
  }

  return { speaker: 'contextual', isExplicit: false };
}

/**
 * Builds concise, high-grounding context from Knowledge Pack for AI model prompt
 */
function buildKnowledgeContext(knowledgePack: NoteKnowledgePack): {
  contextSummary: string;
  sourceLookupPrompt: string;
} {
  const sourcesSummary = knowledgePack.sources.slice(0, 15).map((s, idx) => {
    const details = s.extractedContent.slice(0, 800);
    return `[SOURCE_ID: ${s.id}] (${s.type}) "${s.name}"${s.pageNumber ? ` - Page ${s.pageNumber}` : ''}:\n${details}`;
  }).join('\n\n');

  return {
    contextSummary: `Note Title: "${knowledgePack.noteTitle}"\nNote Body Preview:\n${knowledgePack.noteText.slice(0, 1500)}`,
    sourceLookupPrompt: sourcesSummary
  };
}

/**
 * Generates initial discussion conversational turns in progressive batches
 */
export async function generateInitialPodcastDiscussion(
  knowledgePack: NoteKnowledgePack,
  onBatchGenerated: (batchTurns: GeneratedTurn[]) => Promise<void>
): Promise<GeneratedTurn[]> {
  const ai = getAiInstance();
  const { contextSummary, sourceLookupPrompt } = buildKnowledgeContext(knowledgePack);

  const totalSources = knowledgePack.sources.length;
  const textLength = knowledgePack.noteText.length;

  // Plan discussion depth based on actual content
  let targetTurns = 18;
  if (textLength > 4000 || totalSources > 4) {
    targetTurns = 32;
  } else if (textLength > 1500 || totalSources > 1) {
    targetTurns = 24;
  }

  const batchSize = 12;
  const numBatches = Math.ceil(targetTurns / batchSize);
  const allTurns: GeneratedTurn[] = [];

  for (let batchIdx = 0; batchIdx < numBatches; batchIdx++) {
    const isFirstBatch = batchIdx === 0;
    const isFinalBatch = batchIdx === numBatches - 1;

    const previousHistory = allTurns.slice(-6).map(t => `${t.speaker === 'omni' ? 'Omni' : 'Zeal'}: ${t.text}`).join('\n');

    const prompt = `You are orchestrating a genuine, highly intelligent academic podcast study discussion between two university scholars:
- OMNI: The primary academic tutor. Omni explains concepts with crystal clarity, uses memorable analogies, explains the "why" and underlying mechanisms, breaks down formulas/diagrams, and corrects subtle misconceptions.
- ZEAL: The sharp discussion partner and second lecturer. Zeal identifies key definitions, points out easily overlooked details, asks probing questions, challenges assumptions, connects different sections, and highlights real-world application nuances.

CORE INSTRUCTIONS:
1. They must sound like two real, warm, intelligent scholars sitting together studying the user's specific note material.
2. VARY THE CONVERSATION NATURALLY. Avoid repetitive formulas like (Zeal asks question -> Omni answers -> Zeal says 'Exactly').
   - Sometimes Zeal makes the opening observation.
   - Sometimes Omni questions Zeal's assumption.
   - Sometimes Zeal challenges Omni's explanation or points out a hidden exception.
   - Sometimes one builds directly on the other's insight.
3. BAN CLICHÉS & AI SLOP: NEVER use "That's a great question!", "Exactly!", "Absolutely!", "Wow!", "You're spot on!", "That's a fantastic point!". Keep reactions natural and focused on the academic material.
4. STRICT GROUNDING: Discuss the actual provided note content, diagrams, images, audio, and documents. Every turn MUST cite the real [SOURCE_ID: ...] from the sources below that supports what is being discussed. Do not invent facts or page numbers.
5. LENGTH & TURNS: Generate exactly ${batchSize} alternating conversational turns.

${isFirstBatch ? 'FOCUS: Start with the most foundational definition, core principle, or central question raised by this material.' : ''}
${isFinalBatch ? 'FOCUS: Deep synthesis, exam-style thinking questions, and key takeaways.' : ''}

${isFirstBatch ? '' : `PREVIOUS CONVERSATION SO FAR:\n${previousHistory}\n`}

MATERIAL CONTEXT:
${contextSummary}

PROCESSED SOURCES AVAILABLE TO CITE:
${sourceLookupPrompt}

OUTPUT FORMAT:
Return a valid JSON array of objects with fields:
[
  {
    "speaker": "zeal" | "omni",
    "text": "The spoken discussion message text...",
    "sourceRefs": ["source_id_1", "source_id_2"]
  }
]
Return ONLY the raw JSON array.`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const rawText = response.text || '';
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedTurns: GeneratedTurn[] = JSON.parse(cleanJson);

      if (Array.isArray(parsedTurns) && parsedTurns.length > 0) {
        const validatedBatch: GeneratedTurn[] = parsedTurns.map(item => ({
          speaker: item.speaker === 'zeal' ? 'zeal' : 'omni',
          text: (item.text || '').trim(),
          sourceRefs: Array.isArray(item.sourceRefs) ? item.sourceRefs : []
        })).filter(t => t.text.length > 5);

        allTurns.push(...validatedBatch);
        await onBatchGenerated(validatedBatch);
      }
    } catch (batchErr) {
      console.warn(`Podcast generation batch ${batchIdx + 1} fallback notice:`, batchErr);
      // Fallback simple parsing if JSON block failed
      if (allTurns.length === 0) {
        const fallbackTurns = generateFallbackTurns(knowledgePack);
        allTurns.push(...fallbackTurns);
        await onBatchGenerated(fallbackTurns);
        break;
      }
    }
  }

  return allTurns;
}

/**
 * Fallback generator if remote model JSON output encountered formatting error
 */
function generateFallbackTurns(knowledgePack: NoteKnowledgePack): GeneratedTurn[] {
  const mainSrc = knowledgePack.sources[0]?.id || `src_note_${knowledgePack.noteId}`;
  return [
    {
      speaker: 'zeal',
      text: `Let's break down ${knowledgePack.noteTitle}. Looking through the material, the core concept hinges on the fundamental definitions set out right at the start.`,
      sourceRefs: [mainSrc]
    },
    {
      speaker: 'omni',
      text: `That's the right place to begin. The essential takeaway here is how each component builds upon the primary theorem before introducing complex applications.`,
      sourceRefs: [mainSrc]
    },
    {
      speaker: 'zeal',
      text: `Notice how easily that definition can be misunderstood if you overlook the constraints mentioned in the source material.`,
      sourceRefs: [mainSrc]
    },
    {
      speaker: 'omni',
      text: `Exactly where students often trip up on exams. Let's trace how the evidence directly supports this mechanism step by step.`,
      sourceRefs: [mainSrc]
    }
  ];
}

/**
 * Handles interactive user messages with mention routing and Source Graph grounding
 */
export async function generateUserInteractiveReply(
  userMessage: string,
  replyToMessage: NotePodcastMessage | null,
  recentMessages: NotePodcastMessage[],
  knowledgePack: NoteKnowledgePack
): Promise<GeneratedTurn[]> {
  const ai = getAiInstance();
  const addressInfo = detectAddressedSpeaker(userMessage, replyToMessage?.speaker);

  const { contextSummary, sourceLookupPrompt } = buildKnowledgeContext(knowledgePack);

  // Relevant referenced sources from reply target
  let referencedSourceContext = '';
  if (replyToMessage) {
    referencedSourceContext = `USER IS DIRECTLY REPLYING TO THIS MESSAGE:
Speaker: ${replyToMessage.speaker.toUpperCase()}
Message: "${replyToMessage.text}"
Supporting Sources for that message: ${replyToMessage.sourceRefs?.join(', ') || 'General note'}
`;
  }

  const conversationHistory = recentMessages.slice(-5).map(
    m => `${m.speaker === 'user' ? 'Student' : (m.speaker === 'omni' ? 'Omni' : 'Zeal')}: ${m.text}`
  ).join('\n');

  let responderInstruction = '';
  if (addressInfo.speaker === 'both') {
    responderInstruction = 'Both Omni and Zeal must contribute to answer the student. First have one address the core concept, then have the other add distinct insight, perspective, or a follow-up check. Return 2 turns in the JSON array.';
  } else if (addressInfo.speaker === 'zeal') {
    responderInstruction = 'Zeal should answer directly, maintaining his perceptive, detail-oriented style. Return 1 turn in the JSON array.';
  } else {
    // Default or Omni
    responderInstruction = 'Omni should answer directly as the lead academic tutor with clarity, structure, and helpful analogies. Return 1 turn in the JSON array.';
  }

  const prompt = `You are continuing the interactive study podcast discussion with the student:
- OMNI: Academic tutor (clear, structured, foundational mechanisms, analogies).
- ZEAL: Discussion partner & examiner (nuance, edge cases, definitions, practical implications).

${responderInstruction}

STUDENT QUESTION / MESSAGE:
"${userMessage}"

${referencedSourceContext}

RECENT CHAT HISTORY:
${conversationHistory}

STUDY MATERIAL CONTEXT:
${contextSummary}

SOURCES TO CITE:
${sourceLookupPrompt}

RULES:
- Answer directly based on the note's actual facts and principles.
- Cite specific source IDs in "sourceRefs".
- Do NOT begin with canned filler like "That's a great question!" or "Sure!".
- Keep the response conversational, educational, and engaging.

OUTPUT FORMAT:
JSON array:
[
  {
    "speaker": "omni" | "zeal",
    "text": "Response text...",
    "sourceRefs": ["source_id_1"]
  }
]`;

  try {
    const res = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const raw = res.text || '';
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed: GeneratedTurn[] = JSON.parse(clean);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(p => ({
        speaker: p.speaker === 'zeal' ? 'zeal' : 'omni',
        text: p.text.trim(),
        sourceRefs: Array.isArray(p.sourceRefs) ? p.sourceRefs : []
      }));
    }
  } catch (err) {
    console.warn("Interactive reply generation note:", err);
  }

  // Graceful fallback
  const fallbackSpeaker: 'omni' | 'zeal' = addressInfo.speaker === 'zeal' ? 'zeal' : 'omni';
  return [
    {
      speaker: fallbackSpeaker,
      text: `Looking closely at your note on ${knowledgePack.noteTitle}, the key point to keep in mind is how this concept connects directly back to your primary study objectives.`,
      sourceRefs: [knowledgePack.sources[0]?.id || `src_note_${knowledgePack.noteId}`]
    }
  ];
}

/**
 * Generates an incremental discussion segment when new material is added to an existing note
 */
export async function generateIncrementalUpdateDiscussion(
  addedSources: SourceNode[],
  knowledgePack: NoteKnowledgePack,
  recentMessages: NotePodcastMessage[]
): Promise<GeneratedTurn[]> {
  const ai = getAiInstance();
  const addedSummary = addedSources.map(s => `[NEW SOURCE: ${s.id}] (${s.type}) "${s.name}":\n${s.extractedContent.slice(0, 800)}`).join('\n\n');

  const historySnippet = recentMessages.slice(-3).map(m => `${m.speaker}: ${m.text}`).join('\n');

  const prompt = `Two study podcast hosts (Omni and Zeal) notice that new material was just added to the student's study note:
New items added:
${addedSummary}

Previous conversation was on:
${historySnippet}

INSTRUCTIONS:
Generate 4-6 natural discussion turns where Zeal and Omni highlight this newly added material and discuss its significance.
Start naturally with something like:
Zeal: "There's something new in the material that connects to what we were discussing..."
Omni: "Yes, this new section adds..."
Dive straight into what the new material teaches and how it alters or enriches their understanding.
Cite the new source IDs in sourceRefs.

OUTPUT FORMAT:
JSON array:
[
  {
    "speaker": "zeal" | "omni",
    "text": "...",
    "sourceRefs": ["..."]
  }
]`;

  try {
    const res = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const raw = res.text || '';
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed: GeneratedTurn[] = JSON.parse(clean);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(p => ({
        speaker: p.speaker === 'zeal' ? 'zeal' : 'omni',
        text: p.text.trim(),
        sourceRefs: Array.isArray(p.sourceRefs) ? p.sourceRefs : []
      }));
    }
  } catch (e) {
    console.warn("Incremental update generation note:", e);
  }

  const primaryNewId = addedSources[0]?.id || 'new_src';
  return [
    {
      speaker: 'zeal',
      text: `There's something new added to your note that directly connects to what we were just covering. Notice how this newly added section expands on the definitions we discussed earlier.`,
      sourceRefs: [primaryNewId]
    },
    {
      speaker: 'omni',
      text: `Yes, this is an important addition. It provides the concrete context and details that reinforce the core principles in your study guide.`,
      sourceRefs: [primaryNewId]
    }
  ];
}

/**
 * Regenerates a single AI message using its original source nodes and surrounding context
 */
export async function regenerateSingleMessage(
  targetMessage: NotePodcastMessage,
  surroundingMessages: NotePodcastMessage[],
  knowledgePack: NoteKnowledgePack
): Promise<string> {
  const ai = getAiInstance();
  const supportingSources = knowledgePack.sources.filter(
    s => targetMessage.sourceRefs?.includes(s.id)
  );

  const sourcesText = supportingSources.length > 0 
    ? supportingSources.map(s => `[${s.name}]: ${s.extractedContent.slice(0, 500)}`).join('\n')
    : knowledgePack.noteText.slice(0, 800);

  const contextSnippet = surroundingMessages.map(m => `${m.speaker.toUpperCase()}: ${m.text}`).join('\n');

  const speakerName = targetMessage.speaker === 'zeal' ? 'ZEAL' : 'OMNI';
  const roleStyle = targetMessage.speaker === 'zeal' 
    ? 'perceptive discussion partner, identifying key definitions, asking sharp questions, challenging assumptions'
    : 'lead academic tutor, giving crystal clear explanations and analogies';

  const prompt = `Regenerate this specific message spoken by ${speakerName} in an academic study podcast:
Current message to improve/replace:
"${targetMessage.text}"

Surrounding conversation context:
${contextSnippet}

Supporting source evidence:
${sourcesText}

ROLE: You are ${speakerName} (${roleStyle}).
Make the explanation sharper, deeply grounded, warm, and natural.
Return ONLY the replacement text for this message. No speaker labels or extra quotes.`;

  try {
    const res = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const clean = (res.text || '').replace(/^(omni:|zeal:)\s*/i, '').trim();
    if (clean) return clean;
  } catch (err) {
    console.warn("Single message regeneration error:", err);
  }

  return targetMessage.text;
}
