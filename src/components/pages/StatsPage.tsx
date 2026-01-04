import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IoTrophy, IoGameController, IoStatsChart, IoRefresh } from 'react-icons/io5';
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
    <div className="pb-20 animate-fade-in">
      <div className="bg-linear-to-br from-blue-900 to-blue-950 p-6 mb-4">
        <div className="text-center text-white">
          <IoStatsChart className="text-5xl mx-auto mb-2" />
          <h1 className="text-2xl font-bold mb-1">{t.stats}</h1>
          <p className="text-sm text-blue-200">{t.performance}</p>
        </div>
      </div>

      <div className="px-4 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-linear-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg border border-blue-500/30">
            <IoTrophy className="text-3xl mb-2 opacity-90" />
            <div className="text-3xl font-bold">{progress.highestLevel}</div>
            <div className="text-sm text-blue-100">{t.highestLevel}</div>
          </div>
          
          <div className="bg-linear-to-br from-green-600 to-emerald-700 rounded-2xl p-5 text-white shadow-lg border border-green-500/30">
            <IoGameController className="text-3xl mb-2 opacity-90" />
            <div className="text-3xl font-bold">{progress.gamesPlayed}</div>
            <div className="text-sm text-green-100">{t.totalGames}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-400">{progress.gamesWon}</div>
            <div className="text-xs text-slate-400 mt-1">{t.won}</div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-400">{losses}</div>
            <div className="text-xs text-slate-400 mt-1">{t.lost}</div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-400">{winRate}%</div>
            <div className="text-xs text-slate-400 mt-1">{t.winRate}</div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-100">{t.recentGames}</h2>
          <button
            onClick={fetchHistory}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-blue-400 border border-slate-700"
            aria-label="Refresh history"
          >
            <IoRefresh size={20} />
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((game, index) => (
              <div
                key={index}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm
                      ${game.result === 'win' ? 'bg-green-600' : game.result === 'lose' ? 'bg-red-600' : 'bg-slate-600'}
                    `}>
                      {game.result === 'win' ? '✓' : game.result === 'lose' ? '✗' : '='}
                    </div>
                    
                    <div>
                      <div className="font-semibold text-slate-100">
                        {t.level} {game.level}
                      </div>
                      <div className="text-xs text-slate-400">
                        {game.moves_count} {t.moves} · {new Date(game.created_at).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { 
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`
                    px-3 py-1 rounded-full text-xs font-bold
                    ${game.result === 'win' ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 
                      game.result === 'lose' ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 
                      'bg-slate-600/20 text-slate-400 border border-slate-600/30'}
                  `}>
                    {game.result === 'win' ? 'WIN' : game.result === 'lose' ? 'LOSE' : 'DRAW'}
                  </div>
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <div className="text-center py-12">
                <IoGameController className="text-6xl mx-auto mb-4 text-slate-700" />
                <p className="text-slate-500">
                  {language === 'id' ? 'Belum ada riwayat permainan' : 'No game history yet'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};