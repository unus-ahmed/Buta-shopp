import { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Products } from './tabs/Products';
import { Scan } from './tabs/Scan';
import { Sell } from './tabs/Sell';
import { Summary } from './tabs/Summary';
import { Reports } from './tabs/Reports';

export const Dashboard = ({ onLogout }) => {
  const { translate, currentLang, setLanguage } = useTranslations();
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    { id: 'products', label: translate('tabProducts') },
    { id: 'scan', label: translate('tabScan') },
    { id: 'sell', label: translate('tabSell') },
    { id: 'summary', label: translate('tabSummary') },
    { id: 'reports', label: translate('tabReports') },
  ];

  return (
    <div className="container">
      <div className="header">
        <div className="header-left">
          <h1>{translate('appTitle')}</h1>
          <div className="header-subtitle">{translate('appSubtitle')}</div>
        </div>
        <div className="header-right">
          <div className="lang-switch">
            <button
              className={`lang-btn ${currentLang === 'am' ? 'active' : ''}`}
              onClick={() => setLanguage('am')}
            >
              አማ
            </button>
            <button
              className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            🚪 {translate('logout')}
          </button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="content">
        {activeTab === 'products' && <Products />}
        {activeTab === 'scan' && <Scan />}
        {activeTab === 'sell' && <Sell />}
        {activeTab === 'summary' && <Summary />}
        {activeTab === 'reports' && <Reports />}
      </div>
    </div>
  );
};
