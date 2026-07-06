import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, RefreshCcw, Sparkles, X, Zap, ShieldCheck, BookOpen, ChevronRight, 
  Trash2, Camera, Upload, History, Volume2, Square, Send, Image as ImageIcon, Mic, Brain 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThinkingLevel } from "@google/genai";
import { MarkdownRenderer } from './MarkdownRenderer';
import { cleanTextForSpeech } from '../lib/tts';
import { 
  robustJSONParse, fileToGenerativePart, isHfDepletedGlobal, handleHfErrorGlobal, 
  HF_MODELS, callOpenRouter, callTogetherAI, OPENROUTER_MODELS, LIMITS, FLASH_MODEL, MODEL_NAME,
  MediaFile, Course
} from '../utils';

export const COMMON_COURSES: Course[] = [
  { code: 'MTH 101', name: 'Elementary Mathematics I', description: 'Comprehensive coverage of limits, continuity, differentiation of algebraic functions, and integration basics. Includes algebraic structures and trigonometry.' },
  { code: 'PHY 101', name: 'General Physics I', description: 'Study of mechanics, properties of matter, and thermal physics. Covers motion, force, energy, and thermodynamics.' },
  { code: 'CHM 101', name: 'General Chemistry I', description: 'Fundamental principles of chemistry, atomic and molecular structure, chemical bonding, and stoichiometry.' },
  { code: 'CSC 101', name: 'Introduction to Computer Science', description: 'Foundations of computing, data representation, hardware components, and introduction to algorithms/programming logic.' },
  { code: 'GST 101', name: 'Use of English I', description: 'Focuses on communication skills, study techniques, library usage, and basic English grammar for academic excellence.' },
  { code: 'BIO 101', name: 'General Biology I', description: 'Cell biology, heredity, biodiversity, and ecosystem dynamics. Foundations of life sciences.' },
  { code: 'ECO 101', name: 'Principles of Economics I', description: 'Introduction to microeconomic analysis, including supply and demand, market structures, and consumer behavior.' },
  { code: 'BUS 101', name: 'Introduction to Business', description: 'The nature of business, entrepreneurship, organizational structures, and the functional areas of modern business.' }
];

export const CoursesTool = ({ theme, user, getAiInstance, getHfInstance, setUserNotification, setQuizTopic, setQuizQuestionCount, setQuizDifficulty, generateQuiz, setToolsSubTab, setQuizState, checkAndIncrementUsage }: any) => {
  const [courseSearch, setCourseSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedCourses, setSuggestedCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [activeCourseDesc, setActiveCourseDesc] = useState('');

  const handleSearch = async () => {
    if (!courseSearch.trim()) return;

    const canProceed = await checkAndIncrementUsage('QUIZ'); // Using QUIZ limit for search
    if (!canProceed) return;

    setIsSearching(true);
    setSuggestedCourses([]);
    
    try {
      const prompt = `
        Search context: "${courseSearch}".
        Generate exactly 3 relevant academic courses based on this topic or course code.
        Return ONLY a JSON array of objects with fields: "code", "name", "description".
        Example: [{"code": "MTH101", "name": "Linear Algebra", "description": "Introduction to vectors and matrices"}]
        
        CRITICAL: For any math symbols or codes in 'name' or 'description', use LaTeX $...$.
      `;
      
      const aiInstance = getAiInstance();
      const response = await aiInstance.models.generateContent({
        model: FLASH_MODEL,
        contents: { parts: [{ text: prompt }] },
        config: { 
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
        }
      });
      
      const text = response?.text || "";
      const cleanedText = text.replace(/```json|```/g, '').trim();
      const courses = JSON.parse(cleanedText);
      setSuggestedCourses(Array.isArray(courses) ? courses : []);
    } catch (err) {
      console.error("Course Search Error:", err);
      setUserNotification("Failed to search courses. Please try a different term.");
    } finally {
      setIsSearching(false);
    }
  };

  const openCourse = async (course: Course) => {
    setSelectedCourse(course);
    setIsGeneratingDesc(true);
    setActiveCourseDesc(course.description); // Start with default or existing

    try {
      const canProceed = await checkAndIncrementUsage('QUIZ');
      if (!canProceed) {
        setIsGeneratingDesc(false);
        return;
      }

      // Use Hugging Face for a "deeper" AI generated description as requested
      const hf = getHfInstance();
      const prompt = `Provide a detailed academic description (approx 100 words) for the university course ${course.code}: ${course.name}. Explain what students will learn.`;
      
      // Try Hugging Face first (if not depleted), fallback to Gemini
      let descResult = "";
      
      const tryHF = async () => {
        if (isHfDepletedGlobal) return null;
        try {
          const response = await hf.chatCompletion({
            model: HF_MODELS.TEXT,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 250,
            temperature: 0.7
          });
          return response.choices[0].message.content || null;
        } catch (e) {
          handleHfErrorGlobal(e, "CourseDesc");
          return null;
        }
      };

      const tryGemini = async () => {
        try {
          const ai = getAiInstance();
          const res = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });
          return res.text || null;
        } catch (e) {
          console.error("Gemini fallback failed for description:", e);
          return null;
        }
      };

      const tryOpenRouter = async () => {
        return await callOpenRouter(prompt, OPENROUTER_MODELS.TEXT_FAST);
      };

      const tryTogether = async () => {
        return await callTogetherAI(prompt);
      };

      descResult = await tryHF() || await tryGemini() || await tryTogether() || await tryOpenRouter() || "";

      if (descResult) {
        setActiveCourseDesc(descResult.trim());
      }
    } catch (err) {
      console.error("HF Description Generator Error:", err);
      // Fallback to default description already in state
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const startCourseTool = (type: 'quiz' | 'exam', qCount: number, difficulty: string) => {
    if (!selectedCourse) return;
    
    setQuizTopic(`${selectedCourse.code}: ${selectedCourse.name} - ${activeCourseDesc}`);
    setQuizQuestionCount(qCount);
    setQuizDifficulty(difficulty);
    
    // Switch tab and trigger generation
    setToolsSubTab(type === 'quiz' ? 'quiz' : 'exam');
    setQuizState('idle'); // Ensure clean state
    
    // We need to trigger the generation after a brief delay to allow state updates to settle, 
    // or better, if the toolsSubTab is switched, the tool itself should pick up the topic.
    setUserNotification(`Preparing ${type.toUpperCase()} for ${selectedCourse.code}...`);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className={`p-4 rounded-3xl border ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} shadow-sm flex items-center gap-3`}>
        <div className="bg-[#DC2626]/10 p-2 rounded-xl text-[#DC2626]">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          value={courseSearch}
          onChange={(e) => setCourseSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search course code or topic (e.g. MTH 101)" 
          className={`flex-1 bg-transparent border-none outline-none text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
        />
        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="bg-[#DC2626] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#DC2626]/90 transition-all disabled:opacity-50"
        >
          {isSearching ? <RefreshCcw size={14} className="animate-spin" /> : 'Search'}
        </button>
      </div>

      {suggestedCourses.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-[#DC2626] uppercase tracking-[0.2em] ml-2">Recommended</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {suggestedCourses.map((c, i) => (
              <button 
                key={i} 
                onClick={() => openCourse(c)}
                className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-[#DC2626]/30' : 'bg-white border-slate-100 hover:border-[#DC2626]/30 shadow-sm'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#DC2626] font-mono text-[10px] font-black">{c.code}</span>
                  <Sparkles size={12} className="text-yellow-500" />
                </div>
                <h4 className={`text-xs font-black truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{c.name}</h4>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCourse ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 sm:p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} shadow-xl relative overflow-hidden`}
        >
          <button 
            onClick={() => setSelectedCourse(null)} 
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 transition-all"
          >
            <X size={20} className="text-white/20" />
          </button>

          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[#DC2626] font-mono text-sm font-black tracking-widest">{selectedCourse.code}</span>
              <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedCourse.name}</h3>
            </div>

            <div className={`p-6 rounded-3xl border italic ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white/70' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
              {isGeneratingDesc ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <RefreshCcw size={24} className="animate-spin text-[#DC2626]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#DC2626]">Expanding Curriculum...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <MarkdownRenderer content={activeCourseDesc} className="text-sm leading-relaxed" />
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-black uppercase tracking-tighter opacity-50 uppercase">Verified Curriculum Description</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button 
                onClick={() => startCourseTool('quiz', 20, 'Medium')}
                className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/20 hover:scale-[1.05] transition-all"
              >
                <Zap size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Take Smart Quiz</span>
              </button>
              <button 
                onClick={() => startCourseTool('exam', 50, 'Professional')}
                className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-gradient-to-br from-[#DC2626] to-red-800 text-white shadow-lg shadow-[#DC2626]/20 hover:scale-[1.05] transition-all"
              >
                <ShieldCheck size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Take CBT Exam</span>
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Common Courses</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMMON_COURSES.map((c, i) => (
              <button 
                key={i} 
                onClick={() => openCourse(c)}
                className={`flex items-center gap-5 p-5 rounded-[2rem] border transition-all hover:border-[#DC2626]/50 group ${theme === 'dark' ? 'bg-[#13111C] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 flex flex-col items-center justify-center border border-white/5 group-hover:scale-110 transition-transform`}>
                   <BookOpen size={20} className="text-[#DC2626]" />
                   <span className="text-[8px] font-bold mt-1 text-white/30">{c.code}</span>
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <h4 className={`font-black text-xs uppercase tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{c.name}</h4>
                  <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} truncate uppercase`}>{c.description}</p>
                </div>
                <ChevronRight size={16} className="text-white/10 group-hover:text-[#DC2626] transition-all" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const AssignmentSolver = ({ theme, user, isPremium, getAiInstance, setUserNotification, setChatHistory, setActiveTab, setActiveChatSessionId, addToFinishedHistory, finishedHistory, solution, setSolution, checkAndIncrementUsage }: any) => {
  const [images, setImages] = useState<MediaFile[]>([]);
  const [assignmentText, setAssignmentText] = useState("");
  const [isSolving, setIsSolving] = useState(false);
  const [userWorkings, setUserWorkings] = useState<{
    [stepIdx: number]: {
      imagePreview?: string;
      imageFile?: File;
      analysis?: string;
      isAnalyzing?: boolean;
      transcript?: string;
    }
  }>({});
  const [expandedReplies, setExpandedReplies] = useState<{[key: number]: boolean}>({});
  const [isListening, setIsListening] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const limits = isPremium ? LIMITS.ASSIGNMENT.PREMIUM : LIMITS.ASSIGNMENT.NORMAL;

  // Auto-scroll to results when they appear
  useEffect(() => {
    if (solution && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1000);
    }
  }, [solution]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = limits.IMAGES;
    
    if (images.length + files.length > maxFiles) {
      setUserNotification(`Subscription Limit: ${isPremium ? 'Premium' : 'Free'} users can only upload up to ${maxFiles} image(s) for assignment solving.`);
      return;
    }

    const mapped = files.map(f => ({
      id: Math.random().toString(36).substr(2, 11),
      file: f,
      preview: URL.createObjectURL(f),
      type: 'image' as const
    }));
    
    setImages(prev => [...prev, ...mapped]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.preview) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleWorkingUpload = (stepIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const preview = URL.createObjectURL(file);
    setUserWorkings(prev => ({
      ...prev,
      [stepIdx]: {
        ...prev[stepIdx],
        imagePreview: preview,
        imageFile: file,
        analysis: undefined
      }
    }));

    // Auto-trigger analysis
    setTimeout(() => {
      checkWorking(stepIdx, file);
    }, 100);
  };

  const removeWorkingImage = (stepIdx: number) => {
    setUserWorkings(prev => {
      const working = prev[stepIdx];
      if (working?.imagePreview) URL.revokeObjectURL(working.imagePreview);
      const newState = { ...prev };
      delete newState[stepIdx];
      return newState;
    });
  };

  const startListening = (stepIdx: number) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setUserNotification("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    setIsListening(stepIdx);
    let hasResult = false;
    
    recognition.onresult = async (event: any) => {
      hasResult = true;
      const transcript = event.results[0][0].transcript;
      setIsListening(null);
      analyzeTextWorking(stepIdx, transcript);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech Error:", e);
      setIsListening(null);
      if (!hasResult && e.error !== 'no-speech' && e.error !== 'aborted') {
        setUserNotification(`Speech recognition failed: ${e.error || "unknown"}`);
      }
    };

    recognition.onend = () => {
      setIsListening(null);
    };

    recognition.start();
  };

  const analyzeTextWorking = async (stepIdx: number, text: string) => {
    const canProceed = await checkAndIncrementUsage('ASSIGNMENT');
    if (!canProceed) return;

    setUserWorkings(prev => ({
      ...prev,
      [stepIdx]: { ...prev[stepIdx], isAnalyzing: true, transcript: text }
    }));

    try {
      const ai = getAiInstance();
      const stepData = solution?.steps[stepIdx];

      const prompt = `
        You are an expert tutor. A student is orally describing how they solved a specific step of an assignment.
        The correct step solution is: "${stepData?.step}"
        The logical explanation is: "${stepData?.explanation}"
        
        Student's oral transcription: "${text}"
        
        Analyze their explanation:
        1. Be LITERALLY accurate about what they said.
        2. Identify if their logic is fundamentally correct compared to the ideal solution.
        3. Be encouraging and supportive.
        4. Explain any conceptual errors clearly.
        5. Use LaTeX for ALL math ($...$).
        
        CRITICAL: Keep your reply very short, direct, and under 4 lines.
      `;

      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: { parts: [{ text: prompt }] },
        config: { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } }
      });

      setUserWorkings(prev => ({
        ...prev,
        [stepIdx]: { ...prev[stepIdx], isAnalyzing: false, analysis: response?.text || "" }
      }));
      setUserNotification("Working analyzed!");
    } catch (err: any) {
      console.error("Text Analysis Error:", err);
      setUserWorkings(prev => ({
        ...prev,
        [stepIdx]: { ...prev[stepIdx], isAnalyzing: false }
      }));
    }
  };

  const checkWorking = async (stepIdx: number, providedFile?: File) => {
    const fileToUse = providedFile || userWorkings[stepIdx]?.imageFile;
    
    if (!fileToUse) {
      setUserNotification("Please upload an image of your workings first.");
      return;
    }

    const canProceed = await checkAndIncrementUsage('ASSIGNMENT');
    if (!canProceed) return;

    setUserWorkings(prev => {
      const current = prev[stepIdx] || {};
      return {
        ...prev,
        [stepIdx]: { 
          ...current, 
          isAnalyzing: true,
          imageFile: fileToUse,
          imagePreview: current.imagePreview || URL.createObjectURL(fileToUse)
        }
      };
    });

    try {
      const ai = getAiInstance();
      const imagePart = await fileToGenerativePart(fileToUse);
      const stepData = solution?.steps[stepIdx];

      const prompt = `
        You are an expert tutor. A student is trying to solve a specific step of an assignment.
        The correct step solution is: "${stepData?.step}"
        The logical explanation is: "${stepData?.explanation}"
        
        Analyze the student's uploaded image of their working.
        1. Identify if they are correct or where they made a mistake.
        2. Be encouraging like a teacher.
        3. If there is a mistake, explain exactly where it happened and how to fix it.
        4. Use LaTeX for math.
        
        CRITICAL: Keep your reply very short, straight to the point, and under 4 lines if possible.
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts: [{ text: prompt }, { inlineData: imagePart.inlineData }] }
      });

      setUserWorkings(prev => {
        const current = prev[stepIdx] || {};
        return {
          ...prev,
          [stepIdx]: { ...current, isAnalyzing: false, analysis: response?.text || "" }
        };
      });
      setUserNotification("Working analyzed successfully!");
    } catch (err: any) {
      console.error("Check Working Error:", err);
      setUserWorkings(prev => {
        const current = prev[stepIdx] || {};
        return {
          ...prev,
          [stepIdx]: { ...current, isAnalyzing: false }
        };
      });
      setUserNotification("Could not analyze image. Please try again.");
    }
  };

  const deleteAnalysis = (stepIdx: number) => {
    setUserWorkings(prev => ({
      ...prev,
      [stepIdx]: {
        ...prev[stepIdx],
        analysis: undefined
      }
    }));
  };

  const clearAll = () => {
    images.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
    setImages([]);
    setSolution(null);
  };

  const solveAssignment = async () => {
    if (images.length === 0 && !assignmentText.trim()) {
      setUserNotification("Please provide assignment content (image or text).");
      return;
    }

    const canProceed = await checkAndIncrementUsage('ASSIGNMENT');
    if (!canProceed) return;

    setIsSolving(true);
    setSolution(null);

    try {
      const ai = getAiInstance();
      const imageParts = await Promise.all(images.map(img => fileToGenerativePart(img.file)));

      const prompt = `
        You are an expert academic tutor.
        ${assignmentText ? `The student has provided this text: "${assignmentText}"` : ""}
        ${images.length > 0 ? "Analyze these assignment images." : ""}
        
        Solve the problems step-by-step with clear, educational explanations.
        
        CRITICAL: Use LaTeX for ALL mathematical expressions, variables, and formulas.
        - Use $ ... $ for inline math (e.g., $x^2 + y = 10$).
        - Use $$ ... $$ for large multi-line equations or important formulas.
        - Never leave raw symbols like ^ or _ outside of LaTeX delimiters.
        
        Return ONLY a JSON object:
        {
          "title": "Unified Problem Title",
          "steps": [
            { "step": "Clear calculation/step using LaTeX", "explanation": "Why this was done using LaTeX" }
          ],
          "summary": "Final concise answer using LaTeX"
        }
      `;

      const askGemini = async () => {
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: { parts: [{ text: prompt }, ...imageParts.map(p => ({ inlineData: p.inlineData }))] },
          config: { responseMimeType: "application/json" }
        });
        return response?.text || null;
      };

      const askOpenRouter = async () => {
        const orPrompt = prompt + "\n\nNote: If images were provided, they have been analyzed by vision models previously. Please provide the best possible logic based on text context.";
        return await callOpenRouter(orPrompt, OPENROUTER_MODELS.TEXT_PRO);
      };

      const askTogether = async () => {
        return await callTogetherAI(prompt);
      };

      const responseText = await askGemini() || await askTogether() || await askOpenRouter() || "";
      
      try {
        const data = robustJSONParse(responseText);
        
        if (!data || !data.steps || !Array.isArray(data.steps)) {
          console.warn("AI returned missing or invalid steps array, attempting to recover...");
          const steps = (data && (data.steps || data.solution || data.answer)) ? 
            (Array.isArray(data.steps) ? data.steps : [{ step: data.solution || data.answer || "Calculation complete", explanation: data.reasoning || data.logic || "Derived from analysis." }]) 
            : [{ step: "Analysis Result", explanation: responseText.slice(0, 500) }];
          
          if (data) {
            data.steps = steps;
          } else {
            // Error handled below
          }
        }
        
        setSolution(data);
        addToFinishedHistory({
          id: `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: data.title || "Assignment Solution",
          type: 'assignment',
          date: new Date().toLocaleDateString(),
          timestamp: Date.now(),
          data: data
        });
        setUserNotification("Step-by-step solution generated!");
      } catch (parseError: any) {
        console.error("Parse Issue:", parseError);
        throw new Error(parseError.message || "Invalid AI response structure. Please try again.");
      }
    } catch (err: any) {
      console.error("Assignment Solve Error:", err);
      setUserNotification(err.message || "Failed to solve assignment. Please try again.");
    } finally {
      setIsSolving(false);
    }
  };

  const speakSolution = () => {
    if (!solution) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = `Solution for ${solution.title}. ` + 
      solution.steps.map((s: any, i: number) => `Step ${i + 1}: ${s.step}. ${s.explanation}`).join('. ') + 
      `. Summary: ${solution.summary}`;

    const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text));
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const sendToOmni = () => {
    if (!solution) return;
    const formatted = `### ${solution.title}\n\n` + 
      solution.steps.map((s: any, i: number) => `**Step ${i + 1}**: ${s.step}\n*${s.explanation}*`).join('\n\n') +
      `\n\n**Final Result**: ${solution.summary}`;

    setChatHistory((prev: any) => [...prev, 
      { role: 'user', text: "Deep dive into this solution.", timestamp: new Date().toLocaleTimeString() },
      { role: 'model', text: formatted, timestamp: new Date().toLocaleTimeString() }
    ]);
    setActiveTab('ai');
    setActiveChatSessionId(null);
    setUserNotification("Exported to Omni Chat!");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 pb-20">
      <div className={`p-10 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} shadow-sm text-center relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-4">
          {images.length > 0 && (
            <button onClick={clearAll} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="w-16 h-16 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen size={32} className="text-[#DC2626]" />
        </div>
        <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Assignment Solver</h2>
        
        {finishedHistory.filter((i: any) => i.type === 'assignment').length > 0 && (
          <div className="mb-6 -mx-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#DC2626] mb-3 px-2">Recently Solved</p>
            <div className="flex gap-3 overflow-x-auto pb-2 px-2 no-scrollbar">
              {finishedHistory.filter((i: any) => i.type === 'assignment').slice(0, 10).map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => setSolution(item.data)}
                  className="flex-shrink-0 w-32 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#DC2626]/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <History size={10} className="text-[#DC2626]" />
                    <span className="text-[8px] font-black uppercase text-white/40 truncate">{item.date}</span>
                  </div>
                  <p className="text-[10px] font-bold text-white/80 line-clamp-1 group-hover:text-white transition-colors">{item.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} mt-1 mb-8`}>Upload up to 5 images for detailed academic solutions.</p>

        <div className="space-y-6">
          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest text-[#DC2626]">Assignment Details (Text)</label>
             <textarea 
                value={assignmentText}
                onChange={(e) => setAssignmentText(e.target.value)}
                className={`w-full p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#13111C] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} text-xs resize-none outline-none focus:border-[#DC2626]/50 min-h-[120px] transition-all`}
                placeholder="Type or paste your assignment questions here..."
             />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#DC2626]">Upload Photos</label>
            <div className="flex flex-wrap gap-4 justify-center">
              <AnimatePresence>
                {images.map(img => (
                  <motion.div key={img.id} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="relative group">
                    <img src={img.preview} className={`w-24 h-24 object-cover rounded-2xl border-2 ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'} shadow-xl`} />
                    <button onClick={() => removeImage(img.id)} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {images.length < 5 && (
                <div className="flex gap-3">
                  <label className={`w-24 h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${theme === 'dark' ? 'border-white/10 text-white/20 hover:border-[#DC2626]/40 hover:text-[#DC2626]' : 'border-slate-200 text-slate-300 hover:border-[#DC2626]/40 hover:text-[#DC2626]'}`}>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    <Upload size={24} />
                    <span className="text-[8px] font-black uppercase mt-1">Gallery</span>
                  </label>
                  <label className={`w-24 h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${theme === 'dark' ? 'border-white/10 text-white/20 hover:border-[#DC2626]/40 hover:text-[#DC2626]' : 'border-slate-200 text-slate-300 hover:border-[#DC2626]/40 hover:text-[#DC2626]'}`}>
                    <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                    <Camera size={24} />
                    <span className="text-[8px] font-black uppercase mt-1">Camera</span>
                  </label>
                </div>
              )}
            </div>
            <p className={`text-[9px] text-center ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>Max 5 photos allowed</p>
          </div>

          <button
            onClick={solveAssignment}
            disabled={isSolving || (images.length === 0 && !assignmentText.trim())}
            className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-5 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
          >
            {isSolving ? <><RefreshCcw size={18} className="animate-spin" /> Analyzing...</> : <><Sparkles size={18} /> Solve Assignment</>}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {solution && (
          <motion.div 
            ref={resultsRef}
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="space-y-6 pt-10"
          >
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse" />
                <h3 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {solution.title || "Calculated Solution"}
                </h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={speakSolution} 
                  title={isSpeaking ? "Stop Voice" : "Listen to solution"}
                  className={`p-3 rounded-2xl border transition-all ${isSpeaking ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-lg shadow-[#DC2626]/20' : `${theme === 'dark' ? 'bg-[#13111C] border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-400'} hover:border-[#DC2626] hover:text-[#DC2626]`}`}
                >
                  {isSpeaking ? <Square size={20} fill="currentColor" /> : <Volume2 size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {solution.steps?.map((step: any, idx: number) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: idx * 0.1 }}
                  className={`p-5 sm:p-6 rounded-[2rem] border relative overflow-hidden group transition-all duration-300 ${theme === 'dark' ? 'bg-[#13111C] border-white/10 hover:border-[#DC2626]/30' : 'bg-white border-slate-100 hover:border-[#DC2626]/30 shadow-md shadow-black/5'}`}
                >
                  <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    <span className="text-9xl font-black italic">{idx + 1}</span>
                  </div>
                  <div className="flex gap-5 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-[#DC2626]/20">
                      {idx + 1}
                    </div>
                    <div className="space-y-4 pt-1 flex-1 min-w-0">
                      <div>
                        <p className="text-[10px] font-black text-[#DC2626] uppercase tracking-[0.3em] mb-2 opacity-80">Step Solution</p>
                        <MarkdownRenderer content={step.step} className={`text-lg font-black leading-snug ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} />
                      </div>
                      <div className={`pt-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                        <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-2 ${theme === 'dark' ? 'text-[#DC2626]' : 'text-[#DC2626]'}`}>The Logical Why</p>
                        <MarkdownRenderer content={step.explanation} className={`text-[13px] leading-relaxed font-medium ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`} />
                      </div>

                      {/* STUDENT INTERACTION - COMPACT */}
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500/80">Student Workings</p>
                          <div className="flex gap-2">
                             <label className="p-1.5 cursor-pointer bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-all border border-blue-500/20 shadow-sm shadow-blue-500/10">
                               <input type="file" accept="image/*" onChange={(e) => handleWorkingUpload(idx, e)} className="hidden" />
                               <ImageIcon size={12} />
                             </label>
                             <button 
                               onClick={() => startListening(idx)}
                               className={`p-1.5 rounded-lg border transition-all ${isListening === idx ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' : 'bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-sm shadow-purple-500/10'}`}
                             >
                                <Mic size={12} />
                             </button>
                             <button 
                               onClick={() => checkWorking(idx)}
                               disabled={!userWorkings[idx]?.imageFile || userWorkings[idx]?.isAnalyzing}
                               className={`p-1.5 rounded-lg border transition-all ${userWorkings[idx]?.imageFile ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-sm shadow-green-500/10' : 'bg-white/5 text-white/20 border-white/5'}`}
                             >
                                <Brain size={12} />
                             </button>
                          </div>
                        </div>

                        {userWorkings[idx]?.imagePreview && (
                          <div className="flex items-start gap-3">
                             <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 group/working-img">
                                <img src={userWorkings[idx].imagePreview} className="w-full h-full object-cover" />
                                {userWorkings[idx].isAnalyzing && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                     <RefreshCcw size={14} className="text-white animate-spin" />
                                  </div>
                                )}
                                <button 
                                  onClick={() => removeWorkingImage(idx)}
                                  className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md opacity-0 group-hover/working-img:opacity-100 transition-opacity z-10"
                                  title="Remove image"
                                >
                                  <X size={10} />
                                </button>
                             </div>
                             {(userWorkings[idx]?.analysis || userWorkings[idx]?.transcript) && (
                               <div className="flex-1 p-3 bg-white/5 rounded-xl border border-white/10 space-y-2 relative group min-w-0">
                                 {userWorkings[idx]?.analysis && (
                                   <button 
                                     onClick={() => deleteAnalysis(idx)}
                                     className="absolute top-2 right-2 p-1 text-white/40 hover:text-red-500 transition-colors opacity-30 group-hover:opacity-100 z-20"
                                     title="Delete feedback"
                                   >
                                     <Trash2 size={12} />
                                   </button>
                                 )}
                                 {userWorkings[idx]?.transcript && (
                                   <div className="flex items-center gap-2 mb-1 opacity-50 shrink-0">
                                      <Mic size={10} />
                                      <p className="text-[8px] font-bold italic truncate">"{userWorkings[idx].transcript}"</p>
                                   </div>
                                 )}
                                 {userWorkings[idx].analysis && (
                                   <>
                                     <div className={`${!expandedReplies[idx] ? 'max-h-[100px] overflow-y-auto' : ''} transition-all duration-300 relative custom-scrollbar`}>
                                       <MarkdownRenderer content={userWorkings[idx].analysis} className="text-[11px] leading-relaxed text-white/70" />
                                       {!expandedReplies[idx] && userWorkings[idx].analysis.length > 150 && (
                                         <div className="sticky bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#13111C] to-transparent pointer-events-none" />
                                       )}
                                     </div>
                                     {userWorkings[idx].analysis.length > 150 && (
                                       <button 
                                         onClick={() => setExpandedReplies(prev => ({...prev, [idx]: !prev[idx]}))}
                                         className="text-[9px] font-black uppercase text-blue-500 mt-2 hover:underline inline-block shrink-0"
                                       >
                                         {expandedReplies[idx] ? 'See Part' : 'See All'}
                                       </button>
                                     )}
                                   </>
                                 )}
                               </div>
                             )}
                          </div>
                        )}
                        {userWorkings[idx]?.transcript && !userWorkings[idx]?.imagePreview && (
                           <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2 relative group">
                              {userWorkings[idx]?.analysis && (
                                <button 
                                  onClick={() => deleteAnalysis(idx)}
                                  className="absolute top-2 right-2 p-1 text-white/40 hover:text-red-500 transition-colors opacity-30 group-hover:opacity-100 z-20"
                                  title="Delete feedback"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                              <div className="flex items-center gap-2 mb-1 opacity-50 shrink-0">
                                 <Mic size={10} />
                                 <p className="text-[8px] font-bold italic truncate">"{userWorkings[idx].transcript}"</p>
                              </div>
                              {userWorkings[idx].analysis && (
                                <>
                                  <div className={`${!expandedReplies[idx] ? 'max-h-[100px] overflow-y-auto' : ''} transition-all duration-300 relative custom-scrollbar`}>
                                    <MarkdownRenderer content={userWorkings[idx].analysis} className="text-[11px] leading-relaxed text-white/70" />
                                    {!expandedReplies[idx] && userWorkings[idx].analysis.length > 150 && (
                                      <div className="sticky bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#0A0F1C] to-transparent pointer-events-none" />
                                    )}
                                  </div>
                                  {userWorkings[idx].analysis.length > 150 && (
                                    <button 
                                      onClick={() => setExpandedReplies(prev => ({...prev, [idx]: !prev[idx]}))}
                                      className="text-[9px] font-black uppercase text-blue-500 mt-2 hover:underline inline-block shrink-0"
                                    >
                                      {expandedReplies[idx] ? 'See Part' : 'See All'}
                                    </button>
                                  )}
                                </>
                              )}
                           </div>
                        )}
                        {!userWorkings[idx]?.imagePreview && !userWorkings[idx]?.transcript && (
                          <p className="text-[8px] text-white/20 italic">"Ok Student, let me see your solvings for this step..."</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`p-6 sm:p-8 rounded-[2.5rem] border text-center shadow-2xl relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-[#DC2626]/20 via-[#13111C] to-transparent border-[#DC2626]/30 shadow-[#DC2626]/10' : 'bg-gradient-to-br from-[#DC2626]/5 via-white to-transparent border-[#DC2626]/20'}`}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#DC2626] to-transparent opacity-30" />
                <p className="text-[10px] font-black text-[#DC2626] uppercase tracking-[0.5em] mb-4">Final Concensus</p>
                <div className="relative inline-block">
                  <MarkdownRenderer content={solution.summary} className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} />
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#DC2626]/20 rounded-full blur-sm" />
                </div>
              </motion.div>
            </div>
            
            <div className="flex justify-center pb-10">
              <button 
                onClick={clearAll} 
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40 hover:text-red-500' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-red-500'}`}
              >
                <Trash2 size={16} /> Clear Results & Start Over
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
