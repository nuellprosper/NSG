import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TruncatedUserMessageProps {
  text: string;
  maxChars?: number;
  className?: string;
}

export const TruncatedUserMessage: React.FC<TruncatedUserMessageProps> = ({
  text,
  maxChars = 260,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const lines = text.split('\n');
  const isTooLong = text.length > maxChars || lines.length > 5;

  let displayedText = text;
  if (isTooLong && !isExpanded) {
    if (lines.length > 5) {
      displayedText = lines.slice(0, 4).join('\n') + '...';
    } else {
      displayedText = text.slice(0, maxChars) + '...';
    }
  }

  return (
    <div className={`w-full max-w-full overflow-hidden select-text ${className}`}>
      <div 
        className="w-full text-sm font-medium tracking-tight text-white leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] break-words break-all"
        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
      >
        {displayedText}
      </div>

      {isTooLong && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider cursor-pointer bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 active:scale-95"
        >
          <span>{isExpanded ? 'Show less' : 'See more'}</span>
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}
    </div>
  );
};
