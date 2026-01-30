import { useState } from 'react';
import { Moon, Feather, Mail, Lock, User, ArrowLeft, Check, X } from 'lucide-react';
import { supabase } from '../utils/supabase/client';

interface AuthPageProps {
  onAuthSuccess: (userId: string, email: string, accessToken: string) => void;
  onBack: () => void;
}

const validatePassword = (pwd: string) => {
  return {
    length: pwd.length >= 12,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  };
};

const isPasswordStrong = (pwd: string) => {
  const checks = validatePassword(pwd);
  return Object.values(checks).every(v => v === true);
};

export function AuthPage({ onAuthSuccess, onBack }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupEmailSent, setSignupEmailSent] = useState(false);
  const [signupEmail, setSignupEmail] = useState(''); // Store email for resend
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendVerification = async () => {
    if (!signupEmail) return;
    
    setResendLoading(true);
    setResendSuccess(false);
    setError('');

    try {
      const response = await fetch(
        `https://wqnniektmublmmghfeep.supabase.co/functions/v1/make-server-3e97d870/auth/resend-verification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: signupEmail }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Call backend endpoint for login (enforces email verification)
        const response = await fetch(
          `https://wqnniektmublmmghfeep.supabase.co/functions/v1/make-server-3e97d870/auth/login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        onAuthSuccess(
          data.userId,
          data.email,
          data.accessToken
        );
      } else {
        // Validate password strength for signup
        if (!isPasswordStrong(password)) {
          throw new Error('Password does not meet security requirements');
        }

        // Call backend endpoint for signup (sends verification email)
        const response = await fetch(
          `https://wqnniektmublmmghfeep.supabase.co/functions/v1/make-server-3e97d870/auth/signup`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Signup failed');
        }

        // Show confirmation message and store email for resend
        setSignupEmail(email);
        setSignupEmailSent(true);
        setEmail('');
        setPassword('');
        setName('');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        paddingTop: '48px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.05
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'rgba(74, 71, 70, 0.7)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'color 0.2s ease',
          fontFamily: 'inherit'
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
        <ArrowLeft style={{ width: '20px', height: '20px' }} />
        <span style={{ fontSize: '14px' }}>Back</span>
      </button>

      {/* Auth Form */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '480px'
        }}
      >
        {/* Email Confirmation Screen */}
        {signupEmailSent && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Moon style={{ width: '32px', height: '32px', color: 'rgba(163, 149, 148, 0.7)' }} strokeWidth={1.5} />
              <Feather style={{ width: '32px', height: '32px', color: 'rgba(163, 149, 148, 0.7)' }} strokeWidth={1.5} />
            </div>
            <h1
              style={{
                fontSize: '32px',
                color: '#f2f4f3',
                marginBottom: '12px',
                fontFamily: '"Libre Baskerville", serif',
                fontWeight: 'normal'
              }}
            >
              Verify Your Email
            </h1>
            <p
              style={{
                color: 'rgba(138, 129, 128, 0.8)',
                fontFamily: '"Spectral", serif',
                marginBottom: '8px'
              }}
            >
              We've sent a confirmation link to:
            </p>
            <p
              style={{
                color: '#f2f4f3',
                fontFamily: '"Spectral", serif',
                marginBottom: '24px',
                fontWeight: '500'
              }}
            >
              {signupEmail}
            </p>
            <div
              style={{
                background: 'rgba(100, 200, 255, 0.1)',
                border: '1px solid rgba(100, 200, 255, 0.3)',
                borderRadius: '4px',
                padding: '16px 12px',
                marginBottom: '24px'
              }}
            >
              <p style={{ fontSize: '14px', color: 'rgba(100, 200, 255, 0.9)', margin: 0 }}>
                Click the confirmation link in your email to activate your account. Check spam if you don't see it.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  background: 'rgba(255, 100, 100, 0.1)',
                  border: '1px solid rgba(255, 100, 100, 0.3)',
                  borderRadius: '4px',
                  padding: '12px',
                  marginBottom: '16px'
                }}
              >
                <p style={{ fontSize: '14px', color: 'rgba(255, 100, 100, 0.9)', margin: 0 }}>
                  {error}
                </p>
              </div>
            )}

            {/* Success message for resend */}
            {resendSuccess && (
              <div
                style={{
                  background: 'rgba(100, 255, 150, 0.1)',
                  border: '1px solid rgba(100, 255, 150, 0.3)',
                  borderRadius: '4px',
                  padding: '12px',
                  marginBottom: '16px'
                }}
              >
                <p style={{ fontSize: '14px', color: 'rgba(100, 255, 150, 0.9)', margin: 0 }}>
                  Verification email sent! Check your inbox.
                </p>
              </div>
            )}

            {/* Resend button */}
            <button
              onClick={handleResendVerification}
              disabled={resendLoading}
              style={{
                width: '100%',
                background: 'rgba(163, 149, 148, 0.15)',
                border: '1px solid rgba(163, 149, 148, 0.3)',
                color: '#f2f4f3',
                padding: '12px',
                borderRadius: '4px',
                cursor: resendLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: '"Libre Baskerville", serif',
                fontSize: '14px',
                marginBottom: '12px',
                opacity: resendLoading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!resendLoading) {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = 'rgba(163, 149, 148, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'rgba(163, 149, 148, 0.15)';
              }}
            >
              {resendLoading ? 'Sending...' : "Didn't receive it? Resend Email"}
            </button>

            <button
              onClick={() => {
                setSignupEmailSent(false);
                setSignupEmail('');
                setResendSuccess(false);
                setError('');
                setIsLogin(true);
              }}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid rgba(74, 71, 70, 0.6)',
                color: '#f2f4f3',
                padding: '12px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: '"Libre Baskerville", serif',
                fontSize: '14px'
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
              Back to Sign In
            </button>
          </div>
        )}

        {!signupEmailSent && (
          <>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Moon style={{ width: '32px', height: '32px', color: 'rgba(163, 149, 148, 0.7)' }} strokeWidth={1.5} />
            <Feather style={{ width: '32px', height: '32px', color: 'rgba(163, 149, 148, 0.7)' }} strokeWidth={1.5} />
          </div>
          <h1
            style={{
              fontSize: '32px',
              color: '#f2f4f3',
              marginBottom: '12px',
              fontFamily: '"Libre Baskerville", serif',
              fontWeight: 'normal'
            }}
          >
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p
            style={{
              color: 'rgba(138, 129, 128, 0.8)',
              fontFamily: '"Spectral", serif'
            }}
          >
            {isLogin ? 'Continue your nightly ritual' : 'Begin your journaling journey'}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          {!isLogin && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  color: 'rgba(163, 149, 148, 0.7)',
                  marginBottom: '8px',
                  fontFamily: '"Spectral", serif'
                }}
              >
                Name
              </label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(74, 71, 70, 0.7)' }} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  style={{
                    width: '100%',
                    background: '#1a1817',
                    border: '1px solid rgba(74, 71, 70, 0.6)',
                    borderRadius: '4px',
                    paddingLeft: '48px',
                    paddingRight: '12px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    color: '#f2f4f3',
                    fontFamily: '"Spectral", serif',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    const el = e.currentTarget as HTMLInputElement;
                    el.style.borderColor = 'rgba(163, 149, 148, 0.7)';
                  }}
                  onBlur={(e) => {
                    const el = e.currentTarget as HTMLInputElement;
                    el.style.borderColor = 'rgba(74, 71, 70, 0.6)';
                  }}
                  placeholder="Your name"
                />
              </div>
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                color: 'rgba(163, 149, 148, 0.7)',
                marginBottom: '8px',
                fontFamily: '"Spectral", serif'
              }}
            >
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(74, 71, 70, 0.7)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: '#1a1817',
                  border: '1px solid rgba(74, 71, 70, 0.6)',
                  borderRadius: '4px',
                  paddingLeft: '48px',
                  paddingRight: '12px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  color: '#f2f4f3',
                  fontFamily: '"Spectral", serif',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  const el = e.currentTarget as HTMLInputElement;
                  el.style.borderColor = 'rgba(163, 149, 148, 0.7)';
                }}
                onBlur={(e) => {
                  const el = e.currentTarget as HTMLInputElement;
                  el.style.borderColor = 'rgba(74, 71, 70, 0.6)';
                }}
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                color: 'rgba(163, 149, 148, 0.7)',
                marginBottom: '8px',
                fontFamily: '"Spectral", serif'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(74, 71, 70, 0.7)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: '#1a1817',
                  border: '1px solid rgba(74, 71, 70, 0.6)',
                  borderRadius: '4px',
                  paddingLeft: '48px',
                  paddingRight: '12px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  color: '#f2f4f3',
                  fontFamily: '"Spectral", serif',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  const el = e.currentTarget as HTMLInputElement;
                  el.style.borderColor = 'rgba(163, 149, 148, 0.7)';
                }}
                onBlur={(e) => {
                  const el = e.currentTarget as HTMLInputElement;
                  el.style.borderColor = 'rgba(74, 71, 70, 0.6)';
                }}
                placeholder="••••••••"
              />
            </div>
            
            {!isLogin && password && (
              <div style={{ marginTop: '12px' }}>
                {(() => {
                  const checks = validatePassword(password);
                  const CheckItem = ({ label, met }: { label: string; met: boolean }) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px' }}>
                      {met ? (
                        <Check style={{ width: '16px', height: '16px', color: 'rgba(74, 222, 128, 0.8)', flexShrink: 0 }} />
                      ) : (
                        <X style={{ width: '16px', height: '16px', color: 'rgba(239, 68, 68, 0.6)', flexShrink: 0 }} />
                      )}
                      <span style={{ color: met ? 'rgba(74, 222, 128, 0.8)' : 'rgba(168, 162, 158, 0.6)' }}>
                        {label}
                      </span>
                    </div>
                  );

                  return (
                    <>
                      <CheckItem label="At least 12 characters" met={checks.length} />
                      <CheckItem label="One uppercase letter (A-Z)" met={checks.uppercase} />
                      <CheckItem label="One lowercase letter (a-z)" met={checks.lowercase} />
                      <CheckItem label="One number (0-9)" met={checks.number} />
                      <CheckItem label="One special character (!@#$%^&*)" met={checks.special} />
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '4px',
                padding: '12px 16px'
              }}
            >
              <p style={{ fontSize: '14px', color: '#ff6b6b', margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!isLogin && !isPasswordStrong(password))}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid rgba(74, 71, 70, 0.6)',
              color: '#f2f4f3',
              padding: '12px',
              borderRadius: '4px',
              cursor: loading || (!isLogin && !isPasswordStrong(password)) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: loading || (!isLogin && !isPasswordStrong(password)) ? 0.5 : 1,
              fontFamily: '"Libre Baskerville", serif',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              if (!loading && (isLogin || isPasswordStrong(password))) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = '#1a1817';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'transparent';
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Toggle between login/signup */}
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              color: 'rgba(163, 149, 148, 0.7)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              fontSize: '14px',
              fontFamily: '"Spectral", serif'
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.color = '#f2f4f3';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.color = 'rgba(163, 149, 148, 0.7)';
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Decorative divider */}
        <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <div style={{ width: '4px', height: '4px', background: 'rgba(74, 71, 70, 0.6)', borderRadius: '50%' }}></div>
          <div style={{ width: '4px', height: '4px', background: 'rgba(74, 71, 70, 0.6)', borderRadius: '50%' }}></div>
          <div style={{ width: '4px', height: '4px', background: 'rgba(74, 71, 70, 0.6)', borderRadius: '50%' }}></div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}