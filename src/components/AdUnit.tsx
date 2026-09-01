import React, { useEffect, useRef, useState } from 'react';

export interface AdUnitProps {
  slot: string;
}

export const AdUnit: React.FC<AdUnitProps> = ({ slot }) => {
  const adRef = useRef<any>(null);
  const [isSandbox, setIsSandbox] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const isProd = hostname.includes("nsg.studios");
      setIsSandbox(!isProd);
    }
  }, []);

  useEffect(() => {
    if (isSandbox || !adRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          try {
            if (adRef.current && !adRef.current.getAttribute('data-adsbygoogle-status')) {
              const adsbygoogle = (window as any).adsbygoogle || [];
              adsbygoogle.push({});
              observer.disconnect();
            }
          } catch (e) {
            console.error("AdSense error:", e);
          }
        }
      }
    });

    observer.observe(adRef.current);
    return () => observer.disconnect();
  }, [isSandbox]);

  if (isSandbox) {
    return (
      <div className="my-5 p-4 rounded-2xl bg-[#13111C]/40 border border-[#DC2626]/20 flex flex-col items-center justify-center text-center w-full min-h-[70px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#DC2626]/5 to-transparent rounded-full pointer-events-none" />
        <span className="text-[7.5px] font-black text-[#DC2626] uppercase tracking-[0.3em] mb-1.5">🎓 NSG Academic Booster</span>
        <p className="text-[9.5px] font-black text-white/70 uppercase leading-snug max-w-md font-sans">
          "Tip: Leverage CBT Exams to evaluate course memory before major academic tests!"
        </p>
      </div>
    );
  }

  return (
    <div className="my-6 overflow-hidden flex flex-col items-center w-full min-h-[90px]">
      <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Advertisement</span>
      <ins className="adsbygoogle"
           ref={adRef}
           style={{ display: 'block', minWidth: '250px', minHeight: '90px' }}
           data-ad-client="ca-pub-3216169026195971"
           data-ad-slot={slot}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};
