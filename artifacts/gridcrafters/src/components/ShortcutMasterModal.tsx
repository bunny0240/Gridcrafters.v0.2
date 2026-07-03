import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

const MODAL_KEY = 'shortcut_master_modal_shown';

export function hasSeenShortcutMasterModal(): boolean {
  try { return localStorage.getItem(MODAL_KEY) === '1'; } catch { return false; }
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShortcutMasterModal({ open, onClose }: Props) {
  const handleClose = () => {
    try { localStorage.setItem(MODAL_KEY, '1'); } catch {}
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.82)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
            className="relative rounded-2xl border w-full max-w-sm mx-4 flex flex-col items-center gap-5 p-8 text-center"
            style={{
              background: '#0E0E0E',
              borderColor: 'rgba(0,180,216,0.25)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,180,216,0.06), 0 0 60px rgba(0,180,216,0.08)',
            }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-[#6B7280] hover:text-[#ECECEC] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12, type: 'spring', damping: 16, stiffness: 260 }}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.25)' }}
            >
              <Keyboard className="w-8 h-8 text-[#00B4D8]" />
            </motion.div>

            {/* Heading */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#00B4D8', marginBottom: 8 }}>
                Congratulations
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Shortcut Master</h2>
              <p className="text-[#6B7280] text-sm leading-relaxed">
                You've completed all three shortcut levels — Rookie, Intermediate, and Advanced.
                Your keyboard muscle memory is now certified.
              </p>
            </div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,180,216,0.15), rgba(76,175,80,0.1))',
                  border: '1px solid rgba(0,180,216,0.3)',
                  color: '#00B4D8',
                }}
              >
                <Keyboard className="w-4 h-4" />
                Shortcut Master Badge Earned
              </div>
              <p className="text-[10px] text-[#4B5563] tracking-wider uppercase">+500 XP awarded</p>
            </motion.div>

            {/* CTA */}
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-lg font-bold text-white transition-colors"
              style={{ background: '#00B4D8' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0096B4')}
              onMouseLeave={e => (e.currentTarget.style.background = '#00B4D8')}
            >
              Continue
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
