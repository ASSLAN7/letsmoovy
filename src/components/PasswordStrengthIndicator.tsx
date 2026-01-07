import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// List of common weak passwords to reject
const COMMON_WEAK_PASSWORDS = [
  'password123456',
  '123456789012',
  'qwertyuiopas',
  'abcdefghijkl',
  '111111111111',
  'password1234',
  'passwort1234',
  'hallo1234567',
  'willkommen12',
  'geheim123456',
  'admin1234567',
  'letmein12345',
  'welcome12345',
  'monkey123456',
  'dragon123456',
  'master123456',
  'iloveyou1234',
  'trustno12345',
  'sunshine1234',
  'princess1234',
  'football1234',
  'baseball1234',
  'starwars1234',
  'michael12345',
  'jennifer1234',
  'jordan123456',
  'charlie12345',
  'andrew123456',
  'michelle1234',
  'daniel123456',
];

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    label: 'Mindestens 12 Zeichen',
    test: (pw) => pw.length >= 12,
  },
  {
    label: 'Mindestens ein Großbuchstabe (A-Z)',
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    label: 'Mindestens ein Kleinbuchstabe (a-z)',
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    label: 'Mindestens eine Zahl (0-9)',
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    label: 'Mindestens ein Sonderzeichen (!@#$%^&*...)',
    test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw),
  },
  {
    label: 'Kein häufig verwendetes Passwort',
    test: (pw) => !COMMON_WEAK_PASSWORDS.some(weak => 
      pw.toLowerCase().includes(weak.toLowerCase()) || 
      weak.toLowerCase().includes(pw.toLowerCase())
    ),
  },
];

export const validatePasswordStrength = (password: string): { 
  isValid: boolean; 
  passedCount: number; 
  totalCount: number;
  errors: string[];
} => {
  const errors: string[] = [];
  let passedCount = 0;
  
  PASSWORD_REQUIREMENTS.forEach(req => {
    if (req.test(password)) {
      passedCount++;
    } else {
      errors.push(req.label);
    }
  });
  
  return {
    isValid: passedCount === PASSWORD_REQUIREMENTS.length,
    passedCount,
    totalCount: PASSWORD_REQUIREMENTS.length,
    errors,
  };
};

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator = ({ password, className }: PasswordStrengthIndicatorProps) => {
  const validation = useMemo(() => validatePasswordStrength(password), [password]);
  
  const strengthPercentage = (validation.passedCount / validation.totalCount) * 100;
  
  const getStrengthColor = () => {
    if (strengthPercentage === 100) return 'bg-green-500';
    if (strengthPercentage >= 66) return 'bg-yellow-500';
    if (strengthPercentage >= 33) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const getStrengthLabel = () => {
    if (strengthPercentage === 100) return 'Stark';
    if (strengthPercentage >= 66) return 'Mittel';
    if (strengthPercentage >= 33) return 'Schwach';
    return 'Sehr schwach';
  };

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Passwortstärke</span>
          <span className={cn(
            'font-medium',
            strengthPercentage === 100 ? 'text-green-500' : 
            strengthPercentage >= 66 ? 'text-yellow-500' : 
            strengthPercentage >= 33 ? 'text-orange-500' : 'text-red-500'
          )}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn('h-full transition-all duration-300', getStrengthColor())}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Requirements list */}
      <div className="space-y-1.5">
        {PASSWORD_REQUIREMENTS.map((req, index) => {
          const passed = req.test(password);
          return (
            <div 
              key={index}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors',
                passed ? 'text-green-500' : 'text-muted-foreground'
              )}
            >
              {passed ? (
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/50" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
