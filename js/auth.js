// ============================================
// AUTHENTICATION MODULE - Clean Minimal PIN
// ============================================

const Auth = (function() {
  const db = Database;
  const translate = Translations.translate;
  
  let isUnlocked = false;
  let pinMode = 'verify';
  let enteredPin = '';
  let tempPin = '';
  let pinError = '';
  let storedPinHash = '';
  
  async function getStoredPin() {
    try {
      const doc = await db.settingsDB.get('user_pin');
      return doc.pinHash;
    } catch {
      return null;
    }
  }
  
  async function savePin(pin) {
    const pinHash = db.simpleHash(pin);
    try {
      const doc = await db.settingsDB.get('user_pin');
      doc.pinHash = pinHash;
      await db.settingsDB.put(doc);
    } catch {
      await db.settingsDB.put({ _id: 'user_pin', pinHash });
    }
    storedPinHash = pinHash;
  }
  
  function verifyPin(pin) {
    return db.simpleHash(pin) === storedPinHash;
  }
  
  function lockApp() {
    isUnlocked = false;
    enteredPin = '';
    tempPin = '';
    pinError = '';
    pinMode = 'verify';
    renderPinLock();
  }
  
  function unlockApp() {
    isUnlocked = true;
    App.renderDashboard();
    App.initDashboard();
  }
  
  function handlePinKey(key) {
    if (key === 'delete') {
      enteredPin = enteredPin.slice(0, -1);
    } else if (key === 'clear') {
      enteredPin = '';
    } else if (enteredPin.length < 4) {
      enteredPin += key;
    }
    
    pinError = '';
    renderPinLock();
    
    if (enteredPin.length === 4) {
      setTimeout(() => processPin(), 150);
    }
  }
  
  async function processPin() {
    if (pinMode === 'setup') {
      if (!tempPin) {
        tempPin = enteredPin;
        enteredPin = '';
        renderPinLock();
      } else {
        if (enteredPin === tempPin) {
          await savePin(enteredPin);
          pinMode = 'verify';
          unlockApp();
        } else {
          pinError = translate('pinMismatch');
          tempPin = '';
          enteredPin = '';
          renderPinLock();
        }
      }
    } else if (pinMode === 'change') {
      if (!tempPin) {
        if (verifyPin(enteredPin)) {
          tempPin = 'verified';
          enteredPin = '';
          pinError = '';
          renderPinLock();
        } else {
          pinError = translate('incorrectPin');
          enteredPin = '';
          renderPinLock();
        }
      } else if (tempPin === 'verified') {
        tempPin = enteredPin;
        enteredPin = '';
        renderPinLock();
      } else {
        if (enteredPin === tempPin) {
          await savePin(enteredPin);
          pinMode = 'verify';
          alert(translate('pinChanged') || 'PIN changed successfully!');
          unlockApp();
        } else {
          pinError = translate('pinMismatch');
          tempPin = '';
          enteredPin = '';
          renderPinLock();
        }
      }
    } else {
      if (verifyPin(enteredPin)) {
        unlockApp();
      } else {
        pinError = translate('incorrectPin');
        enteredPin = '';
        renderPinLock();
      }
    }
  }
  
  function renderPinLock() {
    let title = translate('enterPin');
    
    if (pinMode === 'setup') {
      title = tempPin ? translate('confirmPin') : translate('setupPin');
    } else if (pinMode === 'change') {
      if (!tempPin) {
        title = translate('enterOldPin');
      } else if (tempPin === 'verified') {
        title = translate('enterNewPin');
      } else {
        title = translate('confirmNewPin');
      }
    }
    
    const html = `
      <div class="pin-container">
        <div class="pin-card">
          <div class="pin-icon">🔐</div>
          <h2 class="pin-heading">${title}</h2>
          
          <div class="pin-dots-row ${pinError ? 'error' : ''}">
            <div class="pin-square ${enteredPin.length > 0 ? 'filled' : ''}"></div>
            <div class="pin-square ${enteredPin.length > 1 ? 'filled' : ''}"></div>
            <div class="pin-square ${enteredPin.length > 2 ? 'filled' : ''}"></div>
            <div class="pin-square ${enteredPin.length > 3 ? 'filled' : ''}"></div>
          </div>
          
          ${pinError ? `<div class="pin-error-text">${pinError}</div>` : '<div class="pin-error-text"></div>'}
          
          <div class="pin-keypad-grid">
            <button class="pin-num-key" onclick="Auth.handlePinKey('1')">1</button>
            <button class="pin-num-key" onclick="Auth.handlePinKey('2')">2</button>
            <button class="pin-num-key" onclick="Auth.handlePinKey('3')">3</button>
            <button class="pin-num-key" onclick="Auth.handlePinKey('4')">4</button>
            <button class="pin-num-key" onclick="Auth.handlePinKey('5')">5</button>
            <button class="pin-num-key" onclick="Auth.handlePinKey('6')">6</button>
            <button class="pin-num-key" onclick="Auth.handlePinKey('7')">7</button>
            <button class="pin-num-key" onclick="Auth.handlePinKey('8')">8</button>
            <button class="pin-num-key" onclick="Auth.handlePinKey('9')">9</button>
            <button class="pin-num-key" onclick="Auth.handlePinKey('clear')">⌫</button>
            <button class="pin-num-key" onclick="Auth.handlePinKey('0')">0</button>
            <button class="pin-num-key" onclick="Auth.handlePinKey('delete')">✕</button>
          </div>
          
          <div class="pin-footer-links">
            ${pinMode === 'verify' ? `
              <a href="#" onclick="Auth.startChangePin(); return false;">${translate('changePin') || 'Change PIN'}</a>
            ` : ''}
            <a href="#" onclick="Auth.showLanguageMenu(); return false;">${Translations.getCurrentLang() === 'am' ? 'English' : 'አማርኛ'}</a>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('app-root').innerHTML = html;
  }
  
  function showLanguageMenu() {
    const currentLang = Translations.getCurrentLang();
    const newLang = currentLang === 'am' ? 'en' : 'am';
    App.setLanguage(newLang);
  }
  
  function startChangePin() {
    pinMode = 'change';
    enteredPin = '';
    tempPin = '';
    pinError = '';
    renderPinLock();
  }
  
  async function startAuth() {
    try {
      const langDoc = await db.settingsDB.get('language');
      Translations.setLanguage(langDoc.value);
    } catch (e) {
      Translations.setLanguage('am');
    }
    
    storedPinHash = await getStoredPin();
    
    if (!storedPinHash) {
      pinMode = 'setup';
      renderPinLock();
    } else {
      pinMode = 'verify';
      renderPinLock();
    }
  }
  
  function logout() {
    lockApp();
  }
  
  return {
    startAuth,
    handlePinKey,
    lockApp,
    logout,
    isUnlocked: () => isUnlocked,
    startChangePin,
    showLanguageMenu
  };
})();

window.Auth = Auth;