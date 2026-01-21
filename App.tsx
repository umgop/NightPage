import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { JournalSession } from './components/JournalSession';
import { AuthPage } from './components/AuthPage';
import { supabase } from './utils/supabase/client';

type AppView = 'landing' | 'auth' | 'session';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check for existing session on mount and set up auth state listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
        setAccessToken(session.access_token);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
        setAccessToken(session.access_token);
      } else {
        setUserId(null);
        setUserEmail(null);
        setAccessToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = (newUserId: string, email: string, token: string) => {
    setUserId(newUserId);
    setUserEmail(email);
    setAccessToken(token);
    setCurrentView('landing');
  };

  const handleLogout = () => {
    setUserId(null);
    setUserEmail(null);
    setAccessToken(null);
    setCurrentView('landing');
  };

  const handleStartSession = () => {
    if (!userId) {
      setCurrentView('auth');
    } else {
      setCurrentView('session');
    }
  };

  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logout button - only show when logged in and on landing */}
      {userId && currentView === 'landing' && (
        <button
          onClick={handleLogout}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            fontSize: 14,
            color: 'rgba(242,244,243,0.4)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: 50,
          }}
        >
          Sign Out ({userEmail})
        </button>
      )}      {currentView === 'landing' && (
        <LandingPage onStart={handleStartSession} />
      )}

      {currentView === 'auth' && (
        <AuthPage 
          onAuthSuccess={handleAuthSuccess}
          onBack={() => setCurrentView('landing')}
        />
      )}

      {currentView === 'session' && userId && accessToken && (
        <JournalSession 
          onEnd={() => setCurrentView('landing')}
          userId={userId}
          accessToken={accessToken}
        />
      )}
    </div>
  );
}