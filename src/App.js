/* eslint-disable no-restricted-globals, no-unused-vars */
import React, { useState, useEffect } from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: '', original_price: '', discount_price: '', category_id: '', description: '', colors: '', sizes: ''
  });
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  
  // Size stock state
  const [sizeStock, setSizeStock] = useState({});
  const [sizeStockList, setSizeStockList] = useState([]);
  
  // Image states
  const [mainImage, setMainImage] = useState(null);
  const [subImages, setSubImages] = useState([]);
  const [mainPreview, setMainPreview] = useState(null);
  const [subPreviews, setSubPreviews] = useState([]);

  const API = 'http://127.0.0.1:8000/api';
  const BASE_URL = 'http://127.0.0.1:8000';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, productsRes, categoriesRes, ordersRes] = await Promise.all([
        fetch(`${API}/users/`),
        fetch(`${API}/products/`),
        fetch(`${API}/categories/`),
        fetch(`${API}/orders/`)
      ]);
      
      setUsers(await usersRes.json());
      setProducts(await productsRes.json());
      setCategories(await categoriesRes.json());
      setOrders(await ordersRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    try {
      const res = await fetch(`${API}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.user.role === 'admin') {
        localStorage.setItem('admin', JSON.stringify(data.user));
        setAdmin(data.user);
        setIsLoggedIn(true);
        await fetchData();
      } else {
        alert('Login failed');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    setIsLoggedIn(false);
    setAdmin(null);
  };

  useEffect(() => {
    const saved = localStorage.getItem('admin');
    if (saved) {
      setAdmin(JSON.parse(saved));
      setIsLoggedIn(true);
      fetchData();
    }
  }, []);

  const resetForm = () => {
    setProductForm({
      title: '', original_price: '', discount_price: '', category_id: '', description: '', colors: '', sizes: ''
    });
    setMainImage(null);
    setSubImages([]);
    setMainPreview(null);
    setSubPreviews([]);
    setEditingProduct(null);
    setNewSize('');
    setNewColor('');
    setSizeStock({});
    setSizeStockList([]);
  };

  const handleMainImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setMainPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubImages = (e) => {
    const files = Array.from(e.target.files);
    setSubImages(files);
    
    const previews = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === files.length) {
          setSubPreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSubImage = (indexToRemove) => {
    const newPreviews = subPreviews.filter((_, i) => i !== indexToRemove);
    const newFiles = subImages.filter((_, i) => i !== indexToRemove);
    setSubPreviews(newPreviews);
    setSubImages(newFiles);
  };

  // Add size with stock
  const addSizeWithStock = () => {
    if (newSize.trim()) {
      const size = newSize.trim().toUpperCase();
      const currentSizes = productForm.sizes ? productForm.sizes.split(',') : [];
      if (!currentSizes.includes(size)) {
        currentSizes.push(size);
        setProductForm({ ...productForm, sizes: currentSizes.join(',') });
        
        const newSizeStock = { ...sizeStock, [size]: 0 };
        setSizeStock(newSizeStock);
        setSizeStockList(Object.entries(newSizeStock).map(([s, qty]) => ({ size: s, quantity: qty })));
        setNewSize('');
      }
    }
  };

  // Remove size
  const removeSizeWithStock = (sizeToRemove) => {
    const currentSizes = productForm.sizes.split(',');
    const newSizes = currentSizes.filter(s => s !== sizeToRemove);
    setProductForm({ ...productForm, sizes: newSizes.join(',') });
    
    const newSizeStock = { ...sizeStock };
    delete newSizeStock[sizeToRemove];
    setSizeStock(newSizeStock);
    setSizeStockList(Object.entries(newSizeStock).map(([s, qty]) => ({ size: s, quantity: qty })));
  };

  // Update stock for a size
  const updateSizeStock = (size, quantity) => {
    const newSizeStock = { ...sizeStock, [size]: parseInt(quantity) || 0 };
    setSizeStock(newSizeStock);
    setSizeStockList(Object.entries(newSizeStock).map(([s, qty]) => ({ size: s, quantity: qty })));
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      original_price: product.original_price,
      discount_price: product.discount_price || '',
      category_id: product.category_id,
      description: product.description || '',
      colors: product.colors || '',
      sizes: product.sizes || ''
    });
    setMainPreview(product.main_image ? `${BASE_URL}${product.main_image}` : null);
    
    // Load size stock
    if (product.size_stock) {
      try {
        const stockData = JSON.parse(product.size_stock);
        setSizeStock(stockData);
        setSizeStockList(Object.entries(stockData).map(([s, qty]) => ({ size: s, quantity: qty })));
      } catch {
        setSizeStock({});
        setSizeStockList([]);
      }
    } else {
      setSizeStock({});
      setSizeStockList([]);
    }
    
    // Load existing sub images
    if (product.sub_images && product.sub_images.length > 0) {
      const existingSubPreviews = product.sub_images.map(img => `${BASE_URL}${img}`);
      setSubPreviews(existingSubPreviews);
    } else {
      setSubPreviews([]);
    }
    setSubImages([]);
    
    setShowProductModal(true);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const sizeStockJson = JSON.stringify(sizeStock);
      
      if (editingProduct) {
        const productData = {
          title: productForm.title,
          original_price: parseFloat(productForm.original_price),
          discount_price: productForm.discount_price ? parseFloat(productForm.discount_price) : 0,
          category_id: parseInt(productForm.category_id),
          description: productForm.description,
          stock: 0,
          colors: productForm.colors,
          sizes: productForm.sizes,
          size_stock: sizeStockJson
        };
        
        const updateRes = await fetch(`${API}/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
        
        if (!updateRes.ok) throw new Error('Failed to update product');
        
        if (mainImage) {
          const mainFormData = new FormData();
          mainFormData.append('file', mainImage);
          await fetch(`${API}/products/${editingProduct.id}/main-image`, { method: 'POST', body: mainFormData });
        }
        
        if (subImages && subImages.length > 0) {
          const subFormData = new FormData();
          for (let i = 0; i < subImages.length; i++) {
            subFormData.append('files', subImages[i]);
          }
          await fetch(`${API}/products/${editingProduct.id}/sub-images`, { method: 'POST', body: subFormData });
        }
        
        alert('Product updated successfully!');
        
      } else {
        const productData = {
          title: productForm.title,
          original_price: parseFloat(productForm.original_price),
          discount_price: productForm.discount_price ? parseFloat(productForm.discount_price) : 0,
          category_id: parseInt(productForm.category_id),
          description: productForm.description,
          stock: 0,
          colors: productForm.colors,
          sizes: productForm.sizes,
          size_stock: sizeStockJson
        };
        
        const productRes = await fetch(`${API}/products/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
        
        if (!productRes.ok) {
          const error = await productRes.json();
          throw new Error(JSON.stringify(error));
        }
        
        const productResult = await productRes.json();
        const productId = productResult.id;
        
        if (mainImage) {
          const mainFormData = new FormData();
          mainFormData.append('file', mainImage);
          await fetch(`${API}/products/${productId}/main-image`, { method: 'POST', body: mainFormData });
        }
        
        if (subImages && subImages.length > 0) {
          const subFormData = new FormData();
          for (let i = 0; i < subImages.length; i++) {
            subFormData.append('files', subImages[i]);
          }
          await fetch(`${API}/products/${productId}/sub-images`, { method: 'POST', body: subFormData });
        }
        
        alert('Product created successfully!');
      }
      
      setShowProductModal(false);
      resetForm();
      await fetchData();
      
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${API}/categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryForm.name })
      });
      
      if (res.ok) {
        alert('Category created!');
        setShowCategoryModal(false);
        setCategoryForm({ name: '' });
        await fetchData();
      } else {
        alert('Failed to create category');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Delete this product?')) {
      await fetch(`${API}/products/${id}`, { method: 'DELETE' });
      await fetchData();
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Delete this category?')) {
      await fetch(`${API}/categories/${id}`, { method: 'DELETE' });
      await fetchData();
    }
  };

  const addColor = () => {
    if (newColor.trim()) {
      const current = productForm.colors ? productForm.colors.split(',') : [];
      if (!current.includes(newColor.trim())) {
        current.push(newColor.trim());
        setProductForm({ ...productForm, colors: current.join(',') });
        setNewColor('');
      }
    }
  };

  const removeColor = (color) => {
    const current = productForm.colors.split(',');
    const filtered = current.filter(c => c !== color);
    setProductForm({ ...productForm, colors: filtered.join(',') });
  };

  const getStatusColor = (status) => {
    const colors = { pending: '#eab308', paid: '#3b82f6', shipped: '#8b5cf6', delivered: '#22c55e', cancelled: '#ef4444' };
    return colors[status] || '#6b7280';
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
        <div style={{ background: 'white', padding: 40, borderRadius: 8, width: 400 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 30 }}>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 15 }}>
              <input type="email" name="email" defaultValue="admin@dynastore.com" placeholder="Email" style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 4 }} required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <input type="password" name="password" defaultValue="admin123" placeholder="Password" style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 4 }} required />
            </div>
            <button type="submit" style={{ width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#666' }}>admin@dynastore.com / admin123</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: '#1e293b', color: 'white', minHeight: '100vh' }}>
        <div style={{ padding: 20, textAlign: 'center', borderBottom: '1px solid #334155' }}>
          <h2>DYNA STORE</h2>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Admin Panel</p>
        </div>
        <nav>
          {['dashboard', 'products', 'categories', 'orders', 'users'].map(tab => (
            <div key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '12px 20px', cursor: 'pointer', background: activeTab === tab ? '#334155' : 'transparent', borderLeft: activeTab === tab ? '3px solid #3b82f6' : 'none' }}>
              {tab.toUpperCase()}
            </div>
          ))}
        </nav>
        <div style={{ position: 'absolute', bottom: 20, width: 260, padding: '0 20px' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: 10, background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        <header style={{ background: 'white', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>{activeTab.toUpperCase()}</h1>
          {activeTab === 'products' && <button onClick={() => { resetForm(); setShowProductModal(true); }} style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+ Create Product</button>}
          {activeTab === 'categories' && <button onClick={() => setShowCategoryModal(true)} style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+ Create Category</button>}
        </header>

        <div style={{ padding: 24 }}>
          {loading ? <div style={{ textAlign: 'center', padding: 50 }}>Loading...</div> : (
            <>
              {/* Dashboard */}
              {activeTab === 'dashboard' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                  <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3>Products</h3>
                    <p style={{ fontSize: 32, fontWeight: 'bold' }}>{products.length}</p>
                  </div>
                  <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3>Categories</h3>
                    <p style={{ fontSize: 32, fontWeight: 'bold' }}>{categories.length}</p>
                  </div>
                  <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3>Orders</h3>
                    <p style={{ fontSize: 32, fontWeight: 'bold' }}>{orders.length}</p>
                  </div>
                  <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid #3b82f6' }}>
                    <h3>Users</h3>
                    <p style={{ fontSize: 32, fontWeight: 'bold', color: '#3b82f6' }}>{users.length}</p>
                  </div>
                </div>
              )}

              {/* Users */}
              {activeTab === 'users' && (
                <div style={{ background: 'white', borderRadius: 8, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f1f5f9' }}>
                      <tr>
                        <th style={{ padding: 12, textAlign: 'left' }}>ID</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Email</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: 12 }}>{u.id}</td>
                          <td style={{ padding: 12 }}>{u.full_name}</td>
                          <td style={{ padding: 12 }}>{u.email}</td>
                          <td style={{ padding: 12 }}>{u.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Products */}
              {activeTab === 'products' && (
                <div style={{ background: 'white', borderRadius: 8, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f1f5f9' }}>
                      <tr>
                        <th style={{ padding: 12, textAlign: 'left' }}>Image</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Title</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Price</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Stock</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: 12 }}>
                            {p.main_image ? (
                              <img src={`${BASE_URL}${p.main_image}`} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} alt={p.title} />
                            ) : (
                              <div style={{ width: 50, height: 50, background: '#e5e7eb', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>
                            )}
                          </td>
                          <td style={{ padding: 12 }}><strong>{p.title}</strong></td>
                          <td style={{ padding: 12 }}>${p.original_price}</td>
                          <td style={{ padding: 12 }}>
                            {p.size_stock ? (
                              <div style={{ fontSize: 12 }}>
                                {Object.entries(JSON.parse(p.size_stock)).map(([size, qty]) => (
                                  <span key={size} style={{ display: 'inline-block', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, margin: '2px' }}>
                                    {size}: {qty}
                                  </span>
                                ))}
                              </div>
                            ) : '-'}
                          </td>
                          <td style={{ padding: 12 }}>
                            <button onClick={() => handleEditProduct(p)} style={{ background: '#3b82f6', color: 'white', padding: '4px 8px', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 5 }}>Edit</button>
                            <button onClick={() => handleDeleteProduct(p.id)} style={{ background: '#ef4444', color: 'white', padding: '4px 8px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>No products yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Categories */}
              {activeTab === 'categories' && (
                <div style={{ background: 'white', borderRadius: 8, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f1f5f9' }}>
                      <tr>
                        <th style={{ padding: 12, textAlign: 'left' }}>ID</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: 12 }}>{c.id}</td>
                          <td style={{ padding: 12 }}><strong>{c.name}</strong></td>
                          <td style={{ padding: 12 }}>
                            <button onClick={() => handleDeleteCategory(c.id)} style={{ background: '#ef4444', color: 'white', padding: '4px 8px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                      {categories.length === 0 && (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: 40 }}>No categories yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Orders */}
              {activeTab === 'orders' && (
                <div style={{ background: 'white', borderRadius: 8, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f1f5f9' }}>
                      <tr>
                        <th style={{ padding: 12, textAlign: 'left' }}>Order #</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Amount</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: 12 }}>{o.order_number || `ORD-${o.id}`}</td>
                          <td style={{ padding: 12 }}>${o.total_amount || 0}</td>
                          <td style={{ padding: 12 }}>
                            <span style={{ background: getStatusColor(o.status), color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>{o.status || 'pending'}</span>
                          </td>
                          <td style={{ padding: 12 }}>{o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: 40 }}>No orders yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 600, maxHeight: '85vh', overflow: 'auto' }}>
            <h2>{editingProduct ? 'Edit Product' : 'Create Product'}</h2>
            <form onSubmit={handleCreateProduct}>
              <input type="text" placeholder="Title" value={productForm.title} onChange={(e) => setProductForm({...productForm, title: e.target.value})} style={{ width: '100%', padding: 8, margin: '10px 0', border: '1px solid #ddd', borderRadius: 4 }} required />
              
              <div style={{ display: 'flex', gap: 10 }}>
                <input type="number" placeholder="Price" value={productForm.original_price} onChange={(e) => setProductForm({...productForm, original_price: e.target.value})} style={{ flex: 1, padding: 8, margin: '10px 0', border: '1px solid #ddd', borderRadius: 4 }} required />
                <input type="number" placeholder="Discount" value={productForm.discount_price} onChange={(e) => setProductForm({...productForm, discount_price: e.target.value})} style={{ flex: 1, padding: 8, margin: '10px 0', border: '1px solid #ddd', borderRadius: 4 }} />
              </div>
              
              <select value={productForm.category_id} onChange={(e) => setProductForm({...productForm, category_id: e.target.value})} style={{ width: '100%', padding: 8, margin: '10px 0', border: '1px solid #ddd', borderRadius: 4 }} required>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              
              <textarea placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} rows="3" style={{ width: '100%', padding: 8, margin: '10px 0', border: '1px solid #ddd', borderRadius: 4 }}></textarea>
              
              {/* Sizes with Stock */}
              <div style={{ marginTop: 10 }}>
                <label><strong>Sizes with Stock</strong></label>
                
                <div style={{ display: 'flex', gap: 5, marginTop: 5, marginBottom: 10 }}>
                  <input 
                    type="text" 
                    value={newSize} 
                    onChange={(e) => setNewSize(e.target.value)} 
                    placeholder="Add size (S, M, L, XL)" 
                    style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 4 }} 
                  />
                  <button 
                    type="button" 
                    onClick={addSizeWithStock} 
                    style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Add Size
                  </button>
                </div>
                
                {sizeStockList.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ padding: 8, textAlign: 'left' }}>Size</th>
                        <th style={{ padding: 8, textAlign: 'left' }}>Stock Quantity</th>
                        <th style={{ padding: 8, textAlign: 'left' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeStockList.map((item) => (
                        <tr key={item.size} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: 8 }}><strong>{item.size}</strong></td>
                          <td style={{ padding: 8 }}>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateSizeStock(item.size, e.target.value)}
                              style={{ width: 80, padding: 5, border: '1px solid #ddd', borderRadius: 4 }}
                              min="0"
                            />
                          </td>
                          <td style={{ padding: 8 }}>
                            <button
                              type="button"
                              onClick={() => removeSizeWithStock(item.size)}
                              style={{ background: '#ef4444', color: 'white', padding: '4px 8px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              {/* Colors */}
              <div style={{ marginTop: 15 }}>
                <label><strong>Colors</strong></label>
                <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
                  <input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Add color (Red, Blue, Black)" style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 4 }} />
                  <button type="button" onClick={addColor} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {productForm.colors && productForm.colors.split(',').map(c => (
                    <span key={c} style={{ background: '#e5e7eb', padding: '4px 10px', borderRadius: 20, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, background: c.toLowerCase(), borderRadius: '50%' }}></span>
                      {c} <button type="button" onClick={() => removeColor(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Images */}
              <div style={{ marginTop: 15 }}>
                <label><strong>Main Image</strong></label>
                <input type="file" accept="image/*" onChange={handleMainImage} style={{ width: '100%', padding: 8, margin: '5px 0', border: '1px solid #ddd', borderRadius: 4 }} />
                {mainPreview && (
                  <div style={{ marginTop: 10 }}>
                    <img src={mainPreview} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }} alt="Main preview" />
                  </div>
                )}
              </div>

              <div style={{ marginTop: 15 }}>
                <label><strong>Additional Images</strong></label>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleSubImages} 
                  style={{ width: '100%', padding: 8, margin: '5px 0', border: '1px solid #ddd', borderRadius: 4 }} 
                />
                <p style={{ fontSize: 12, color: '#666', marginTop: 5 }}>Hold Ctrl (or Cmd) to select multiple images</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {subPreviews && subPreviews.length > 0 ? (
                    subPreviews.map((preview, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <img 
                          src={preview} 
                          alt={`sub ${idx + 1}`} 
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }} 
                        />
                        <button
                          type="button"
                          onClick={() => removeSubImage(idx)}
                          style={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#999', fontSize: 12, padding: '10px 0' }}>No additional images selected</div>
                  )}
                </div>
              </div>
              
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{loading ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}</button>
                <button type="button" onClick={() => { setShowProductModal(false); resetForm(); }} style={{ flex: 1, padding: 10, background: '#ccc', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h2>Create Category</h2>
            <form onSubmit={handleCreateCategory}>
              <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={(e) => setCategoryForm({name: e.target.value})} style={{ width: '100%', padding: 8, margin: '10px 0', border: '1px solid #ddd', borderRadius: 4 }} required />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Create</button>
                <button type="button" onClick={() => setShowCategoryModal(false)} style={{ flex: 1, padding: 10, background: '#ccc', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;