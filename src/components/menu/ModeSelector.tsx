import React from 'react';
import { GiRobotGolem, GiTwoShadows, IoSparkles, IoGlobe } from 'react-icons/io5';
import { translations, Language } from '@/lib/language';

interface ModeSelectorProps {
  onSelectMode: (mode: 'ai' | 'multiplayer') => void;
  language: Language;
}

export default function ModeSelector({ onSelectMode, language }: ModeSelectorProps) {
  const t = translations[language];
  
  return (
    <div className="card animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
          <IoSparkles className="text-2xl text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            {language === 'id' ? 'Pilih Mode Permainan' : 'Select Game Mode'}
          </h3>
          <p className="text-sm text-gray-500">
            {language === 'id' ? 'Pilih cara bermainmu' : 'Choose how to play'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* AI Mode */}
        <button
          onClick={() => onSelectMode('ai')}
          className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl p-6 rounded-2xl transition-all touch-feedback text-left overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <GiRobotGolem className="text-3xl text-white" />
              </div>
              
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                  {language === 'id' ? 'Lawan AI' : 'Play vs AI'}
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
                    {language === 'id' ? 'Offline' : 'Offline'}
                  </span>
                </h4>
                
                <p className="text-sm text-gray-600 mb-3">
                  {language === 'id' 
                    ? 'Tantang komputer AI dengan 10 level kesulitan. Perfect untuk latihan!' 
                    : 'Challenge AI computer with 10 difficulty levels. Perfect for practice!'}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                    📊 10 {t.level}
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">
                    🏆 {t.ranking}
                  </span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">
                    💾 Auto Save
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
        </button>

        {/* Multiplayer Mode */}
        <button
          onClick={() => onSelectMode('multiplayer')}
          className="group relative bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-xl p-6 rounded-2xl transition-all touch-feedback text-left overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <GiTwoShadows className="text-3xl text-white" />
              </div>
              
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                  {language === 'id' ? 'Multiplayer Online' : 'Online Multiplayer'}
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold animate-pulse-slow flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    {language === 'id' ? 'Live' : 'Live'}
                  </span>
                </h4>
                
                <p className="text-sm text-gray-600 mb-3">
                  {language === 'id' 
                    ? 'Main online dengan teman atau pemain lain. Gunakan kode room atau share link!' 
                    : 'Play online with friends or other players. Use room code or share link!'}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
                    <IoGlobe className="inline mr-1" size={12} />
                    {language === 'id' ? 'Real-time' : 'Real-time'}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                    🎮 {language === 'id' ? 'Dengan Teman' : 'With Friends'}
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">
                    👥 {language === 'id' ? 'Mode Nonton' : 'Spectator'}
                  </span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">
                    ⏱️ Timer
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-emerald-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
        </button>
      </div>

      {/* Info Tips */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
        <div className="flex gap-3">
          <IoSparkles className="text-2xl text-purple-600 shrink-0" />
          <div>
            <h4 className="font-bold text-sm text-gray-800 mb-1">
              {language === 'id' ? 'Tips Memilih Mode' : 'Mode Selection Tips'}
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {language === 'id' 
                ? 'Pilih AI untuk latihan dan tingkatkan skill. Pilih Multiplayer untuk pengalaman kompetitif melawan pemain lain!' 
                : 'Choose AI to practice and improve skills. Choose Multiplayer for competitive experience against other players!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}