// ============================================
// MAIN APPLICATION MODULE
// ============================================

const App = (function() {
  const translate = Translations.translate;
  const db = Database;
  
  function renderDashboard() {
    const currentLang = Translations.getCurrentLang();
    const translate = Translations.translate;
    const isAdmin = (typeof Users !== 'undefined' && Users.getCurrentUser) ? 
      Users.getCurrentUser()?.role === 'admin' : false;
    
    const html = `
      <div class="container">
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h1>${translate('appTitle')}</h1>
              <div style="font-size: 12px; opacity: 0.9;">${translate('appSubtitle')}</div>
            </div>
            <div style="display: flex; align-items: center;">
              <div class="lang-switch">
                <button class="lang-btn ${currentLang === 'am' ? 'active' : ''}" onclick="App.setLanguage('am')">አማ</button>
                <button class="lang-btn ${currentLang === 'en' ? 'active' : ''}" onclick="App.setLanguage('en')">EN</button>
              </div>
              <button class="logout-btn" onclick="Auth.logout()">🚪 ${translate('logout')}</button>
            </div>
          </div>
        </div>

        <div id="scanner-container" class="hidden">
          <div class="scanner-overlay">
            <h2 style="margin-bottom: 10px;">${translate('scanOverlayTitle')}</h2>
            <p>${translate('scanOverlayText')}</p>
          </div>
          <div class="scanner-frame"></div>
          <div id="qr-reader"></div>
          <div id="scanner-controls">
            <button class="btn" onclick="Scanner.switchCamera()" style="background: #4b5563;">${translate('switchCamera')}</button>
            <button class="btn" onclick="Scanner.stopScanner()" style="background: #dc2626;">${translate('cancelScan')}</button>
          </div>
        </div>

        <div class="tabs">
          <button class="tab active" onclick="App.showTab('products')">${translate('tabProducts')}</button>
          <button class="tab" onclick="App.showTab('scan')">${translate('tabScan')}</button>
          <button class="tab" onclick="App.showTab('sell')">${translate('tabSell')}</button>
          <button class="tab" onclick="App.showTab('summary')">${translate('tabSummary')}</button>
          <button class="tab" onclick="App.showTab('reports')">${translate('tabReports')}</button>
          ${isAdmin ? `<button class="tab" onclick="App.showTab('admin')">👑 ${translate('adminDashboard')}</button>` : ''}
        </div>

        <div class="content">
          <div id="products-tab">
            <button class="btn" onclick="Products.showAddForm()">${translate('addProductBtn')}</button>
            
            <div id="add-form" class="card hidden">
              <h3 style="margin-bottom: 15px;">${translate('addFormTitle')}</h3>
              <input type="text" id="prod-name" placeholder="${currentLang === 'am' ? 'የእቃው ስም' : 'Product Name'}">
              <input type="text" id="prod-barcode" placeholder="${currentLang === 'am' ? 'ባርኮድ' : 'Barcode'}">
              <div class="flex">
                <input type="number" id="prod-price" placeholder="${currentLang === 'am' ? 'የሽያጭ ዋጋ' : 'Selling Price'}" step="0.01">
                <input type="number" id="prod-cost" placeholder="${currentLang === 'am' ? 'የግዢ ዋጋ' : 'Cost Price'}" step="0.01">
              </div>
              <input type="number" id="prod-stock" placeholder="${currentLang === 'am' ? 'ክምችት' : 'Stock'}" value="0">
              <div class="flex">
                <button class="btn btn-green" onclick="Products.saveProduct()">${translate('saveProductBtn')}</button>
                <button class="btn btn-gray" onclick="Products.hideAddForm()">${translate('cancelFormBtn')}</button>
              </div>
            </div>

            <div id="edit-form" class="card hidden">
              <h3 style="margin-bottom: 15px;">${translate('editFormTitle')}</h3>
              <input type="hidden" id="edit-prod-id">
              <input type="text" id="edit-prod-name">
              <input type="text" id="edit-prod-barcode">
              <div class="flex">
                <input type="number" id="edit-prod-price" step="0.01">
                <input type="number" id="edit-prod-cost" step="0.01">
              </div>
              <input type="number" id="edit-prod-stock" value="0">
              <div class="flex">
                <button class="btn btn-green" onclick="Products.saveEditedProduct()">${translate('updateProductBtn')}</button>
                <button class="btn btn-gray" onclick="Products.hideEditForm()">${translate('cancelEditBtn')}</button>
              </div>
            </div>
            
            <!-- Search Bar -->
            <div style="margin-bottom: 15px;">
              <div style="position: relative;">
                <input type="text" id="product-search-input" placeholder="${currentLang === 'am' ? '🔍 እቃ ፈልግ...' : 'Search products...'}" 
                       style="padding-left: 45px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px;">
                <span style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #9ca3af;">🔍</span>
                <button onclick="Products.clearProductSearch()" id="clear-product-search" 
                        style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #9ca3af; cursor: pointer; display: none;">✕</button>
              </div>
            </div>
            
            <div id="products-list"></div>
          </div>

          <div id="scan-tab" class="hidden">
            <h2 style="margin-bottom: 15px;">${translate('scanTitle')}</h2>
            <button class="btn btn-green" onclick="Scanner.startScanner()" style="font-size: 20px; padding: 20px;">${translate('openCamera')}</button>
            <div style="margin: 20px 0; text-align: center;">${translate('orText')}</div>
            <div class="card">
              <h3>${translate('manualEntry')}</h3>
              <input type="text" id="manual-barcode" placeholder="${translate('enterBarcode')}">
              <button class="btn" onclick="Scanner.processManualBarcode()">${translate('processBarcode')}</button>
            </div>
            <div id="scan-cart" class="card hidden">
              <h3>${translate('scanCart')}</h3>
              <div id="scan-cart-items"></div>
              <div style="border-top: 2px solid #e5e7eb; margin-top: 15px; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                  <span>${translate('cartTotal')}</span>
                  <span id="scan-cart-total">0.00 ${translate('etb')}</span>
                </div>
                <button class="btn btn-green" onclick="Scanner.checkoutScanCart()" style="margin-top: 10px;">${translate('checkout')}</button>
                <button class="btn btn-gray" onclick="Scanner.clearScanCart()">${translate('clearCart')}</button>
              </div>
            </div>
          </div>

          <div id="sell-tab" class="hidden">
            <h2 style="margin-bottom: 15px;">${translate('tabSell')}</h2>
            <input type="text" id="product-search" placeholder="${translate('searchPlaceholder')}">
            <div id="product-search-results" style="max-height: 400px; overflow-y: auto;"></div>
            
            <div class="card hidden" id="sell-details">
              <h3 id="selected-product-name"></h3>
              <div style="margin: 15px 0;">
                <strong>${translate('priceLabel')}:</strong> <span id="sell-price"></span> ${translate('etb')}<br>
                <strong>${translate('availableLabel')}:</strong> <span id="sell-stock"></span>
              </div>
              <div class="flex" style="justify-content: center;">
                <button class="stock-btn" onclick="Sales.changeQty(-1)">−</button>
                <input type="number" id="sell-qty" value="1" min="1" style="width: 100px; text-align: center; font-size: 20px;">
                <button class="stock-btn" onclick="Sales.changeQty(1)">+</button>
              </div>
              <div style="display: flex; gap: 5px; margin: 15px 0; justify-content: center;">
                <button onclick="Sales.setQuantity(1)" style="padding: 10px 15px; border: 1px solid #d1d5db; border-radius: 8px;">1</button>
                <button onclick="Sales.setQuantity(2)" style="padding: 10px 15px; border: 1px solid #d1d5db; border-radius: 8px;">2</button>
                <button onclick="Sales.setQuantity(5)" style="padding: 10px 15px; border: 1px solid #d1d5db; border-radius: 8px;">5</button>
                <button onclick="Sales.setQuantity(10)" style="padding: 10px 15px; border: 1px solid #d1d5db; border-radius: 8px;">10</button>
              </div>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
                <strong>${translate('totalLabel')}:</strong> <span id="sell-total" style="font-size: 28px; font-weight: bold;">0.00</span> ${translate('etb')}
              </div>
              <div class="flex">
                <button class="btn btn-green" onclick="Sales.recordSale()" style="flex: 2;">${translate('completeSaleBtn')}</button>
                <button class="btn btn-gray" onclick="Sales.cancelSale()" style="flex: 1;">${translate('cancel')}</button>
              </div>
            </div>
            
            <div id="recent-items" style="margin-top: 20px;">
              <h4 style="margin-bottom: 10px;">${translate('recentTitle')}</h4>
              <div id="recent-items-list" style="display: flex; flex-wrap: wrap; gap: 8px;"></div>
            </div>
          </div>

          <div id="summary-tab" class="hidden">
            <h2 style="margin-bottom: 15px;">${translate('summaryTitle')}</h2>
            <input type="date" id="summary-date">
            <button class="btn" onclick="Reports.loadSummary()">${translate('loadSummary')}</button>
            <div id="summary-results" class="hidden">
              <div class="summary-card">
                <div>${translate('totalRevenue')}</div>
                <div class="summary-number" id="total-revenue">0.00</div>
              </div>
              <div class="summary-card" style="background: #f0fdf4;">
                <div>${translate('totalProfit')}</div>
                <div class="summary-number" id="total-profit" style="color: #15803d;">0.00</div>
              </div>
              <div class="card">
                <strong>${translate('transactions')}:</strong> <span id="transaction-count">0</span>
              </div>
            </div>
          </div>

          <div id="reports-tab" class="hidden">
            <div class="card" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; overflow: hidden;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="margin: 0; color: white; font-size: 16px;">${translate('todaySummary')}</h3>
                <span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 20px; font-size: 11px;" id="today-date"></span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                <div style="background: rgba(255,255,255,0.15); border-radius: 10px; padding: 12px 6px; text-align: center;">
                  <div style="font-size: 20px; margin-bottom: 3px;">💰</div>
                  <div style="font-size: 16px; font-weight: bold; word-break: break-word;" id="today-revenue">0.00</div>
                  <div style="font-size: 10px; opacity: 0.9;">${translate('revenueLabelShort')}</div>
                </div>
                <div style="background: rgba(255,255,255,0.15); border-radius: 10px; padding: 12px 6px; text-align: center;">
                  <div style="font-size: 20px; margin-bottom: 3px;">📈</div>
                  <div style="font-size: 16px; font-weight: bold; word-break: break-word;" id="today-profit">0.00</div>
                  <div style="font-size: 10px; opacity: 0.9;">${translate('profitLabelShort')}</div>
                </div>
                <div style="background: rgba(255,255,255,0.15); border-radius: 10px; padding: 12px 6px; text-align: center;">
                  <div style="font-size: 20px; margin-bottom: 3px;">🧾</div>
                  <div style="font-size: 16px; font-weight: bold; word-break: break-word;" id="today-transactions">0</div>
                  <div style="font-size: 10px; opacity: 0.9;">${translate('transactionsLabelShort')}</div>
                </div>
              </div>
            </div>
            
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">${translate('telegramBot')}</h3>
                <span id="bot-status-badge-large" style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${translate('notConfigured')}</span>
              </div>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 15px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                  <span style="font-size: 24px;">⏰</span>
                  <div>
                    <div style="font-weight: bold;" id="schedule-display">${translate('dailyReportDisplay')}: 8:00 PM</div>
                    <div style="font-size: 12px; color: #6b7280;" id="next-report-countdown"></div>
                  </div>
                </div>
                <div style="display: flex; gap: 10px;">
                  <button class="btn-small" onclick="Reports.toggleBotSettings()" style="background: #1e3a8a; color: white; flex: 1;" id="edit-bot-btn">${translate('editSettings')}</button>
                  <button class="btn-small btn-green" onclick="Reports.sendManualReport()" style="flex: 1;">${translate('sendNow')}</button>
                </div>
              </div>
              
              <div id="bot-settings-form" class="hidden" style="border-top: 1px solid #e5e7eb; padding-top: 15px;">
                <label style="font-weight: bold; margin-bottom: 5px; display: block;">${translate('shopNameLabel')}:</label>
                <input type="text" id="shop-name" value="ቡታጅራ ሱቅ" style="margin-bottom: 15px;">
                <label style="font-weight: bold; margin-bottom: 5px; display: block;">${translate('botTokenLabel')}:</label>
                <input type="text" id="bot-token" placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz" style="margin-bottom: 15px;">
                <label style="font-weight: bold; margin-bottom: 5px; display: block;">${translate('chatIdLabel')}:</label>
                <input type="text" id="chat-id" placeholder="-1001234567890" style="margin-bottom: 15px;">
                <div style="display: flex; gap: 10px;">
                  <button class="btn-small btn-blue" onclick="Reports.saveTelegramSettings()" style="flex: 1;">${translate('saveSettings')}</button>
                  <button class="btn-small btn-green" onclick="Reports.testTelegramConnection()" style="flex: 1;">${translate('testConnection')}</button>
                  <button class="btn-small btn-gray" onclick="Reports.toggleBotSettings()" style="flex: 1;">${translate('cancel')}</button>
                </div>
              </div>
            </div>
            
            <div class="card">
              <h3 style="margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">${translate('reportSchedule')}</h3>
              
              <div style="margin-bottom: 15px;">
                <label style="font-weight: bold; margin-bottom: 5px; display: block;">${translate('dailyReportTimeLabel')}:</label>
                <input type="time" id="report-time" value="20:00" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #d1d5db; font-size: 16px;">
              </div>
              
              <div style="background: #f0fdf4; border-radius: 12px; padding: 15px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;" id="schedule-icon">✅</span>
                    <div>
                      <div style="font-weight: bold;" id="schedule-status-text">${translate('autoReportActive')}</div>
                      <div style="font-size: 12px; color: #6b7280;" id="schedule-description">${translate('autoReportDesc')}</div>
                    </div>
                  </div>
                  <label class="switch">
                    <input type="checkbox" id="auto-report" checked onchange="Reports.toggleAutoReport()">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              
              <button class="btn btn-green" onclick="Reports.saveScheduleSettings()">${translate('saveSchedule')}</button>
            </div>
            
            <div class="card">
              <h3 style="margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">${translate('lowStockAlertTitle')}</h3>
              
              <div style="margin-bottom: 20px;">
                <label style="font-weight: bold; margin-bottom: 10px; display: block;">${translate('alertWhenBelow')}:</label>
                <div style="display: flex; align-items: center; gap: 15px;">
                  <button class="stock-btn" onclick="Reports.adjustThreshold(-1)" style="width: 50px; height: 50px;">−</button>
                  <div style="text-align: center;">
                    <span style="font-size: 36px; font-weight: bold; color: #1e3a8a;" id="threshold-display">5</span>
                    <span style="font-size: 14px; color: #6b7280; display: block;">${translate('units')}</span>
                  </div>
                  <button class="stock-btn" onclick="Reports.adjustThreshold(1)" style="width: 50px; height: 50px;">+</button>
                </div>
                <input type="hidden" id="low-stock-threshold" value="5">
              </div>
              
              <div id="low-stock-preview" style="background: #fef3c7; border-radius: 12px; padding: 15px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                  <span>⚠️</span>
                  <span style="font-weight: bold;" id="low-stock-count">0 ${translate('units')}</span>
                  <span style="color: #6b7280; font-size: 12px;">${translate('lowStockItemsCount')}</span>
                </div>
                <div id="low-stock-items-list" style="font-size: 14px;">
                  <span style="color: #6b7280;">${translate('loadingPreview')}</span>
                </div>
              </div>
              
              <button class="btn" onclick="Reports.saveLowStockSettings()" style="background: #ea580c;">${translate('saveThreshold')}</button>
            </div>
            
            <div class="card">
              <h3 style="margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
                <span></span> ${translate('backupRestore')}
              </h3>
              
              <div style="margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 16px;"></span>
                  <span style="font-weight: 500; color: #374151;">${translate('products')}</span>
                </div>
                <div style="display: flex; gap: 10px;">
                  <button class="btn-small" onclick="Backup.exportProducts()" style="background: #1e3a8a; color: white; flex: 1;">
                     ${translate('export')}
                  </button>
                  <button class="btn-small btn-green" onclick="Backup.importProducts()" style="flex: 1;">
                     ${translate('import')}
                  </button>
                </div>
              </div>
              
              <div style="margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 16px;"></span>
                  <span style="font-weight: 500; color: #374151;">${translate('sales')}</span>
                </div>
                <div style="display: flex; gap: 10px;">
                  <button class="btn-small" onclick="Backup.exportSales()" style="background: #1e3a8a; color: white; flex: 1;">
                     ${translate('export')}
                  </button>
                  <button class="btn-small btn-green" onclick="Backup.importSales()" style="flex: 1;">
                     ${translate('import')}
                  </button>
                </div>
              </div>
              
              <button class="btn btn-green" onclick="Backup.exportAll()" style="margin-top: 5px;">
                 ${translate('exportAll')}
              </button>
              
              <p style="font-size: 11px; color: #6b7280; margin-top: 12px; text-align: center;">
                💡 ${translate('backupNote')}
              </p>
            </div>
            
            ${isAdmin ? `
            <div style="position: sticky; bottom: 20px; display: flex; justify-content: flex-end; margin-top: 10px;">
              <button onclick="Reports.sendManualReport()" style="background: #1e3a8a; color: white; border: none; border-radius: 60px; padding: 15px 25px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(30,58,138,0.3); cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <span></span> ${translate('sendDailyReportNow')}
              </button>
            </div>
            ` : ''}
          </div>

          ${isAdmin && typeof Admin !== 'undefined' ? `<div id="admin-tab" class="hidden">${Admin.renderAdminTab()}</div>` : ''}
        </div>
      </div>
    `;
    
    document.getElementById('app-root').innerHTML = html;
  }
  
  function setLanguage(lang) {
    Translations.setLanguage(lang);
    db.settingsDB.put({ _id: 'language', value: lang }).catch(() => {});
    if (Auth.isUnlocked()) {
      renderDashboard();
      initDashboard();
      
      setTimeout(() => {
        const reportsTab = document.getElementById('reports-tab');
        if (reportsTab && !reportsTab.classList.contains('hidden')) {
          App.showTab('reports');
        }
      }, 50);
    }
  }
  
  function showTab(tabName) {
    const isAdmin = (typeof Users !== 'undefined' && Users.getCurrentUser) ? 
      Users.getCurrentUser()?.role === 'admin' : false;
    const tabs = isAdmin ? ['products', 'scan', 'sell', 'summary', 'reports', 'admin'] 
                        : ['products', 'scan', 'sell', 'summary', 'reports'];
    
    tabs.forEach(t => {
      const el = document.getElementById(t + '-tab');
      if (el) el.classList.add('hidden');
    });
    
    const activeTab = document.getElementById(tabName + '-tab');
    if (activeTab) activeTab.classList.remove('hidden');
    
    document.querySelectorAll('.tab').forEach((tab, i) => {
      if (tabs[i]) tab.classList.toggle('active', tabs[i] === tabName);
    });
    
    if (tabName === 'sell') {
      if (typeof Sales !== 'undefined' && Sales.initSellTab) {
        Sales.initSellTab();
      } else {
        const searchInput = document.getElementById('product-search');
        if (searchInput) searchInput.value = '';
        const results = Sales.searchProducts('');
        Sales.displaySearchResults(results);
        Sales.loadRecentSales();
      }
    }
    
    if (tabName === 'summary') {
      document.getElementById('summary-date').value = new Date().toISOString().split('T')[0];
    }
    
    if (tabName === 'admin' && typeof Admin !== 'undefined') {
      Admin.initAdminTab();
    }
  }
  
  async function initDashboard() {
    await Products.loadProducts();
    if (typeof Products !== 'undefined' && Products.initProductSearch) {
      Products.initProductSearch();
    }
    if (typeof Reports !== 'undefined' && Reports.initReports) {
      Reports.initReports();
    }
    
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const results = Sales.searchProducts(e.target.value);
        Sales.displaySearchResults(results);
      });
    }
    
    document.getElementById('summary-date').value = new Date().toISOString().split('T')[0];
    
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
  }
  
  return {
    renderDashboard,
    initDashboard,
    setLanguage,
    showTab
  };
})();

Auth.startAuth();
