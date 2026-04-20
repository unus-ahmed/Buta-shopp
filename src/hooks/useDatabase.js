import { useRef, useCallback } from 'react';
import PouchDB from 'pouchdb';

const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

export const useDatabase = () => {
  const dbsRef = useRef({
    productDB: new PouchDB('products'),
    salesDB: new PouchDB('sales'),
    settingsDB: new PouchDB('settings'),
  });

  const getProducts = useCallback(async () => {
    try {
      const result = await dbsRef.current.productDB.allDocs({ include_docs: true });
      return result.rows.map(row => row.doc);
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }, []);

  const saveProduct = useCallback(async (product) => {
    try {
      const doc = {
        ...product,
        _id: product._id || `product_${Date.now()}`,
        createdAt: product.createdAt || new Date().toISOString(),
      };
      const result = await dbsRef.current.productDB.put(doc);
      return { ...doc, _rev: result.rev };
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  }, []);

  const deleteProduct = useCallback(async (productId, rev) => {
    try {
      await dbsRef.current.productDB.remove(productId, rev);
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }, []);

  const getSales = useCallback(async () => {
    try {
      const result = await dbsRef.current.salesDB.allDocs({ include_docs: true });
      return result.rows.map(row => row.doc);
    } catch (error) {
      console.error('Error fetching sales:', error);
      return [];
    }
  }, []);

  const recordSale = useCallback(async (sale) => {
    try {
      const doc = {
        ...sale,
        _id: `sale_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      await dbsRef.current.salesDB.put(doc);
      return doc;
    } catch (error) {
      console.error('Error recording sale:', error);
      throw error;
    }
  }, []);

  const getSetting = useCallback(async (key) => {
    try {
      const doc = await dbsRef.current.settingsDB.get(key);
      return doc;
    } catch {
      return null;
    }
  }, []);

  const saveSetting = useCallback(async (key, value) => {
    try {
      let doc;
      try {
        doc = await dbsRef.current.settingsDB.get(key);
      } catch {
        doc = { _id: key };
      }
      doc.value = value;
      doc.updatedAt = new Date().toISOString();
      const result = await dbsRef.current.settingsDB.put(doc);
      return { ...doc, _rev: result.rev };
    } catch (error) {
      console.error('Error saving setting:', error);
      throw error;
    }
  }, []);

  const exportData = useCallback(async () => {
    try {
      const products = await dbsRef.current.productDB.allDocs({ include_docs: true });
      const sales = await dbsRef.current.salesDB.allDocs({ include_docs: true });
      const settings = await dbsRef.current.settingsDB.allDocs({ include_docs: true });
      
      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        products: products.rows.map(r => r.doc),
        sales: sales.rows.map(r => r.doc),
        settings: settings.rows.map(r => r.doc),
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }, []);

  const importData = useCallback(async (data) => {
    try {
      for (const product of data.products) {
        await dbsRef.current.productDB.put(product);
      }
      for (const sale of data.sales) {
        await dbsRef.current.salesDB.put(sale);
      }
      for (const setting of data.settings) {
        await dbsRef.current.settingsDB.put(setting);
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }, []);

  return {
    // Products
    getProducts,
    saveProduct,
    deleteProduct,
    
    // Sales
    getSales,
    recordSale,
    
    // Settings
    getSetting,
    saveSetting,
    
    // Backup/Restore
    exportData,
    importData,
    
    // Utilities
    simpleHash,
  };
};
