import React from 'react';
import { IoHome, IoTrophy, IoStatsChart, IoSettings } from 'react-icons/io5';
import { translations, Language } from '@/lib/language';

interface BottomNavProps {
  activeTab: 'home' | 'leaderboard' | 'stats' | 'settings';
  onTabChange: (tab: 'home' | 'leaderboard' | 'stats' | 'settings') => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, language }) => {
  const t = translations[language];
  
  const tabs = [
    { id: 'home' as const, icon: IoHome, label: t.home },
    { id: 'leaderboard' as const, icon: IoTrophy, label: t.ranking },
    { id: 'stats' as const, icon: IoStatsChart, label: t.stats },
    { id: 'settings' as const, icon: IoSettings, label: t.settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-xl border-t border-slate-700 shadow-lg safe-area-bottom">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all
                  ${isActive 
                    ? 'text-blue-400' 
                    : 'text-slate-500 hover:text-slate-400'
                  }
                `}
              >
                <Icon className={`text-2xl transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-xs font-semibold ${isActive ? 'font-bold' : ''}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-blue-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};