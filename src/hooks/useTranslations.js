import { useState, useCallback } from 'react';

const texts = {
  am: {
    // App
    appTitle: '📦 ቡታጅራ ሱቅ',
    appSubtitle: 'ከመስመር ውጭ የእቃ መዝገብ',
    
    // PIN Lock
    enterPin: 'ፒን ያስገቡ',
    setupPin: 'አዲስ ፒን ያዘጋጁ',
    confirmPin: 'ፒን ያረጋግጡ',
    pinMismatch: 'ፒኖች አይዛመዱም',
    incorrectPin: 'የተሳሳተ ፒን',
    pinSet: 'ፒን ተቀናብሯል!',
    logout: 'ውጣ',
    
    // Tabs
    tabProducts: '📋 እቃዎች',
    tabScan: '📷 ቅኝት',
    tabSell: '💰 ሽያጭ',
    tabSummary: '📊 ማጠቃለያ',
    tabReports: '📱 ሪፖርት',
    changePin: '🔑 ፒን ቀይር',
    enterOldPin: 'የድሮ ፒን ያስገቡ',
    enterNewPin: 'አዲስ ፒን ያስገቡ',
    confirmNewPin: 'አዲሱን ፒን ያረጋግጡ',
    pinChanged: '✅ ፒን በተሳካ ሁኔታ ተቀይሯል!',
    createPinSubtitle: 'ሱቅዎን ለመጠበቅ ባለ 4-አሃዝ ፒን ይፍጠሩ',
    enterOldPinSubtitle: 'አሁን ያለዎትን ፒን ያስገቡ',
    enterNewPinSubtitle: 'አዲስ ባለ 4-አሃዝ ፒን ይምረጡ',
    confirmNewPinSubtitle: 'አዲሱን ፒን እንደገና ያስገቡ',
    welcomeBack: 'እንኳን ደህና መጡ! ለመቀጠል ፒንዎን ያስገቡ',
    
    // Products
    addProductBtn: '➕ አዲስ እቃ ጨምር',
    addFormTitle: 'እቃ ጨምር',
    saveProductBtn: '💾 አስቀምጥ',
    cancelFormBtn: 'ሰርዝ',
    editFormTitle: 'እቃ አርትዕ',
    updateProductBtn: '💾 አዘምን',
    cancelEditBtn: 'ሰርዝ',
    noProducts: 'እስካሁን ምንም እቃ የለም',
    inStock: 'በክምችት',
    deleteConfirm: 'እቃውን መሰረዝ ይፈልጋሉ?',
    enterProductDetails: 'ስም እና ዋጋ ያስገቡ',
    
    // Sales
    priceLabel: 'ዋጋ',
    availableLabel: 'ያለው',
    totalLabel: 'ድምር',
    quantityLabel: 'ብዛት',
    completeSaleBtn: '✅ ሽያጭ አጠናቅቅ',
    saleRecorded: 'ሽያጭ ተመዝግቧል!',
    searchPlaceholder: '🔍 የእቃ ስም ይፈልጉ...',
    recentTitle: '🕒 በቅርብ የተሸጡ',
    notEnoughStock: 'በቂ ክምችት የለም',
    selectProduct: 'እባክዎ እቃ ይምረጡ',
    noRecentSales: 'ምንም የቅርብ ጊዜ ሽያጭ የለም',
    etb: 'ብር',
    cancel: 'ሰርዝ',
    
    // Summary
    summaryTitle: 'ዕለታዊ ማጠቃለያ',
    loadSummary: 'ማጠቃለያ ጫን',
    totalRevenue: 'ጠቅላላ ገቢ',
    totalProfit: 'ጠቅላላ ትርፍ',
    transactions: 'ግብይቶች',
    
    // Reports
    todaySummary: '📊 የዛሬ ማጠቃለያ',
    revenueLabelShort: 'ገቢ (ብር)',
    profitLabelShort: 'ትርፍ (ብር)',
    transactionsLabelShort: 'ግብይቶች',
    telegramBot: '🤖 ቴሌግራም ቦት',
    notConfigured: 'ያልተዋቀረ',
    configured: '✅ ተዋቅሯል',
    edit: '✏️ አርትዕ',
    sendNow: '📤 አሁን ላክ',
    editSettings: 'ቅንብሮች',
    reportSchedule: '⏰ የሪፖርት መርሐግብር',
    dailyReportTimeLabel: 'ዕለታዊ ሪፖርት ሰዓት',
    autoReportActive: 'አውቶማቲክ ሪፖርት ንቁ ነው',
    autoReportPaused: 'አውቶማቲክ ሪፖርት ቆሟል',
    autoReportDesc: 'በየቀኑ በተመረጠው ሰዓት ይላካል',
    autoReportPausedDesc: 'ማንቂያ ተሰናክሏል',
    saveSchedule: '💾 መርሐግብር አስቀምጥ',
    lowStockAlertTitle: '⚠️ ዝቅተኛ ክምችት ማስጠንቀቂያ',
    alertWhenBelow: 'ከዚህ በታች ከሆነ አስጠንቅቅ',
    units: 'ክፍሎች',
    lowStockItemsCount: 'እቃዎች ዝቅተኛ ክምችት ላይ ናቸው',
    allItemsStocked: '✅ ሁሉም እቃዎች በቂ ክምችት አላቸው',
    saveThreshold: '💾 ገደብ አስቀምጥ',
    backupRestore: '💾 ለባክ ከ መልሶ ማግኛ',
    backupData: '⬇️ ምዝግብ ወርድ',
    restoreData: '⬆️ ምዝግብ ጫን',
    scanOverlayTitle: 'ባርኮድ ስካን',
    scanOverlayText: 'ባርኮዱን ስካን ያድርጉ',
    switchCamera: 'ካሜራ ቀይር',
    cancelScan: 'ስካን ሰርዝ',
    scanTitle: 'ሙቀት ስካን',
    openCamera: '📷 ካሜራ ክፈት',
    orText: 'ወይም',
    manualEntry: 'ራ ማስገባት',
    enterBarcode: 'ባርኮድ ያስገቡ',
    processBarcode: 'ዝግጅት',
    scanCart: 'ስካን ስሌት',
    cartTotal: 'ጠቅላላ',
    checkout: 'መልስ',
    clearCart: 'ስሌት ወስዳ',
    adminDashboard: 'አስተዳዳሪ',
  },
  en: {
    // App
    appTitle: '📦 Buta Shop',
    appSubtitle: 'Offline Inventory Management',
    
    // PIN Lock
    enterPin: 'Enter PIN',
    setupPin: 'Setup New PIN',
    confirmPin: 'Confirm PIN',
    pinMismatch: 'PINs do not match',
    incorrectPin: 'Incorrect PIN',
    pinSet: 'PIN Set!',
    logout: 'Logout',
    
    // Tabs
    tabProducts: '📋 Products',
    tabScan: '📷 Scan',
    tabSell: '💰 Sell',
    tabSummary: '📊 Summary',
    tabReports: '📱 Reports',
    changePin: '🔑 Change PIN',
    enterOldPin: 'Enter Old PIN',
    enterNewPin: 'Enter New PIN',
    confirmNewPin: 'Confirm New PIN',
    pinChanged: '✅ PIN Changed Successfully!',
    createPinSubtitle: 'Create a 4-digit PIN to protect your shop',
    enterOldPinSubtitle: 'Enter your current PIN',
    enterNewPinSubtitle: 'Choose a new 4-digit PIN',
    confirmNewPinSubtitle: 'Enter the new PIN again',
    welcomeBack: 'Welcome Back! Enter your PIN to continue',
    
    // Products
    addProductBtn: '➕ Add Product',
    addFormTitle: 'Add Product',
    saveProductBtn: '💾 Save',
    cancelFormBtn: 'Cancel',
    editFormTitle: 'Edit Product',
    updateProductBtn: '💾 Update',
    cancelEditBtn: 'Cancel',
    noProducts: 'No products yet',
    inStock: 'In Stock',
    deleteConfirm: 'Delete this product?',
    enterProductDetails: 'Enter name and price',
    
    // Sales
    priceLabel: 'Price',
    availableLabel: 'Available',
    totalLabel: 'Total',
    quantityLabel: 'Quantity',
    completeSaleBtn: '✅ Complete Sale',
    saleRecorded: 'Sale Recorded!',
    searchPlaceholder: '🔍 Search products...',
    recentTitle: '🕒 Recently Sold',
    notEnoughStock: 'Not enough stock',
    selectProduct: 'Please select a product',
    noRecentSales: 'No recent sales',
    etb: 'ETB',
    cancel: 'Cancel',
    
    // Summary
    summaryTitle: 'Daily Summary',
    loadSummary: 'Load Summary',
    totalRevenue: 'Total Revenue',
    totalProfit: 'Total Profit',
    transactions: 'Transactions',
    
    // Reports
    todaySummary: '📊 Today Summary',
    revenueLabelShort: 'Revenue (ETB)',
    profitLabelShort: 'Profit (ETB)',
    transactionsLabelShort: 'Transactions',
    telegramBot: '🤖 Telegram Bot',
    notConfigured: 'Not Configured',
    configured: '✅ Configured',
    edit: '✏️ Edit',
    sendNow: '📤 Send Now',
    editSettings: 'Edit Settings',
    reportSchedule: '⏰ Report Schedule',
    dailyReportTimeLabel: 'Daily Report Time',
    autoReportActive: 'Auto Report Active',
    autoReportPaused: 'Auto Report Paused',
    autoReportDesc: 'Sent daily at selected time',
    autoReportPausedDesc: 'Alerts disabled',
    saveSchedule: '💾 Save Schedule',
    lowStockAlertTitle: '⚠️ Low Stock Alert',
    alertWhenBelow: 'Alert when below',
    units: 'Units',
    lowStockItemsCount: 'items low on stock',
    allItemsStocked: '✅ All items well stocked',
    saveThreshold: '💾 Save Threshold',
    backupRestore: '💾 Backup & Restore',
    backupData: '⬇️ Download Backup',
    restoreData: '⬆️ Upload Backup',
    scanOverlayTitle: 'Scan Barcode',
    scanOverlayText: 'Point camera at barcode',
    switchCamera: 'Switch Camera',
    cancelScan: 'Cancel Scan',
    scanTitle: 'Scan Products',
    openCamera: '📷 Open Camera',
    orText: 'OR',
    manualEntry: 'Manual Entry',
    enterBarcode: 'Enter Barcode',
    processBarcode: 'Process',
    scanCart: 'Scan Cart',
    cartTotal: 'Total',
    checkout: 'Checkout',
    clearCart: 'Clear Cart',
    adminDashboard: 'Admin',
  },
};

export const useTranslations = () => {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('lang') || 'am';
  });

  const translate = useCallback((key) => {
    return texts[currentLang]?.[key] || texts['en']?.[key] || key;
  }, [currentLang]);

  const setLanguage = useCallback((lang) => {
    setCurrentLang(lang);
    localStorage.setItem('lang', lang);
  }, []);

  return {
    translate,
    currentLang,
    setLanguage,
  };
};
