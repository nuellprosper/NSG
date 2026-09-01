import React from 'react';
import { Target, PlayCircle, Award, Sparkles, Zap } from 'lucide-react';

interface QuizReadyCardProps {
  quizId: string;
  topic: string;
  count: number | string;
  onOpenQuizById?: (quizId: string) => void;
  generateQuiz?: (topic?: string, count?: number, difficulty?: any, forceNew?: boolean) => Promise<any>;
}

export const QuizReadyCard: React.FC<QuizReadyCardProps> = ({
  quizId,
  topic,
  count,
  onOpenQuizById,
  generateQuiz
}) => {
  const cleanTopic = (topic || 'Study Practice Quiz')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .trim();
  const questionCount = typeof count === 'number' ? count : parseInt(String(count), 10) || 5;

  const handleTakeQuiz = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (quizId && onOpenQuizById) {
      onOpenQuizById(quizId.trim());
      return;
    }

    if (quizId) {
      const evt = new CustomEvent('open_quiz_by_id', { detail: { quizId: quizId.trim() } });
      window.dispatchEvent(evt);
    }

    if (generateQuiz) {
      generateQuiz(cleanTopic, questionCount, 'Medium', true);
    } else {
      const genEvt = new CustomEvent('trigger_quiz_gen', { detail: { topic: cleanTopic, count: questionCount } });
      window.dispatchEvent(genEvt);
    }
  };

  return (
    <div className="my-3 w-full max-w-lg rounded-2xl bg-gradient-to-br from-[#1A1528] via-[#141022] to-[#1F122B] border border-red-500/30 p-4 sm:p-5 shadow-xl shadow-red-950/20 text-left transition-all hover:border-red-500/50 group select-none">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-600/30 shrink-0">
            <Target size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-wider border border-red-500/30">
                AI Generated Quiz
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <Sparkles size={11} /> Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1 mb-4">
        <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight line-clamp-2 [overflow-wrap:anywhere] break-words">
          {cleanTopic}
        </h4>
        <div className="flex items-center gap-3 text-xs text-white/60 font-medium">
          <span className="flex items-center gap-1 text-white/80">
            <Award size={13} className="text-red-400" /> {questionCount} Questions
          </span>
          <span>•</span>
          <span className="text-purple-300 font-semibold">High-Yield Practice</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleTakeQuiz}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#DC2626] via-red-600 to-rose-600 hover:brightness-110 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
      >
        <PlayCircle size={16} className="fill-white/20" />
        <span>Take Quiz Now</span>
      </button>
    </div>
  );
};
