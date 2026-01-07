import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Lazy import for native only
let NativeBiometric: any = null;

export type BiometryType = 'faceId' | 'touchId' | 'fingerprint' | 'face' | 'iris' | 'none';

interface BiometricAuthState {
  isAvailable: boolean;
  biometryType: BiometryType;
  isNative: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useBiometricAuth = () => {
  const [state, setState] = useState<BiometricAuthState>({
    isAvailable: false,
    biometryType: 'none',
    isNative: Capacitor.isNativePlatform(),
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkAvailability = async () => {
      if (!Capacitor.isNativePlatform()) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Dynamic import for native platforms
        const module = await import('capacitor-native-biometric');
        NativeBiometric = module.NativeBiometric;

        const result = await NativeBiometric.isAvailable();
        
        let biometryType: BiometryType = 'none';
        if (result.isAvailable) {
          // Map biometry types from the plugin
          switch (result.biometryType) {
            case 1: // TouchID
              biometryType = 'touchId';
              break;
            case 2: // FaceID
              biometryType = 'faceId';
              break;
            case 3: // Fingerprint (Android)
              biometryType = 'fingerprint';
              break;
            case 4: // Face (Android)
              biometryType = 'face';
              break;
            case 5: // Iris (Android)
              biometryType = 'iris';
              break;
            default:
              biometryType = 'fingerprint';
          }
        }

        setState({
          isAvailable: result.isAvailable,
          biometryType,
          isNative: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Biometric check failed:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Biometrie-Check fehlgeschlagen',
        }));
      }
    };

    checkAvailability();
  }, []);

  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    if (!state.isAvailable || !NativeBiometric) {
      return false;
    }

    try {
      await NativeBiometric.verifyIdentity({
        reason: reason || 'Bitte authentifizieren Sie sich',
        title: 'Biometrische Anmeldung',
        subtitle: 'Melden Sie sich mit Biometrie an',
        description: 'Verwenden Sie Ihren Fingerabdruck oder Ihr Gesicht',
        useFallback: true,
        fallbackTitle: 'Code verwenden',
      });
      return true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }, [state.isAvailable]);

  // Save refresh token securely (not password!)
  const saveRefreshToken = useCallback(async (server: string, email: string, refreshToken: string): Promise<boolean> => {
    if (!NativeBiometric) {
      return false;
    }

    try {
      // We store the email as username and refresh token as "password" in secure storage
      // The password field is just the storage key - we're storing a token, not actual password
      await NativeBiometric.setCredentials({
        server,
        username: email,
        password: refreshToken, // This is actually the refresh token
      });
      return true;
    } catch (error) {
      console.error('Failed to save refresh token:', error);
      return false;
    }
  }, []);

  // Get stored refresh token
  const getStoredToken = useCallback(async (server: string): Promise<{ email: string; refreshToken: string } | null> => {
    if (!NativeBiometric) {
      return null;
    }

    try {
      const credentials = await NativeBiometric.getCredentials({ server });
      return {
        email: credentials.username,
        refreshToken: credentials.password, // This is actually the refresh token
      };
    } catch (error) {
      console.error('Failed to get stored token:', error);
      return null;
    }
  }, []);

  const deleteStoredToken = useCallback(async (server: string): Promise<boolean> => {
    if (!NativeBiometric) {
      return false;
    }

    try {
      await NativeBiometric.deleteCredentials({ server });
      return true;
    } catch (error) {
      console.error('Failed to delete stored token:', error);
      return false;
    }
  }, []);

  // Check if biometric credentials exist
  const hasStoredCredentials = useCallback(async (server: string): Promise<boolean> => {
    if (!NativeBiometric) {
      return false;
    }

    try {
      const credentials = await NativeBiometric.getCredentials({ server });
      return !!credentials?.password;
    } catch {
      return false;
    }
  }, []);

  const getBiometryLabel = useCallback((): string => {
    switch (state.biometryType) {
      case 'faceId':
        return 'Face ID';
      case 'touchId':
        return 'Touch ID';
      case 'fingerprint':
        return 'Fingerabdruck';
      case 'face':
        return 'Gesichtserkennung';
      case 'iris':
        return 'Iris-Erkennung';
      default:
        return 'Biometrie';
    }
  }, [state.biometryType]);

  const getBiometryIcon = useCallback((): 'fingerprint' | 'scan-face' | 'eye' => {
    switch (state.biometryType) {
      case 'faceId':
      case 'face':
        return 'scan-face';
      case 'iris':
        return 'eye';
      default:
        return 'fingerprint';
    }
  }, [state.biometryType]);

  return {
    ...state,
    authenticate,
    saveRefreshToken,
    getStoredToken,
    deleteStoredToken,
    hasStoredCredentials,
    getBiometryLabel,
    getBiometryIcon,
  };
};
