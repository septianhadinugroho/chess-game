export const AI_LEVELS = [
  { level: 1, name: 'Pemula', depth: 1, description: 'Belajar dasar catur', color: 'emerald' },
  { level: 2, name: 'Mudah', depth: 1, description: 'Santai bermain', color: 'green' },
  { level: 3, name: 'Cukup Mudah', depth: 2, description: 'Mulai berpikir', color: 'lime' },
  { level: 4, name: 'Menengah', depth: 2, description: 'Perlu strategi', color: 'yellow' },
  { level: 5, name: 'Menengah+', depth: 3, description: 'Harus fokus', color: 'orange' },
  { level: 6, name: 'Sulit', depth: 3, description: 'Tantangan berat', color: 'amber' },
  { level: 7, name: 'Sangat Sulit', depth: 4, description: 'Butuh keahlian', color: 'red' },
  { level: 8, name: 'Expert', depth: 4, description: 'Level ahli', color: 'rose' },
  { level: 9, name: 'Master', depth: 5, description: 'Hampir mustahil', color: 'purple' },
  { level: 10, name: 'Grand Master', depth: 5, description: 'Ultimate boss!', color: 'violet' }
] as const;

export const PIECE_VALUES = {
  p: 10, n: 30, b: 30, r: 50, q: 90, k: 900,
  P: 10, N: 30, B: 30, R: 50, Q: 90, K: 900
} as const;