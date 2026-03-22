import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  /** Mock Google sign-in — replace with real OAuth + API when ready. */
  const login = useCallback(() => {
    setUser({
      id: 1,
      name: 'Demo Student',
      email: 'demo@smartcampus.edu',
      roles: ['USER'],
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
    }),
    [user, login],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
