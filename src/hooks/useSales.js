import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from './useDatabase';

export const useSales = () => {
  const { getSales, recordSale } = useDatabase();
  const [sales, setSales] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = useCallback(async () => {
    try {
      const loadedSales = await getSales();
      setSales(loadedSales);
      
      // Get recent sales from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recent = loadedSales
        .filter(s => new Date(s.timestamp) > oneDayAgo)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
      
      setRecentSales(recent);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  }, [getSales]);

  const recordNewSale = useCallback(async (product, qty, price) => {
    try {
      const sale = await recordSale({
        productId: product._id,
        productName: product.name,
        quantity: qty,
        unitPrice: price,
        totalAmount: qty * price,
        profit: (qty * (price - (product.cost || 0))),
        costPrice: product.cost || 0,
      });
      
      await loadSales();
      return sale;
    } catch (error) {
      console.error('Error recording sale:', error);
      throw error;
    }
  }, [recordSale, loadSales]);

  const calculateTotal = useCallback(() => {
    if (!selectedProduct) return 0;
    return selectedProduct.price * quantity;
  }, [selectedProduct, quantity]);

  const changeQuantity = useCallback((delta) => {
    setQuantity(prev => Math.max(1, prev + delta));
  }, []);

  const setQty = useCallback((qty) => {
    setQuantity(Math.max(1, qty));
  }, []);

  const getSalesToday = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return sales.filter(s => {
      const saleDate = new Date(s.timestamp);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });
  }, [sales]);

  const getTotalRevenue = useCallback((salesToCheck) => {
    return salesToCheck.reduce((sum, sale) => sum + sale.totalAmount, 0);
  }, []);

  const getTotalProfit = useCallback((salesToCheck) => {
    return salesToCheck.reduce((sum, sale) => sum + (sale.profit || 0), 0);
  }, []);

  return {
    sales,
    selectedProduct,
    setSelectedProduct,
    quantity,
    setQuantity,
    recentSales,
    recordNewSale,
    calculateTotal,
    changeQuantity,
    setQty,
    getSalesToday,
    getTotalRevenue,
    getTotalProfit,
    loadSales,
  };
};
