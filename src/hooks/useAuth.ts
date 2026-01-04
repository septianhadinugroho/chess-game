import { useState, useEffect } from 'react';

const generateId = () => Math.random().toString(36).substring(2, 10);

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek localStorage
    const savedUser = localStorage.getItem('chess_user');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // GENERATE GUEST ID (Pasti Text, pasti unik)
      const uniqueId = `guest_${generateId()}`;
      
      const guestUser = {
        id: uniqueId, 
        email: 'guest@chess.com',
        user_metadata: { 
          full_name: `Guest ${uniqueId.substring(6).toUpperCase()}` 
        },
        is_guest: true
      };
      
      localStorage.setItem('chess_user', JSON.stringify(guestUser));
      setUser(guestUser);
    }
    setLoading(false);
  }, []);

  const signIn = () => {
    const mockUser = {
      id: 'member_septian', // ID Member juga pake text aja biar seragam
      email: 'septian@chess.com',
      user_metadata: { full_name: 'Septian (Member)' }
    };
    localStorage.setItem('chess_user', JSON.stringify(mockUser));
    setUser(mockUser);
    window.location.reload();
  };

  const signOut = () => {
    localStorage.removeItem('chess_user');
    window.location.reload();
  };

  return { user, loading, signIn, signOut };
};