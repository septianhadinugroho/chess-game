'use client';

import React, { useState, useEffect } from 'react';
import { IoDownload, IoClose, IoCheckmarkCircle } from 'react-icons/io5';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration);
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      });
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 5 seconds
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa_install_dismissed');
        if (!dismissed) {
          setShowInstallPrompt(true);
        }
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      localStorage.setItem('pwa_install_dismissed', 'true');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (isInstalled || !showInstallPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="max-w-md mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-2xl p-4 text-white">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Close"
        >
          <IoClose size={20} />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <IoDownload className="text-2xl" />
          </div>

          <div className="flex-1 pr-6">
            <h3 className="font-bold text-lg mb-1">Install Chess Master</h3>
            <p className="text-sm text-blue-100 mb-3">
              Install aplikasi untuk pengalaman lebih baik & akses offline!
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-white text-blue-600 px-4 py-2 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <IoCheckmarkCircle size={18} />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="bg-white/20 px-4 py-2 rounded-xl font-bold hover:bg-white/30 transition-all"
              >
                Nanti
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}