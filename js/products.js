// ============================================
// PRODUCTS MODULE
// ============================================

const Products = (function() {
  const db = Database;
  const translate = Translations.translate;
  
  let products = [];
  
  async function loadProducts() {
    try {
      const result = await db.productDB.allDocs({ include_docs: true });
      products = result.rows.map(row => row.doc).filter(doc => !doc._id.startsWith('_'));
      products.sort((a, b) => a.name.localeCompare(b.name));
      db.setProducts(products);
      displayProducts();
    } catch (error) {
      products = [];
    }
  }
  
  function displayProducts() {
    displayFilteredProducts(products);
  }
  
  // Display filtered products
  function displayFilteredProducts(filteredProducts) {
    const container = document.getElementById('products-list');
    if (!container) return;
    
    if (filteredProducts.length === 0) {
      container.innerHTML = `<p style="text-align: center; padding: 30px;">${translate('noProductsFound') || 'ምንም እቃ አልተገኘም'}</p>`;
      return;
    }
    
    container.innerHTML = filteredProducts.map(product => `
      <div class="card">
        <div style="display: flex; justify-content: space-between;">
          <div>
            <h3 style="font-size: 18px;">${product.name}</h3>
            ${product.barcode ? `<div class="barcode-badge">📷 ${product.barcode}</div>` : ''}
            <div style="color: #4b5563; margin-top: 5px;">
              💰 ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${translate('etb')}
              ${product.costPrice ? ` · ${translate('costPrice')}: ${product.costPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${translate('etb')}` : ''}
            </div>
          </div>
          <div style="display: flex; gap: 5px;">
            <button onclick="Products.editProduct('${product._id}')" style="background: none; border: none; font-size: 20px;">✏️</button>
            <button onclick="Products.deleteProduct('${product._id}')" style="background: none; border: none; font-size: 20px;">🗑️</button>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
          <span style="font-size: 16px; ${product.stock < 5 ? 'color: #dc2626; font-weight: bold;' : ''}">
            📦 ${product.stock} ${translate('inStock')}
          </span>
          <div style="display: flex; gap: 10px;">
            <button class="stock-btn" onclick="Products.updateStock('${product._id}', -1)" ${product.stock <= 0 ? 'disabled' : ''}>−</button>
            <button class="stock-btn" onclick="Products.updateStock('${product._id}', 1)">+</button>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  // Filter products by search
  function filterProducts() {
    const searchInput = document.getElementById('product-search-input');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const filtered = searchTerm === '' 
      ? products 
      : products.filter(p => p.name.toLowerCase().includes(searchTerm) || (p.barcode && p.barcode.includes(searchTerm)));
    
    displayFilteredProducts(filtered);
    
    const clearBtn = document.getElementById('clear-product-search');
    if (clearBtn) clearBtn.style.display = searchTerm ? 'block' : 'none';
  }
  
  // Clear search
  function clearProductSearch() {
    const searchInput = document.getElementById('product-search-input');
    if (searchInput) {
      searchInput.value = '';
      filterProducts();
    }
  }
  
  // Initialize search
  function initProductSearch() {
    const searchInput = document.getElementById('product-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', filterProducts);
    }
  }
  
  async function saveProduct() {
    const name = document.getElementById('prod-name').value.trim();
    const barcode = document.getElementById('prod-barcode').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value);
    const costPrice = parseFloat(document.getElementById('prod-cost').value) || 0;
    const stock = parseInt(document.getElementById('prod-stock').value) || 0;
    
    if (!name || !price) {
      alert(translate('enterProductDetails'));
      return;
    }
    
    await db.productDB.put({
      _id: 'product_' + Date.now(),
      name, barcode: barcode || null, price, costPrice, stock,
      createdAt: new Date().toISOString()
    });
    
    hideAddForm();
    await loadProducts();
    
    document.getElementById('prod-name').value = '';
    document.getElementById('prod-barcode').value = '';
    document.getElementById('prod-price').value = '';
    document.getElementById('prod-cost').value = '';
    document.getElementById('prod-stock').value = '0';
  }
  
  async function updateStock(productId, change) {
    const product = await db.productDB.get(productId);
    product.stock = Math.max(0, product.stock + change);
    await db.productDB.put(product);
    await loadProducts();
  }
  
  async function deleteProduct(productId) {
    if (!confirm(translate('deleteConfirm'))) return;
    await db.productDB.remove(await db.productDB.get(productId));
    await loadProducts();
  }
  
  function editProduct(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    hideAddForm();
    document.getElementById('edit-prod-id').value = product._id;
    document.getElementById('edit-prod-name').value = product.name || '';
    document.getElementById('edit-prod-barcode').value = product.barcode || '';
    document.getElementById('edit-prod-price').value = product.price || 0;
    document.getElementById('edit-prod-cost').value = product.costPrice || 0;
    document.getElementById('edit-prod-stock').value = product.stock || 0;
    document.getElementById('edit-form').classList.remove('hidden');
  }
  
  async function saveEditedProduct() {
    const productId = document.getElementById('edit-prod-id').value;
    const product = await db.productDB.get(productId);
    
    product.name = document.getElementById('edit-prod-name').value.trim();
    product.barcode = document.getElementById('edit-prod-barcode').value.trim() || null;
    product.price = parseFloat(document.getElementById('edit-prod-price').value) || 0;
    product.costPrice = parseFloat(document.getElementById('edit-prod-cost').value) || 0;
    product.stock = parseInt(document.getElementById('edit-prod-stock').value) || 0;
    product.updatedAt = new Date().toISOString();
    
    await db.productDB.put(product);
    hideEditForm();
    await loadProducts();
  }
  
  function hideAddForm() { document.getElementById('add-form').classList.add('hidden'); }
  function showAddForm() { hideEditForm(); document.getElementById('add-form').classList.remove('hidden'); }
  function hideEditForm() { document.getElementById('edit-form').classList.add('hidden'); }
  
  return {
    loadProducts,
    displayProducts,
    saveProduct,
    updateStock,
    deleteProduct,
    editProduct,
    saveEditedProduct,
    hideAddForm,
    showAddForm,
    hideEditForm,
    getProducts: () => products,
    filterProducts,
    clearProductSearch,
    initProductSearch
  };
})();

window.Products = Products;
window.clearProductSearch = Products.clearProductSearch;