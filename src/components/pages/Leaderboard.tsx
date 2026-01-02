import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IoTrophy, IoFlame, IoStar } from 'react-icons/io5';

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
      // Mengambil data dari VIEW 'leaderboard' yang sudah dibuat di SQL
      let query = supabase
        .from('leaderboard') 
        .select('*')
        .limit(100);

      if (filter === 'level') {
        query = query.order('highest_level', { ascending: false });
      } else if (filter === 'wins') {
        query = query.order('games_won', { ascending: false });
      } else {
        // Default sorting
        query = query.order('highest_level', { ascending: false })
                     .order('games_won', { ascending: false });
      }

      const { data, error } = await query;

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
      {/* Header Biru */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 mb-4 rounded-b-3xl shadow-lg">
        <div className="text-center text-white">
          <IoTrophy className="text-5xl mx-auto mb-2" />
          <h1 className="text-2xl font-bold mb-1">Top Players</h1>
          <p className="text-sm text-blue-100">Global Ranking</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {[
            { id: 'all', label: 'Semua', icon: IoStar },
            { id: 'level', label: 'Level', icon: IoTrophy },
            // { id: 'wins', label: 'Menang', icon: IoFlame }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`
                  flex-1 py-2 px-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all
                  ${filter === tab.id 
                    ? 'bg-blue-600 text-white shadow-md' 
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

      {/* Leaderboard List (Panjang ke bawah) */}
      <div className="px-4 space-y-3">
        {leaderboard.map((entry, index) => {
          const rank = index + 1;
          const isCurrentUser = entry.user_id === currentUserId;
          // Hitung 'Kalah/Draw' sebagai sisa dari Played - Won
          const losses = entry.games_played - entry.games_won;

          // Pewarnaan khusus Rank 1, 2, 3
          let rankColor = "text-gray-500";
          if (rank === 1) rankColor = "text-yellow-500";
          if (rank === 2) rankColor = "text-gray-400";
          if (rank === 3) rankColor = "text-orange-500";

          return (
            <div
              key={entry.user_id}
              className={`
                flex items-center gap-4 p-4 rounded-xl transition-all relative overflow-hidden
                ${isCurrentUser 
                  ? 'bg-blue-50 border-2 border-blue-500 shadow-md transform scale-[1.01]' // Highlight user sendiri
                  : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'
                }
              `}
            >
              {/* Nomor Rank */}
              <div className={`text-2xl font-black w-10 text-center ${rankColor}`}>
                #{rank}
              </div>

              {/* Info Player */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                   <span className="font-bold text-gray-800 text-base">
                      {entry.player_name || 'Anonymous'}
                   </span>
                   {isCurrentUser && (
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                        YOU
                      </span>
                   )}
                </div>
                
                {/* Stats: Level X - XW : YL */}
                <div className="text-sm text-gray-600 font-medium mt-1 flex items-center gap-2">
                  <span className="text-blue-600 font-bold">Level {entry.highest_level}</span>
                  <span className="text-gray-300">|</span>
                  <span>{entry.games_won}W : {losses}L</span>
                </div>
              </div>

              {/* Win Rate di ujung kanan */}
              <div className="text-right">
                 <div className="text-[10px] text-gray-400 uppercase tracking-wider">Win Rate</div>
                 <div className={`font-bold ${entry.win_rate > 50 ? 'text-green-600' : 'text-gray-600'}`}>
                    {entry.win_rate}%
                 </div>
              </div>
            </div>
          );
        })}

        {leaderboard.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>Belum ada data ranking.</p>
          </div>
        )}
      </div>
    </div>
  );
};