// FILE: src/hooks/useAuth.ts
import { useState, useEffect } from 'react';

// Fungsi helper buat bikin ID acak
const generateId = () => Math.random().toString(36).substring(2, 10);

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Cek apakah di browser ini udah ada data usernya?
    const savedUser = localStorage.getItem('chess_user');
    
    if (savedUser) {
      // Kalau ada, pakai identitas lama (UUID & Nama yang sama)
      setUser(JSON.parse(savedUser));
    } else {
      // 2. Kalau BELUM ADA (User Baru), kita buatin identitas permanen sekarang juga!
      // Jadi gak ada lagi cerita user = null.
      const uniqueId = `user_${generateId()}`; // Contoh: user_x7z9q2
      
      const guestUser = {
        id: uniqueId, 
        email: `${uniqueId}@guest.chess.com`,
        user_metadata: { 
          // Kasih nama unik biar ketauan siapa lawan siapa
          full_name: `Guest ${uniqueId.substring(5).toUpperCase()}` 
        },
        is_guest: true
      };
      
      // Simpan ke localStorage biar ID ini abadi di browser dia
      localStorage.setItem('chess_user', JSON.stringify(guestUser));
      setUser(guestUser);
    }
    setLoading(false);
  }, []);

  const signIn = () => {
    // Ini kalau dia mau login jadi member beneran (misal overwrite guest)
    const mockUser = {
      id: 'member_septian', // Contoh ID tetap buat member
      email: 'player@chess.com',
      user_metadata: { full_name: 'Septian (Member)' }
    };
    localStorage.setItem('chess_user', JSON.stringify(mockUser));
    setUser(mockUser);
    window.location.reload(); 
  };

  const signOut = () => {
    localStorage.removeItem('chess_user');
    window.location.reload(); // Reload biar dibuatin ID Guest baru lagi
  };

  return { user, loading, signIn, signOut };
};