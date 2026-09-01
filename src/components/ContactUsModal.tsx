import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, X } from 'lucide-react';

export interface ContactUsModalProps {
  showContactUsModal: boolean;
  setShowContactUsModal: (show: boolean) => void;
}

export const ContactUsModal: React.FC<ContactUsModalProps> = ({
  showContactUsModal,
  setShowContactUsModal,
}) => {
  return (
    <AnimatePresence>
      {showContactUsModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#12101D] border border-white/10 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6 text-left shadow-2xl text-white relative"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                  <Mail size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Contact Us</h2>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">We are here to assist you 24/7</p>
                </div>
              </div>
              <button
                onClick={() => setShowContactUsModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-white/80 leading-relaxed font-sans">
                Have questions, feedback, subscription support, or technical issues? Reach out to our team directly through any of our official contact channels below:
              </p>

              <div className="space-y-3 pt-2">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/2347046732569"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 text-slate-950 font-black rounded-xl flex items-center justify-center text-lg">
                      💬
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">WhatsApp Support</p>
                      <p className="text-sm font-bold text-white font-mono">07046732569</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    Chat Now →
                  </span>
                </a>

                {/* Email 1 */}
                <a
                  href="mailto:nuellkelechi@gmail.com"
                  className="flex items-center justify-between p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Direct Admin Email</p>
                      <p className="text-xs font-bold text-white font-mono">nuellkelechi@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-400 group-hover:translate-x-1 transition-transform">
                    Send Email →
                  </span>
                </a>

                {/* Email 2 */}
                <a
                  href="mailto:nuellstudyguide@gmail.com"
                  className="flex items-center justify-between p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-blue-400 tracking-wider">Official Support Email</p>
                      <p className="text-xs font-bold text-white font-mono">nuellstudyguide@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
                    Send Email →
                  </span>
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowContactUsModal(false)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                Close Window
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
