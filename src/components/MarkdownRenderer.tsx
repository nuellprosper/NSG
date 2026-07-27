import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export const MarkdownRenderer = ({ content, className = "", selectable = false }: { content: string, className?: string, selectable?: boolean }) => {
  // Pre-process content to ensure LaTeX is correctly formatted for remark-math
  // Handle both escaped \( \) and \[ \] as well as raw strings that AI might send
  let processedContent = (content || "")
    .replace(/\\\\\((.*?)\\\\\)/g, '$$$1$')
    .replace(/\\\\\[(.*?)\\\\\]/g, '$$$$$1$$$$')
    .replace(/\\\((.*?)\\\)/g, '$$$1$')
    .replace(/\\\[(.*?)\\\]/g, '$$$$$1$$$$');

  // Fix common AI forward-slash typos for accents/vectors (e.g. 2/hat/I or /hat{i} or /vec/v or 2\hat/I)
  processedContent = processedContent.replace(/[\/\\](hat|vec|bar|dot|ddot|tilde)[\/\s]*([a-zA-Z0-9]+)/gi, '\\$1{$2}');
  processedContent = processedContent.replace(/[\/\\](hat|vec|bar|dot|ddot|tilde)\{([a-zA-Z0-9]+)\}/gi, '\\$1{$2}');
  // Fix forward-slash for common LaTeX math keywords (e.g. /frac{, /sqrt{, /pi, /alpha, etc.)
  processedContent = processedContent.replace(/(^|[^a-zA-Z0-9\\$])\/(frac|sqrt|pi|theta|alpha|beta|gamma|delta|sigma|omega|lambda|mu|times|cdot|approx|neq|leq|geq|pm|mp|infty|circ|deg|int|sum|prod|sin|cos|tan|log|ln|lim|exp|left|right)\b/gi, '$1\\$2');

  // Helper to auto-wrap only math expressions within a line to avoid wrapping text
  const autoWrapMath = (text: string): string => {
    if (!text || !text.trim()) return text;
    
    // Protect existing math blocks
    const protectedBlocks: string[] = [];
    let processed = text.replace(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g, (match) => {
      protectedBlocks.push(match);
      return `__MATH_BLOCK_${protectedBlocks.length - 1}__`;
    });

    // Only auto-wrap if the text contains explicit LaTeX commands
    const explicitLatexPattern = /\\(frac|sqrt|hat|vec|bar|dot|ddot|tilde|sum|int|prod|lim|alpha|beta|gamma|delta|sigma|omega|lambda|theta|pi|mu|rho|tau|phi|psi|epsilon|eta|xi|zeta|approx|neq|leq|geq|pm|mp|infty)\b/;
    
    if (explicitLatexPattern.test(processed)) {
      const trimmed = processed.trim();
      if (trimmed && !trimmed.startsWith('__MATH_BLOCK_')) {
        processed = ` $${trimmed}$ `;
      }
    }

    // Restore protected blocks
    processed = processed.replace(/__MATH_BLOCK_(\d+)__/g, (_, idx) => {
      return protectedBlocks[parseInt(idx, 10)] || '';
    });

    return processed;
  };

  // Apply autoWrapMath to each line that doesn't already have math indicators
  processedContent = processedContent.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.includes('$')) {
      return line;
    }
    return autoWrapMath(line);
  }).join('\n');

  return (
    <div className={`markdown-body overflow-x-auto ${selectable ? 'select-text' : 'select-none'} selection:bg-[#DC2626]/20 custom-scrollbar ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]} 
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-base font-black uppercase tracking-tight text-white mb-2 mt-4 border-b border-white/10 pb-1" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-sm font-black uppercase tracking-tight text-white/95 mb-1.5 mt-3" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-xs font-bold uppercase tracking-tight text-white/90 mb-1 mt-2" {...props} />,
          p: ({node, ...props}) => <p className="leading-relaxed mb-3.5 text-white/85 text-xs sm:text-sm tracking-normal whitespace-pre-wrap font-sans font-medium" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3.5 space-y-1.5 text-white/85 text-xs sm:text-sm font-sans font-medium" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3.5 space-y-1.5 text-white/85 text-xs sm:text-sm font-sans font-medium" {...props} />,
          li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-red-500/50 bg-white/5 px-3 py-2 rounded-r-lg italic my-3 text-white/70 text-xs sm:text-sm" {...props} />,
          code({node, inline, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '');
            const rawCode = String(children || '').replace(/\n$/, '');
            return !inline ? (
              <div className="my-4 border border-white/10 rounded-xl overflow-hidden bg-[#0A0712] shadow-2xl relative">
                <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.05] text-[9px] font-mono text-white/40 uppercase tracking-widest">
                  <span>{match ? match[1] : 'code'}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(rawCode)}
                    className="hover:text-white transition-colors flex items-center gap-1 text-[8px] font-black tracking-wider uppercase"
                  >
                    Copy Block
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] sm:text-xs leading-5 font-mono text-red-400/90 whitespace-pre overflow-y-hidden custom-scrollbar">
                  <code {...props} className={className}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="px-1.5 py-0.5 rounded bg-white/10 text-red-400 font-mono text-xs font-semibold mx-0.5 select-all" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
