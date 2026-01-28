import { useState, useEffect } from 'react';
import { BookOpen, ArrowLeft, Download, Trash2, Cloud, X, Edit2, Check } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface JournalHistoryProps {
  onClose: () => void;
}

interface JournalEntry {
  date: string;
  content: string;
  wordCount: number;
  duration: number;
  title?: string;
}

export function JournalHistory({ onClose }: JournalHistoryProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'cloud' | 'local'>('cloud');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [newContent, setNewContent] = useState('');
  const [downloadFormat, setDownloadFormat] = useState<'text' | 'html' | null>(null);
  const [downloadingEntry, setDownloadingEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const accessToken = localStorage.getItem('nightpage_access_token');
    const userId = localStorage.getItem('nightpage_user_id');
    
    if (accessToken) {
      // Try to load from cloud first
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3e97d870/journal/entries`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setEntries(data.entries);
          setSource('cloud');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Failed to load from cloud:', err);
      }
    }
    
    // Fallback to localStorage - user-specific
    const storageKey = userId ? `journalEntries_${userId}` : 'journalEntries';
    const localEntries = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setEntries(localEntries);
    setSource('local');
    setLoading(false);
  };

  const downloadEntry = (entry: JournalEntry, format: 'text' | 'html' = 'text') => {
    const date = new Date(entry.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <div class="date">${date}</div>
        <div class="metadata">Word Count: ${entry.wordCount} | Duration: ${entry.duration} minutes</div>
    </div>
    <div class="content">${entry.content}</div>
</body>
</html>`;
      content = htmlContent;
      mimeType = 'text/html';
      extension = 'html';
    } else {
      // Strip HTML tags for text export
      const textOnly = entry.content.replace(/<[^>]*>/g, '').trim();
      const textContent = `NightPage - Journal Entry\n\n${date}\nWord Count: ${entry.wordCount}\nDuration: ${entry.duration} minutes\n\n---\n\n${textOnly}`;
      content = textContent;
      mimeType = 'text/plain';
      extension = 'txt';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nightpage-${new Date(entry.date).toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllEntries = () => {
    const allContent = entries.map(entry => {
      const date = new Date(entry.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${date}\nWord Count: ${entry.wordCount} | Duration: ${entry.duration} min\n\n${entry.content}\n\n${'='.repeat(80)}\n\n`;
    }).join('');

    const textContent = `NightPage - Complete Journal Archive\n\nTotal Entries: ${entries.length}\n\n${'='.repeat(80)}\n\n${allContent}`;
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nightpage-archive-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteEntry = (date: string) => {
    if (confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
      const updated = entries.filter(e => e.date !== date);
      const userId = localStorage.getItem('nightpage_user_id');
      const storageKey = userId ? `journalEntries_${userId}` : 'journalEntries';
      localStorage.setItem(storageKey, JSON.stringify(updated.reverse()));
      loadEntries();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startEditing = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewContent(entry.content);
  };

  const saveEdit = async () => {
    if (!editingEntry) return;

    const updatedEntry = {
      ...editingEntry,
      content: newContent,
      wordCount: newContent.split(/\s+/).filter(word => word.length > 0).length,
      duration: Math.ceil(newContent.length / 150) // Assuming 150 words per minute
    };

    const updatedEntries = entries.map(e => e.date === editingEntry.date ? updatedEntry : e);
    setEntries(updatedEntries);
    const userId = localStorage.getItem('nightpage_user_id');
    const storageKey = userId ? `journalEntries_${userId}` : 'journalEntries';
    localStorage.setItem(storageKey, JSON.stringify(updatedEntries.reverse()));
    setEditingEntry(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0908',
        zIndex: 50,
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px 48px'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '48px',
            paddingBottom: '32px',
            borderBottom: '1px solid rgba(42, 38, 37, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen style={{ width: '32px', height: '32px', color: 'rgba(163, 149, 148, 0.7)' }} />
            <h1
              style={{
                fontSize: '32px',
                color: '#f2f4f3',
                fontFamily: 'Georgia, serif',
                fontWeight: 'normal',
                margin: 0
              }}
            >
              Past Entries
            </h1>
          </div>
          <button
            onClick={onClose}
            style={{
              color: 'rgba(74, 71, 70, 0.7)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.color = 'rgba(163, 149, 148, 0.7)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.color = 'rgba(74, 71, 70, 0.7)';
            }}
          >
            <X style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: '80px', paddingBottom: '80px' }}>
            <p
              style={{
                color: 'rgba(138, 129, 128, 0.8)',
                fontSize: '18px',
                marginBottom: '16px',
                fontFamily: 'Georgia, serif'
              }}
            >
              Loading entries...
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '80px', paddingBottom: '80px' }}>
            <p
              style={{
                color: 'rgba(138, 129, 128, 0.8)',
                fontSize: '18px',
                marginBottom: '16px',
                fontFamily: 'Georgia, serif'
              }}
            >
              No entries yet. Your thoughts await.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '8px 24px',
                border: '1px solid rgba(74, 71, 70, 0.6)',
                color: '#f2f4f3',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'background-color 0.2s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = '#1a1817';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'transparent';
              }}
            >
              Start Writing
            </button>
          </div>
        ) : (
          <>
            {/* Stats and download all */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '32px',
                paddingBottom: '24px',
                borderBottom: '1px solid rgba(42, 38, 37, 0.6)'
              }}
            >
              <div style={{ color: 'rgba(138, 129, 128, 0.8)' }}>
                <span style={{ fontSize: '24px', color: '#f2f4f3', fontWeight: 'bold' }}>
                  {entries.length}
                </span>{' '}
                {entries.length === 1 ? 'entry' : 'entries'} saved
              </div>
              <button
                onClick={downloadAllEntries}
                style={{
                  padding: '8px 16px',
                  border: '1px solid rgba(163, 149, 148, 0.7)',
                  color: 'rgba(163, 149, 148, 0.7)',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = 'rgba(42, 38, 37, 0.6)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = 'transparent';
                }}
              >
                <Download style={{ width: '16px', height: '16px' }} />
                Download All
              </button>
            </div>

            {/* Entries grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px'
              }}
            >
              {entries.map((entry) => (
                <button
                  key={entry.date}
                  onClick={() => setSelectedEntry(entry)}
                  style={{
                    textAlign: 'left',
                    padding: '24px',
                    border: '1px solid rgba(42, 38, 37, 0.6)',
                    background: '#0f0e0d',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = 'rgba(74, 71, 70, 0.6)';
                    el.style.background = '#1a1817';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = 'rgba(42, 38, 37, 0.6)';
                    el.style.background = '#0f0e0d';
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'rgba(74, 71, 70, 0.7)',
                      marginBottom: '8px'
                    }}
                  >
                    {formatDate(entry.date)}
                  </div>
                  <div
                    style={{
                      color: '#f2f4f3',
                      marginBottom: '12px',
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontFamily: 'Georgia, serif'
                    }}
                  >
                    {entry.content.substring(0, 150)}...
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'rgba(138, 129, 128, 0.8)' }}>
                    <span>{entry.wordCount} words</span>
                    <span>•</span>
                    <span>{entry.duration} min</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Entry detail modal */}
        {selectedEntry && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: '24px',
              backdropFilter: 'blur(4px)'
            }}
          >
            <div
              style={{
                background: '#0f0e0d',
                border: '1px solid rgba(74, 71, 70, 0.6)',
                borderRadius: '4px',
                maxWidth: '768px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  background: '#0f0e0d',
                  borderBottom: '1px solid rgba(42, 38, 37, 0.6)',
                  padding: '24px 32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'rgba(74, 71, 70, 0.7)',
                      marginBottom: '4px'
                    }}
                  >
                    {formatDate(selectedEntry.date)}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'rgba(138, 129, 128, 0.8)'
                    }}
                  >
                    {selectedEntry.wordCount} words • {selectedEntry.duration} min session
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setDownloadingEntry(selectedEntry);
                      setDownloadFormat('text');
                    }}
                    style={{
                      padding: '8px 12px',
                      color: 'rgba(163, 149, 148, 0.7)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Download options"
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.color = '#f2f4f3';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.color = 'rgba(163, 149, 148, 0.7)';
                    }}
                  >
                    <Download style={{ width: '20px', height: '20px' }} />
                  </button>
                  {downloadingEntry?.date === selectedEntry.date && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        background: '#0f0e0d',
                        border: '1px solid rgba(74, 71, 70, 0.6)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      <button
                        onClick={() => {
                          downloadEntry(selectedEntry, 'text');
                          setDownloadingEntry(null);
                          setDownloadFormat(null);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          color: '#f2f4f3',
                          cursor: 'pointer',
                          fontSize: '13px',
                          transition: 'background-color 0.2s ease',
                          borderBottom: '1px solid rgba(42, 38, 37, 0.6)'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42, 38, 37, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        📄 Text Only (.txt)
                      </button>
                      <button
                        onClick={() => {
                          downloadEntry(selectedEntry, 'html');
                          setDownloadingEntry(null);
                          setDownloadFormat(null);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          color: '#f2f4f3',
                          cursor: 'pointer',
                          fontSize: '13px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42, 38, 37, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        🖼️ With Images (.html)
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => deleteEntry(selectedEntry.date)}
                    style={{
                      padding: '8px',
                      color: 'rgba(163, 149, 148, 0.7)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease'
                    }}
                    title="Delete"
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.color = '#ff6b6b';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.color = 'rgba(163, 149, 148, 0.7)';
                    }}
                  >
                    <Trash2 style={{ width: '20px', height: '20px' }} />
                  </button>
                  <button
                    onClick={() => startEditing(selectedEntry)}
                    style={{
                      padding: '8px',
                      color: 'rgba(163, 149, 148, 0.7)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease'
                    }}
                    title="Edit"
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.color = '#f2f4f3';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.color = 'rgba(163, 149, 148, 0.7)';
                    }}
                  >
                    <Edit2 style={{ width: '20px', height: '20px' }} />
                  </button>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    style={{
                      padding: '8px',
                      color: 'rgba(74, 71, 70, 0.7)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.color = 'rgba(163, 149, 148, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.color = 'rgba(74, 71, 70, 0.7)';
                    }}
                  >
                    <X style={{ width: '20px', height: '20px' }} />
                  </button>
                </div>
              </div>
              <div style={{ padding: '32px' }}>
                {editingEntry && editingEntry.date === selectedEntry.date ? (
                  <>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      style={{
                        width: '100%',
                        height: '192px',
                        background: '#0f0e0d',
                        color: '#f2f4f3',
                        border: '1px solid rgba(42, 38, 37, 0.6)',
                        padding: '16px',
                        resize: 'none',
                        lineHeight: '1.8',
                        fontFamily: 'Georgia, serif',
                        fontSize: '1.125rem',
                        fontSizeAdjust: 'none'
                      }}
                    />
                    <button
                      onClick={saveEdit}
                      style={{
                        marginTop: '16px',
                        padding: '8px 16px',
                        background: 'rgba(163, 149, 148, 0.7)',
                        color: '#0f0e0d',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontFamily: 'inherit'
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = '#f2f4f3';
                        el.style.color = '#0f0e0d';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = 'rgba(163, 149, 148, 0.7)';
                        el.style.color = '#0f0e0d';
                      }}
                    >
                      <Check style={{ width: '16px', height: '16px' }} />
                      Save
                    </button>
                  </>
                ) : (
                  <div
                    style={{
                      color: '#f2f4f3',
                      lineHeight: '1.8',
                      fontFamily: 'Georgia, serif',
                      fontSize: '1.125rem'
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedEntry.content }}
                  />
                )}
              </div>
              <style>{`
                div[dangerouslySetInnerHTML] img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 8px;
                  margin: 16px 0;
                  display: block;
                }
              `}</style>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}