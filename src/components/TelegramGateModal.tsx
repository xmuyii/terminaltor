import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Shield,
  ExternalLink,
  ArrowRight,
  Lock,
  Check,
  AlertCircle,
  KeyRound,
  UserCheck,
  UserPlus,
  LogIn,
  Sparkles,
  Mail,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import { telegramAuth, getTelegramBotUsername } from '../lib/telegramAuth';
import { accountAuth } from '../lib/accountAuth';
import { Profile } from '../types';
import { SupabaseStore } from '../lib/supabase';
import { signInWithGooglePopup } from '../lib/firebaseGoogleAuth';

interface TelegramGateModalProps {
  isOpen: boolean;
  onAuthenticated: (updatedProfile: Profile) => void;
}

export const TelegramGateModal: React.FC<TelegramGateModalProps> = ({
  isOpen,
  onAuthenticated,
}) => {
  // Main authentication method tab
  const [authMethod, setAuthMethod] = useState<'credentials' | 'telegram'>('credentials');

  // Username/Password sub-mode
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [telegramHandleInput, setTelegramHandleInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOptionalLinks, setShowOptionalLinks] = useState(false);

  // Telegram verification states
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [verifiedHandle, setVerifiedHandle] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [waitingForBot, setWaitingForBot] = useState(false);

  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const botUsername = getTelegramBotUsername();

  // If already detected running inside Telegram WebApp, default tab to Telegram
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (win.Telegram?.WebApp?.initDataUnsafe?.user) {
        setAuthMethod('telegram');
      }
    }
  }, [isOpen]);

  // Background auto-polling when waiting for Telegram bot verification
  useEffect(() => {
    if (!waitingForBot || !sessionToken) return;

    const interval = setInterval(async () => {
      try {
        const res = await telegramAuth.checkStatus(sessionToken);
        if (res.verified && res.session) {
          setIsAutoDetected(true);
          setVerifiedHandle(res.session.username);
          setWaitingForBot(false);
          const updatedProfile = SupabaseStore.getProfile();
          setTimeout(() => {
            onAuthenticated(updatedProfile);
          }, 900);
        } else if (res.mismatch && res.message) {
          setError(res.message);
        }
      } catch {
        // continue polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [waitingForBot, sessionToken, onAuthenticated]);

  // Set up Official Telegram Login Widget callback
  useEffect(() => {
    if (!isOpen || authMethod !== 'telegram') return;

    (window as any).onTelegramAuth = (user: any) => {
      if (user && (user.username || user.first_name)) {
        setIsAutoDetected(true);
        const session = telegramAuth.authenticateWithTelegramWidget(user);
        setVerifiedHandle(session.username);
        const updatedProfile = SupabaseStore.getProfile();
        setTimeout(() => {
          onAuthenticated(updatedProfile);
        }, 800);
      }
    };

    if (widgetContainerRef.current) {
      widgetContainerRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botUsername);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '12');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      widgetContainerRef.current.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [isOpen, authMethod, botUsername, onAuthenticated]);

  if (!isOpen) return null;

  const win = typeof window !== 'undefined' ? (window as any) : null;
  const webAppUser = win?.Telegram?.WebApp?.initDataUnsafe?.user;

  // 1-Tap in Telegram Mini App
  const handleNativeTelegramAuth = () => {
    const session = telegramAuth.detectTelegramWebApp();
    if (session) {
      const updatedProfile = SupabaseStore.getProfile();
      onAuthenticated(updatedProfile);
    }
  };

  // Start Zero-Input Bot Challenge
  const handleStartBotVerification = async () => {
    setIsSubmitting(true);
    setError(null);
    setWaitingForBot(true);

    try {
      const res = await telegramAuth.createSessionChallenge();
      if (res.success && res.sessionToken) {
        setSessionToken(res.sessionToken);
        const cleanBot = botUsername.replace(/^@+/, '').trim();
        const link = res.deepLink || `https://t.me/${cleanBot}?start=auth_${res.sessionToken}`;
        setDeepLink(link);
      } else {
        setError(res.message || 'Failed creating verification session.');
        setWaitingForBot(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Verification service error. Please try again.');
      setWaitingForBot(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify PIN received in Telegram
  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) {
      setError('Please enter the 6-digit confirmation PIN sent to your Telegram chat.');
      return;
    }
    if (!sessionToken) {
      setError('Session expired. Tap below to start a new verification.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await telegramAuth.verifyCode(sessionToken, codeInput.trim(), '');
      if (res.success && res.session) {
        setVerifiedHandle(res.session.username);
        setIsAutoDetected(true);
        const updatedProfile = SupabaseStore.getProfile();
        setTimeout(() => {
          onAuthenticated(updatedProfile);
        }, 800);
      } else {
        setError(res.message || 'Incorrect confirmation PIN. Check your Telegram chat with the bot.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Username & Password Registration or Sign-In
  const handleCredentialsAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanUsername = usernameInput.trim().replace(/^@+/, '');
    if (!cleanUsername) {
      setError('Please enter a cadet username.');
      return;
    }
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (!passwordInput) {
      setError('Please enter your password.');
      return;
    }

    if (authMode === 'signup') {
      if (passwordInput.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (confirmPasswordInput && passwordInput !== confirmPasswordInput) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (authMode === 'signup') {
        const result = await accountAuth.registerWithCredentials(cleanUsername, passwordInput, {
          email: googleEmailInput.trim() || undefined,
          telegramUsername: telegramHandleInput.trim() || undefined,
          googleEmail: googleEmailInput.trim() || undefined,
        });

        if (result.success && result.session) {
          setSuccessMessage('Account created! Entering TERMINALTOR...');
          setIsAutoDetected(true);
          setVerifiedHandle(result.session.username);
          const updatedProfile = SupabaseStore.getProfile();
          setTimeout(() => {
            onAuthenticated(updatedProfile);
          }, 700);
        } else {
          setError(result.message || 'Failed creating account. Please try a different username.');
        }
      } else {
        const result = await accountAuth.loginWithCredentials(cleanUsername, passwordInput);
        if (result.success && result.session) {
          setSuccessMessage('Welcome back, Cadet! Authenticating...');
          setIsAutoDetected(true);
          setVerifiedHandle(result.session.username);
          const updatedProfile = SupabaseStore.getProfile();
          setTimeout(() => {
            onAuthenticated(updatedProfile);
          }, 700);
        } else {
          setError(result.message || 'Invalid username or password.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real Google Sign-In with Google Services & Firebase
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Trigger Google Identity Services popup
      const googleAuth = await signInWithGooglePopup();

      // 2. Register or sign in cadet with verified Google credentials
      const result = await accountAuth.loginWithGoogle({
        email: googleAuth.email,
        name: googleAuth.displayName,
        avatarUrl: googleAuth.photoUrl,
        sub: googleAuth.uid,
        desiredUsername: usernameInput.trim() || undefined,
      });

      if (result.success && result.session) {
        setSuccessMessage(`Google verified: ${googleAuth.email}! Welcome to TERMINALTOR.`);
        setIsAutoDetected(true);
        setVerifiedHandle(result.session.username);
        const updatedProfile = SupabaseStore.getProfile();
        setTimeout(() => {
          onAuthenticated(updatedProfile);
        }, 800);
      } else {
        setError(result.message || 'Google authentication failed.');
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(err?.message || 'Google account verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain p-3 sm:p-6 flex min-h-full items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg my-auto bg-[#070b14] border-2 border-emerald-500/50 rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.25)] max-h-[92dvh] flex flex-col text-slate-100 font-sans overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Banner */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-[#070b14] border-b border-emerald-500/30 flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30 shrink-0">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
                Mainframe Security Gate
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 truncate">
              Cadet Authentication
            </h2>
          </div>
        </div>

        {/* Tab Selector: Username & Password vs Telegram */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 p-1.5 gap-2 px-5 sm:px-6 shrink-0">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('credentials');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMethod === 'credentials'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Username &amp; Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('telegram');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMethod === 'telegram'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5 -rotate-12" />
            <span>Telegram Login</span>
          </button>
        </div>

        {/* Content Body - Scrollable on mobile & laptop */}
        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto overscroll-contain flex-1">
          {isAutoDetected && verifiedHandle ? (
            <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-2xl flex items-center gap-3 text-emerald-300 animate-pulse">
              <UserCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-sm">Identity Verified!</div>
                <div className="font-mono text-xs text-slate-300">
                  Entering TERMINALTOR as <strong>{verifiedHandle}</strong>...
                </div>
              </div>
            </div>
          ) : authMethod === 'credentials' ? (
            /* TAB 1: USERNAME & PASSWORD AUTH (WITH GOOGLE / TELEGRAM LINKING) */
            <div className="space-y-4">
              {/* Sign In vs Sign Up Toggle */}
              <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>

              {/* Official Google Sign-In Button */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-semibold text-sm rounded-xl border border-slate-200 shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isSubmitting ? 'Verifying with Google...' : 'Continue with Google'}</span>
                </button>
                <div className="text-[10px] text-center text-slate-400 font-mono">
                  Verified with Google services • Instant cadet setup
                </div>
              </div>

              <div className="flex items-center gap-2 my-1">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                  Or with Cadet Username &amp; Password
                </span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              {/* Credentials Form */}
              <form onSubmit={handleCredentialsAuth} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Cadet Callsign / Username <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="e.g. CyberCadet or Vector99"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm font-mono text-white placeholder-slate-600 focus:outline-none transition-colors"
                      required
                    />
                    <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Security Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Enter password'}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition-colors pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Re-type password"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                )}

                {/* Optional Account Linking (Google / Telegram) */}
                {authMode === 'signup' && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowOptionalLinks(!showOptionalLinks)}
                      className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{showOptionalLinks ? '▼ Hide Optional Account Links' : '▶ Optional: Link Google or Telegram Account'}</span>
                    </button>

                    {showOptionalLinks && (
                      <div className="mt-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5 animate-in fade-in duration-200">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Link Google Email (optional):
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type="email"
                                value={googleEmailInput}
                                onChange={(e) => setGoogleEmailInput(e.target.value)}
                                placeholder="cadet@gmail.com"
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                              />
                              <Mail className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setIsSubmitting(true);
                                  const gAuth = await signInWithGooglePopup();
                                  setGoogleEmailInput(gAuth.email);
                                  setSuccessMessage(`Google account verified: ${gAuth.email}`);
                                } catch (err: any) {
                                  setError(err.message);
                                } finally {
                                  setIsSubmitting(false);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-700 cursor-pointer shrink-0"
                            >
                              Verify via Google
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Link Telegram Account (optional):
                          </label>
                          {webAppUser ? (
                            <div className="p-2 bg-slate-900 border border-sky-500/30 rounded-lg flex items-center justify-between text-xs">
                              <span className="text-sky-300 font-mono">@{webAppUser.username || webAppUser.first_name}</span>
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">Verified via Mini App</span>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                              🔒 To prevent account spoofing, Telegram handles are cryptographically verified via @{botUsername} handshake in your profile settings.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <span>Authenticating...</span>
                  ) : authMode === 'signup' ? (
                    <>
                      <span>Create Cadet Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Enter TERMINALTOR</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* TAB 2: TELEGRAM SOVEREIGN GATE */
            <div>
              {webAppUser ? (
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                    <span>Cryptographically Authenticated Telegram Session</span>
                  </div>
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/30 font-mono text-sm">
                    <div className="text-xs text-slate-400">Telegram Username:</div>
                    <div className="text-base font-bold text-emerald-400">
                      @{webAppUser.username || webAppUser.first_name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Telegram UID: {webAppUser.id} • Alliance: Solo Developer
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleNativeTelegramAuth}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Enter Terminaltor as @{webAppUser.username || webAppUser.first_name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Option 1: Native In-App Launch */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-sky-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-sky-400 -rotate-12" />
                        <span className="text-xs font-mono font-bold text-sky-300 uppercase">
                          Play in Telegram App
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        Instant Auth
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Launch inside Telegram to automatically lock your callsign to your authentic Telegram handle.
                    </p>
                    <a
                      href={`https://t.me/${botUsername.replace(/^@+/, '').trim()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4 fill-current -rotate-12" />
                      <span>Launch in Telegram (@{botUsername.replace(/^@+/, '').trim()})</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </div>

                  {/* Option 2: Zero-Input Bot Challenge Handshake */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Bot Verification Handshake &amp; PIN</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Tap below to generate a single-use handshake link. When you tap Start in <strong>@{botUsername.replace(/^@+/, '').trim()}</strong>, the bot captures your authentic handle and logs you in.
                    </p>

                    {!waitingForBot ? (
                      <button
                        type="button"
                        onClick={handleStartBotVerification}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>{isSubmitting ? 'Generating Handshake...' : 'Verify with @' + botUsername.replace(/^@+/, '').trim()}</span>
                      </button>
                    ) : (
                      <div className="space-y-3 pt-1">
                        {deepLink && (
                          <a
                            href={deepLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
                          >
                            <Send className="w-4 h-4 fill-current -rotate-12" />
                            <span>1. Open @{botUsername.replace(/^@+/, '').trim()} &amp; Tap Start</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>Listening for authentic Telegram tap...</span>
                        </div>

                        {/* 6-digit PIN input sent by bot */}
                        <form onSubmit={handleConfirmCode} className="space-y-2 pt-2 border-t border-slate-800">
                          <label className="block text-[11px] font-bold text-slate-400">
                            Or enter 6-digit PIN received in Telegram:
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={codeInput}
                              onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="6-digit PIN"
                              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm text-center font-mono text-white placeholder-slate-600 focus:outline-none"
                            />
                            <button
                              type="submit"
                              disabled={codeInput.length < 6 || isSubmitting}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
                            >
                              Confirm
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Option 3: Official Telegram Login Widget */}
                  <div className="space-y-2 pt-1 text-center">
                    <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                      Or Official Telegram Web Login:
                    </div>
                    <div ref={widgetContainerRef} className="flex justify-center min-h-[40px] items-center" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback & Error Messages */}
          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 p-3 rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl font-medium flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-500 text-center font-mono leading-relaxed pt-1 border-t border-slate-800/60">
            🔒 Sovereign Cyber Security: Choose standard username/password or connect via Telegram/Google. All progress is preserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TelegramGateModal;
