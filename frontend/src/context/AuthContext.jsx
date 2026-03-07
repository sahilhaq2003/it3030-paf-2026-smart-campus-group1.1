// Temporary mock auth context — Member 4 will replace this with real OAuth
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Mock user for testing your module independently
  const [user] = useState({
    id: 1,
    name: 'Test User',
    email: 'test@sliit.lk',
    roles: ['USER'],
  });

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: true }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}