import { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { useDatabase } from '../hooks/useDatabase';

export const PinLock = ({ onAuthenticated }) => {
  const { translate, currentLang, setLanguage } = useTranslations();
  const { getSetting, saveSetting, simpleHash } = useDatabase();
  const [enteredPin, setEnteredPin] = useState('');
  const [pinMode, setPinMode] = useState('loading');
  const [error, setError] = useState('');
  const [tempPin, setTempPin] = useState('');
  const [shakeError, setShakeError] = useState(false);

  useEffect(() => {
    const checkPinStatus = async () => {
      try {
        const pinDoc = await getSetting('user_pin');
        if (pinDoc?.value?.pinHash) {
          setPinMode('verify');
        } else {
          setPinMode('setup');
        }
      } catch {
        setPinMode('setup');
      }
    };
    checkPinStatus();
  }, [getSetting]);

  const handlePinKey = (key) => {
    if (key === 'delete') {
      setEnteredPin(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setEnteredPin('');
    } else if (enteredPin.length < 4) {
      const newPin = enteredPin + key;
      setEnteredPin(newPin);
      
      if (newPin.length === 4) {
        setTimeout(() => processPin(newPin), 150);
      }
    }
    setError('');
  };

  const processPin = async (pin) => {
    if (pinMode === 'setup') {
      if (!tempPin) {
        setTempPin(pin);
        setEnteredPin('');
      } else {
        if (pin === tempPin) {
          const pinHash = simpleHash(pin);
          await saveSetting('user_pin', { pinHash });
          onAuthenticated();
        } else {
          setError(translate('pinMismatch'));
          setShakeError(true);
          setTempPin('');
          setEnteredPin('');
          setTimeout(() => setShakeError(false), 500);
        }
      }
    } else if (pinMode === 'verify') {
      try {
        const pinDoc = await getSetting('user_pin');
        if (simpleHash(pin) === pinDoc.value.pinHash) {
          onAuthenticated();
        } else {
          setError(translate('incorrectPin'));
          setShakeError(true);
          setEnteredPin('');
          setTimeout(() => setShakeError(false), 500);
        }
      } catch (err) {
        setError('Error verifying PIN');
      }
    }
  };

  const getTitle = () => {
    if (pinMode === 'setup') {
      return !tempPin ? translate('setupPin') : translate('confirmPin');
    }
    return translate('enterPin');
  };

  const getSubtitle = () => {
    if (pinMode === 'setup') {
      return !tempPin ? translate('createPinSubtitle') : translate('confirmNewPinSubtitle');
    }
    return translate('welcomeBack');
  };

  if (pinMode === 'loading') {
    return (
      <div className="pin-lock-container">
        <div className="pin-lock-card">
          <div className="pin-title">{translate('appTitle')}</div>
        </div>
      </div>
    );
  }

  const pinDots = Array(4).fill(0).map((_, i) => i < enteredPin.length);

  return (
    <div className="pin-lock-container">
      <div className="pin-lock-card">
        <div className="pin-title">{getTitle()}</div>
        <div className="pin-subtitle">{getSubtitle()}</div>

        <div className={`pin-dots ${shakeError ? 'shake' : ''}`}>
          {pinDots.map((filled, i) => (
            <div
              key={i}
              className={`pin-dot ${filled ? 'filled' : ''}`}
            />
          ))}
        </div>

        {error && <div className="pin-error">{error}</div>}

        <div className="pin-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              className="pin-key"
              onClick={() => handlePinKey(num.toString())}
            >
              {num}
            </button>
          ))}
          <button
            className="pin-key delete"
            onClick={() => handlePinKey('delete')}
          >
            ←
          </button>
          <button
            className="pin-key"
            onClick={() => handlePinKey('0')}
          >
            0
          </button>
          <button
            className="pin-key delete"
            onClick={() => handlePinKey('clear')}
          >
            C
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
          <button
            className="lang-btn"
            onClick={() => setLanguage('am')}
            style={{ opacity: currentLang === 'am' ? 1 : 0.5 }}
          >
            አማ
          </button>
          <button
            className="lang-btn"
            onClick={() => setLanguage('en')}
            style={{ opacity: currentLang === 'en' ? 1 : 0.5 }}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  );
};
