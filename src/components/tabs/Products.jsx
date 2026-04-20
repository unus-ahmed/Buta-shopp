import { useState, useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { useDatabase } from '../../hooks/useDatabase';

export const Products = () => {
  const { translate, currentLang } = useTranslations();
  const { getProducts, saveProduct, deleteProduct } = useDatabase();
  const [products, setProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: '',
    cost: '',
    stock: '0',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const loaded = await getProducts();
    setProducts(loaded);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddProduct = async () => {
    if (!formData.name || !formData.price) {
      alert(translate('enterProductDetails'));
      return;
    }

    try {
      await saveProduct({
        name: formData.name,
        barcode: formData.barcode,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost) || 0,
        stock: parseInt(formData.stock) || 0,
      });
      
      setFormData({ name: '', barcode: '', price: '', cost: '', stock: '0' });
      setShowAddForm(false);
      loadProducts();
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode,
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
    });
    setShowEditForm(true);
  };

  const handleUpdateProduct = async () => {
    if (!formData.name || !formData.price) {
      alert(translate('enterProductDetails'));
      return;
    }

    try {
      await saveProduct({
        ...editingProduct,
        name: formData.name,
        barcode: formData.barcode,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost) || 0,
        stock: parseInt(formData.stock) || 0,
      });
      
      setShowEditForm(false);
      setEditingProduct(null);
      setFormData({ name: '', barcode: '', price: '', cost: '', stock: '0' });
      loadProducts();
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (confirm(translate('deleteConfirm'))) {
      try {
        await deleteProduct(product._id, product._rev);
        loadProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
      }
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <button className="btn" onClick={() => setShowAddForm(!showAddForm)}>
        {translate('addProductBtn')}
      </button>

      {showAddForm && (
        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>{translate('addFormTitle')}</h3>
          <input
            type="text"
            name="name"
            placeholder={currentLang === 'am' ? 'የእቃው ስም' : 'Product Name'}
            value={formData.name}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="barcode"
            placeholder={currentLang === 'am' ? 'ባርኮድ' : 'Barcode'}
            value={formData.barcode}
            onChange={handleInputChange}
          />
          <div className="flex">
            <input
              type="number"
              name="price"
              placeholder={currentLang === 'am' ? 'የሽያጭ ዋጋ' : 'Selling Price'}
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
            />
            <input
              type="number"
              name="cost"
              placeholder={currentLang === 'am' ? 'የግዢ ዋጋ' : 'Cost Price'}
              value={formData.cost}
              onChange={handleInputChange}
              step="0.01"
            />
          </div>
          <input
            type="number"
            name="stock"
            placeholder={currentLang === 'am' ? 'ክምችት' : 'Stock'}
            value={formData.stock}
            onChange={handleInputChange}
          />
          <div className="flex">
            <button className="btn btn-green" onClick={handleAddProduct}>
              {translate('saveProductBtn')}
            </button>
            <button className="btn btn-gray" onClick={() => setShowAddForm(false)}>
              {translate('cancelFormBtn')}
            </button>
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>{translate('editFormTitle')}</h3>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="barcode"
            value={formData.barcode}
            onChange={handleInputChange}
          />
          <div className="flex">
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
            />
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleInputChange}
              step="0.01"
            />
          </div>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleInputChange}
          />
          <div className="flex">
            <button className="btn btn-green" onClick={handleUpdateProduct}>
              {translate('updateProductBtn')}
            </button>
            <button className="btn btn-gray" onClick={() => {
              setShowEditForm(false);
              setEditingProduct(null);
            }}>
              {translate('cancelEditBtn')}
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '15px', marginTop: '15px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder={currentLang === 'am' ? '🔍 እቃ ፈልግ...' : 'Search products...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '45px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px' }}
          />
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
            🔍
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
          {translate('noProducts')}
        </div>
      ) : (
        <div style={{ marginTop: '15px' }}>
          {filteredProducts.map(product => (
            <div key={product._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{product.name}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {translate('priceLabel')}: {product.price.toFixed(2)} {translate('etb')} | {translate('availableLabel')}: {product.stock}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  className="btn btn-blue"
                  onClick={() => handleEditProduct(product)}
                  style={{ padding: '10px 15px', width: 'auto', minHeight: 'auto', fontSize: '12px', marginBottom: 0, marginTop: 0 }}
                >
                  ✏️
                </button>
                <button
                  className="btn btn-red"
                  onClick={() => handleDeleteProduct(product)}
                  style={{ padding: '10px 15px', width: 'auto', minHeight: 'auto', fontSize: '12px', marginBottom: 0, marginTop: 0 }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
