import { useState, useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { useSales } from '../../hooks/useSales';

export const Summary = () => {
  const { translate } = useTranslations();
  const { getSalesToday, getTotalRevenue, getTotalProfit } = useSales();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summaryData, setSummaryData] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const loadSummary = async () => {
    try {
      const salesToday = getSalesToday();
      const revenue = getTotalRevenue(salesToday);
      const profit = getTotalProfit(salesToday);

      setSummaryData({
        revenue,
        profit,
        transactionCount: salesToday.length,
      });
      setShowResults(true);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '15px' }}>{translate('summaryTitle')}</h2>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />
      <button className="btn" onClick={loadSummary}>
        {translate('loadSummary')}
      </button>

      {showResults && summaryData && (
        <div id="summary-results">
          <div className="summary-card">
            <div>{translate('totalRevenue')}</div>
            <div className="summary-number" id="total-revenue">
              {summaryData.revenue.toFixed(2)}
            </div>
          </div>
          <div className="summary-card" style={{ background: '#f0fdf4' }}>
            <div>{translate('totalProfit')}</div>
            <div className="summary-number" id="total-profit" style={{ color: '#15803d' }}>
              {summaryData.profit.toFixed(2)}
            </div>
          </div>
          <div className="card">
            <strong>{translate('transactions')}:</strong>{' '}
            <span id="transaction-count">{summaryData.transactionCount}</span>
          </div>
        </div>
      )}
    </div>
  );
};
