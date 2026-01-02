import { useState, useEffect } from 'react';
import { UserProgress } from '@/types/game';

export const useProgress = (userId: string | null) => {
  const [progress, setProgress] = useState<UserProgress>({
    userId: userId || '',
    currentLevel: 1,
    highestLevel: 1,
    gamesWon: 0,
    gamesPlayed: 0
  });

  useEffect(() => {
    if (userId) {
      loadProgress();
    }
  }, [userId]);

  const loadProgress = () => {
    const saved = localStorage.getItem(`chess_progress_${userId}`);
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  };

  const saveProgress = (updates: Partial<UserProgress>) => {
    const newProgress = { ...progress, ...updates };
    setProgress(newProgress);
    localStorage.setItem(`chess_progress_${userId}`, JSON.stringify(newProgress));
  };

  const unlockNextLevel = () => {
    if (progress.currentLevel < 10) {
      saveProgress({
        highestLevel: Math.max(progress.highestLevel, progress.currentLevel + 1)
      });
    }
  };

  const incrementWins = () => {
    saveProgress({
      gamesWon: progress.gamesWon + 1,
      gamesPlayed: progress.gamesPlayed + 1
    });
  };

  const incrementPlayed = () => {
    saveProgress({
      gamesPlayed: progress.gamesPlayed + 1
    });
  };

  return { progress, saveProgress, unlockNextLevel, incrementWins, incrementPlayed };
};