import { Type } from 'lucide-react';
import { useState } from 'react';

interface FontSelectorProps {
  currentFont: string;
  onFontChange: (font: string) => void;
}

const fonts = [
  { id: 'georgia', name: 'Classic Serif', family: 'Georgia, serif', sample: 'The night whispers secrets' },
  { id: 'baskerville', name: 'Baskerville', family: '"Libre Baskerville", serif', sample: 'The night whispers secrets' },
  { id: 'spectral', name: 'Spectral', family: '"Spectral", serif', sample: 'The night whispers secrets' },
  { id: 'merriweather', name: 'Merriweather', family: '"Merriweather", serif', sample: 'The night whispers secrets' },
  { id: 'playfair', name: 'Playfair Display', family: '"Playfair Display", serif', sample: 'The night whispers secrets' },
  { id: 'lora', name: 'Lora', family: '"Lora", serif', sample: 'The night whispers secrets' },
  { id: 'crimson', name: 'Crimson Text', family: '"Crimson Text", serif', sample: 'The night whispers secrets' },
  { id: 'courier', name: 'Typewriter', family: '"Courier New", monospace', sample: 'The night whispers secrets' },
  { id: 'dancing', name: 'Dancing Script', family: '"Dancing Script", cursive', sample: 'The night whispers secrets', isCalligraphy: true },
  { id: 'greatvibes', name: 'Great Vibes', family: '"Great Vibes", cursive', sample: 'The night whispers secrets', isCalligraphy: true },
  { id: 'satisfy', name: 'Satisfy', family: '"Satisfy", cursive', sample: 'The night whispers secrets', isCalligraphy: true },
  { id: 'inter', name: 'Modern Sans', family: '"Inter", sans-serif', sample: 'The night whispers secrets' },
  { id: 'system', name: 'System UI', family: 'system-ui, sans-serif', sample: 'The night whispers secrets' },
];

export function FontSelector({ currentFont, onFontChange }: FontSelectorProps) {
  const [showSelector, setShowSelector] = useState(false);

  const selectedFont = fonts.find(f => f.id === currentFont) || fonts[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowSelector(!showSelector)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          color: 'rgba(242,244,243,0.5)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 13,
          transition: 'color 200ms'
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.color = '#f2f4f3';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.color = 'rgba(242,244,243,0.5)';
        }}
        title="Change font"
      >
        <Type style={{ width: 16, height: 16 }} />
      </button>

      {showSelector && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40
            }}
            onClick={() => setShowSelector(false)}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 320,
            background: '#0f0e0e',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 8,
            zIndex: 50,
            overflow: 'hidden',
            maxHeight: '70vh',
            overflowY: 'auto'
          }}>
            <div style={{
              padding: 12,
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ fontSize: 13, color: 'rgba(242,244,243,0.5)' }}>Choose Your Font</div>
            </div>
            <div style={{
              overflowY: 'auto',
              maxHeight: '60vh'
            }}>
              {/* Journalistic Fonts Section */}
              <div style={{
                padding: '8px 12px',
                background: '#0f0e0d',
                borderBottom: '1px solid rgba(42, 38, 37, 0.6)'
              }}>
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(74, 71, 70, 0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Journalistic</div>
              </div>
              {fonts.filter(f => !f.isCalligraphy && f.id !== 'courier' && f.id !== 'inter' && f.id !== 'system').map((font) => {
                const isSelected = font.id === currentFont;
                return (
                  <button
                    key={font.id}
                    onClick={() => {
                      onFontChange(font.id);
                      setShowSelector(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '16px',
                      background: isSelected ? 'rgba(42, 38, 37, 0.6)' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(42, 38, 37, 0.3)',
                      color: isSelected ? '#f2f4f3' : 'rgba(138, 129, 128, 0.8)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = 'rgba(42, 38, 37, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = isSelected ? 'rgba(42, 38, 37, 0.6)' : 'transparent';
                    }}
                  >
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>{font.name}</div>
                    <div
                      style={{
                        fontSize: '16px',
                        color: 'rgba(163, 149, 148, 0.7)',
                        fontFamily: font.family
                      }}
                    >
                      {font.sample}
                    </div>
                  </button>
                );
              })}

              {/* Calligraphy Fonts Section */}
              <div style={{
                padding: '8px 12px',
                background: '#0f0e0d',
                borderBottom: '1px solid rgba(42, 38, 37, 0.6)'
              }}>
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(74, 71, 70, 0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Calligraphy</div>
              </div>
              {fonts.filter(f => f.isCalligraphy).map((font) => {
                const isSelected = font.id === currentFont;
                return (
                  <button
                    key={font.id}
                    onClick={() => {
                      onFontChange(font.id);
                      setShowSelector(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '16px',
                      background: isSelected ? 'rgba(42, 38, 37, 0.6)' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(42, 38, 37, 0.3)',
                      color: isSelected ? '#f2f4f3' : 'rgba(138, 129, 128, 0.8)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = 'rgba(42, 38, 37, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = isSelected ? 'rgba(42, 38, 37, 0.6)' : 'transparent';
                    }}
                  >
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>{font.name}</div>
                    <div
                      style={{
                        fontSize: '18px',
                        color: 'rgba(163, 149, 148, 0.7)',
                        fontFamily: font.family
                      }}
                    >
                      {font.sample}
                    </div>
                  </button>
                );
              })}

              {/* Other Fonts Section */}
              <div style={{
                padding: '8px 12px',
                background: '#0f0e0d',
                borderBottom: '1px solid rgba(42, 38, 37, 0.6)'
              }}>
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(74, 71, 70, 0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Other</div>
              </div>
              {fonts.filter(f => ['courier', 'inter', 'system'].includes(f.id)).map((font) => {
                const isSelected = font.id === currentFont;
                return (
                  <button
                    key={font.id}
                    onClick={() => {
                      onFontChange(font.id);
                      setShowSelector(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '16px',
                      background: isSelected ? 'rgba(42, 38, 37, 0.6)' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(42, 38, 37, 0.3)',
                      color: isSelected ? '#f2f4f3' : 'rgba(138, 129, 128, 0.8)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = 'rgba(42, 38, 37, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = isSelected ? 'rgba(42, 38, 37, 0.6)' : 'transparent';
                    }}
                  >
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>{font.name}</div>
                    <div
                      style={{
                        fontSize: '16px',
                        color: 'rgba(163, 149, 148, 0.7)',
                        fontFamily: font.family
                      }}
                    >
                      {font.sample}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function getFontFamily(fontId: string): string {
  const font = fonts.find(f => f.id === fontId);
  return font ? font.family : fonts[0].family;
}
