// ============================================
// BACKUP MODULE - CSV EXPORT/IMPORT
// ============================================

const Backup = (function() {
  const db = Database;
  const translate = Translations.translate;
  
  // ========== EXPORT PRODUCTS TO CSV ==========
  async function exportProductsToCSV() {
    try {
      const result = await db.productDB.allDocs({ include_docs: true });
      const products = result.rows.map(r => r.doc).filter(d => !d._id.startsWith('_'));
      
      if (products.length === 0) {
        alert(translate('noProducts') || 'No products to export');
        return false;
      }
      
      let csv = 'Name,Barcode,Price,Cost,Stock\n';
      
      products.forEach(p => {
        const name = (p.name || '').replace(/,/g, ' ');
        csv += `${name},${p.barcode || ''},${p.price || 0},${p.costPrice || 0},${p.stock || 0}\n`;
      });
      
      downloadCSV(csv, `products_${getDateString()}.csv`);
      
      const msg = Translations.getCurrentLang() === 'am' ? 
        `✅ ${products.length} እቃዎች ተልከዋል` : 
        `✅ ${products.length} products exported`;
      alert(msg);
      return true;
    } catch (e) {
      alert(translate('exportFailed') || 'Failed to export products');
      return false;
    }
  }
  
  // ========== EXPORT SALES TO CSV ==========
  async function exportSalesToCSV() {
    try {
      const result = await db.salesDB.allDocs({ include_docs: true });
      const sales = result.rows.map(r => r.doc).filter(d => d.timestamp);
      
      if (sales.length === 0) {
        alert(translate('noSales') || 'No sales to export');
        return false;
      }
      
      sales.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      let csv = 'Date,Product,Quantity,Price,Total\n';
      
      sales.forEach(s => {
        const date = formatDateForCSV(s.timestamp);
        const name = (s.productName || '').replace(/,/g, ' ');
        csv += `${date},${name},${s.quantity || 0},${s.unitPrice || 0},${s.totalAmount || 0}\n`;
      });
      
      downloadCSV(csv, `sales_${getDateString()}.csv`);
      
      const msg = Translations.getCurrentLang() === 'am' ? 
        `✅ ${sales.length} ሽያጮች ተልከዋል` : 
        `✅ ${sales.length} sales exported`;
      alert(msg);
      return true;
    } catch (e) {
      alert(translate('exportFailed') || 'Failed to export sales');
      return false;
    }
  }
  
  // ========== EXPORT ALL ==========
  async function exportAllData() {
    const productsOk = await exportProductsToCSV();
    const salesOk = await exportSalesToCSV();
    
    if (productsOk && salesOk) {
      setTimeout(() => {
        const msg = Translations.getCurrentLang() === 'am' ? 
          '✅ ሁሉም ውሂብ ተልኳል!' : 
          '✅ All data exported!';
        alert(msg);
      }, 500);
    }
  }
  
  // ========== IMPORT PRODUCTS FROM CSV ==========
  async function importProductsFromCSV(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n').filter(l => l.trim());
          
          if (lines.length < 2) {
            alert(translate('invalidCSV') || 'Invalid CSV file');
            resolve(false);
            return;
          }
          
          let imported = 0;
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = parseCSVLine(line);
            
            if (values.length >= 5) {
              const product = {
                _id: 'product_import_' + Date.now() + '_' + i,
                name: values[0] || 'Unknown',
                barcode: values[1] || null,
                price: parseFloat(values[2]) || 0,
                costPrice: parseFloat(values[3]) || 0,
                stock: parseInt(values[4]) || 0,
                createdAt: new Date().toISOString()
              };
              
              try {
                await db.productDB.put(product);
                imported++;
              } catch (err) {
                console.warn('Failed to import row:', err);
              }
            }
          }
          
          await Products.loadProducts();
          
          const msg = Translations.getCurrentLang() === 'am' ? 
            `✅ ${imported} እቃዎች ተጭነዋል` : 
            `✅ ${imported} products imported`;
          alert(msg);
          resolve(true);
        } catch (err) {
          alert(translate('importFailed') || 'Failed to import');
          resolve(false);
        }
      };
      
      reader.readAsText(file);
    });
  }
  
  // ========== IMPORT SALES FROM CSV ==========
  async function importSalesFromCSV(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n').filter(l => l.trim());
          
          if (lines.length < 2) {
            alert(translate('invalidCSV') || 'Invalid CSV file');
            resolve(false);
            return;
          }
          
          let imported = 0;
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = parseCSVLine(line);
            
            if (values.length >= 5) {
              const sale = {
                _id: 'sale_import_' + Date.now() + '_' + i,
                timestamp: values[0] || new Date().toISOString(),
                productName: values[1] || 'Unknown',
                quantity: parseInt(values[2]) || 1,
                unitPrice: parseFloat(values[3]) || 0,
                totalAmount: parseFloat(values[4]) || 0
              };
              
              try {
                await db.salesDB.put(sale);
                imported++;
              } catch (err) {
                console.warn('Failed to import sale:', err);
              }
            }
          }
          
          const msg = Translations.getCurrentLang() === 'am' ? 
            `✅ ${imported} ሽያጮች ተጭነዋል` : 
            `✅ ${imported} sales imported`;
          alert(msg);
          resolve(true);
        } catch (err) {
          alert(translate('importFailed') || 'Failed to import');
          resolve(false);
        }
      };
      
      reader.readAsText(file);
    });
  }
  
  // ========== FILE INPUT HELPERS ==========
  function createFileInput(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) callback(file);
      document.body.removeChild(input);
    };
    
    document.body.appendChild(input);
    input.click();
  }
  
  // ========== HELPER FUNCTIONS ==========
  function formatDateForCSV(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  
  function getDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  
  function downloadCSV(csv, filename) {
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i+1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }
  
  // ========== PUBLIC API ==========
  return {
    exportProducts: exportProductsToCSV,
    exportSales: exportSalesToCSV,
    exportAll: exportAllData,
    importProducts: () => createFileInput(importProductsFromCSV),
    importSales: () => createFileInput(importSalesFromCSV)
  };
})();

window.Backup = Backup;