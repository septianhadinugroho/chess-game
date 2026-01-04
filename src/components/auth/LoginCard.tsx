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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header Section */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl mb-4 shadow-xl">
                <GiChessKnight className="text-7xl text-white drop-shadow-lg" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">Chess Master</h1>
              <div className="flex items-center justify-center gap-2 text-white/95">
                <IoSparkles className="text-yellow-300" size={18} />
                <p className="text-sm font-semibold">10 Level AI Challenge</p>
                <IoSparkles className="text-yellow-300" size={18} />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {t.welcome}
              </h2>
              <p className="text-gray-600 text-sm">
                {t.loginSubtitle}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 hover:shadow-md transition-all">
                <div className="text-4xl mb-2">
                  <IoSparkles className="text-blue-600 mx-auto" />
                </div>
                <p className="text-xs font-bold text-blue-700">10 {t.level}</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 hover:shadow-md transition-all">
                <IoTrophy className="text-4xl text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-emerald-700">{t.ranking}</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 hover:shadow-md transition-all">
                <IoStatsChart className="text-4xl text-orange-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-orange-700">{t.stats}</p>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={onLogin}
              className="w-full bg-white border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl text-gray-800 font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 group mb-6 touch-feedback"
            >
              <FcGoogle className="text-3xl group-hover:scale-110 transition-transform" />
              <span className="text-base">{t.loginButton}</span>
            </button>

            {/* User Friendly Language Toggle */}
            <div className="bg-gray-100 p-1.5 rounded-2xl flex relative">
              <button
                onClick={() => language === 'en' && onLanguageToggle()}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  language === 'id' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>🇮🇩</span> Indonesia
              </button>
              <button
                onClick={() => language === 'id' && onLanguageToggle()}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  language === 'en' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>🇬🇧</span> English
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-6 flex items-center justify-center gap-1">
              <IoSparkles className="text-emerald-500" size={14} />
              {t.autoSave}
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            {language === 'id' ? 'Tantang AI dari pemula hingga grand master' : 'Challenge AI from beginner to grand master'}
          </p>
        </div>
      </div>
    </div>
  );
};