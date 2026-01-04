import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IoTrophy, IoGameController, IoStatsChart, IoRefresh, IoCalendar } from 'react-icons/io5';
import { translations, Language } from '@/lib/language';

interface GameHistory {
  level: number;
  result: 'win' | 'lose' | 'draw';
  created_at: string;
  moves_count: number;
}

interface StatsPageProps {
  userId: string;
  progress: {
    highestLevel: number;
    gamesWon: number;
    gamesPlayed: number;
  };
  language: Language;
}

export const StatsPage: React.FC<StatsPageProps> = ({ userId, progress, language }) => {
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const t = translations[language];

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('game_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const winRate = progress.gamesPlayed > 0 
    ? Math.round((progress.gamesWon / progress.gamesPlayed) * 100) 
    : 0;

  const losses = progress.gamesPlayed - progress.gamesWon;

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-pink-500 p-6 mb-4 shadow-lg">
        <div className="max-w-lg mx-auto text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-3 animate-bounce-slow">
            <IoStatsChart className="text-4xl" />
          </div>
          <h1 className="text-3xl font-bold mb-2 drop-shadow-md">{t.stats}</h1>
          <p className="text-sm text-orange-100 font-medium">{t.performance}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-4">
        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-xl">
            <IoTrophy className="text-4xl mb-3 opacity-90 animate-bounce-slow" />
            <div className="text-4xl font-black mb-1">{progress.highestLevel}</div>
            <div className="text-sm text-blue-100 font-semibold">{t.highestLevel}</div>
          </div>
          
          <div className="card bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-xl">
            <IoGameController className="text-4xl mb-3 opacity-90" />
            <div className="text-4xl font-black mb-1">{progress.gamesPlayed}</div>
            <div className="text-sm text-emerald-100 font-semibold">{t.totalGames}</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="card">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <IoStatsChart className="text-blue-500" /> {language === 'id' ? 'Statistik Detail' : 'Detailed Stats'}
          </h3>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200">
              <div className="text-3xl font-black text-emerald-600 mb-1">{progress.gamesWon}</div>
              <div className="text-xs text-emerald-700 font-bold">{t.won}</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border-2 border-red-200">
              <div className="text-3xl font-black text-red-600 mb-1">{losses}</div>
              <div className="text-xs text-red-700 font-bold">{t.lost}</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200">
              <div className="text-3xl font-black text-blue-600 mb-1">{winRate}%</div>
              <div className="text-xs text-blue-700 font-bold">{t.winRate}</div>
            </div>
          </div>

          {/* Win Rate Progress */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl border border-blue-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-700">{t.winRate}</span>
              <span className={`text-sm font-black ${
                winRate >= 60 ? 'text-emerald-600' : 
                winRate >= 40 ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {winRate}%
              </span>
            </div>
            <div className="h-4 bg-white rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  winRate >= 60 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                  winRate >= 40 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                  'bg-gradient-to-r from-gray-400 to-gray-500'
                }`}
                style={{ width: `${winRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <IoCalendar className="text-blue-500" />
              {t.recentGames}
            </h2>
            <button
              onClick={fetchHistory}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-blue-500 border border-blue-200"
              aria-label="Refresh history"
            >
              <IoRefresh size={20} />
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((game, index) => (
                <div
                  key={index}
                  className={`
                    p-4 rounded-2xl transition-all hover:shadow-md border-2
                    ${game.result === 'win' 
                      ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' 
                      : game.result === 'lose' 
                      ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' 
                      : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-md text-xl
                        ${game.result === 'win' ? 'bg-gradient-to-br from-emerald-500 to-green-500' : 
                          game.result === 'lose' ? 'bg-gradient-to-br from-red-500 to-pink-500' : 
                          'bg-gradient-to-br from-gray-400 to-gray-500'}
                      `}>
                        {game.result === 'win' ? '✓' : game.result === 'lose' ? '✗' : '='}
                      </div>
                      
                      <div>
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                          <span>{t.level} {game.level}</span>
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          {game.moves_count} {t.moves} · {new Date(game.created_at).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { 
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`
                      px-3 py-1 rounded-full text-xs font-black
                      ${game.result === 'win' ? 'bg-emerald-500 text-white' : 
                        game.result === 'lose' ? 'bg-red-500 text-white' : 
                        'bg-gray-500 text-white'}
                    `}>
                      {game.result === 'win' ? 'WIN' : game.result === 'lose' ? 'LOSE' : 'DRAW'}
                    </div>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="text-center py-12">
                  <IoGameController className="text-6xl mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">
                    {language === 'id' ? 'Belum ada riwayat permainan' : 'No game history yet'}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {language === 'id' ? 'Mainkan game pertamamu!' : 'Play your first game!'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};