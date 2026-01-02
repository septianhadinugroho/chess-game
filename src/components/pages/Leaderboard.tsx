import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IoTrophy, IoFlame, IoStar } from 'react-icons/io5';
import { FaCrown } from 'react-icons/fa';

interface LeaderboardEntry {
  user_id: string;
  player_name: string;
  highest_level: number;
  games_won: number;
  games_played: number;
  win_rate: number;
}

export const Leaderboard: React.FC<{ currentUserId: string }> = ({ currentUserId }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'level' | 'wins'>('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('user_progress')
        .select(`
          user_id,
          highest_level,
          games_won,
          games_played
        `)
        .order('highest_level', { ascending: false })
        .order('games_won', { ascending: false })
        .limit(100);

      const { data, error } = await query;

      if (error) throw error;

      // Calculate win rate and format data
      const formattedData = data?.map((entry: any) => ({
        ...entry,
        player_name: entry.user_id.substring(0, 8),
        win_rate: entry.games_played > 0 
          ? Math.round((entry.games_won / entry.games_played) * 100) 
          : 0
      })) || [];

      setLeaderboard(formattedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <FaCrown className="text-yellow-500 text-xl" />;
    if (index === 1) return <FaCrown className="text-gray-400 text-lg" />;
    if (index === 2) return <FaCrown className="text-orange-600 text-lg" />;
    return null;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (index === 1) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
    if (index === 2) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    return 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 animate-fade-in">
      {/* Header */}
      <div className="bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 mb-4">
        <div className="text-center text-white">
          <IoTrophy className="text-5xl mx-auto mb-2" />
          <h1 className="text-2xl font-bold mb-1">Global Leaderboard</h1>
          <p className="text-sm text-white/80">Top Players Worldwide</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
          {[
            { id: 'all', label: 'Semua', icon: IoStar },
            { id: 'level', label: 'Level', icon: IoTrophy },
            { id: 'wins', label: 'Menang', icon: IoFlame }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`
                  flex-1 py-2 px-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all
                  ${filter === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="text-lg" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="px-4 mb-6">
        <div className="flex items-end justify-center gap-2 mb-6">
          {leaderboard.slice(0, 3).map((entry, index) => {
            const heights = ['h-28', 'h-32', 'h-24'];
            const orders = [1, 0, 2];
            const actualIndex = orders.indexOf(index);
            
            return (
              <div key={entry.user_id} className={`flex-1 ${index === 1 ? 'order-first' : ''}`}>
                <div className={`${heights[actualIndex]} bg-linear-to-br ${getRankBadge(actualIndex)} rounded-t-2xl flex flex-col items-center justify-end pb-3 shadow-lg relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/10"></div>
                  <div className="relative z-10 text-center">
                    {getRankIcon(actualIndex)}
                    <div className="text-2xl font-bold mt-1">#{actualIndex + 1}</div>
                    <div className="text-xs font-semibold mt-1 truncate px-2">
                      {entry.player_name}
                    </div>
                    <div className="text-xs mt-1">
                      Lv.{entry.highest_level} · {entry.games_won}W
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="px-4 space-y-2">
        {leaderboard.slice(3).map((entry, index) => {
          const actualRank = index + 4;
          const isCurrentUser = entry.user_id === currentUserId;
          
          return (
            <div
              key={entry.user_id}
              className={`
                bg-white rounded-xl p-4 shadow-sm border-2 transition-all
                ${isCurrentUser 
                  ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                  : 'border-transparent hover:border-gray-200'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  ${isCurrentUser ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}
                `}>
                  #{actualRank}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 truncate flex items-center gap-2">
                    {entry.player_name}
                    {isCurrentUser && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <IoTrophy className="text-amber-500" />
                      Level {entry.highest_level}
                    </span>
                    <span className="flex items-center gap-1">
                      <IoFlame className="text-red-500" />
                      {entry.games_won} Wins
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-indigo-600">
                    {entry.win_rate}%
                  </div>
                  <div className="text-xs text-gray-500">Win Rate</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <IoTrophy className="text-6xl mx-auto mb-4 opacity-30" />
          <p>Belum ada data ranking</p>
        </div>
      )}
    </div>
  );
};