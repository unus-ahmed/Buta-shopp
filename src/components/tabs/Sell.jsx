import { useState, useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { useDatabase } from '../../hooks/useDatabase';
import { useSales } from '../../hooks/useSales';

export const Sell = () => {
  const { translate } = useTranslations();
  const { getProducts } = useDatabase();
  const {
    selectedProduct,
    setSelectedProduct,
    quantity,
    setQuantity,
    changeQuantity,
    setQty,
    recordNewSale,
    recentSales,
  } = useSales();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const loaded = await getProducts();
    setProducts(loaded);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.barcode.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleCompleteSale = async () => {
    if (!selectedProduct) {
      alert(translate('selectProduct'));
      return;
    }

    if (quantity > selectedProduct.stock) {
      alert(translate('notEnoughStock'));
      return;
    }

    try {
      await recordNewSale(selectedProduct, quantity, selectedProduct.price);
      alert(translate('saleRecorded'));
      setSelectedProduct(null);
      setQuantity(1);
      // Refresh products to update stock
      loadProducts();
    } catch (error) {
      alert('Error recording sale');
      console.error(error);
    }
  };

  const handleCancelSale = () => {
    setSelectedProduct(null);
    setQuantity(1);
  };

  const getRecentProductIds = () => {
    return [...new Set(recentSales.map(s => s.productId))].slice(0, 5);
  };

  const recentProductIds = getRecentProductIds();
  const recentProducts = products.filter(p => recentProductIds.includes(p._id));

  return (
    <div>
      <h2 style={{ marginBottom: '15px' }}>{translate('tabSell')}</h2>

      <input
        type="text"
        placeholder={translate('searchPlaceholder')}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {showSearchResults && (
        <div id="product-search-results" style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '10px' }}>
          {searchResults.length > 0 ? (
            searchResults.map(product => (
              <button
                key={product._id}
                className="product-search-item"
                onClick={() => selectProduct(product)}
              >
                <strong>{product.name}</strong>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>
                  {translate('priceLabel')}: {product.price.toFixed(2)} {translate('etb')} | {translate('availableLabel')}: {product.stock}
                </div>
              </button>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
              {translate('noProducts')}
            </div>
          )}
        </div>
      )}

      {selectedProduct && (
        <div className="card" id="sell-details" style={{ marginTop: '15px' }}>
          <h3 id="selected-product-name" style={{ marginBottom: '15px' }}>
            {selectedProduct.name}
          </h3>
          <div style={{ margin: '15px 0' }}>
            <strong>{translate('priceLabel')}:</strong> <span id="sell-price">{selectedProduct.price.toFixed(2)}</span> {translate('etb')}
            <br />
            <strong>{translate('availableLabel')}:</strong> <span id="sell-stock">{selectedProduct.stock}</span>
          </div>

          <div className="flex" style={{ justifyContent: 'center', marginBottom: '15px' }}>
            <button className="stock-btn" onClick={() => changeQuantity(-1)}>
              −
            </button>
            <input
              type="number"
              id="sell-qty"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              min="1"
              style={{ width: '100px', textAlign: 'center', fontSize: '20px' }}
            />
            <button className="stock-btn" onClick={() => changeQuantity(1)}>
              +
            </button>
          </div>

          <div style={{ display: 'flex', gap: '5px', margin: '15px 0', justifyContent: 'center' }}>
            {[1, 2, 5, 10].map(num => (
              <button
                key={num}
                onClick={() => setQty(num)}
                style={{ padding: '10px 15px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              >
                {num}
              </button>
            ))}
          </div>

          <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <strong>{translate('totalLabel')}:</strong>{' '}
            <span id="sell-total" style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {(selectedProduct.price * quantity).toFixed(2)}
            </span>{' '}
            {translate('etb')}
          </div>

          <div className="flex" style={{ marginTop: '15px' }}>
            <button className="btn btn-green" onClick={handleCompleteSale} style={{ flex: 2 }}>
              {translate('completeSaleBtn')}
            </button>
            <button className="btn btn-gray" onClick={handleCancelSale} style={{ flex: 1 }}>
              {translate('cancel')}
            </button>
          </div>
        </div>
      )}

      {recentProducts.length > 0 && (
        <div id="recent-items" style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '10px' }}>{translate('recentTitle')}</h4>
          <div id="recent-items-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {recentProducts.map(product => (
              <button
                key={product._id}
                className="product-search-item"
                onClick={() => selectProduct(product)}
                style={{ flex: '0 0 calc(50% - 4px)' }}
              >
                {product.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
