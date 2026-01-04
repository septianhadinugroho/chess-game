export type Language = 'id' | 'en';

export const translations = {
  id: {
    // Auth
    welcome: 'Selamat Datang!',
    loginSubtitle: 'Tantang AI dari level pemula hingga grand master',
    loginButton: 'Masuk dengan Google',
    logout: 'Keluar Akun',
    
    // Home
    greeting: 'Hai',
    readyMessage: 'Siap untuk tantangan catur hari ini?',
    level: 'Level',
    wins: 'Menang',
    selectLevel: 'Pilih Level',
    selectColor: 'Pilih Warna',
    
    // Colors
    white: 'Putih',
    black: 'Hitam',
    random: 'Acak',
    firstMove: 'Jalan duluan',
    secondMove: 'Jalan kedua',
    randomColor: 'Acak warna',
    
    // Game
    aiThinking: 'Sedang berpikir...',
    waitingTurn: 'Menunggu giliran',
    yourTurn: 'Giliran Anda Jalan',
    waitingAI: 'Menunggu AI Jalan...',
    check: 'SKAK! Raja dalam bahaya',
    victory: 'MENANG!',
    defeat: 'KALAH',
    youWin: 'Anda Menang!',
    youLose: 'Anda Kalah!',
    draw: 'Remis / Seri',
    
    // Controls
    undo: 'Undo',
    save: 'Simpan',
    reset: 'Reset',
    playAgain: 'Main Lagi',
    backToMenu: 'Kembali ke Menu',
    
    // Stats
    stats: 'Statistik',
    performance: 'Performance & Progress',
    highestLevel: 'Highest Level',
    totalGames: 'Total Games',
    won: 'Menang',
    lost: 'Kalah',
    winRate: 'Win Rate',
    currentStreak: 'Current Streak',
    recentGames: 'Recent Games',
    moves: 'moves',
    
    // Leaderboard
    topPlayers: 'Top Players',
    globalRanking: 'Global Ranking',
    all: 'Semua',
    refresh: 'Refresh Ranking',
    
    // Settings
    settings: 'Pengaturan',
    manageAccount: 'Kelola akun & preferensi',
    googleAccount: 'Akun Google',
    aboutApp: 'Tentang Aplikasi',
    appVersion: 'Chess Master AI Challenge v1.0',
    builtBy: 'Built by',
    
    // Tabs
    home: 'Home',
    ranking: 'Ranking',
    
    // Toast
    gameSaved: 'Permainan tersimpan!',
    gameLoaded: 'Game sebelumnya dimuat!',
    moveCanceled: 'Langkah dibatalkan',
    
    // AI Levels
    levels: {
      1: 'Pemula',
      2: 'Mudah',
      3: 'Cukup Mudah',
      4: 'Menengah',
      5: 'Menengah+',
      6: 'Sulit',
      7: 'Sangat Sulit',
      8: 'Expert',
      9: 'Master',
      10: 'Grand Master'
    }
  },
  en: {
    // Auth
    welcome: 'Welcome!',
    loginSubtitle: 'Challenge AI from beginner to grand master',
    loginButton: 'Sign in with Google',
    logout: 'Sign Out',
    
    // Home
    greeting: 'Hi',
    readyMessage: 'Ready for today\'s chess challenge?',
    level: 'Level',
    wins: 'Wins',
    selectLevel: 'Select Level',
    selectColor: 'Select Color',
    
    // Colors
    white: 'White',
    black: 'Black',
    random: 'Random',
    firstMove: 'First move',
    secondMove: 'Second move',
    randomColor: 'Random color',
    
    // Game
    aiThinking: 'Thinking...',
    waitingTurn: 'Waiting turn',
    yourTurn: 'Your Turn',
    waitingAI: 'Waiting AI Move...',
    check: 'CHECK! King in danger',
    victory: 'VICTORY!',
    defeat: 'DEFEAT',
    youWin: 'You Win!',
    youLose: 'You Lose!',
    draw: 'Draw',
    
    // Controls
    undo: 'Undo',
    save: 'Save',
    reset: 'Reset',
    playAgain: 'Play Again',
    backToMenu: 'Back to Menu',
    
    // Stats
    stats: 'Statistics',
    performance: 'Performance & Progress',
    highestLevel: 'Highest Level',
    totalGames: 'Total Games',
    won: 'Won',
    lost: 'Lost',
    winRate: 'Win Rate',
    currentStreak: 'Current Streak',
    recentGames: 'Recent Games',
    moves: 'moves',
    
    // Leaderboard
    topPlayers: 'Top Players',
    globalRanking: 'Global Ranking',
    all: 'All',
    refresh: 'Refresh Ranking',
    
    // Settings
    settings: 'Settings',
    manageAccount: 'Manage your account & preferences',
    googleAccount: 'Google Account',
    aboutApp: 'About Application',
    appVersion: 'Chess Master AI Challenge v1.0',
    builtBy: 'Built by',
    
    // Tabs
    home: 'Home',
    ranking: 'Ranking',
    
    // Toast
    gameSaved: 'Game saved!',
    gameLoaded: 'Previous game loaded!',
    moveCanceled: 'Move canceled',
    
    // AI Levels
    levels: {
      1: 'Beginner',
      2: 'Easy',
      3: 'Quite Easy',
      4: 'Medium',
      5: 'Medium+',
      6: 'Hard',
      7: 'Very Hard',
      8: 'Expert',
      9: 'Master',
      10: 'Grand Master'
    }
  }
};

export const useTranslation = (lang: Language) => {
  return {
    t: translations[lang],
    lang
  };
};