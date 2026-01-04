import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IoTrophy, IoRefresh } from 'react-icons/io5';
import { translations, Language } from '@/lib/language';

interface LeaderboardEntry {
  user_id: string;
  player_name: string;
  highest_level: number;
  games_won: number;
  games_played: number;
  win_rate: number;
}

export const Leaderboard: React.FC<{ currentUserId: string; language: Language }> = ({ currentUserId, language }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const t = translations[language];

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('highest_level', { ascending: false })
        .order('games_won', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="pb-24 animate-fade-in">
      <div className="bg-linear-to-br from-blue-900 to-blue-950 p-6 mb-4 rounded-b-3xl shadow-lg">
        <div className="text-center text-white">
          <IoTrophy className="text-5xl mx-auto mb-2" />
          <h1 className="text-2xl font-bold mb-1">{t.topPlayers}</h1>
          <p className="text-sm text-blue-200">{t.globalRanking}</p>
        </div>
      </div>

      <div className="px-4 mb-4">
        <button
          onClick={fetchLeaderboard}
          className="w-full bg-slate-800 border border-slate-700 text-blue-400 py-2 rounded-xl font-semibold hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <IoRefresh size={18} />
          {t.refresh}
        </button>
      </div>

      <div className="px-4 space-y-2">
        {leaderboard.map((entry, index) => {
          const rank = index + 1;
          const isCurrentUser = entry.user_id === currentUserId;
          const losses = entry.games_played - entry.games_won;

          let rankBg = "bg-slate-700 text-slate-300";
          let rankIcon = "text-slate-400";
          
          if (rank === 1) {
            rankBg = "bg-linear-to-br from-yellow-500 to-yellow-600 text-white";
            rankIcon = "text-yellow-400";
          } else if (rank === 2) {
            rankBg = "bg-linear-to-br from-slate-400 to-slate-500 text-white";
            rankIcon = "text-slate-300";
          } else if (rank === 3) {
            rankBg = "bg-linear-to-br from-orange-500 to-orange-600 text-white";
            rankIcon = "text-orange-400";
          }

          return (
            <div
              key={entry.user_id}
              className={`
                flex items-center gap-4 p-4 rounded-xl transition-all relative
                ${isCurrentUser 
                  ? 'bg-blue-600/20 border-2 border-blue-500 shadow-md' 
                  : 'bg-slate-800 border border-slate-700 shadow-sm hover:shadow-md'}
              `}
            >
              <div className={`${rankBg} w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-md shrink-0`}>
                {rank <= 3 ? (
                  <IoTrophy className={rankIcon} size={24} />
                ) : (
                  `#${rank}`
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-100 truncate">
                    {entry.player_name || 'Anonymous'}
                  </span>
                  {isCurrentUser && (
                    <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold shrink-0">
                      YOU
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-slate-400 font-medium flex items-center gap-2">
                  <span className="text-blue-400 font-bold">{t.level} {entry.highest_level}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-green-400">{entry.games_won}W</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-red-400">{losses}L</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t.winRate}</div>
                <div className={`font-bold text-lg ${entry.win_rate >= 50 ? 'text-green-400' : 'text-slate-400'}`}>
                  {entry.win_rate}%
                </div>
              </div>
            </div>
          );
        })}

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-700 text-6xl mb-4">🏆</div>
            <p className="text-slate-500">{language === 'id' ? 'Belum ada data ranking' : 'No ranking data yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
};