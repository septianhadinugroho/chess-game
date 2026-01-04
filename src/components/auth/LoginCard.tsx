import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { GiChessKnight } from 'react-icons/gi';
import { IoSparkles, IoTrophy, IoStatsChart, IoLanguage } from 'react-icons/io5';
import { translations, Language } from '@/lib/language';

interface LoginCardProps {
  onLogin: () => void;
  language: Language;
  onLanguageToggle: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({ onLogin, language, onLanguageToggle }) => {
  const t = translations[language];
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-md animate-slide-up">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-linear-to-br from-blue-900 to-blue-950 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-800/30 backdrop-blur-sm rounded-2xl mb-4 border border-blue-600/30">
                <GiChessKnight className="text-6xl text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Chess Master</h1>
              <div className="flex items-center justify-center gap-2 text-white/90">
                <IoSparkles className="text-blue-300" size={16} />
                <p className="text-sm font-medium">10 Level AI Challenge</p>
                <IoSparkles className="text-blue-300" size={16} />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-100 mb-2">
                {t.welcome}
              </h2>
              <p className="text-slate-400 text-sm">
                {t.loginSubtitle}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="text-center p-4 bg-blue-600/10 border border-blue-600/30 rounded-xl">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-xs font-semibold text-blue-400">10 {t.level}</p>
              </div>
              <div className="text-center p-4 bg-blue-600/10 border border-blue-600/30 rounded-xl">
                <IoTrophy className="text-3xl text-blue-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-blue-400">{t.ranking}</p>
              </div>
              <div className="text-center p-4 bg-blue-600/10 border border-blue-600/30 rounded-xl">
                <IoStatsChart className="text-3xl text-blue-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-blue-400">{t.stats}</p>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={onLogin}
              className="w-full bg-slate-700 border-2 border-slate-600 hover:border-blue-500 hover:shadow-lg text-slate-100 font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 group mb-4"
            >
              <FcGoogle className="text-2xl" />
              <span>{t.loginButton}</span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={onLanguageToggle}
              className="w-full bg-blue-600/10 border border-blue-600/30 text-blue-400 font-semibold py-3 px-6 rounded-xl transition-all hover:bg-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <IoLanguage size={20} />
              <span className="text-sm">
                {language === 'id' ? '🇬🇧 English' : '🇮🇩 Indonesia'}
              </span>
            </button>

            <p className="text-center text-xs text-slate-500 mt-4">
              {language === 'id' ? 'Progress & statistik tersimpan otomatis' : 'Progress & stats auto-saved'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};