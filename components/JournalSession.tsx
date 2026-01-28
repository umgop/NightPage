import { useState, useEffect, useRef } from 'react';
import { Timer } from './Timer';
import { MusicPlayer } from './MusicPlayer';
import { Journal } from './Journal';
import { FontSelector } from './FontSelector';
import { JournalAssistant } from './JournalAssistant';
import { X, Download, Cloud, Sparkles, Image as ImageIcon } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface JournalSessionProps {
  onEnd: () => void;
  userId: string;
  accessToken: string;
}

const textEffects = [
  { id: 'none', name: 'None', class: '' },
  { id: 'sparkle', name: '✨ Sparkle', class: 'sparkle-effect' },
  { id: 'glow', name: '💫 Glow', class: 'glow-effect' },
  { id: 'flicker', name: '⚡ Flicker', class: 'flicker-effect' },
  { id: 'pulse', name: '💓 Pulse', class: 'pulse-effect' },
  { id: 'wave', name: '〰️ Wave', class: 'wave-effect' },
];

export function JournalSession({ onEnd, userId, accessToken }: JournalSessionProps) {
  const [sessionDuration, setSessionDuration] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [journalContent, setJournalContent] = useState('');
  const [selectedFont, setSelectedFont] = useState('georgia');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [selectedEffect, setSelectedEffect] = useState('none');
  const [showEffectMenu, setShowEffectMenu] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'text' | 'html' | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // NEW: image picker ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleInsertPrompt = (prompt: string) => {
    setJournalContent((prev) => {
      if (prev && !prev.endsWith('\n\n')) return prev + '\n\n' + prompt + '\n\n';
      return prev + prompt + '\n\n';
    });
  };

  // Start the timer
  const startTimer = (minutes: number) => {
    const seconds = minutes * 60;
    setSessionDuration(seconds);
    setTimeRemaining(seconds);
    setIsTimerActive(true);
    setSessionEnded(false);
  };

  // Pause/Resume timer
  const toggleTimer = () => {
    setIsTimerActive(!isTimerActive);
  };

  // End session early
  const endSession = () => {
    setIsTimerActive(false);
    setSessionEnded(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    saveEntryToCloud();
  };

  // Save entry to cloud (Supabase)
  const saveEntryToCloud = async () => {
    if (!journalContent.trim()) return;

    setSaveStatus('saving');

    try {
      const entry = {
        date: new Date().toISOString(),
        content: journalContent,
        wordCount: journalContent.trim().split(/\s+/).length,
        duration: sessionDuration ? Math.round(sessionDuration / 60) : 0,
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3e97d870/journal/save`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ entry }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      saveEntryToLocalStorage();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      console.error('Error saving to cloud:', err);
      saveEntryToLocalStorage();
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Save entry to localStorage (backup) - user-specific
  const saveEntryToLocalStorage = () => {
    if (!journalContent.trim()) return;

    const entry = {
      id: Date.now(),
      content: journalContent,
      date: new Date().toISOString(),
      wordCount: journalContent.trim().split(/\s+/).length,
      duration: sessionDuration ? sessionDuration / 60 : 0,
    };

    const storageKey = `journalEntries_${userId}`;
    const existingEntries = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existingEntries.push(entry);
    localStorage.setItem(storageKey, JSON.stringify(existingEntries));
  };

  // Download entry as text file
  const downloadEntry = (format: 'text' | 'html' = 'text') => {
    if (!journalContent.trim()) return;

    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let content: string;
    let mimeType: string;
    let extension: string;

    if (format === 'html') {
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NightPage - Journal Entry</title>
    <style>
        body {
            font-family: Georgia, serif;
            color: #333;
            background-color: #fafafa;
            padding: 40px 20px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.8;
        }
        .header {
            border-bottom: 1px solid #ddd;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .date {
            color: #666;
            font-size: 14px;
        }
        .metadata {
            color: #999;
            font-size: 13px;
            margin-top: 10px;
        }
        .content {
            white-space: pre-wrap;
            word-break: break-word;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 16px 0;
            display: block;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>NightPage Journal Entry</h1>
        <div class="date">${dateStr}</div>
        <div class="metadata">Word Count: ${journalContent.trim().split(/\s+/).length}</div>
    </div>
    <div class="content">${journalContent}</div>
</body>
</html>`;
      content = htmlContent;
      mimeType = 'text/html';
      extension = 'html';
    } else {
      // Strip HTML tags for text export
      const textOnly = journalContent.replace(/<[^>]*>/g, '').trim();
      const textContent = `NightPage - Journal Entry\n\n${dateStr}\nWord Count: ${journalContent.trim().split(/\s+/).length}\n\n---\n\n${textOnly}`;
      content = textContent;
      mimeType = 'text/plain';
      extension = 'txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nightpage-${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadFormat(null);
  };

  // NEW: image insert (as HTML <img>)
  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      // reset so the same file can be selected later
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;

      const imgHtml = `<img src="${dataUrl}" alt="journal image" style="max-width:100%; border-radius:12px; margin:12px 0;" />`;

      setJournalContent((prev) => {
        const prefix = prev && !prev.endsWith('\n\n') ? prev + '\n\n' : prev;
        return prefix + imgHtml + '\n\n';
      });

      // reset so selecting same file twice still triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  // Timer countdown logic
  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            setSessionEnded(true);
            saveEntryToCloud();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerActive, timeRemaining]);

  // Show timer selection if not started
  if (!sessionDuration) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
        }}
      >
        <button
          onClick={onEnd}
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            color: 'rgba(242,244,243,0.4)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <X style={{ width: 24, height: 24 }} />
        </button>

        <Timer onStart={startTimer} />
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with timer display */}
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '24px 32px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(10,9,8,0.95)',
          zIndex: 40,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
            {/* Timer display */}
            <div
              style={{
                color: 'rgba(242,244,243,0.9)',
                fontFamily: 'monospace',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 2,
                minWidth: 'fit-content',
              }}
            >
              {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
            </div>

            {/* Timer controls */}
            {!sessionEnded && (
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <button
                  onClick={toggleTimer}
                  style={{
                    fontSize: 16,
                    color: 'rgba(242,244,243,0.6)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f2f4f3')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(242,244,243,0.6)')}
                >
                  {isTimerActive ? 'Pause' : 'Resume'}
                </button>
                <span style={{ color: 'rgba(242,244,243,0.2)', fontSize: 18 }}>|</span>
                <button
                  onClick={endSession}
                  style={{
                    fontSize: 16,
                    color: 'rgba(242,244,243,0.6)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f2f4f3')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(242,244,243,0.6)')}
                >
                  End Session
                </button>
              </div>
            )}

            {/* Save status indicator */}
            {saveStatus !== 'idle' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15 }}>
                {saveStatus === 'saving' && (
                  <>
                    <Cloud style={{ width: 20, height: 20, color: 'rgba(242,244,243,0.4)' }} />
                    <span style={{ color: 'rgba(242,244,243,0.4)' }}>Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Cloud style={{ width: 20, height: 20, color: '#4ade80' }} />
                    <span style={{ color: '#4ade80' }}>Saved to cloud</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <Cloud style={{ width: 20, height: 20, color: '#ef4444' }} />
                    <span style={{ color: '#ef4444' }}>Saved locally</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FontSelector currentFont={selectedFont} onFontChange={setSelectedFont} />
            <MusicPlayer isPlaying={isTimerActive && !sessionEnded} />

            {/* NEW: Image button */}
            <button
              onClick={handlePickImage}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#f2f4f3',
                padding: '8px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
              title="Add an image to your journal"
            >
              <ImageIcon size={16} />
              Image
            </button>

            {/* hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelected}
              style={{ display: 'none' }}
            />

            {/* Effects dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowEffectMenu(!showEffectMenu)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#f2f4f3',
                  padding: '8px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }}
              >
                <Sparkles size={16} />
                Effect
              </button>

              {showEffectMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 8,
                    background: '#0a0908',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    minWidth: 160,
                    zIndex: 1000,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  }}
                >
                  {textEffects.map((effect, index) => (
                    <button
                      key={effect.id}
                      onClick={() => {
                        setSelectedEffect(effect.id);
                        setShowEffectMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background:
                          selectedEffect === effect.id ? 'rgba(255,255,255,0.12)' : 'transparent',
                        border: 'none',
                        borderBottom:
                          index < textEffects.length - 1
                            ? '1px solid rgba(255,255,255,0.05)'
                            : 'none',
                        color: selectedEffect === effect.id ? '#f2f4f3' : 'rgba(242,244,243,0.7)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.color = '#f2f4f3';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          selectedEffect === effect.id ? 'rgba(255,255,255,0.12)' : 'transparent';
                        e.currentTarget.style.color =
                          selectedEffect === effect.id ? '#f2f4f3' : 'rgba(242,244,243,0.7)';
                      }}
                    >
                      {effect.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Journal Assistant */}
            <JournalAssistant
              onInsertPrompt={handleInsertPrompt}
              currentContent={journalContent}
              accessToken={accessToken}
            />
          </div>

          <button
            onClick={onEnd}
            style={{
              color: 'rgba(242,244,243,0.4)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(242,244,243,0.7)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(242,244,243,0.4)')}
          >
            <X style={{ width: 28, height: 28 }} />
          </button>
        </div>
      </div>

      {/* Journal area */}
      <div style={{ flex: 1, overflowY: 'auto', marginTop: '20px' }}>
        <Journal
          content={journalContent}
          onChange={setJournalContent}
          isDisabled={sessionEnded}
          sessionEnded={sessionEnded}
          selectedFont={selectedFont}
          selectedEffect={selectedEffect}
        />
      </div>

      {/* Session ended overlay */}
      {sessionEnded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              background: '#0f0e0e',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 8,
              padding: 48,
              maxWidth: 420,
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontSize: 32,
                color: '#f2f4f3',
                margin: '0 0 24px 0',
                fontFamily: '"Playfair Display", "Merriweather", serif',
              }}
            >
              Session Complete
            </h2>
            <p
              style={{
                color: 'rgba(242,244,243,0.65)',
                lineHeight: 1.6,
                marginBottom: 32,
                fontFamily: 'inherit',
              }}
            >
              Your thoughts have been captured. Let them rest until tomorrow night.
            </p>

            {journalContent.trim() && (
              <div style={{ position: 'relative', marginBottom: 24 }}>
                <button
                  onClick={() => setDownloadFormat(downloadFormat ? null : 'text')}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    border: '1px solid rgba(242,244,243,0.2)',
                    color: '#f2f4f3',
                    background: 'transparent',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontFamily: 'inherit',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(242,244,243,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(242,244,243,0.2)';
                  }}
                >
                  <Download style={{ width: 16, height: 16 }} />
                  Download This Entry
                </button>
                {downloadFormat && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '8px',
                      background: '#1a1919',
                      border: '1px solid rgba(242,244,243,0.15)',
                      borderRadius: 6,
                      overflow: 'hidden',
                      zIndex: 1000,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    <button
                      onClick={() => {
                        downloadEntry('text');
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px 16px',
                        textAlign: 'center',
                        background: 'transparent',
                        border: 'none',
                        color: '#f2f4f3',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'background-color 0.2s ease',
                        borderBottom: '1px solid rgba(242,244,243,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      📄 Text Only (.txt)
                    </button>
                    <button
                      onClick={() => {
                        downloadEntry('html');
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px 16px',
                        textAlign: 'center',
                        background: 'transparent',
                        border: 'none',
                        color: '#f2f4f3',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      🖼️ With Images (.html)
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', paddingTop: 16 }}>
              <button
                onClick={() => {
                  setSessionDuration(null);
                  setJournalContent('');
                  setSessionEnded(false);
                  setTimeRemaining(0);
                }}
                style={{
                  padding: '10px 24px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f2f4f3',
                  background: 'transparent',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                New Session
              </button>

              <button
                onClick={onEnd}
                style={{
                  padding: '10px 24px',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#f2f4f3',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
