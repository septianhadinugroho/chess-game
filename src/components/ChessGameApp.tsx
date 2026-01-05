'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { translations, Language } from '@/lib/language';

// Components
import { LoginCard } from '@/components/auth/LoginCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { Leaderboard } from '@/components/pages/Leaderboard';
import { StatsPage } from '@/components/pages/StatsPage';
import { LevelSelector } from '@/components/menu/LevelSelector';
import { ColorSelector } from '@/components/menu/ColorSelector';
import ModeSelector from '@/components/menu/ModeSelector';
import MultiplayerLobby from '@/components/multiplayer/MultiplayerLobby';
import AIGameScreen from '@/components/game/AIGameScreen';
import MultiplayerGameScreen from '@/components/game/MultiplayerGameScreen';
import { Toast } from '@/components/ui/Toast';

// Icons
import { IoLogOut, IoArrowBack, IoLanguage, IoLogoInstagram } from 'react-icons/io5';
import { GiChessKnight } from 'react-icons/gi';

type GameMode = 'ai' | 'multiplayer' | null;
type ActiveTab = 'home' | 'leaderboard' | 'stats' | 'settings';

export default function ChessGameApp() {
  // --- STATE MANAGEMENT ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [progress, setProgress] = useState<any>({ 
    highestLevel: 1, 
    gamesWon: 0, 
    gamesPlayed: 0 
  });
  const [language, setLanguage] = useState<Language>('id');
  const [toast, setToast] = useState({ 
    show: false, 
    message: '', 
    type: 'success' as 'success' | 'info' | 'warning' | 'error' 
  });

  // Game Setup States
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [selectedColor, setSelectedColor] = useState<'white' | 'black' | 'random' | null>(null);

  // Game Active States
  const [showGame, setShowGame] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentRoomCode, setCurrentRoomCode] = useState<string>('');
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState(false);

  const t = translations[language];

  // --- EFFECTS ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('chess_language');
      if (savedLang === 'en' || savedLang === 'id') {
        setLanguage(savedLang);
      }
    }

    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserName(session.user.user_metadata.full_name || 'Player');
        setUserEmail(session.user.email || '');
        setUserId(session.user.id);
        fetchProgress(session.user.id);
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- HELPER FUNCTIONS ---
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setIsLoggedIn(true);
      setUserName(session.user.user_metadata.full_name || 'Player');
      setUserEmail(session.user.email || '');
      setUserId(session.user.id);
      await fetchProgress(session.user.id);
    }
  };
  
  const fetchProgress = async (uid: string) => {
    try {
      const { data } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', uid)
        .single();
      
      if (data) {
        setProgress({ 
          highestLevel: data.highest_level, 
          gamesWon: data.games_won, 
          gamesPlayed: data.games_played 
        });
      } else {
        await supabase.from('user_progress').insert([{ user_id: uid }]);
      }
    } catch (e) { 
      console.error("Error fetching progress", e); 
    }
  };

  const toggleLanguage = () => {
    const newLang: Language = language === 'id' ? 'en' : 'id';
    setLanguage(newLang);
    localStorage.setItem('chess_language', newLang);
  };

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  // --- AUTH & NAVIGATION HANDLERS ---
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetToHome();
  };

  const resetToHome = () => {
    setShowGame(false);
    setGameMode(null);
    setSelectedColor(null);
    setActiveTab('home');
    setCurrentRoomId(null);
    setCurrentRoomCode('');
    setShowMultiplayerLobby(false);
  };

  // --- GAME MODE HANDLERS ---
  const handleModeSelect = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'multiplayer') {
      setShowMultiplayerLobby(true);
    }
  };

  const handleJoinRoom = (roomId: string, roomCode: string) => {
    setCurrentRoomId(roomId);
    setCurrentRoomCode(roomCode);
    setShowMultiplayerLobby(false);
    setShowGame(true);
    showToast(`Joined room: ${roomCode}`, 'success');
  };

  const handleStartAIGame = (color: 'white' | 'black' | 'random') => {
    setSelectedColor(color);
    setShowGame(true);
  };

  const handleGameComplete = async (won: boolean) => {
    if (!userId) return;

    try {
      const newWon = won ? progress.gamesWon + 1 : progress.gamesWon;
      const newPlayed = progress.gamesPlayed + 1;
      const newLevel = won && currentLevel < 10 && currentLevel === progress.highestLevel 
                        ? progress.highestLevel + 1 
                        : progress.highestLevel;

      setProgress({ 
        ...progress, 
        gamesWon: newWon, 
        gamesPlayed: newPlayed, 
        highestLevel: newLevel 
      });

      await supabase.from('user_progress').update({
        games_played: newPlayed,
        games_won: newWon,
        highest_level: newLevel
      }).eq('user_id', userId);

      await supabase.from('game_history').insert([{
        user_id: userId,
        level: currentLevel,
        player_color: selectedColor === 'random' ? (Math.random() > 0.5 ? 'white' : 'black') : selectedColor,
        result: won ? 'win' : 'lose',
        moves_count: 0, // Will be updated by game component
      }]);

    } catch (e) { 
      console.error('Error saving game result:', e);
    }
  };

  // --- RENDERING ---
  if (!isLoggedIn) {
    return <LoginCard onLogin={handleLogin} language={language} onLanguageToggle={toggleLanguage} />;
  }

  // Multiplayer Lobby
  if (showMultiplayerLobby && gameMode === 'multiplayer') {
    return (
      <MultiplayerLobby
        userId={userId || ''}
        language={language}
        onJoinRoom={handleJoinRoom}
        onBack={() => {
          setShowMultiplayerLobby(false);
          setGameMode(null);
        }}
      />
    );
  }

  // AI Game Screen
  if (showGame && gameMode === 'ai' && selectedColor) {
    return (
      <AIGameScreen
        userId={userId}
        userName={userName}
        level={currentLevel}
        color={selectedColor}
        language={language}
        onBack={resetToHome}
        onGameComplete={handleGameComplete}
      />
    );
  }

  // Multiplayer Game Screen
  if (showGame && gameMode === 'multiplayer' && currentRoomId) {
    return (
      <MultiplayerGameScreen
        userId={userId || ''}
        userName={userName}
        roomId={currentRoomId}
        roomCode={currentRoomCode}
        language={language}
        onBack={resetToHome}
        onGameComplete={handleGameComplete}
      />
    );
  }

  // Settings Page
  if (activeTab === 'settings') {
    return (
      <div className="min-h-screen pb-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <Toast 
          message={toast.message} 
          show={toast.show} 
          type={toast.type}
          onHide={() => setToast({ ...toast, show: false })} 
        />
        
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-8 shadow-lg mb-6">
          <div className="max-w-lg mx-auto text-center text-white">
            <h1 className="text-3xl font-bold mb-2 drop-shadow-md">{t.settings}</h1>
            <p className="text-sm text-gray-100 font-medium">{t.manageAccount}</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 space-y-4 animate-slide-up">
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-4 text-lg pb-2 border-b border-gray-100 flex items-center gap-2">
              <GiChessKnight className="text-xl text-blue-600" /> {t.googleAccount}
            </h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <GiChessKnight className="text-3xl text-white" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-bold text-gray-800 truncate text-lg">{userName}</div>
                <div className="text-sm text-gray-500 truncate">{userEmail}</div>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl font-bold hover:shadow-xl transition-all touch-feedback flex items-center justify-center gap-2"
            >
              <IoLogOut size={20} /> {t.logout}
            </button>
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-800 mb-4 text-lg pb-2 border-b border-gray-100 flex items-center gap-2">
              <IoLanguage className="text-xl text-blue-600" /> {t.language}
            </h3>
            
            <div className="bg-gray-100 p-1.5 rounded-2xl flex relative">
              <button
                onClick={() => language !== 'id' && toggleLanguage()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 touch-feedback ${
                  language === 'id' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-lg">🇮🇩</span> Indonesia
              </button>
              <button
                onClick={() => language !== 'en' && toggleLanguage()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 touch-feedback ${
                  language === 'en' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-lg">🇬🇧</span> English
              </button>
            </div>
          </div>

          <div className="card text-center">
            <h3 className="font-bold text-gray-800 mb-2 text-lg">{t.aboutApp}</h3>
            <p className="text-gray-500 mb-4 text-sm">Chess Master V2.0</p>
            <div className="border-t border-gray-100 pt-4 mt-2">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">{t.builtBy}</p>
              <p className="font-bold text-blue-600 text-xl mb-3">Septian Hadi Nugroho</p>
              <a 
                href="https://instagram.com/septianhnr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-pink-600 font-bold hover:text-pink-500 bg-gradient-to-r from-pink-50 to-pink-100 border-2 border-pink-200 px-6 py-3 rounded-2xl transition-all hover:shadow-md touch-feedback"
              >
                <IoLogoInstagram size={20} />
                @septianhnr
              </a>
            </div>
          </div>
        </div>
        
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
      </div>
    );
  }

  // Leaderboard Tab
  if (activeTab === 'leaderboard') {
    return (
      <div className="min-h-screen pb-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <Leaderboard currentUserId={userId || ''} language={language} />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
      </div>
    );
  }

  // Stats Tab
  if (activeTab === 'stats') {
    return (
      <div className="min-h-screen pb-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <StatsPage userId={userId || ''} progress={progress} language={language} />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
      </div>
    );
  }

  // Default: Home Tab
  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <Toast
        message={toast.message}
        show={toast.show}
        type={toast.type}
        onHide={() => setToast({ ...toast, show: false })}
      />

      {/* Home Header */}
      <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-4 shadow-sm mb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-blue-100 text-xs font-medium mb-0.5">{language === 'id' ? 'Halo,' : 'Hi,'}</p>
              <h1 className="text-xl font-bold text-white">
                {userName.split(' ')[0]} 👋
              </h1>
            </div>
            <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl shadow-lg">
              <span className="text-[10px] font-medium opacity-90 block">{t.level}</span>
              <span className="text-lg font-black">{progress.highestLevel}</span>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex justify-around border border-white/20">
            <div className="text-center">
              <p className="text-[10px] text-blue-100 mb-0.5 font-medium">{language === 'id' ? 'Main' : 'Played'}</p>
              <p className="font-bold text-white text-base">{progress.gamesPlayed}</p>
            </div>
            <div className="w-px bg-white/20"></div>
            <div className="text-center">
              <p className="text-[10px] text-blue-100 mb-0.5 font-medium">{language === 'id' ? 'Menang' : 'Won'}</p>
              <p className="font-bold text-white text-base">{progress.gamesWon}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 animate-slide-up">
        {!gameMode ? (
          /* Mode Selector */
          <ModeSelector onSelectMode={handleModeSelect} language={language} />
        ) : gameMode === 'ai' ? (
          /* AI Setup Menu */
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => setGameMode(null)}
                aria-label="Back to Mode Selection"
                className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-gray-600"
              >
                <IoArrowBack size={24} />
              </button>
              <h2 className="text-xl font-bold text-gray-800">
                {language === 'id' ? 'Setup Permainan' : 'Game Setup'}
              </h2>
            </div>
            
            <LevelSelector 
              currentLevel={currentLevel} 
              onSelectLevel={(level) => {
                setCurrentLevel(level);
                setTimeout(() => {
                  const colorSection = document.getElementById('color-selector-section');
                  if (colorSection) {
                    const elementPosition = colorSection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - 80;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }, 200);
              }}
              highestLevel={progress.highestLevel}
              language={language}
            />
            
            <div id="color-selector-section">
              <ColorSelector 
                onSelectColor={handleStartAIGame}
                language={language}
              />
            </div>
          </div>
        ) : null}
      </div>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} language={language} />
    </div>
  );
}