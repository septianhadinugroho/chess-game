import React from 'react';
import { IoHome, IoTrophy, IoStatsChart, IoSettings } from 'react-icons/io5';

interface BottomNavProps {
  activeTab: 'home' | 'leaderboard' | 'stats' | 'settings';
  onTabChange: (tab: 'home' | 'leaderboard' | 'stats' | 'settings') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home' as const, icon: IoHome, label: 'Home' },
    { id: 'leaderboard' as const, icon: IoTrophy, label: 'Ranking' },
    { id: 'stats' as const, icon: IoStatsChart, label: 'Stats' },
    { id: 'settings' as const, icon: IoSettings, label: 'Setting' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-lg safe-area-bottom">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all
                  ${isActive 
                    ? 'text-indigo-600 bg-indigo-50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`text-2xl ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className={`text-xs font-semibold ${isActive ? 'font-bold' : ''}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 w-12 h-1 bg-indigo-600 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};