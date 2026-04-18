// ============================================
// SCANNER MODULE
// ============================================

const Scanner = (function() {
  const db = Database;
  const translate = Translations.translate;
  
  let html5QrCode = null;
  let currentCamera = "environment";
  let scanCart = [];
  
  async function startScanner() {
    try {
      if (!html5QrCode) html5QrCode = new Html5Qrcode("qr-reader");
      document.getElementById('scanner-container').classList.remove('hidden');
      
      await html5QrCode.start(
        { facingMode: currentCamera },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => { stopScanner(); processBarcode(text); },
        () => {}
      );
    } catch (error) {
      alert(translate('cameraError') || 'Cannot access camera');
      stopScanner();
    }
  }
  
  function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop().then(() => {
        document.getElementById('scanner-container').classList.add('hidden');
      }).catch(() => {
        document.getElementById('scanner-container').classList.add('hidden');
      });
    } else {
      document.getElementById('scanner-container').classList.add('hidden');
    }
  }
  
  async function switchCamera() {
    if (html5QrCode && html5QrCode.isScanning) {
      currentCamera = currentCamera === "environment" ? "user" : "environment";
      await html5QrCode.stop();
      await startScanner();
    }
  }
  
  function processManualBarcode() {
    const barcode = document.getElementById('manual-barcode').value.trim();
    if (!barcode) return;
    processBarcode(barcode);
    document.getElementById('manual-barcode').value = '';
  }
  
  function processBarcode(barcode) {
    const products = Products.getProducts();
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      if (product.stock > 0) {
        addToScanCart(product);
      } else {
        alert(translate('outOfStock') || 'Out of stock!');
      }
    } else {
      const name = prompt(translate('enterProductName') || 'New product. Enter name:');
      if (name) {
        const price = prompt(translate('enterProductPrice') || 'Enter price (ETB):');
        if (price) {
          createProductFromBarcode(barcode, name, parseFloat(price));
        }
      }
    }
  }
  
  async function createProductFromBarcode(barcode, name, price) {
    const product = {
      _id: 'product_' + Date.now(),
      name, barcode, price, costPrice: 0, stock: 1,
      createdAt: new Date().toISOString()
    };
    await db.productDB.put(product);
    await Products.loadProducts();
    const products = Products.getProducts();
    addToScanCart(products.find(p => p.barcode === barcode));
  }
  
  function addToScanCart(product) {
    const existing = scanCart.find(item => item.productId === product._id);
    if (existing) {
      if (existing.quantity < product.stock) existing.quantity++;
      else { alert(translate('notEnoughStock')); return; }
    } else {
      scanCart.push({
        productId: product._id, name: product.name,
        price: product.price, costPrice: product.costPrice || 0,
        quantity: 1
      });
    }
    updateScanCartDisplay();
  }
  
  function updateScanCartDisplay() {
    const cartDiv = document.getElementById('scan-cart');
    if (scanCart.length === 0) { cartDiv.classList.add('hidden'); return; }
    cartDiv.classList.remove('hidden');
    
    let total = 0;
    document.getElementById('scan-cart-items').innerHTML = scanCart.map((item, i) => {
      total += item.price * item.quantity;
      return `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <div>
            <strong>${item.name}</strong><br>
            <span>${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} x ${item.quantity}</span>
          </div>
          <div style="display: flex; gap: 5px;">
            <span style="font-weight: bold;">${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <button onclick="Scanner.updateCartItem(${i}, -1)" style="width: 40px; height: 40px;">−</button>
            <button onclick="Scanner.updateCartItem(${i}, 1)" style="width: 40px; height: 40px;">+</button>
            <button onclick="Scanner.removeCartItem(${i})" style="width: 40px; height: 40px; color: #dc2626;">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
    
    document.getElementById('scan-cart-total').textContent = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + (translate('etb') || 'ብር');
  }
  
  function updateCartItem(index, change) {
    const item = scanCart[index];
    const products = Products.getProducts();
    const product = products.find(p => p._id === item.productId);
    const newQty = item.quantity + change;
    if (newQty < 1) scanCart.splice(index, 1);
    else if (newQty <= product.stock) item.quantity = newQty;
    else { alert(translate('notEnoughStock')); return; }
    updateScanCartDisplay();
  }
  
  function removeCartItem(index) { scanCart.splice(index, 1); updateScanCartDisplay(); }
  
  function clearScanCart() {
    if (scanCart.length > 0 && !confirm(translate('clearCartConfirm') || 'Clear cart?')) return;
    scanCart = [];
    updateScanCartDisplay();
  }
  
  async function checkoutScanCart() {
    if (scanCart.length === 0) return;
    
    for (const item of scanCart) {
      const product = await db.productDB.get(item.productId);
      if (product.stock < item.quantity) {
        alert(translate('notEnoughStock') + ': ' + product.name);
        return;
      }
      
      await db.salesDB.put({
        _id: 'sale_' + Date.now() + '_' + Math.random().toString(36),
        productId: product._id, productName: product.name,
        quantity: item.quantity, unitPrice: product.price,
        unitCost: product.costPrice || 0,
        totalAmount: product.price * item.quantity,
        timestamp: new Date().toISOString()
      });
      
      product.stock -= item.quantity;
      await db.productDB.put(product);
    }
    
    scanCart = [];
    updateScanCartDisplay();
    await Products.loadProducts();
    alert(translate('saleCompleted') || 'Sale completed!');
    App.showTab('products');
  }
  
  return {
    startScanner,
    stopScanner,
    switchCamera,
    processManualBarcode,
    updateCartItem,
    removeCartItem,
    clearScanCart,
    checkoutScanCart
  };
})();

window.Scanner = Scanner;