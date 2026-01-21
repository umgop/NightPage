import { Moon, Feather, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { JournalHistory } from './JournalHistory';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (showHistory) {
    return <JournalHistory onClose={() => setShowHistory(false)} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Gradient glow effect behind content */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 1
      }}></div>

      {/* Content */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
        width: '100%'
      }}>
        {/* Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          marginBottom: 32,
          opacity: isAnimated ? 1 : 0,
          transform: isAnimated ? 'scale(1)' : 'scale(0.8)',
          transition: 'all 1200ms cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <Moon style={{ width: 48, height: 48, color: 'rgba(242,244,243,0.7)' }} strokeWidth={1.5} />
          <Feather style={{ width: 48, height: 48, color: 'rgba(242,244,243,0.7)' }} strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 80,
          margin: '0 0 16px 0',
          color: '#f2f4f3',
          fontFamily: '"Playfair Display", "Merriweather", serif',
          fontWeight: 700,
          letterSpacing: -2,
          opacity: isAnimated ? 1 : 0,
          transform: isAnimated ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 1000ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms'
        }}>
          NightPage
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 20,
          color: 'rgba(242,244,243,0.75)',
          margin: '0 0 36px 0',
          fontFamily: '"Merriweather", serif',
          fontWeight: 300,
          letterSpacing: 0.5,
          opacity: isAnimated ? 1 : 0,
          transform: isAnimated ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 1000ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms'
        }}>
          When the world gets quiet, your thoughts get louder.
        </p>

        {/* Description */}
        <div style={{
          maxWidth: 550,
          margin: '0 auto 40px auto',
          color: 'rgba(242,244,243,0.65)',
          fontSize: 17,
          lineHeight: 1.7,
          fontFamily: '"Merriweather", serif',
          opacity: isAnimated ? 1 : 0,
          transform: isAnimated ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 1000ms cubic-bezier(0.34, 1.56, 0.64, 1) 300ms'
        }}>
          <p style={{ marginBottom: 12 }}>A quiet space for timed reflection.</p>
          <p>Set your mood. Start the timer. Let words flow.</p>
        </div>

        {/* CTA Button */}
        <button
          onClick={onStart}
          style={{
            marginTop: 32,
            padding: '16px 40px',
            background: isAnimated ? 'rgba(255,255,255,0.05)' : 'transparent',
            color: '#f2f4f3',
            border: '2px solid rgba(242,244,243,0.3)',
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 3,
            cursor: 'pointer',
            borderRadius: 6,
            fontFamily: 'inherit',
            opacity: isAnimated ? 1 : 0,
            transform: isAnimated ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 1000ms cubic-bezier(0.34, 1.56, 0.64, 1) 400ms',
            boxShadow: isAnimated ? '0 0 30px rgba(255,255,255,0.05)' : 'none'
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'rgba(255,255,255,0.1)';
            el.style.borderColor = 'rgba(242,244,243,0.6)';
            el.style.boxShadow = '0 0 40px rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'rgba(255,255,255,0.05)';
            el.style.borderColor = 'rgba(242,244,243,0.3)';
            el.style.boxShadow = '0 0 30px rgba(255,255,255,0.05)';
          }}
        >
          START WRITING
        </button>

        {/* View past entries button */}
        <button
          onClick={() => setShowHistory(true)}
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'rgba(242,244,243,0.5)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontFamily: 'inherit',
            opacity: isAnimated ? 1 : 0,
            transform: isAnimated ? 'translateY(0)' : 'translateY(-16px)',
            transition: 'all 700ms ease 1200ms'
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = 'rgba(242,244,243,0.8)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.color = 'rgba(242,244,243,0.5)';
          }}
        >
          <BookOpen style={{ width: 20, height: 20 }} />
          <span>Past Entries</span>
        </button>

        {/* Footer text */}
        <p style={{
          marginTop: 56,
          fontSize: 12,
          color: 'rgba(242,244,243,0.35)',
          letterSpacing: 2,
          fontFamily: '"Merriweather", serif',
          opacity: isAnimated ? 1 : 0,
          transition: 'opacity 1200ms ease 1000ms',
          textTransform: 'uppercase'
        }}>
          YOUR NIGHTLY RITUAL AWAITS
        </p>
      </div>
    </div>
  );
}