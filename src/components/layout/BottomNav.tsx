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
    { id: 'home' as const, icon: IoHome, label: t.home, color: 'blue' },
    { id: 'leaderboard' as const, icon: IoTrophy, label: t.ranking, color: 'emerald' },
    { id: 'stats' as const, icon: IoStatsChart, label: t.stats, color: 'orange' },
    { id: 'settings' as const, icon: IoSettings, label: t.settings, color: 'gray' },
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    if (!isActive) return 'text-gray-400';
    
    const colors: Record<string, string> = {
      blue: 'text-blue-600',
      emerald: 'text-emerald-600',
      orange: 'text-orange-600',
      gray: 'text-gray-600',
    };
    
    return colors[color] || 'text-blue-600';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-lg safe-area-bottom">
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
                  relative flex flex-col items-center gap-1 py-3 px-4 rounded-2xl 
                  transition-all duration-200 touch-feedback min-w-[70px]
                  ${isActive 
                    ? 'bg-gradient-to-br from-blue-50 to-emerald-50' 
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <Icon 
                  className={`
                    text-2xl transition-all duration-200
                    ${getColorClasses(tab.color, isActive)}
                    ${isActive ? 'scale-110' : ''}
                  `} 
                />
                <span 
                  className={`
                    text-[10px] font-bold transition-all duration-200
                    ${isActive 
                      ? getColorClasses(tab.color, isActive) 
                      : 'text-gray-500'
                    }
                  `}
                >
                  {tab.label}
                </span>
                
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};