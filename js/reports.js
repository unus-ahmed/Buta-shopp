// ============================================
// REPORTS MODULE
// ============================================

const Reports = (function() {
  const db = Database;
  const translate = Translations.translate;
  
  let reportInterval = null;
  
  // ========== LOAD DAILY SUMMARY ==========
  async function loadSummary() {
    const date = document.getElementById('summary-date').value;
    const start = new Date(date); start.setHours(0,0,0,0);
    const end = new Date(date); end.setHours(23,59,59,999);
    
    const result = await db.salesDB.allDocs({ include_docs: true });
    const sales = result.rows.map(r => r.doc).filter(d => {
      if (!d.timestamp) return false;
      const saleDate = new Date(d.timestamp);
      return saleDate >= start && saleDate <= end;
    });
    
    let revenue = 0, profit = 0;
    sales.forEach(s => {
      revenue += s.totalAmount || 0;
      profit += s.totalAmount - ((s.unitCost || 0) * s.quantity);
    });
    
    document.getElementById('total-revenue').textContent = revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('total-profit').textContent = profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('transaction-count').textContent = sales.length.toLocaleString();
    document.getElementById('summary-results').classList.remove('hidden');
  }
  
  // ========== SAVE SCHEDULE SETTINGS ==========
  async function saveScheduleSettings() {
    const reportTime = document.getElementById('report-time').value;
    const autoReport = document.getElementById('auto-report').checked;
    
    await db.settingsDB.put({ _id: 'reportTime', value: reportTime });
    await db.settingsDB.put({ _id: 'autoReport', value: autoReport });
    
    startReportScheduler();
    updateScheduleDisplay();
    alert(translate('scheduleSaved') || 'Schedule saved!');
  }
  
  // ========== SAVE LOW STOCK THRESHOLD ==========
  async function saveLowStockSettings() {
    const threshold = parseInt(document.getElementById('low-stock-threshold').value) || 5;
    await db.settingsDB.put({ _id: 'lowStockThreshold', value: threshold });
    loadLowStockPreview();
    alert(translate('thresholdSaved') || 'Threshold saved!');
  }
  
  // ========== GET TODAY'S SALES DATA ==========
  async function getTodaySalesData() {
    const today = new Date();
    const start = new Date(today); start.setHours(0,0,0,0);
    const end = new Date(today); end.setHours(23,59,59,999);
    
    const result = await db.salesDB.allDocs({ include_docs: true });
    const sales = result.rows.map(r => r.doc).filter(d => {
      if (!d.timestamp) return false;
      const saleDate = new Date(d.timestamp);
      return saleDate >= start && saleDate <= end;
    });
    
    let revenue = 0, profit = 0;
    const itemSales = {};
    
    sales.forEach(s => {
      revenue += s.totalAmount || 0;
      profit += s.totalAmount - ((s.unitCost || 0) * s.quantity);
      
      if (!itemSales[s.productName]) {
        itemSales[s.productName] = { quantity: 0, revenue: 0 };
      }
      itemSales[s.productName].quantity += s.quantity;
      itemSales[s.productName].revenue += s.totalAmount || 0;
    });
    
    const topItems = Object.entries(itemSales)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 5);
    
    return {
      date: today,
      revenue,
      profit,
      transactionCount: sales.length,
      topItems,
      itemSales
    };
  }
  
  // ========== GET LOW STOCK ITEMS ==========
  async function getLowStockItems() {
    const thresholdDoc = await db.settingsDB.get('lowStockThreshold').catch(() => ({ value: 5 }));
    const threshold = thresholdDoc.value;
    
    const products = Products.getProducts();
    return products.filter(p => p.stock < threshold);
  }
  
  // ========== FORMAT REPORT MESSAGE ==========
  async function formatReportMessage(shopName) {
    const data = await getTodaySalesData();
    const lowStock = await getLowStockItems();
    const thresholdDoc = await db.settingsDB.get('lowStockThreshold').catch(() => ({ value: 5 }));
    const currentLang = Translations.getCurrentLang();
    
    const dateStr = data.date.toLocaleDateString(currentLang === 'am' ? 'am-ET' : 'en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    let msg = `📊 ${translate('dailyReport') || 'Daily Report'} - ${shopName}\n`;
    msg += `${dateStr}\n\n`;
    
    msg += `💰 ${translate('totalSales') || 'Total Sales'}: ${data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${translate('etb') || 'ETB'}\n`;
    msg += `📈 ${translate('totalProfit') || 'Total Profit'}: ${data.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${translate('etb') || 'ETB'}\n`;
    msg += `📋 ${translate('transactions') || 'Transactions'}: ${data.transactionCount.toLocaleString()}\n`;
    
    if (data.topItems.length > 0) {
      msg += `\n🏆 ${translate('topSelling') || 'Top Selling Items'}:\n`;
      data.topItems.forEach((item, i) => {
        const prefix = i === data.topItems.length - 1 ? '└' : '├';
        msg += `${prefix} ${item[0]}: ${item[1].quantity} ${translate('units') || 'units'}\n`;
      });
    }
    
    if (lowStock.length > 0) {
      msg += `\n⚠️ ${translate('lowStockWarning') || 'Low Stock Alert'} (${translate('below') || 'below'} ${thresholdDoc.value}):\n`;
      lowStock.slice(0, 5).forEach((item, i) => {
        const prefix = i === Math.min(lowStock.length, 5) - 1 ? '└' : '├';
        msg += `${prefix} ${item.name}: ${item.stock} ${translate('left') || 'left'}\n`;
      });
      if (lowStock.length > 5) {
        msg += `└ ...${translate('and') || 'and'} ${lowStock.length - 5} ${translate('more') || 'more'}\n`;
      }
    }
    
    msg += `\n📱 ${translate('sentFrom') || 'Sent from'} ${shopName}`;
    
    return msg;
  }
  
  // ========== SEND MANUAL REPORT ==========
  async function sendManualReport() {
    const shopName = (await db.settingsDB.get('shopName').catch(() => ({ value: 'Butajira Shop' }))).value;
    const token = (await db.settingsDB.get('botToken').catch(() => ({ value: '' }))).value;
    const chatId = (await db.settingsDB.get('chatId').catch(() => ({ value: '' }))).value;
    
    if (!token || !chatId) { 
      alert(translate('configureBot') || 'Configure bot first'); 
      return false; 
    }
    
    const msg = await formatReportMessage(shopName);
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' })
      });
      const data = await response.json();
      
      if (data.ok) {
        alert(translate('reportSent') || 'Report sent!');
        return true;
      } else {
        alert(translate('sendFailed') || 'Failed to send');
        return false;
      }
    } catch (e) {
      console.error('Send error:', e);
      alert(translate('sendFailed') || 'Failed to send');
      return false;
    }
  }
  
  // ========== SEND SCHEDULED REPORT ==========
  async function sendScheduledReport() {
    const autoReport = await db.settingsDB.get('autoReport').catch(() => ({ value: true }));
    if (!autoReport.value) return false;
    
    const token = (await db.settingsDB.get('botToken').catch(() => ({ value: '' }))).value;
    const chatId = (await db.settingsDB.get('chatId').catch(() => ({ value: '' }))).value;
    
    if (!token || !chatId) return false;
    
    const today = new Date().toISOString().split('T')[0];
    const lastSent = await db.settingsDB.get('lastReportSent').catch(() => ({ date: '' }));
    
    if (lastSent.date === today) return false;
    
    const shopName = (await db.settingsDB.get('shopName').catch(() => ({ value: 'Butajira Shop' }))).value;
    const msg = await formatReportMessage(shopName);
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' })
      });
      const data = await response.json();
      
      if (data.ok) {
        await db.settingsDB.put({ _id: 'lastReportSent', date: today });
        console.log('📤 Scheduled report sent at', new Date().toLocaleTimeString());
        return true;
      }
      return false;
    } catch (e) {
      console.error('Scheduled send error:', e);
      return false;
    }
  }
  
  // ========== START REPORT SCHEDULER ==========
  function startReportScheduler() {
    if (reportInterval) {
      clearInterval(reportInterval);
    }
    
    reportInterval = setInterval(async () => {
      try {
        const autoReport = await db.settingsDB.get('autoReport').catch(() => ({ value: false }));
        if (!autoReport.value) return;
        
        const reportTime = await db.settingsDB.get('reportTime').catch(() => ({ value: '20:00' }));
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        if (currentTime === reportTime.value) {
          await sendScheduledReport();
        }
      } catch (e) {
        console.error('Scheduler error:', e);
      }
    }, 60000);
    
    console.log('✅ Report scheduler started');
  }
  
  // ========== STOP REPORT SCHEDULER ==========
  function stopReportScheduler() {
    if (reportInterval) {
      clearInterval(reportInterval);
      reportInterval = null;
      console.log('⏹️ Report scheduler stopped');
    }
  }
  
  // ========== GET SCHEDULER STATUS ==========
  async function getSchedulerStatus() {
    const autoReport = await db.settingsDB.get('autoReport').catch(() => ({ value: false }));
    const reportTime = await db.settingsDB.get('reportTime').catch(() => ({ value: '20:00' }));
    
    return {
      enabled: autoReport.value,
      time: reportTime.value,
      running: reportInterval !== null
    };
  }
  
  // ========== TOGGLE BOT SETTINGS FORM ==========
  function toggleBotSettings() {
    const form = document.getElementById('bot-settings-form');
    const btn = document.getElementById('edit-bot-btn');
    
    if (form.classList.contains('hidden')) {
      form.classList.remove('hidden');
      if (btn) btn.textContent = translate('hideSettings') || '🔽 ደብቅ ቅንብሮች';
    } else {
      form.classList.add('hidden');
      if (btn) btn.textContent = translate('editSettings') || '✏️ ቅንብሮችን አርትዕ';
    }
  }
  
  // ========== SAVE TELEGRAM SETTINGS ==========
  async function saveTelegramSettings() {
    const shopName = document.getElementById('shop-name').value;
    const botToken = document.getElementById('bot-token').value;
    const chatId = document.getElementById('chat-id').value;
    
    await db.settingsDB.put({ _id: 'shopName', value: shopName });
    await db.settingsDB.put({ _id: 'botToken', value: botToken });
    await db.settingsDB.put({ _id: 'chatId', value: chatId });
    
    updateBotStatusBadge();
    toggleBotSettings();
    
    alert(translate('settingsSaved') || '✅ ቅንብሮች ተቀምጠዋል!');
  }
  
  // ========== LOAD SETTINGS INTO FORM ==========
  async function loadSettingsIntoForm() {
    try {
      const shopName = await db.settingsDB.get('shopName');
      document.getElementById('shop-name').value = shopName.value;
    } catch (e) {}
    
    try {
      const botToken = await db.settingsDB.get('botToken');
      document.getElementById('bot-token').value = botToken.value;
    } catch (e) {}
    
    try {
      const chatId = await db.settingsDB.get('chatId');
      document.getElementById('chat-id').value = chatId.value;
    } catch (e) {}
    
    try {
      const reportTime = await db.settingsDB.get('reportTime');
      document.getElementById('report-time').value = reportTime.value;
    } catch (e) {
      document.getElementById('report-time').value = '20:00';
    }
    
    try {
      const autoReport = await db.settingsDB.get('autoReport');
      document.getElementById('auto-report').checked = autoReport.value;
    } catch (e) {
      document.getElementById('auto-report').checked = true;
    }
    
    try {
      const threshold = await db.settingsDB.get('lowStockThreshold');
      document.getElementById('low-stock-threshold').value = threshold.value;
    } catch (e) {
      document.getElementById('low-stock-threshold').value = '5';
    }
    
    updateBotStatusBadge();
    const form = document.getElementById('bot-settings-form');
    if (form) form.classList.add('hidden');
    updateScheduleDisplay();
  }
  
  // ========== TEST TELEGRAM CONNECTION ==========
  async function testTelegramConnection() {
    const token = document.getElementById('bot-token').value;
    const chatId = document.getElementById('chat-id').value;
    
    if (!token || !chatId) {
      alert(translate('enterTokenAndChatId') || 'Enter token and chat ID');
      return;
    }
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: chatId, 
          text: '🧪 ' + (translate('testMessage') || 'Test message from Butajira Shop')
        })
      });
      const data = await response.json();
      
      if (data.ok) {
        alert(translate('testSuccess') || '✅ Test message sent! Check Telegram.');
      } else {
        alert(translate('testFailed') || '❌ Failed. Check token and chat ID.');
      }
    } catch (e) {
      alert(translate('testFailed') || '❌ Connection failed');
    }
  }

  // ========== TOGGLE AUTO REPORT ==========
  function toggleAutoReport() {
    const checkbox = document.getElementById('auto-report');
    const icon = document.getElementById('schedule-icon');
    const statusText = document.getElementById('schedule-status-text');
    const desc = document.getElementById('schedule-description');
    
    if (checkbox.checked) {
      icon.textContent = '✅';
      statusText.textContent = translate('autoReportActive') || 'አውቶማቲክ ሪፖርት ንቁ ነው';
      desc.textContent = translate('autoReportDesc') || 'በየቀኑ በተመረጠው ሰዓት ይላካል';
    } else {
      icon.textContent = '⏸️';
      statusText.textContent = translate('autoReportPaused') || 'አውቶማቲክ ሪፖርት ቆሟል';
      desc.textContent = translate('autoReportPausedDesc') || 'ማንቂያ ተሰናክሏል';
    }
  }

  // ========== ADJUST THRESHOLD ==========
  function adjustThreshold(delta) {
    const input = document.getElementById('low-stock-threshold');
    const display = document.getElementById('threshold-display');
    let value = parseInt(input.value) || 5;
    value = Math.max(1, value + delta);
    input.value = value;
    display.textContent = value;
    loadLowStockPreview();
  }

  // ========== LOAD LOW STOCK PREVIEW ==========
  async function loadLowStockPreview() {
    const threshold = parseInt(document.getElementById('low-stock-threshold').value) || 5;
    const products = Products.getProducts();
    const lowStock = products.filter(p => p.stock < threshold);
    
    const countEl = document.getElementById('low-stock-count');
    const listEl = document.getElementById('low-stock-items-list');
    
    if (countEl) {
      countEl.textContent = `${lowStock.length} ${translate('units') || 'እቃ'}${lowStock.length !== 1 ? '' : ''}`;
    }
    
    if (listEl) {
      if (lowStock.length === 0) {
        listEl.innerHTML = `<span style="color: #15803d;">${translate('allItemsStocked') || '✅ ሁሉም እቃዎች በቂ ክምችት አላቸው'}</span>`;
      } else {
        listEl.innerHTML = lowStock.slice(0, 3).map(p => 
          `<div>• ${p.name} (${p.stock} ${translate('remaining') || 'ቀሪ'})</div>`
        ).join('');
        if (lowStock.length > 3) {
          listEl.innerHTML += `<div style="color: #6b7280; margin-top: 5px;">...${translate('andMore') || 'እና'} ${lowStock.length - 3} ${translate('more') || 'ሌሎች'}</div>`;
        }
      }
    }
  }

  // ========== UPDATE TODAY'S SUMMARY ==========
  async function updateTodaySummary() {
    const data = await getTodaySalesData();
    
    document.getElementById('today-revenue').textContent = data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('today-profit').textContent = data.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('today-transactions').textContent = data.transactionCount.toLocaleString();
    
    const today = new Date();
    const currentLang = Translations.getCurrentLang();
    const locale = currentLang === 'am' ? 'am-ET' : 'en-US';
    document.getElementById('today-date').textContent = today.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  }

  // ========== UPDATE SCHEDULE DISPLAY ==========
  async function updateScheduleDisplay() {
    const reportTime = await db.settingsDB.get('reportTime').catch(() => ({ value: '20:00' }));
    const select = document.getElementById('report-time');
    if (select) select.value = reportTime.value;
    
    const display = document.getElementById('schedule-display');
    const timeStr = formatTimeDisplay(reportTime.value);
    if (display) display.textContent = `${translate('dailyReportDisplay') || 'ዕለታዊ ሪፖርት'}: ${timeStr}`;
    
    updateCountdown(reportTime.value);
  }

  function formatTimeDisplay(timeStr) {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }

  function updateCountdown(reportTime) {
    const now = new Date();
    const [h, m] = reportTime.split(':');
    const reportDate = new Date();
    reportDate.setHours(parseInt(h), parseInt(m), 0);
    
    if (reportDate < now) {
      reportDate.setDate(reportDate.getDate() + 1);
    }
    
    const diff = reportDate - now;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    const el = document.getElementById('next-report-countdown');
    if (el) {
      el.textContent = `${translate('nextReportIn') || '⏵ የሚቀጥለው ሪፖርት በ:'} ${hours} ${translate('hours') || 'ሰዓት'} ${minutes} ${translate('minutes') || 'ደቂቃ'}`;
    }
    
    setTimeout(() => updateCountdown(reportTime), 60000);
  }

  // ========== UPDATE BOT STATUS BADGE ==========
  async function updateBotStatusBadge() {
    const badge = document.getElementById('bot-status-badge');
    const badgeLarge = document.getElementById('bot-status-badge-large');
    
    try {
      const token = await db.settingsDB.get('botToken').catch(() => ({ value: '' }));
      const chatId = await db.settingsDB.get('chatId').catch(() => ({ value: '' }));
      
      const isConfigured = token.value && chatId.value;
      const text = isConfigured ? (translate('configured') || '✅ ተዋቅሯል') : (translate('notConfigured') || '⚠️ ያልተዋቀረ');
      const bg = isConfigured ? '#dcfce7' : '#fef3c7';
      const color = isConfigured ? '#15803d' : '#b45309';
      
      if (badge) {
        badge.textContent = text;
        badge.style.background = bg;
        badge.style.color = color;
      }
      if (badgeLarge) {
        badgeLarge.textContent = text;
        badgeLarge.style.background = bg;
        badgeLarge.style.color = color;
      }
    } catch (e) {
      if (badge) badge.textContent = '⚠️ ያልተዋቀረ';
      if (badgeLarge) badgeLarge.textContent = '⚠️ ያልተዋቀረ';
    }
  }

  function startCountdownTimer() {
    setInterval(async () => {
      const reportTime = await db.settingsDB.get('reportTime').catch(() => ({ value: '20:00' }));
      updateCountdown(reportTime.value);
    }, 60000);
  }
  
  // ========== INITIALIZE REPORTS MODULE ==========
  async function initReports() {
    await loadSettingsIntoForm();
    await updateTodaySummary();
    await updateScheduleDisplay();
    await updateBotStatusBadge();
    await loadLowStockPreview();
    startReportScheduler();
    startCountdownTimer();
  }
  
  // ========== EXPORT PUBLIC FUNCTIONS ==========
  return {
    loadSummary,
    getTodaySalesData,
    getLowStockItems,
    saveTelegramSettings,
    testTelegramConnection,
    sendManualReport,
    sendScheduledReport,
    saveScheduleSettings,
    saveLowStockSettings,
    startReportScheduler,
    stopReportScheduler,
    getSchedulerStatus,
    loadSettingsIntoForm,
    initReports,
    toggleBotSettings,
    updateBotStatusBadge,
    formatReportMessage,
    toggleAutoReport,
    adjustThreshold,
    loadLowStockPreview,
    updateTodaySummary,
    updateScheduleDisplay
  };
})();

window.Reports = Reports;