export type Language = 'id' | 'en';

export const translations = {
  id: {
    // Auth
    welcome: 'Selamat Datang!',
    loginSubtitle: 'Tantang AI dari level pemula hingga grand master',
    loginButton: 'Masuk dengan Google',
    logout: 'Keluar Akun',
    autoSave: 'Progress & statistik tersimpan otomatis',
    
    // Home
    greeting: 'Hai',
    readyMessage: 'Siap untuk tantangan catur hari ini?',
    level: 'Level',
    wins: 'Menang',
    selectLevel: 'Pilih Level',
    selectColor: 'Pilih Warna',
    chooseDifficulty: 'Pilih tingkat kesulitan',
    levelProgress: 'Progress Level',
    
    // Colors
    white: 'Putih',
    black: 'Hitam',
    random: 'Acak',
    firstMove: 'Jalan duluan',
    secondMove: 'Jalan kedua',
    randomColor: 'Acak warna',
    chooseColorDesc: 'Tentukan warna bidakmu',
    aggressive: 'Agresif',
    defensive: 'Defensif',
    surprise: 'Kejutan!',
    playingTips: 'Tips Bermain',
    tipsDesc: 'Putih: Kontrol awal permainan. Hitam: Strategi counter-attack. Random: Buat permainan lebih menantang!',
    
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
    aiPlayer: 'Komputer AI',
    youPlayer: 'Kamu',
    
    // Game Result Messages
    dontGiveUp: 'Jangan menyerah! Coba lagi dan raih kemenangan!',
    congrats: 'Selamat! Kamu berhasil mengalahkan AI!',
    drawMessage: 'Permainan seri! Kedua pemain bermain bagus.',
    
    // Controls
    undo: 'Undo',
    save: 'Simpan',
    reset: 'Reset',
    playAgain: 'Main Lagi',
    backToMenu: 'Kembali ke Menu',
    
    // Stats
    stats: 'Statistik',
    performance: 'Performance & Progress',
    highestLevel: 'Level Tertinggi',
    totalGames: 'Total Permainan',
    won: 'Menang',
    lost: 'Kalah',
    winRate: 'Win Rate',
    currentStreak: 'Current Streak',
    recentGames: 'Riwayat Permainan',
    moves: 'langkah',
    detailedStats: 'Statistik Detail',
    noHistory: 'Belum ada riwayat permainan',
    playFirstGame: 'Mainkan game pertamamu!',
    
    // Leaderboard
    topPlayers: 'Top Players',
    globalRanking: 'Ranking Global',
    all: 'Semua',
    refresh: 'Refresh Ranking',
    loadingRankings: 'Memuat ranking...',
    noRankingData: 'Belum ada data ranking',
    beTheFirst: 'Jadilah yang pertama!',
    youLabel: 'KAMU',
    
    // Settings
    settings: 'Pengaturan',
    manageAccount: 'Kelola akun & preferensi',
    googleAccount: 'Akun Google',
    aboutApp: 'Tentang Aplikasi',
    appVersion: 'Chess Master AI Challenge v1.0',
    builtBy: 'Dibuat oleh',
    language: 'Bahasa',
    locked: 'Terkunci',
    
    // Tabs
    home: 'Home',
    ranking: 'Ranking',
    
    // Toast
    gameSaved: 'Permainan tersimpan!',
    gameLoaded: 'Game sebelumnya dimuat!',
    moveCanceled: 'Langkah dibatalkan',
    
    // AI Levels Description
    levelDesc: {
      1: 'Belajar dasar catur',
      2: 'Santai bermain',
      3: 'Mulai berpikir',
      4: 'Perlu strategi',
      5: 'Harus fokus',
      6: 'Tantangan berat',
      7: 'Butuh keahlian',
      8: 'Level ahli',
      9: 'Hampir mustahil',
      10: 'Ultimate boss!'
    },
    
    // AI Levels Name
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
    autoSave: 'Progress & stats auto-saved',
    
    // Home
    greeting: 'Hi',
    readyMessage: 'Ready for today\'s chess challenge?',
    level: 'Level',
    wins: 'Wins',
    selectLevel: 'Select Level',
    selectColor: 'Select Color',
    chooseDifficulty: 'Choose difficulty level',
    levelProgress: 'Level Progress',
    
    // Colors
    white: 'White',
    black: 'Black',
    random: 'Random',
    firstMove: 'First move',
    secondMove: 'Second move',
    randomColor: 'Random color',
    chooseColorDesc: 'Choose your pieces color',
    aggressive: 'Aggressive',
    defensive: 'Defensive',
    surprise: 'Surprise!',
    playingTips: 'Playing Tips',
    tipsDesc: 'White: Control early game. Black: Counter-attack strategy. Random: Make it more challenging!',
    
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
    aiPlayer: 'AI Computer',
    youPlayer: 'You',
    
    // Game Result Messages
    dontGiveUp: 'Don\'t give up! Try again and claim victory!',
    congrats: 'Congratulations! You defeated the AI!',
    drawMessage: 'It\'s a draw! Both players played well.',
    
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
    detailedStats: 'Detailed Stats',
    noHistory: 'No game history yet',
    playFirstGame: 'Play your first game!',
    
    // Leaderboard
    topPlayers: 'Top Players',
    globalRanking: 'Global Ranking',
    all: 'All',
    refresh: 'Refresh Ranking',
    loadingRankings: 'Loading rankings...',
    noRankingData: 'No ranking data yet',
    beTheFirst: 'Be the first!',
    youLabel: 'YOU',
    
    // Settings
    settings: 'Settings',
    manageAccount: 'Manage your account & preferences',
    googleAccount: 'Google Account',
    aboutApp: 'About Application',
    appVersion: 'Chess Master AI Challenge v1.0',
    builtBy: 'Built by',
    language: 'Language',
    locked: 'Locked',
    
    // Tabs
    home: 'Home',
    ranking: 'Ranking',
    
    // Toast
    gameSaved: 'Game saved!',
    gameLoaded: 'Previous game loaded!',
    moveCanceled: 'Move canceled',
    
    // AI Levels Description
    levelDesc: {
      1: 'Learn basic chess',
      2: 'Casual play',
      3: 'Start thinking',
      4: 'Need strategy',
      5: 'Must focus',
      6: 'Hard challenge',
      7: 'Need skills',
      8: 'Expert level',
      9: 'Almost impossible',
      10: 'Ultimate boss!'
    },

    // AI Levels Name
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