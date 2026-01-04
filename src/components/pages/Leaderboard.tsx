import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IoTrophy, IoRefresh, IoSparkles, IoMedal, IoRibbon } from 'react-icons/io5';
import { translations, Language } from '@/lib/language';

interface LeaderboardEntry {
  user_id: string;
  player_name: string;
  highest_level: number;
  games_won: number;
  games_played: number;
  win_rate: number;
}

export const Leaderboard: React.FC<{ currentUserId: string; language: Language }> = ({ 
  currentUserId, 
  language 
}) => {
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            {language === 'id' ? 'Memuat ranking...' : 'Loading rankings...'}
          </p>
        </div>
      </div>
    );
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return {
      bg: 'bg-gradient-to-br from-yellow-400 to-orange-500',
      icon: IoTrophy,
      iconColor: 'text-yellow-300',
      border: 'border-yellow-300',
      shadow: 'shadow-yellow-200'
    };
    if (rank === 2) return {
      bg: 'bg-gradient-to-br from-gray-300 to-gray-400',
      icon: IoMedal,
      iconColor: 'text-gray-200',
      border: 'border-gray-300',
      shadow: 'shadow-gray-200'
    };
    if (rank === 3) return {
      bg: 'bg-gradient-to-br from-orange-400 to-orange-500',
      icon: IoRibbon,
      iconColor: 'text-orange-200',
      border: 'border-orange-300',
      shadow: 'shadow-orange-200'
    };
    return {
      bg: 'bg-gradient-to-br from-gray-100 to-gray-200',
      icon: null,
      iconColor: '',
      border: 'border-gray-200',
      shadow: 'shadow-gray-100'
    };
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-6 mb-4 shadow-lg">
        <div className="max-w-lg mx-auto text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-3 animate-bounce-slow">
            <IoTrophy className="text-4xl" />
          </div>
          <h1 className="text-3xl font-bold mb-2 drop-shadow-md">{t.topPlayers}</h1>
          <p className="text-sm text-blue-100 font-medium flex items-center justify-center gap-2">
            <IoSparkles size={16} />
            {t.globalRanking}
            <IoSparkles size={16} />
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Refresh Button */}
        <button
          onClick={fetchLeaderboard}
          className="w-full bg-white border-2 border-blue-200 text-blue-600 py-3 rounded-2xl font-bold hover:border-blue-400 hover:shadow-md transition-all touch-feedback flex items-center justify-center gap-2 mb-4"
        >
          <IoRefresh size={20} />
          {t.refresh}
        </button>

        {/* Leaderboard List */}
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.user_id === currentUserId;
            const losses = entry.games_played - entry.games_won;
            const rankStyle = getRankStyle(rank);
            const RankIcon = rankStyle.icon;

            return (
              <div
                key={entry.user_id}
                className={`
                  card card-hover relative overflow-hidden
                  ${isCurrentUser 
                    ? 'ring-4 ring-blue-500 bg-gradient-to-br from-blue-50 to-emerald-50' 
                    : ''}
                `}
              >
                {/* Top 3 Special Background */}
                {rank <= 3 && (
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-transparent opacity-30"></div>
                )}

                <div className="flex items-center gap-4 relative z-10">
                  {/* Rank Badge */}
                  <div className={`
                    ${rankStyle.bg} w-14 h-14 rounded-2xl flex items-center justify-center 
                    font-black text-white shadow-lg ${rankStyle.shadow} shrink-0
                  `}>
                    {RankIcon ? (
                      <RankIcon className={`text-2xl ${rankStyle.iconColor}`} />
                    ) : (
                      <span className="text-lg">#{rank}</span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800 truncate text-base">
                        {entry.player_name || 'Anonymous'}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-blue-500 text-white px-2 py-1 rounded-full font-bold shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg font-bold text-xs flex items-center gap-1">
                        🎯 {t.level} {entry.highest_level}
                      </span>
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg font-bold text-xs">
                        ✓ {entry.games_won}W
                      </span>
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-lg font-bold text-xs">
                        ✗ {losses}L
                      </span>
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">
                      {t.winRate}
                    </div>
                    <div className={`
                      font-black text-2xl
                      ${entry.win_rate >= 60 
                        ? 'text-emerald-600' 
                        : entry.win_rate >= 40 
                        ? 'text-blue-600' 
                        : 'text-gray-600'
                      }
                    `}>
                      {entry.win_rate}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="card text-center py-12">
              <IoTrophy className="text-6xl mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium">
                {language === 'id' ? 'Belum ada data ranking' : 'No ranking data yet'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {language === 'id' ? 'Jadilah yang pertama!' : 'Be the first!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};