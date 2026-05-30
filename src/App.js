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

const API = 'https://backend-ecommerce-6hef.onrender.com/api';
  const BASE_URL = 'https://backend-ecommerce-6hef.onrender.com';

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

  // Function to get product names from order items
  const getOrderProductNames = (order) => {
    if (order.items && order.items.length > 0) {
      return order.items.map(item => item.product_title || item.product_name).join(', ');
    }
    return order.order_number || `ORD-${order.id}`;
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ background: 'white', padding: 40, borderRadius: 12, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <i className="fas fa-store" style={{ fontSize: 48, color: '#3b82f6' }}></i>
            <h2 style={{ marginTop: 10, color: '#1e293b' }}>Admin Login</h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>MENGHOR STORE Management Panel</p>
          </div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 15 }}>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-envelope" style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }}></i>
                <input type="email" name="email" defaultValue="admin@dynastore.com" placeholder="Email" style={{ width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }} required />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-lock" style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }}></i>
                <input type="password" name="password" defaultValue="admin123" placeholder="Password" style={{ width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }} required />
              </div>
            </div>
            <button type="submit" style={{ width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-sign-in-alt"></i> Login</>}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#94a3b8' }}>
            <i className="fas fa-info-circle"></i> admin@dynastore.com / admin123
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Sidebar */}
      <div style={{ width: 280, background: '#0f172a', color: 'white', position: 'fixed', height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '24px 20px', textAlign: 'center', borderBottom: '1px solid #1e293b' }}>
          <i className="fas fa-crown" style={{ fontSize: 32, color: '#fbbf24' }}></i>
          <h2 style={{ margin: '10px 0 5px', fontSize: 20 }}>DYNA STORE</h2>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Administrator Panel</p>
        </div>
        <nav style={{ marginTop: 20 }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
            { id: 'products', label: 'Products', icon: 'fa-box' },
            { id: 'categories', label: 'Categories', icon: 'fa-tags' },
            { id: 'orders', label: 'Orders', icon: 'fa-shopping-cart' },
            { id: 'users', label: 'Users', icon: 'fa-users' }
          ].map(tab => (
            <div 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              style={{ 
                padding: '14px 24px', 
                cursor: 'pointer', 
                background: activeTab === tab.id ? '#1e293b' : 'transparent',
                borderLeft: activeTab === tab.id ? '4px solid #3b82f6' : '4px solid transparent',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <i className={`fas ${tab.icon}`} style={{ width: 20 }}></i>
              <span>{tab.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ position: 'absolute', bottom: 20, width: 280, padding: '0 20px' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: 12, background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 280, flex: 1 }}>
        <header style={{ background: 'white', padding: '16px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, color: '#1e293b' }}>
              <i className={`fas ${activeTab === 'dashboard' ? 'fa-tachometer-alt' : activeTab === 'products' ? 'fa-box' : activeTab === 'categories' ? 'fa-tags' : activeTab === 'orders' ? 'fa-shopping-cart' : 'fa-users'}`} style={{ marginRight: 10, color: '#3b82f6' }}></i>
              {activeTab.toUpperCase()}
            </h1>
          </div>
          <div>
            <i className="fas fa-user-circle" style={{ fontSize: 32, color: '#64748b' }}></i>
          </div>
        </header>

        <div style={{ padding: 32 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: 48, color: '#3b82f6' }}></i>
              <p style={{ marginTop: 16, color: '#64748b' }}>Loading data...</p>
            </div>
          ) : (
            <>
              {/* Dashboard */}
              {activeTab === 'dashboard' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
                    <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #3b82f6' }}>
                      <i className="fas fa-box" style={{ fontSize: 32, color: '#3b82f6' }}></i>
                      <h3 style={{ margin: '10px 0 5px', color: '#64748b', fontSize: 14 }}>Products</h3>
                      <p style={{ fontSize: 36, fontWeight: 'bold', margin: 0, color: '#1e293b' }}>{products.length}</p>
                    </div>
                    <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #10b981' }}>
                      <i className="fas fa-tags" style={{ fontSize: 32, color: '#10b981' }}></i>
                      <h3 style={{ margin: '10px 0 5px', color: '#64748b', fontSize: 14 }}>Categories</h3>
                      <p style={{ fontSize: 36, fontWeight: 'bold', margin: 0, color: '#1e293b' }}>{categories.length}</p>
                    </div>
                    <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #8b5cf6' }}>
                      <i className="fas fa-shopping-cart" style={{ fontSize: 32, color: '#8b5cf6' }}></i>
                      <h3 style={{ margin: '10px 0 5px', color: '#64748b', fontSize: 14 }}>Orders</h3>
                      <p style={{ fontSize: 36, fontWeight: 'bold', margin: 0, color: '#1e293b' }}>{orders.length}</p>
                    </div>
                    <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: '4px solid #f59e0b' }}>
                      <i className="fas fa-users" style={{ fontSize: 32, color: '#f59e0b' }}></i>
                      <h3 style={{ margin: '10px 0 5px', color: '#64748b', fontSize: 14 }}>Users</h3>
                      <p style={{ fontSize: 36, fontWeight: 'bold', margin: 0, color: '#1e293b' }}>{users.length}</p>
                    </div>
                  </div>
                  
                  {/* Recent Orders */}
                  <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 20px 0' }}><i className="fas fa-clock"></i> Recent Orders</h3>
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div>
                          <p style={{ fontWeight: 'bold', margin: 0 }}>
                            {order.status === 'paid' ? getOrderProductNames(order) : (order.order_number || `ORD-${order.id}`)}
                          </p>
                          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                            <i className="fas fa-calendar-alt"></i> {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                          </p>
                        </div>
                        <div>
                          <span style={{ background: getStatusColor(order.status), color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>
                            {order.status || 'pending'}
                          </span>
                          <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 'bold', textAlign: 'right' }}>${order.total_amount || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {activeTab === 'users' && (
                <div style={{ background: 'white', borderRadius: 12, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-hashtag"></i> ID</th>
                        <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-user"></i> Name</th>
                        <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-envelope"></i> Email</th>
                        <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-shield-alt"></i> Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: 16 }}>{u.id}</td>
                          <td style={{ padding: 16 }}><strong>{u.full_name}</strong></td>
                          <td style={{ padding: 16 }}>{u.email}</td>
                          <td style={{ padding: 16 }}>
                            {u.role === 'admin' ? (
                              <span style={{ background: '#3b82f6', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>Admin</span>
                            ) : (
                              <span style={{ background: '#10b981', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>User</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Products */}
              {activeTab === 'products' && (
                <div>
                  <div style={{ marginBottom: 20, textAlign: 'right' }}>
                    <button onClick={() => { resetForm(); setShowProductModal(true); }} style={{ background: '#3b82f6', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-plus"></i> Create Product
                    </button>
                  </div>
                  <div style={{ background: 'white', borderRadius: 12, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-image"></i> Image</th>
                          <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-tag"></i> Title</th>
                          <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-dollar-sign"></i> Price</th>
                          <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-boxes"></i> Stock</th>
                          <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-cog"></i> Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: 12 }}>
                              {p.main_image ? (
                                <img src={`${BASE_URL}${p.main_image}`} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} alt={p.title} />
                              ) : (
                                <div style={{ width: 50, height: 50, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className="fas fa-image" style={{ color: '#94a3b8' }}></i>
                                </div>
                              )}
                            </td>
                            <td style={{ padding: 16 }}><strong>{p.title}</strong></td>
                            <td style={{ padding: 16 }}>${p.original_price}</td>
                            <td style={{ padding: 16 }}>
                              {p.size_stock ? (
                                <div style={{ fontSize: 12 }}>
                                  {Object.entries(JSON.parse(p.size_stock)).map(([size, qty]) => (
                                    <span key={size} style={{ display: 'inline-block', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, margin: '2px' }}>
                                      {size}: {qty}
                                    </span>
                                  ))}
                                </div>
                              ) : '-'}
                            </td>
                            <td style={{ padding: 16 }}>
                              <button onClick={() => handleEditProduct(p)} style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 8 }}>
                                <i className="fas fa-edit"></i> Edit
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id)} style={{ background: '#ef4444', color: 'white', padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {products.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>
                              <i className="fas fa-box-open" style={{ fontSize: 48, color: '#94a3b8' }}></i>
                              <p>No products yet</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Categories */}
              {activeTab === 'categories' && (
                <div>
                  <div style={{ marginBottom: 20, textAlign: 'right' }}>
                    <button onClick={() => setShowCategoryModal(true)} style={{ background: '#3b82f6', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <i className="fas fa-plus"></i> Create Category
                    </button>
                  </div>
                  <div style={{ background: 'white', borderRadius: 12, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-hashtag"></i> ID</th>
                          <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-tag"></i> Name</th>
                          <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-cog"></i> Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: 16 }}>{c.id}</td>
                            <td style={{ padding: 16 }}><strong>{c.name}</strong></td>
                            <td style={{ padding: 16 }}>
                              <button onClick={() => handleDeleteCategory(c.id)} style={{ background: '#ef4444', color: 'white', padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {categories.length === 0 && (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center', padding: 40 }}>
                              <i className="fas fa-folder-open" style={{ fontSize: 48, color: '#94a3b8' }}></i>
                              <p>No categories yet</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Orders - FIXED: Shows product names after payment */}
              {activeTab === 'orders' && (
                <div style={{ background: 'white', borderRadius: 12, overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-receipt"></i> Order / Product</th>
                        <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-dollar-sign"></i> Amount</th>
                        <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-chart-line"></i> Status</th>
                        <th style={{ padding: 16, textAlign: 'left' }}><i className="fas fa-calendar"></i> Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: 16 }}>
                            <strong>
                              {/* Show product names if status is 'paid' or higher, otherwise show order number */}
                              {(o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered') ? (
                                <>
                                  <i className="fas fa-box" style={{ color: '#10b981', marginRight: 8 }}></i>
                                  {getOrderProductNames(o)}
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-receipt" style={{ color: '#f59e0b', marginRight: 8 }}></i>
                                  {o.order_number || `ORD-${o.id}`}
                                </>
                              )}
                            </strong>
                            {o.items && o.items.length > 0 && (o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered') && (
                              <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
                                <i className="fas fa-info-circle"></i> Order #{o.order_number || o.id}
                              </p>
                            )}
                           </td>
                          <td style={{ padding: 16 }}>${o.total_amount || 0}</td>
                          <td style={{ padding: 16 }}>
                            <span style={{ background: getStatusColor(o.status), color: 'white', padding: '6px 14px', borderRadius: 20, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <i className={`fas ${o.status === 'paid' ? 'fa-check-circle' : o.status === 'delivered' ? 'fa-truck' : 'fa-clock'}`}></i>
                              {o.status || 'pending'}
                            </span>
                          </td>
                          <td style={{ padding: 16 }}>
                            <i className="fas fa-calendar-alt" style={{ marginRight: 6, color: '#94a3b8' }}></i>
                            {o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: 40 }}>
                            <i className="fas fa-shopping-cart" style={{ fontSize: 48, color: '#94a3b8' }}></i>
                            <p>No orders yet</p>
                          </td>
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
          <div style={{ background: 'white', padding: 32, borderRadius: 12, width: 650, maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ margin: '0 0 20px 0' }}>
              <i className={`fas ${editingProduct ? 'fa-edit' : 'fa-plus-circle'}`} style={{ marginRight: 10, color: '#3b82f6' }}></i>
              {editingProduct ? 'Edit Product' : 'Create Product'}
            </h2>
            <form onSubmit={handleCreateProduct}>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}><i className="fas fa-heading"></i> Title</label>
                <input type="text" placeholder="Product title" value={productForm.title} onChange={(e) => setProductForm({...productForm, title: e.target.value})} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} required />
              </div>
              
              <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}><i className="fas fa-dollar-sign"></i> Price</label>
                  <input type="number" placeholder="Price" value={productForm.original_price} onChange={(e) => setProductForm({...productForm, original_price: e.target.value})} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}><i className="fas fa-tag"></i> Discount</label>
                  <input type="number" placeholder="Discount price" value={productForm.discount_price} onChange={(e) => setProductForm({...productForm, discount_price: e.target.value})} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} />
                </div>
              </div>
              
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}><i className="fas fa-folder"></i> Category</label>
                <select value={productForm.category_id} onChange={(e) => setProductForm({...productForm, category_id: e.target.value})} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} required>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}><i className="fas fa-align-left"></i> Description</label>
                <textarea placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} rows="3" style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }}></textarea>
              </div>
              
              {/* Sizes with Stock */}
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}><i className="fas fa-ruler-combined"></i> Sizes with Stock</label>
                
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input 
                    type="text" 
                    value={newSize} 
                    onChange={(e) => setNewSize(e.target.value)} 
                    placeholder="Add size (S, M, L, XL)" 
                    style={{ flex: 1, padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} 
                  />
                  <button 
                    type="button" 
                    onClick={addSizeWithStock} 
                    style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                  >
                    <i className="fas fa-plus"></i> Add
                  </button>
                </div>
                
                {sizeStockList.length > 0 && (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: 10, textAlign: 'left' }}>Size</th>
                          <th style={{ padding: 10, textAlign: 'left' }}>Stock</th>
                          <th style={{ padding: 10, textAlign: 'left' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizeStockList.map((item) => (
                          <tr key={item.size} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: 10 }}><strong>{item.size}</strong></td>
                            <td style={{ padding: 10 }}>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateSizeStock(item.size, e.target.value)}
                                style={{ width: 80, padding: 6, border: '1px solid #e2e8f0', borderRadius: 6 }}
                                min="0"
                              />
                            </td>
                            <td style={{ padding: 10 }}>
                              <button
                                type="button"
                                onClick={() => removeSizeWithStock(item.size)}
                                style={{ background: '#ef4444', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              {/* Colors */}
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}><i className="fas fa-palette"></i> Colors</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Add color (Red, Blue, Black)" style={{ flex: 1, padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} />
                  <button type="button" onClick={addColor} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    <i className="fas fa-plus"></i> Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {productForm.colors && productForm.colors.split(',').map(c => (
                    <span key={c} style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: 20, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'inline-block', width: 12, height: 12, background: c.toLowerCase(), borderRadius: '50%' }}></span>
                      {c} 
                      <button type="button" onClick={() => removeColor(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Images */}
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}><i className="fas fa-camera"></i> Main Image</label>
                <input type="file" accept="image/*" onChange={handleMainImage} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }} />
                {mainPreview && (
                  <div style={{ marginTop: 10 }}>
                    <img src={mainPreview} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} alt="Preview" />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}><i className="fas fa-images"></i> Additional Images</label>
                <input type="file" accept="image/*" multiple onChange={handleSubImages} style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }} />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                  {subPreviews && subPreviews.length > 0 ? (
                    subPreviews.map((preview, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <img src={preview} alt={`Sub ${idx + 1}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                        <button type="button" onClick={() => removeSubImage(idx)} style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}>
                          <i className="fas fa-times" style={{ fontSize: 12 }}></i>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#94a3b8', padding: '20px 0', textAlign: 'center' }}>
                      <i className="fas fa-cloud-upload-alt" style={{ fontSize: 32 }}></i>
                      <p style={{ fontSize: 12 }}>No additional images</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : (editingProduct ? <><i className="fas fa-save"></i> Update</> : <><i className="fas fa-plus"></i> Create</>)}
                </button>
                <button type="button" onClick={() => { setShowProductModal(false); resetForm(); }} style={{ flex: 1, padding: 12, background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  <i className="fas fa-times"></i> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 12, width: 450 }}>
            <h2 style={{ margin: '0 0 20px 0' }}>
              <i className="fas fa-folder-plus" style={{ marginRight: 10, color: '#3b82f6' }}></i>
              Create Category
            </h2>
            <form onSubmit={handleCreateCategory}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}><i className="fas fa-tag"></i> Category Name</label>
                <input type="text" placeholder="Enter category name" value={categoryForm.name} onChange={(e) => setCategoryForm({name: e.target.value})} style={{ width: '100%', padding: 12, border: '1px solid #e2e8f0', borderRadius: 8 }} required />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" style={{ flex: 1, padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  <i className="fas fa-check"></i> Create
                </button>
                <button type="button" onClick={() => setShowCategoryModal(false)} style={{ flex: 1, padding: 12, background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  <i className="fas fa-times"></i> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;