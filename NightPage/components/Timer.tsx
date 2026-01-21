import { Clock } from 'lucide-react';

interface TimerProps {
  onStart: (minutes: number) => void;
}

const presetDurations = [
  { label: '5 Minutes', value: 5 },
  { label: '10 Minutes', value: 10 },
  { label: '15 Minutes', value: 15 },
  { label: '20 Minutes', value: 20 },
  { label: '30 Minutes', value: 30 },
];

export function Timer({ onStart }: TimerProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px'
    }}>
      <div style={{
        maxWidth: 800,
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 32
        }}>
          <Clock style={{ width: 56, height: 56, color: 'rgba(242,244,243,0.7)' }} strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h2 style={{
          fontSize: 56,
          color: '#f2f4f3',
          margin: '0 0 24px 0',
          fontFamily: '"Playfair Display", "Merriweather", serif',
          fontWeight: 700,
          letterSpacing: -1
        }}>
          Set Your Time
        </h2>

        {/* Description */}
        <p style={{
          color: 'rgba(242,244,243,0.65)',
          marginBottom: 40,
          maxWidth: 550,
          margin: '0 auto 40px auto',
          fontSize: 16,
          lineHeight: 1.6,
          fontFamily: '"Merriweather", serif',
          fontWeight: 300
        }}>
          Choose how long you wish to journal tonight. When time runs out, your session gently concludes.
        </p>

        {/* Duration buttons grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 16,
          maxWidth: 600,
          margin: '0 auto 48px auto'
        }}>
          {presetDurations.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => onStart(value)}
              style={{
                padding: '20px 24px',
                background: 'rgba(255,255,255,0.02)',
                color: '#f2f4f3',
                border: '1.5px solid rgba(242,244,243,0.15)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: '"Merriweather", serif',
                letterSpacing: 0.5,
                transition: 'all 300ms ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'rgba(255,255,255,0.06)';
                el.style.borderColor = 'rgba(242,244,243,0.35)';
                el.style.boxShadow = '0 0 20px rgba(255,255,255,0.08)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'rgba(255,255,255,0.02)';
                el.style.borderColor = 'rgba(242,244,243,0.15)';
                el.style.boxShadow = 'none';
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Footer text */}
        <p style={{
          fontSize: 11,
          color: 'rgba(242,244,243,0.35)',
          letterSpacing: 2,
          fontFamily: '"Merriweather", serif',
          textTransform: 'uppercase',
          marginTop: 32
        }}>
          CHOOSE WISELY — TIME FLOWS ONLY FORWARD
        </p>
      </div>
    </div>
  );
}
