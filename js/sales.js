// ============================================
// SALES MODULE
// ============================================

const Sales = (function() {
  const db = Database;
  const translate = Translations.translate;
  
  let currentProduct = null;
  let recentSales = [];
  
  // Get products safely
  function getProducts() {
    if (typeof Products !== 'undefined' && Products.getProducts) {
      return Products.getProducts();
    }
    console.warn('Products module not available');
    return [];
  }
  
  function searchProducts(query) {
    const products = getProducts();
    const term = (query || '').toLowerCase().trim();
    const available = products.filter(p => p.stock > 0);
    
    if (term === '') {
      return available.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return available.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.barcode && p.barcode.includes(term))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }
  
  function displaySearchResults(results) {
    const container = document.getElementById('product-search-results');
    if (!container) {
      console.warn('Search results container not found');
      return;
    }
    
    if (!results || results.length === 0) {
      container.innerHTML = `<p style="text-align: center; padding: 20px; color: #6b7280;">${translate('noProductsFound') || 'No products found'}</p>`;
      return;
    }
    
    container.innerHTML = results.map(p => `
      <button onclick="Sales.selectProduct('${p._id}')" class="product-search-item">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: bold; font-size: 16px;">${p.name}</div>
            <div style="color: #6b7280; font-size: 14px;">
              ${p.barcode ? '📷 ' + p.barcode + ' · ' : ''}
              📦 ${p.stock} ${translate('inStock') || 'in stock'}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: bold; color: #1e3a8a;">${p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style="color: #6b7280; font-size: 12px;">${translate('etb') || 'ETB'}</div>
          </div>
        </div>
      </button>
    `).join('');
  }
  
  function selectProduct(productId) {
    const products = getProducts();
    currentProduct = products.find(p => p._id === productId);
    
    if (!currentProduct) {
      console.error('Product not found:', productId);
      return;
    }
    
    const nameEl = document.getElementById('selected-product-name');
    const priceEl = document.getElementById('sell-price');
    const stockEl = document.getElementById('sell-stock');
    const qtyInput = document.getElementById('sell-qty');
    const detailsCard = document.getElementById('sell-details');
    const resultsDiv = document.getElementById('product-search-results');
    
    if (nameEl) nameEl.textContent = currentProduct.name;
    if (priceEl) priceEl.textContent = currentProduct.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (stockEl) stockEl.textContent = currentProduct.stock;
    if (qtyInput) {
      qtyInput.max = currentProduct.stock;
      qtyInput.value = 1;
    }
    if (detailsCard) detailsCard.classList.remove('hidden');
    if (resultsDiv) resultsDiv.classList.add('hidden');
    
    updateSellTotal();
  }
  
  function setQuantity(qty) {
    if (!currentProduct) return;
    const input = document.getElementById('sell-qty');
    if (input) {
      input.value = Math.min(currentProduct.stock, qty);
      updateSellTotal();
    }
  }
  
  function changeQty(delta) {
    if (!currentProduct) return;
    const input = document.getElementById('sell-qty');
    if (input) {
      const currentVal = parseInt(input.value) || 1;
      input.value = Math.min(currentProduct.stock, Math.max(1, currentVal + delta));
      updateSellTotal();
    }
  }
  
  function updateSellTotal() {
    if (!currentProduct) return;
    const qtyInput = document.getElementById('sell-qty');
    const totalEl = document.getElementById('sell-total');
    
    if (qtyInput && totalEl) {
      const qty = parseInt(qtyInput.value) || 1;
      totalEl.textContent = (currentProduct.price * qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }
  
  function cancelSale() {
    currentProduct = null;
    
    const detailsCard = document.getElementById('sell-details');
    const resultsDiv = document.getElementById('product-search-results');
    const searchInput = document.getElementById('product-search');
    
    if (detailsCard) detailsCard.classList.add('hidden');
    if (resultsDiv) resultsDiv.classList.remove('hidden');
    if (searchInput) searchInput.value = '';
    
    const results = searchProducts('');
    displaySearchResults(results);
  }
  
  async function recordSale() {
    if (!currentProduct) {
      alert(translate('selectProduct') || 'Select a product first');
      return;
    }
    
    const qtyInput = document.getElementById('sell-qty');
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
    
    if (quantity < 1 || quantity > currentProduct.stock) {
      alert(translate('notEnoughStock') || 'Not enough stock');
      return;
    }
    
    try {
      const product = await db.productDB.get(currentProduct._id);
      
      await db.salesDB.put({
        _id: 'sale_' + Date.now() + '_' + Math.random().toString(36),
        productId: product._id,
        productName: product.name,
        quantity: quantity,
        unitPrice: product.price,
        unitCost: product.costPrice || 0,
        totalAmount: product.price * quantity,
        timestamp: new Date().toISOString()
      });
      
      product.stock -= quantity;
      await db.productDB.put(product);
      
      if (typeof Products !== 'undefined' && Products.loadProducts) {
        await Products.loadProducts();
      }
      
      const existingIndex = recentSales.findIndex(p => p._id === product._id);
      if (existingIndex >= 0) {
        recentSales.splice(existingIndex, 1);
      }
      recentSales.unshift(product);
      if (recentSales.length > 8) recentSales.pop();
      
      cancelSale();
      displayRecentItems();
      
      alert((translate('saleRecorded') || 'Sale recorded!') + ' - ' + product.name + ' x' + quantity);
      
    } catch (error) {
      console.error('Sale error:', error);
      alert('Error recording sale: ' + error.message);
    }
  }
  
  function displayRecentItems() {
    const container = document.getElementById('recent-items-list');
    if (!container) return;
    
    if (recentSales.length === 0) {
      container.innerHTML = '<p style="color: #6b7280; font-size: 14px; padding: 10px;">' + 
        (translate('noRecentSales') || 'No recent sales') + '</p>';
      return;
    }
    
    const availableRecent = recentSales.filter(p => p.stock > 0);
    
    if (availableRecent.length === 0) {
      container.innerHTML = '<p style="color: #6b7280; font-size: 14px; padding: 10px;">' + 
        (translate('noRecentSales') || 'No recent sales') + '</p>';
      return;
    }
    
    container.innerHTML = availableRecent.slice(0, 6).map(p => `
      <button onclick="Sales.selectProduct('${p._id}')" 
        style="padding: 10px 15px; border: 1px solid #d1d5db; border-radius: 8px; background: white; cursor: pointer; font-size: 14px;">
        ${p.name}<br>
        <span style="color: #1e3a8a; font-weight: bold;">${p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${translate('etb') || 'ETB'}</span>
      </button>
    `).join('');
  }
  
  async function loadRecentSales() {
    try {
      const result = await db.salesDB.allDocs({ include_docs: true });
      const sales = result.rows
        .map(r => r.doc)
        .filter(d => d.timestamp)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      const products = getProducts();
      const recentIds = [...new Set(sales.map(s => s.productId))].slice(0, 8);
      recentSales = recentIds
        .map(id => products.find(p => p._id === id))
        .filter(p => p && p.stock > 0);
      
      displayRecentItems();
    } catch (e) {
      console.error('Error loading recent sales:', e);
      recentSales = [];
    }
  }
  
  async function initSellTab() {
    if (typeof Products !== 'undefined' && Products.loadProducts) {
      const prods = getProducts();
      if (prods.length === 0) {
        await Products.loadProducts();
      }
    }
    
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    
    const results = searchProducts('');
    displaySearchResults(results);
    await loadRecentSales();
  }
  
  return {
    searchProducts,
    displaySearchResults,
    selectProduct,
    setQuantity,
    changeQty,
    updateSellTotal,
    cancelSale,
    recordSale,
    loadRecentSales,
    displayRecentItems,
    initSellTab,
    getRecentSales: () => recentSales
  };
})();

window.Sales = Sales;