import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for mock login
    const savedUser = localStorage.getItem('chess_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = () => {
    const mockUser = {
      id: 'mock-user-id',
      email: 'player@chess.com',
      user_metadata: { full_name: 'Player' }
    };
    localStorage.setItem('chess_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const signOut = () => {
    localStorage.removeItem('chess_user');
    setUser(null);
  };

  return { user, loading, signIn, signOut };
};