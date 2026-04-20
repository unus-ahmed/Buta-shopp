import { useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { useScanner } from '../../hooks/useScanner';
import { useDatabase } from '../../hooks/useDatabase';

export const Scan = () => {
  const { translate } = useTranslations();
  const { isScanning, scanResult, startScanner, stopScanner, switchCamera, error } = useScanner();
  const { getProducts } = useDatabase();
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanCart, setScanCart] = useState([]);
  const [scannedProducts, setScannedProducts] = useState([]);

  const handleScanResult = async (barcode) => {
    const products = await getProducts();
    const product = products.find(p => p.barcode === barcode);
    
    if (product) {
      const existingItem = scanCart.find(item => item._id === product._id);
      if (existingItem) {
        setScanCart(scanCart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setScanCart([...scanCart, { ...product, quantity: 1 }]);
      }
      setScannedProducts([...scannedProducts, product]);
    } else {
      alert(`${translate('enterProductDetails')} - ${barcode}`);
    }
  };

  const processManualBarcode = () => {
    if (manualBarcode.trim()) {
      handleScanResult(manualBarcode);
      setManualBarcode('');
    }
  };

  const updateQuantity = (productId, qty) => {
    if (qty <= 0) {
      removeScanItem(productId);
    } else {
      setScanCart(scanCart.map(item =>
        item._id === productId ? { ...item, quantity: qty } : item
      ));
    }
  };

  const removeScanItem = (productId) => {
    setScanCart(scanCart.filter(item => item._id !== productId));
  };

  const calculateScanTotal = () => {
    return scanCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleScanCheckout = () => {
    if (scanCart.length === 0) {
      alert(translate('selectProduct'));
      return;
    }
    // Emit event or callback to parent to handle sale recording
    console.log('Checkout:', scanCart);
    alert(`${translate('saleRecorded')}`);
    setScanCart([]);
    setScannedProducts([]);
  };

  const handleClearCart = () => {
    setScanCart([]);
    setScannedProducts([]);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '15px' }}>{translate('scanTitle')}</h2>
      
      {!isScanning ? (
        <button className="btn btn-green" onClick={startScanner} style={{ fontSize: '20px', padding: '20px' }}>
          {translate('openCamera')}
        </button>
      ) : (
        <>
          <div id="qr-reader" style={{ width: '100%', marginBottom: '15px' }}></div>
          <div id="scanner-controls" style={{ padding: '15px', background: 'black', display: 'flex', gap: '10px' }}>
            <button className="btn" onClick={switchCamera} style={{ background: '#4b5563', flex: 1 }}>
              {translate('switchCamera')}
            </button>
            <button className="btn btn-red" onClick={stopScanner} style={{ flex: 1 }}>
              {translate('cancelScan')}
            </button>
          </div>
        </>
      )}

      {error && <div style={{ color: '#dc2626', margin: '10px 0' }}>{error}</div>}

      <div style={{ margin: '20px 0', textAlign: 'center' }}>
        {translate('orText')}
      </div>

      <div className="card">
        <h3>{translate('manualEntry')}</h3>
        <input
          type="text"
          placeholder={translate('enterBarcode')}
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && processManualBarcode()}
        />
        <button className="btn" onClick={processManualBarcode}>
          {translate('processBarcode')}
        </button>
      </div>

      {scanCart.length > 0 && (
        <div className="card">
          <h3>{translate('scanCart')}</h3>
          {scanCart.map(item => (
            <div key={item._id} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{item.name}</div>
              <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '10px' }}>
                <button
                  className="stock-btn"
                  onClick={() => updateQuantity(item._id, item.quantity - 1)}
                  style={{ width: '40px', height: '40px' }}
                >
                  −
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item._id, parseInt(e.target.value))}
                  style={{ width: '60px', textAlign: 'center' }}
                />
                <button
                  className="stock-btn"
                  onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  style={{ width: '40px', height: '40px' }}
                >
                  +
                </button>
                <button
                  className="btn btn-red"
                  onClick={() => removeScanItem(item._id)}
                  style={{ width: 'auto', padding: '5px 10px', minHeight: 'auto' }}
                >
                  🗑️
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {(item.price * item.quantity).toFixed(2)} {translate('etb')}
              </div>
            </div>
          ))}

          <div style={{ borderTop: '2px solid #e5e7eb', marginTop: '15px', paddingTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
              <span>{translate('cartTotal')}</span>
              <span id="scan-cart-total">{calculateScanTotal().toFixed(2)} {translate('etb')}</span>
            </div>
            <button className="btn btn-green" onClick={handleScanCheckout} style={{ marginTop: '10px' }}>
              {translate('checkout')}
            </button>
            <button className="btn btn-gray" onClick={handleClearCart}>
              {translate('clearCart')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
