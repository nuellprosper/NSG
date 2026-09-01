import React from 'react';
import { motion } from 'motion/react';
import { XCircle, Send, Save, User, Check } from 'lucide-react';

export interface PublishArticleModalProps {
  isAddingPost: boolean;
  setIsAddingPost: (v: boolean) => void;
  theme: string;
  newPost: { title: string; content: string };
  setNewPost: React.Dispatch<React.SetStateAction<{ title: string; content: string }>>;
  handleAddPost: (e: React.FormEvent) => void;
}

export const PublishArticleModal: React.FC<PublishArticleModalProps> = ({
  isAddingPost,
  setIsAddingPost,
  theme,
  newPost,
  setNewPost,
  handleAddPost,
}) => {
  if (!isAddingPost) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${
          theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'
        } border rounded-3xl p-8 max-w-2xl w-full space-y-6 shadow-2xl`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Publish New Article</h3>
          <button
            onClick={() => setIsAddingPost(false)}
            className="text-white/40 hover:text-[#DC2626] transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        <form onSubmit={handleAddPost} className="space-y-4">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Article Title</p>
            <input
              type="text"
              required
              placeholder="Enter a bold, catchy title..."
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all"
            />
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">
              Article Content (Markdown Supported)
            </p>
            <textarea
              required
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none text-white h-60 resize-none focus:border-[#DC2626]/50 transition-all"
              placeholder="Write full article markdown here..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsAddingPost(false)}
              className="flex-1 bg-white/5 text-white/60 font-bold py-4 rounded-2xl text-sm"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-[2] bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2"
            >
              <Send size={16} /> PUBLISH ARTICLE
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export interface EditArticleModalProps {
  isEditingPost: boolean;
  setIsEditingPost: (v: boolean) => void;
  editingPost: any;
  setEditingPost: (post: any) => void;
  theme: string;
  handleUpdatePost: (e: React.FormEvent) => void;
  deletePost?: (id: string) => void;
}

export const EditArticleModal: React.FC<EditArticleModalProps> = ({
  isEditingPost,
  setIsEditingPost,
  editingPost,
  setEditingPost,
  theme,
  handleUpdatePost,
  deletePost,
}) => {
  if (!isEditingPost || !editingPost) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${
          theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'
        } border rounded-3xl p-8 max-w-2xl w-full space-y-6 shadow-2xl`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Edit Article</h3>
          <button
            onClick={() => setIsEditingPost(false)}
            className="text-white/40 hover:text-[#DC2626] transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        <form onSubmit={handleUpdatePost} className="space-y-4">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Article Title</p>
            <input
              type="text"
              required
              value={editingPost.title || ''}
              onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all"
            />
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Article Content</p>
            <textarea
              required
              value={editingPost.content || ''}
              onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none text-white h-60 resize-none focus:border-[#DC2626]/50 transition-all"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsEditingPost(false)}
              className="flex-1 bg-white/5 text-white/60 font-bold py-4 rounded-2xl text-sm"
            >
              CANCEL
            </button>
            {deletePost && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this article?')) {
                    deletePost(editingPost.id);
                    setIsEditingPost(false);
                  }
                }}
                className="bg-red-500/20 text-red-400 font-bold px-4 py-4 rounded-2xl text-xs"
              >
                DELETE
              </button>
            )}
            <button
              type="submit"
              className="flex-[2] bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2"
            >
              <Save size={16} /> SAVE CHANGES
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export interface AdminEditUserModalProps {
  editingUser: any;
  setEditingUser: (u: any) => void;
  theme: string;
  handleEditUser: (e: React.FormEvent) => void;
}

export const AdminEditUserModal: React.FC<AdminEditUserModalProps> = ({
  editingUser,
  setEditingUser,
  theme,
  handleEditUser,
}) => {
  if (!editingUser) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`${
          theme === 'dark' ? 'bg-[#13111C] border-purple-500/30' : 'bg-white border-slate-200'
        } border rounded-3xl p-5 md:p-8 max-w-lg w-full max-h-[95vh] overflow-y-auto custom-scrollbar space-y-4 md:space-y-6 flex flex-col shadow-2xl`}
      >
        <div className="text-center space-y-1 pb-2 border-b border-purple-500/20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase tracking-wider">
            <User size={12} className="text-purple-400" /> Admin Command Override
          </div>
          <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">Modify Student Profile</h3>
          <p className="text-[10px] text-purple-300/60 font-medium uppercase tracking-widest">
            {editingUser.email || editingUser.username || editingUser.id}
          </p>
        </div>

        <form onSubmit={handleEditUser} className="space-y-4 pb-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Full Name</p>
              <input
                type="text"
                value={editingUser.fullName || editingUser.displayName || ''}
                onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all"
                placeholder="Full Name"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Username</p>
              <input
                type="text"
                value={editingUser.username || ''}
                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all"
                placeholder="Username"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Email</p>
              <input
                type="email"
                value={editingUser.email || ''}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all"
                placeholder="Email address"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Gender</p>
              <select
                value={editingUser.gender || 'Male'}
                onChange={(e) => setEditingUser({ ...editingUser, gender: e.target.value })}
                className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Matric Number</p>
              <input
                type="text"
                value={editingUser.matricNumber || editingUser.matric || ''}
                onChange={(e) => setEditingUser({ ...editingUser, matricNumber: e.target.value })}
                className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all"
                placeholder="Matriculation"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Date of Birth</p>
              <input
                type="text"
                value={editingUser.dob || ''}
                onChange={(e) => setEditingUser({ ...editingUser, dob: e.target.value })}
                className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all"
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">University</p>
              <input
                type="text"
                value={editingUser.university || ''}
                onChange={(e) => setEditingUser({ ...editingUser, university: e.target.value })}
                className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all"
                placeholder="University"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Academic Level</p>
              <input
                type="text"
                value={editingUser.level || ''}
                onChange={(e) => setEditingUser({ ...editingUser, level: e.target.value })}
                className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all"
                placeholder="100, 200, 300..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Faculty</p>
              <input
                type="text"
                value={editingUser.faculty || ''}
                onChange={(e) => setEditingUser({ ...editingUser, faculty: e.target.value })}
                className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all"
                placeholder="Faculty"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Department</p>
              <input
                type="text"
                value={editingUser.department || ''}
                onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all"
                placeholder="Department"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-[9px] font-black text-purple-400 uppercase tracking-wider ml-1">User Privileges & Bypasses</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2.5 bg-white/5 border border-purple-500/20 rounded-xl cursor-pointer hover:bg-purple-500/10 transition-all">
                <input
                  type="checkbox"
                  checked={editingUser.isPremium}
                  onChange={(e) => setEditingUser({ ...editingUser, isPremium: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 border border-purple-400/40 rounded-md peer-checked:bg-purple-600 peer-checked:border-purple-500 transition-all flex items-center justify-center">
                  <Check size={11} className={`text-white font-black transition-all ${editingUser.isPremium ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <span className="text-[10px] font-bold uppercase text-white/60 peer-checked:text-purple-300 leading-none">Premium</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 bg-white/5 border border-purple-500/20 rounded-xl cursor-pointer hover:bg-purple-500/10 transition-all">
                <input
                  type="checkbox"
                  checked={editingUser.bypassAllPayments}
                  onChange={(e) => setEditingUser({ ...editingUser, bypassAllPayments: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 border border-purple-400/40 rounded-md peer-checked:bg-purple-600 peer-checked:border-purple-500 transition-all flex items-center justify-center">
                  <Check size={11} className={`text-white transition-all ${editingUser.bypassAllPayments ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <span className="text-[10px] font-bold uppercase text-white/60 peer-checked:text-purple-300 leading-none">Master Bypass</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="flex-1 bg-white/5 border border-white/10 text-white/50 font-bold py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export interface AdminEditGroupModalProps {
  editingGroup: any;
  setEditingGroup: (g: any) => void;
  theme: string;
  handleEditGroup: (e: React.FormEvent) => void;
}

export const AdminEditGroupModal: React.FC<AdminEditGroupModalProps> = ({
  editingGroup,
  setEditingGroup,
  theme,
  handleEditGroup,
}) => {
  if (!editingGroup) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`${
          theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'
        } border rounded-3xl p-5 md:p-8 max-w-md w-full max-h-[95vh] overflow-y-auto custom-scrollbar space-y-4 md:space-y-6 flex flex-col`}
      >
        <div className="text-center space-y-1 pb-2">
          <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter">Cluster Configuration</h3>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Administrative Override Active</p>
        </div>

        <form onSubmit={handleEditGroup} className="space-y-4 pb-4 flex-1">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Cluster Name</p>
            <input
              type="text"
              value={editingGroup.name || ''}
              onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all"
              placeholder="Cluster Name"
              required
            />
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Description / Bio</p>
            <textarea
              value={editingGroup.description || ''}
              onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all h-24 resize-none"
              placeholder="Cluster description..."
            />
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Display URL (Image)</p>
            <input
              type="text"
              value={editingGroup.photoURL || ''}
              onChange={(e) => setEditingGroup({ ...editingGroup, photoURL: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-4 pt-6 pb-2">
            <button
              type="button"
              onClick={() => setEditingGroup(null)}
              className="flex-1 bg-white/5 border border-white/10 text-white/40 font-black py-3 rounded-2xl text-[9px] uppercase tracking-widest hover:text-white transition-all"
            >
              Abort Task
            </button>
            <button
              type="submit"
              className="flex-[2] bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-3 rounded-2xl text-[9px] uppercase tracking-[0.2em] shadow-2xl shadow-red-900/40 active:scale-95 transition-all"
            >
              Commit Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
