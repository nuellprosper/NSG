import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XCircle, Settings } from 'lucide-react';

export interface LegalModalProps {
  legalPage: 'about' | 'terms' | 'privacy' | 'contact' | null;
  setLegalPage: (page: 'about' | 'terms' | 'privacy' | 'contact' | null) => void;
  theme: 'light' | 'dark';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  legalPage,
  setLegalPage,
  theme,
}) => {
  return (
    <AnimatePresence>
      {legalPage && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            className={`relative z-10 p-6 sm:p-8 rounded-3xl border shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar text-left ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'}`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">
                {legalPage === 'about' && "About Us"}
                {legalPage === 'terms' && "Terms & Conditions"}
                {legalPage === 'privacy' && "Privacy Policy"}
                {legalPage === 'contact' && "Contact Us"}
              </h2>
              <button onClick={() => setLegalPage(null)} className="text-white/40 hover:text-[#DC2626] transition-colors cursor-pointer">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-sm text-white/70 leading-relaxed">
              {legalPage === 'about' && (
                <>
                  <p>NSG is a cutting-edge educational tool designed to empower students and lifelong learners. We leverage advanced AI to simplify complex learning processes.</p>
                  <p>Our mission is to provide a seamless interface for capturing lecture content, analyzing it with state-of-the-art language models, and providing interactive tools like AI chat and custom quizzes to reinforce knowledge.</p>
                </>
              )}
              {legalPage === 'terms' && (
                <>
                  <p>By using NSG, you agree to the following terms:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>NSG is provided "as is" for educational purposes.</li>
                    <li>Users are responsible for the content they upload and record.</li>
                    <li>We do not guarantee 100% accuracy of AI-generated content.</li>
                    <li>Your data is stored locally on your device for privacy.</li>
                  </ul>
                </>
              )}
              {legalPage === 'privacy' && (
                <div className="space-y-4">
                  <p className="font-bold text-[#DC2626]">Last Updated: April 9, 2026</p>
                  <p>At NSG, we take your privacy seriously. This policy explains how we collect, use, and protect your data.</p>
                  
                  <h3 className="font-bold text-white">1. Information Collection</h3>
                  <p>We collect information you provide directly to us, such as your name, email address, and educational details when you create an account. We also collect audio recordings and text data you process through our AI tools.</p>
                  
                  <h3 className="font-bold text-white">2. Use of Data</h3>
                  <p>Your data is used to provide and improve our educational services, personalize your experience, and communicate with you about your account. We use advanced AI models to process your study materials.</p>
                  
                  <h3 className="font-bold text-white">3. Cookies & Google AdSense</h3>
                  <p>We use cookies to enhance your experience and analyze site traffic. We also use Google AdSense to serve advertisements. Google, as a third-party vendor, uses cookies to serve ads based on your visit to this and other sites on the Internet.</p>
                  <p>Users may opt out of personalized advertising by visiting Google's <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="text-[#DC2626] underline">Ads Settings</a>.</p>
                  
                  <h3 className="font-bold text-white">4. Data Security</h3>
                  <p>We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
                </div>
              )}
              {legalPage === 'contact' && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-[#DC2626]/10 rounded-full flex items-center justify-center mx-auto"><Settings size={32} className="text-[#DC2626]" /></div>
                  <p className="text-lg font-bold text-white">Need Assistance?</p>
                  <p>If you have any issues, pls contact us at:</p>
                  <div className="space-y-1 font-mono text-[#DC2626] font-bold">
                    <p>nuellkelechi@gmail.com</p>
                    <p>07046732569</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
