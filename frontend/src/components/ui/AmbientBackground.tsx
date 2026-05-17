'use client';

import { motion } from 'framer-motion';

export function AmbientBackground() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <motion.div
        className="absolute -left-[20%] top-[8%] h-[420px] w-[420px] rounded-full opacity-[0.14] blur-[120px]"
        style={{ background: 'var(--color-accent)' }}
        animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-[10%] top-[35%] h-[360px] w-[360px] rounded-full opacity-[0.1] blur-[100px]"
        style={{ background: 'var(--color-accent-2)' }}
        animate={{ x: [0, -20, 0], y: [0, 12, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="grid-layer opacity-40" />
    </motion.div>
  );
}
