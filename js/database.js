// ============================================
// DATABASE MODULE
// ============================================

const Database = (function() {
  const productDB = new PouchDB('products');
  const salesDB = new PouchDB('sales');
  const settingsDB = new PouchDB('settings');
  
  let products = [];
  
  return {
    productDB,
    salesDB,
    settingsDB,
    
    getProducts: () => products,
    setProducts: (newProducts) => { products = newProducts; },
    
    simpleHash: (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString();
    }
  };
})();

window.Database = Database;