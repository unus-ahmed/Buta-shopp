import { useState, useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { useSales } from '../../hooks/useSales';
import { useDatabase } from '../../hooks/useDatabase';

export const Reports = () => {
  const { translate } = useTranslations();
  const { getSalesToday, getTotalRevenue, getTotalProfit } = useSales();
  const { getSetting, saveSetting, exportData, importData } = useDatabase();
  const [todayStats, setTodayStats] = useState(null);
  const [reportTime, setReportTime] = useState('20:00');
  const [autoReportEnabled, setAutoReportEnabled] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [showBotSettings, setShowBotSettings] = useState(false);
  const [botSettings, setBotSettings] = useState({
    shopName: 'ቡታጅራ ሱቅ',
    botToken: '',
    chatId: '',
  });

  useEffect(() => {
    loadTodayStats();
    loadSettings();
  }, []);

  const loadTodayStats = () => {
    const salesToday = getSalesToday();
    const revenue = getTotalRevenue(salesToday);
    const profit = getTotalProfit(salesToday);

    setTodayStats({
      revenue: revenue.toFixed(2),
      profit: profit.toFixed(2),
      transactions: salesToday.length,
    });
  };

  const loadSettings = async () => {
    try {
      const timeSettings = await getSetting('report_time');
      if (timeSettings?.value?.time) {
        setReportTime(timeSettings.value.time);
      }

      const autoReport = await getSetting('auto_report');
      if (autoReport?.value !== undefined) {
        setAutoReportEnabled(autoReport.value);
      }

      const threshold = await getSetting('low_stock_threshold');
      if (threshold?.value?.threshold) {
        setLowStockThreshold(threshold.value.threshold);
      }

      const botSettings = await getSetting('telegram_settings');
      if (botSettings?.value) {
        setBotSettings(botSettings.value);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSchedule = async () => {
    await saveSetting('report_time', { time: reportTime });
    alert('Schedule saved!');
  };

  const handleToggleAutoReport = async () => {
    const newValue = !autoReportEnabled;
    setAutoReportEnabled(newValue);
    await saveSetting('auto_report', newValue);
  };

  const handleSaveBotSettings = async () => {
    await saveSetting('telegram_settings', botSettings);
    alert('Bot settings saved!');
    setShowBotSettings(false);
  };

  const handleThresholdChange = async (delta) => {
    const newThreshold = Math.max(1, lowStockThreshold + delta);
    setLowStockThreshold(newThreshold);
  };

  const handleSaveThreshold = async () => {
    await saveSetting('low_stock_threshold', { threshold: lowStockThreshold });
    alert('Threshold saved!');
  };

  const handleBackupData = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('Backup downloaded!');
    } catch (error) {
      alert('Error backing up data');
      console.error(error);
    }
  };

  if (!todayStats) {
    return <div>{translate('loadingSummary') || 'Loading...'}</div>;
  }

  return (
    <div>
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: '16px' }}>{translate('todaySummary')}</h3>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '20px', fontSize: '11px' }}>
            {new Date().toLocaleDateString()}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '12px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '3px' }}>💰</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', wordBreak: 'break-word' }}>
              {todayStats.revenue}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.9 }}>{translate('revenueLabelShort')}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '12px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '3px' }}>📈</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', wordBreak: 'break-word' }}>
              {todayStats.profit}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.9 }}>{translate('profitLabelShort')}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '12px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '3px' }}>🧾</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', wordBreak: 'break-word' }}>
              {todayStats.transactions}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.9 }}>{translate('transactionsLabelShort')}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {translate('reportSchedule')}
        </h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
            {translate('dailyReportTimeLabel')}:
          </label>
          <input
            type="time"
            value={reportTime}
            onChange={(e) => setReportTime(e.target.value)}
          />
        </div>

        <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '15px', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {autoReportEnabled ? translate('autoReportActive') : translate('autoReportPaused')}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {autoReportEnabled ? translate('autoReportDesc') : translate('autoReportPausedDesc')}
                </div>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={autoReportEnabled}
                onChange={handleToggleAutoReport}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <button className="btn btn-green" onClick={handleSaveSchedule}>
          {translate('saveSchedule')}
        </button>
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 15px 0' }}>{translate('lowStockAlertTitle')}</h3>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
            {translate('alertWhenBelow')}:
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              className="stock-btn"
              onClick={() => handleThresholdChange(-1)}
              style={{ width: '50px', height: '50px' }}
            >
              −
            </button>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e3a8a' }}>
                {lowStockThreshold}
              </span>
              <span style={{ fontSize: '14px', color: '#6b7280', display: 'block' }}>
                {translate('units')}
              </span>
            </div>
            <button
              className="stock-btn"
              onClick={() => handleThresholdChange(1)}
              style={{ width: '50px', height: '50px' }}
            >
              +
            </button>
          </div>
        </div>

        <button className="btn" onClick={handleSaveThreshold} style={{ background: '#ea580c' }}>
          {translate('saveThreshold')}
        </button>
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 15px 0' }}>{translate('backupRestore')}</h3>

        <div style={{ marginBottom: '15px' }}>
          <button className="btn btn-green" onClick={handleBackupData} style={{ marginBottom: '10px' }}>
            {translate('backupData')}
          </button>
        </div>
      </div>
    </div>
  );
};
