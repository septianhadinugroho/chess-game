import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IoTrophy, IoGameController, IoFlame, IoStatsChart } from 'react-icons/io5';

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
}

export const StatsPage: React.FC<StatsPageProps> = ({ userId, progress }) => {
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

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
  const currentStreak = calculateStreak(history);

  return (
    <div className="pb-20 animate-fade-in">
      {/* Header */}
      <div className="bg-linear-to-br from-purple-600 via-pink-600 to-red-600 p-6 mb-4">
        <div className="text-center text-white">
          <IoStatsChart className="text-5xl mx-auto mb-2" />
          <h1 className="text-2xl font-bold mb-1">Statistik Anda</h1>
          <p className="text-sm text-white/80">Performance & Progress</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
            <IoTrophy className="text-3xl mb-2" />
            <div className="text-3xl font-bold">{progress.highestLevel}</div>
            <div className="text-sm text-white/80">Highest Level</div>
          </div>
          
          <div className="bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
            <IoGameController className="text-3xl mb-2" />
            <div className="text-3xl font-bold">{progress.gamesPlayed}</div>
            <div className="text-sm text-white/80">Games Played</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{progress.gamesWon}</div>
            <div className="text-xs text-gray-600 mt-1">Menang</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{losses}</div>
            <div className="text-xs text-gray-600 mt-1">Kalah</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-indigo-600">{winRate}%</div>
            <div className="text-xs text-gray-600 mt-1">Win Rate</div>
          </div>
        </div>
      </div>

      {/* Current Streak */}
      <div className="px-4 mb-6">
        <div className="bg-linear-to-r from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/80 mb-1">Current Streak</div>
              <div className="text-4xl font-bold">{currentStreak}</div>
            </div>
            <IoFlame className="text-6xl opacity-80" />
          </div>
        </div>
      </div>

      {/* Recent Games */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-white mb-3">Recent Games</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((game, index) => (
              <div
                key={index}
                className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white
                      ${game.result === 'win' ? 'bg-green-500' : game.result === 'lose' ? 'bg-red-500' : 'bg-gray-500'}
                    `}>
                      {game.result === 'win' ? '✓' : game.result === 'lose' ? '✗' : '='}
                    </div>
                    
                    <div>
                      <div className="font-semibold text-gray-800">
                        Level {game.level}
                      </div>
                      <div className="text-xs text-gray-600">
                        {game.moves_count} moves · {new Date(game.created_at).toLocaleDateString('id-ID', { 
                          day: 'numeric',
                          month: 'short'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`
                    px-3 py-1 rounded-full text-xs font-bold
                    ${game.result === 'win' ? 'bg-green-100 text-green-700' : 
                      game.result === 'lose' ? 'bg-red-100 text-red-700' : 
                      'bg-gray-100 text-gray-700'}
                  `}>
                    {game.result === 'win' ? 'WIN' : game.result === 'lose' ? 'LOSE' : 'DRAW'}
                  </div>
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <div className="text-center py-12 text-white/80">
                <IoGameController className="text-6xl mx-auto mb-4 opacity-50" />
                <p>Belum ada riwayat permainan</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function calculateStreak(history: GameHistory[]): number {
  let streak = 0;
  for (const game of history) {
    if (game.result === 'win') {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}