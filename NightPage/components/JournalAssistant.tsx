import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface JournalAssistantProps {
  onInsertPrompt: (text: string) => void;
  currentContent: string;
  accessToken?: string;
}

export function JournalAssistant({ onInsertPrompt, currentContent, accessToken }: JournalAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [isOpen]);

  const quickPrompts = [
    "What moments from today am I grateful for?",
    "What challenged me today and what did I learn from it?",
    "What would I tell my future self about this moment?",
    "What emotions am I feeling right now and why?",
    "If I could relive one moment from today, what would it be?",
    "What's one thing I wish I had done differently today?",
    "Who impacted my day and how?",
    "What am I looking forward to tomorrow?"
  ];

  const getAISuggestion = async () => {
    setLoading(true);
    setSuggestion('');

    try {
      console.log('=== AI REQUEST DEBUG ===');
      
      // Get fresh token from Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        throw new Error('Please sign in again to use AI features');
      }

      const userToken = session.access_token;
      console.log('Session user ID:', session.user.id);
      console.log('User token length:', userToken.length);
      console.log('Making request to:', `https://${projectId}.supabase.co/functions/v1/make-server-3e97d870/ai/prompt`);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3e97d870/ai/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,  // Anon key for function invocation
          'x-user-token': userToken  // User JWT for authentication inside function
        },
        body: JSON.stringify({
          currentContent
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API error response:', response.status, errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        console.error('Full error object:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData.error || errorData.message || 'Failed to get AI suggestion');
      }

      const data = await response.json();
      console.log('AI response received:', data);
      setSuggestion(data.prompt);
    } catch (err: any) {
      console.error('AI suggestion error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setSuggestion('Failed to get AI suggestion. Try signing out and back in.');
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    onInsertPrompt(prompt);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          color: '#f2f4f3',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          borderRadius: 8,
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          fontSize: 13
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
        }}
        title="Need inspiration?"
      >
        <Sparkles style={{ width: '16px', height: '16px', animation: 'sparkle 1.5s ease-in-out infinite' }} />
        <span style={{ fontSize: '13px' }}>Need ideas?</span>
      </button>

      {isOpen && createPortal(
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 9998,
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#0f0e0d',
                border: '1px solid rgba(74, 71, 70, 0.4)',
                borderRadius: '6px',
                maxWidth: '520px',
                width: '100%',
                maxHeight: '70vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
              }}
            >
              {/* Header */}
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  background: '#0f0e0d',
                  borderBottom: '1px solid rgba(74, 71, 70, 0.3)',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Sparkles style={{ width: '22px', height: '22px', color: '#f2f4f3' }} />
                  <h2
                    style={{
                      fontSize: '18px',
                      color: '#f2f4f3',
                      fontFamily: 'inherit',
                      fontWeight: 500,
                      margin: 0,
                      letterSpacing: '0.5px'
                    }}
                  >
                    Journal Assistant
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    color: 'rgba(242,244,243,0.5)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.color = '#f2f4f3';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.color = 'rgba(242,244,243,0.5)';
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* AI Suggestion */}
                <div style={{ background: '#0f0e0d', border: '1px solid rgba(42, 38, 37, 0.6)', borderRadius: '4px', padding: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '16px'
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '12px',
                        color: 'rgba(163, 149, 148, 0.7)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: 'bold',
                        margin: 0
                      }}
                    >
                      AI-Powered Prompt
                    </h3>
                    <button
                      onClick={getAISuggestion}
                      disabled={loading}
                      style={{
                        padding: '4px 12px',
                        background: 'transparent',
                        border: '1px solid rgba(74, 71, 70, 0.6)',
                        color: 'rgba(163, 149, 148, 0.7)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: loading ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          const el = e.currentTarget as HTMLButtonElement;
                          el.style.background = 'rgba(42, 38, 37, 0.6)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = 'transparent';
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
                          Thinking...
                        </>
                      ) : (
                        <>
                          <Sparkles style={{ width: '12px', height: '12px' }} />
                          Generate
                        </>
                      )}
                    </button>
                  </div>
                  {suggestion ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p
                        style={{
                          color: '#f2f4f3',
                          lineHeight: '1.6',
                          fontFamily: '"Spectral", serif',
                          margin: 0,
                          fontSize: '14px'
                        }}
                      >
                        {suggestion}
                      </p>
                      <button
                        onClick={() => handlePromptClick(suggestion)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid rgba(100, 200, 255, 0.5)',
                          background: 'rgba(100, 200, 255, 0.1)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit',
                          color: 'rgba(100, 200, 255, 0.9)',
                          fontSize: '12px',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLButtonElement;
                          el.style.background = 'rgba(100, 200, 255, 0.2)';
                          el.style.borderColor = 'rgba(100, 200, 255, 0.8)';
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLButtonElement;
                          el.style.background = 'rgba(100, 200, 255, 0.1)';
                          el.style.borderColor = 'rgba(100, 200, 255, 0.5)';
                        }}
                      >
                        Use This Prompt
                      </button>
                    </div>
                  ) : (
                    <p
                      style={{
                        color: 'rgba(163, 149, 148, 0.5)',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        margin: 0,
                        textAlign: 'center',
                        paddingTop: '8px'
                      }}
                    >
                      Click Generate to get a personalized prompt
                    </p>
                  )}
                </div>

                {/* Quick Prompts */}
                <div>
                  <h3
                    style={{
                      fontSize: '12px',
                      color: 'rgba(163, 149, 148, 0.7)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: 'bold',
                      margin: 0,
                      marginBottom: '8px'
                    }}
                  >
                    Quick Prompts
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {quickPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handlePromptClick(prompt)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px',
                          border: '1px solid rgba(42, 38, 37, 0.6)',
                          background: '#0f0e0d',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontFamily: 'inherit'
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLButtonElement;
                          el.style.borderColor = 'rgba(163, 149, 148, 0.7)';
                          el.style.background = '#1a1817';
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLButtonElement;
                          el.style.borderColor = 'rgba(42, 38, 37, 0.6)';
                          el.style.background = '#0f0e0d';
                        }}
                      >
                        <p
                          style={{
                            color: 'rgba(138, 129, 128, 0.8)',
                            transition: 'color 0.2s ease',
                            fontFamily: '"Spectral", serif',
                            margin: 0,
                            fontSize: '13px'
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLParagraphElement;
                            el.style.color = '#f2f4f3';
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLParagraphElement;
                            el.style.color = 'rgba(138, 129, 128, 0.8)';
                          }}
                        >
                          {prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>, document.body)}
    </>
  );
}