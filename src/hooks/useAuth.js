import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from './useDatabase';

export const useAuth = () => {
  const { getSetting, saveSetting, simpleHash } = useDatabase();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pinMode, setPinMode] = useState('verify'); // 'verify' | 'setup' | 'change'
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const pinDoc = await getSetting('user_pin');
        if (pinDoc?.value?.pinHash) {
          setPinMode('verify');
        } else {
          setPinMode('setup');
        }
      } catch (err) {
        setPinMode('setup');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [getSetting]);

  const verifyPin = useCallback(async (pin, translate) => {
    try {
      setError('');
      const pinDoc = await getSetting('user_pin');
      
      if (!pinDoc?.value?.pinHash) {
        setError(translate?.('enterPin') || 'Please set a PIN first');
        return false;
      }

      if (simpleHash(pin) === pinDoc.value.pinHash) {
        setIsAuthenticated(true);
        return true;
      } else {
        setError(translate?.('incorrectPin') || 'Incorrect PIN');
        return false;
      }
    } catch (err) {
      setError('Error verifying PIN');
      return false;
    }
  }, [getSetting, simpleHash]);

  const setupPin = useCallback(async (pin, confirmPin, translate) => {
    try {
      setError('');
      if (pin !== confirmPin) {
        setError(translate?.('pinMismatch') || 'PINs do not match');
        return false;
      }

      if (pin.length !== 4) {
        setError('PIN must be 4 digits');
        return false;
      }

      const pinHash = simpleHash(pin);
      await saveSetting('user_pin', { pinHash });
      setIsAuthenticated(true);
      setPinMode('verify');
      return true;
    } catch (err) {
      setError('Error setting PIN');
      return false;
    }
  }, [saveSetting, simpleHash]);

  const changePin = useCallback(async (oldPin, newPin, confirmNewPin, translate) => {
    try {
      setError('');
      const pinDoc = await getSetting('user_pin');

      if (simpleHash(oldPin) !== pinDoc.value.pinHash) {
        setError(translate?.('incorrectPin') || 'Incorrect PIN');
        return false;
      }

      if (newPin !== confirmNewPin) {
        setError(translate?.('pinMismatch') || 'PINs do not match');
        return false;
      }

      if (newPin.length !== 4) {
        setError('PIN must be 4 digits');
        return false;
      }

      const newPinHash = simpleHash(newPin);
      await saveSetting('user_pin', { pinHash: newPinHash });
      return true;
    } catch (err) {
      setError('Error changing PIN');
      return false;
    }
  }, [getSetting, saveSetting, simpleHash]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setError('');
  }, []);

  return {
    isAuthenticated,
    isLoading,
    pinMode,
    error,
    verifyPin,
    setupPin,
    changePin,
    logout,
  };
};
