import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft, Loader2, Fingerprint, ScanFace, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import logoImage from '@/assets/logo.png';
import { PasswordStrengthIndicator, validatePasswordStrength } from '@/components/PasswordStrengthIndicator';

const BIOMETRIC_SERVER = 'moovy-carsharing';

// Validation schemas
const emailSchema = z.string().email('Ungültige E-Mail-Adresse');
const loginPasswordSchema = z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben');
const nameSchema = z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100);

const Auth = () => {
  const navigate = useNavigate();
  const { user, session, loading, signUp, signIn, signInWithGoogle } = useAuth();
  const { 
    isAvailable: biometricAvailable, 
    isLoading: biometricLoading,
    authenticate: biometricAuth,
    getStoredToken,
    saveRefreshToken,
    hasStoredCredentials,
    getBiometryLabel,
    getBiometryIcon,
  } = useBiometricAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Check for saved biometric credentials (refresh tokens)
  useEffect(() => {
    const checkBiometricCredentials = async () => {
      if (biometricAvailable && !biometricLoading) {
        const hasCredentials = await hasStoredCredentials(BIOMETRIC_SERVER);
        setBiometricEnabled(hasCredentials);
      }
    };
    checkBiometricCredentials();
  }, [biometricAvailable, biometricLoading, hasStoredCredentials]);

  // Save refresh token when session changes after successful login
  useEffect(() => {
    const saveTokenForBiometric = async () => {
      if (session?.refresh_token && session?.user?.email && biometricAvailable) {
        await saveRefreshToken(BIOMETRIC_SERVER, session.user.email, session.refresh_token);
        setBiometricEnabled(true);
      }
    };
    saveTokenForBiometric();
  }, [session, biometricAvailable, saveRefreshToken]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    // Forgot password only needs a valid email.
    if (isForgotPassword) {
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // For login, use simple password validation
    // For signup, use strong password validation
    if (isLogin) {
      try {
        loginPasswordSchema.parse(password);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.password = e.errors[0].message;
        }
      }
    } else {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        newErrors.password = 'Bitte erfülle alle Passwortanforderungen';
      }
    }

    if (!isLogin && fullName) {
      try {
        nameSchema.parse(fullName);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.fullName = e.errors[0].message;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Passwort-Reset E-Mail gesendet! Bitte prüfe dein Postfach.');
          setIsForgotPassword(false);
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Ungültige Anmeldedaten. Bitte überprüfe E-Mail und Passwort.');
          } else {
            toast.error(error.message);
          }
        } else {
          // Refresh token will be saved automatically via useEffect when session updates
          toast.success('Erfolgreich angemeldet!');
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error('Diese E-Mail ist bereits registriert. Bitte melde dich an.');
          } else {
            toast.error(error.message);
          }
        } else {
          // Refresh token will be saved automatically via useEffect when session updates
          toast.success('Konto erfolgreich erstellt!');
          navigate('/');
        }
      }
    } catch (err) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsSubmitting(true);
    try {
      // First verify biometric identity
      const authenticated = await biometricAuth('Melden Sie sich bei MOOVY an');
      if (!authenticated) {
        setIsSubmitting(false);
        return;
      }

      // Get stored refresh token
      const storedData = await getStoredToken(BIOMETRIC_SERVER);
      if (!storedData) {
        toast.error('Keine gespeicherten Anmeldedaten gefunden. Bitte manuell anmelden.');
        setBiometricEnabled(false);
        setIsSubmitting(false);
        return;
      }

      // Use refresh token to restore session
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: storedData.refreshToken
      });

      if (error || !data.session) {
        // Refresh token expired or invalid - clear stored credentials
        toast.error('Sitzung abgelaufen. Bitte manuell anmelden.');
        setBiometricEnabled(false);
        setIsSubmitting(false);
        return;
      }

      // Save the new refresh token for next time
      if (data.session.refresh_token) {
        await saveRefreshToken(BIOMETRIC_SERVER, storedData.email, data.session.refresh_token);
      }

      toast.success('Erfolgreich mit Biometrie angemeldet!');
      navigate('/');
    } catch (err) {
      console.error('Biometric login error:', err);
      toast.error('Biometrische Authentifizierung fehlgeschlagen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message);
      }
    } catch (err) {
      toast.error('Google-Anmeldung fehlgeschlagen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full mx-auto"
        >
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={20} />
            <span>Zurück zur Startseite</span>
          </button>

          {/* Logo */}
          <a href="/" className="flex items-center gap-2 mb-2">
            <img src={logoImage} alt="MOOVY Logo" className="h-10 w-10" />
            <span className="text-3xl font-bold gradient-text">MOOVY</span>
          </a>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isForgotPassword ? 'Passwort zurücksetzen' : isLogin ? 'Willkommen zurück' : 'Konto erstellen'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isForgotPassword
              ? 'Gib deine E-Mail ein, um einen Reset-Link zu erhalten'
              : isLogin 
                ? 'Melde dich an, um Fahrzeuge zu buchen' 
                : 'Registriere dich für MOOVY Carsharing'}
          </p>

          {/* Biometric Login Button - Show only on native with saved credentials */}
          {isLogin && biometricAvailable && biometricEnabled && (
            <>
              <Button
                variant="outline"
                className="w-full mb-4 h-14"
                onClick={handleBiometricLogin}
                disabled={isSubmitting}
              >
                {getBiometryIcon() === 'scan-face' && <ScanFace className="w-6 h-6 mr-2" />}
                {getBiometryIcon() === 'fingerprint' && <Fingerprint className="w-6 h-6 mr-2" />}
                {getBiometryIcon() === 'eye' && <Eye className="w-6 h-6 mr-2" />}
                Mit {getBiometryLabel()} anmelden
              </Button>
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">oder</span>
                </div>
              </div>
            </>
          )}

          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full mb-6"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Mit Google fortfahren
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">oder</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Max Mustermann"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="max@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Passwort</Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setErrors({});
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Passwort vergessen?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isLogin ? "••••••••" : "Min. 12 Zeichen, Groß/Klein, Zahl, Sonderzeichen"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                {/* Show password strength indicator only during signup */}
                {!isLogin && (
                  <PasswordStrengthIndicator password={password} className="mt-3" />
                )}
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isForgotPassword ? (
                'Reset-Link senden'
              ) : isLogin ? (
                'Anmelden'
              ) : (
                'Registrieren'
              )}
            </Button>
          </form>

          {/* Toggle Login/Signup/Forgot Password */}
          <p className="mt-6 text-center text-muted-foreground">
            {isForgotPassword ? (
              <>
                Zurück zum{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrors({});
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Login
                </button>
              </>
            ) : isLogin ? (
              <>
                Noch kein Konto?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setErrors({});
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Jetzt registrieren
                </button>
              </>
            ) : (
              <>
                Bereits registriert?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setErrors({});
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Anmelden
                </button>
              </>
            )}
          </p>
        </motion.div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 gradient-accent opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-background" />
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center"
          >
            <div className="w-32 h-32 rounded-full bg-background/20 backdrop-blur-sm mx-auto mb-8 flex items-center justify-center glow-strong p-4">
              <img src={logoImage} alt="MOOVY" className="w-20 h-20 object-contain" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Mobilität neu gedacht
            </h2>
            <p className="text-muted-foreground max-w-sm">
              Mit MOOVY bist du in Sekunden unterwegs. 100% elektrisch, 100% flexibel.
            </p>
          </motion.div>

          {/* Floating elements */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-20 w-20 h-20 rounded-full bg-primary/10 blur-xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-32 left-20 w-32 h-32 rounded-full bg-primary/5 blur-2xl"
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;
