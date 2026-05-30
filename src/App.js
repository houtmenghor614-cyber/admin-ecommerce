/* eslint-disable no-restricted-globals, no-unused-vars */
import React, { useState, useEffect } from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
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
  
  const [sizeStock, setSizeStock] = useState({});
  const [sizeStockList, setSizeStockList] = useState([]);
  
  const [mainImage, setMainImage] = useState(null);
  const [subImages, setSubImages] = useState([]);
  const [mainPreview, setMainPreview] = useState(null);
  const [subPreviews, setSubPreviews] = useState([]);

  const API = 'https://backend-ecommerce-6hef.onrender.com/api';
  const BASE_URL = 'https://backend-ecommerce-6hef.onrender.com';

  // Check for mobile screen
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const removeSizeWithStock = (sizeToRemove) => {
    const currentSizes = productForm.sizes.split(',');
    const newSizes = currentSizes.filter(s => s !== sizeToRemove);
    setProductForm({ ...productForm, sizes: newSizes.join(',') });
    
    const newSizeStock = { ...sizeStock };
    delete newSizeStock[sizeToRemove];
    setSizeStock(newSizeStock);
    setSizeStockList(Object.entries(newSizeStock).map(([s, qty]) => ({ size: s, quantity: qty })));
  };

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
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.loginIcon}>
            <i className="fas fa-store"></i>
          </div>
          <h2>Admin Login</h2>
          <p>Enter your credentials to access the dashboard</p>
          <form onSubmit={handleLogin}>
            <input type="email" name="email" placeholder="Email" defaultValue="admin@dynastore.com" style={styles.input} required />
            <input type="password" name="password" placeholder="Password" defaultValue="admin123" style={styles.input} required />
            <button type="submit" style={styles.loginBtn} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p style={styles.loginHint}>admin@dynastore.com / admin123</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)} 
        style={styles.menuButton}
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Sidebar - Responsive */}
      <div style={{ ...styles.sidebar, ...(isMobile && !sidebarOpen ? styles.sidebarClosed : {}) }}>
        <div style={styles.logo}>
          <i className="fas fa-store" style={{ fontSize: 24 }}></i>
          {sidebarOpen && <span>DYNA STORE</span>}
        </div>
        
        <nav style={styles.nav}>
          <button onClick={() => { setActiveTab('dashboard'); if(isMobile) setSidebarOpen(false); }} style={{ ...styles.navItem, ...(activeTab === 'dashboard' ? styles.navItemActive : {}) }}>
            <i className="fas fa-chart-line"></i>
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          <button onClick={() => { setActiveTab('products'); if(isMobile) setSidebarOpen(false); }} style={{ ...styles.navItem, ...(activeTab === 'products' ? styles.navItemActive : {}) }}>
            <i className="fas fa-box"></i>
            {sidebarOpen && <span>Products</span>}
          </button>
          <button onClick={() => { setActiveTab('categories'); if(isMobile) setSidebarOpen(false); }} style={{ ...styles.navItem, ...(activeTab === 'categories' ? styles.navItemActive : {}) }}>
            <i className="fas fa-tags"></i>
            {sidebarOpen && <span>Categories</span>}
          </button>
          <button onClick={() => { setActiveTab('orders'); if(isMobile) setSidebarOpen(false); }} style={{ ...styles.navItem, ...(activeTab === 'orders' ? styles.navItemActive : {}) }}>
            <i className="fas fa-shopping-cart"></i>
            {sidebarOpen && <span>Orders</span>}
          </button>
          <button onClick={() => { setActiveTab('users'); if(isMobile) setSidebarOpen(false); }} style={{ ...styles.navItem, ...(activeTab === 'users' ? styles.navItemActive : {}) }}>
            <i className="fas fa-users"></i>
            {sidebarOpen && <span>Users</span>}
          </button>
        </nav>
        
        <div style={styles.userSection}>
          <div style={styles.userAvatar}>
            {admin?.full_name?.charAt(0) || 'A'}
          </div>
          {sidebarOpen && (
            <div>
              <div style={styles.userName}>{admin?.full_name}</div>
              <div style={styles.userRole}>Administrator</div>
            </div>
          )}
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ ...styles.main, marginLeft: (isMobile && !sidebarOpen) ? 0 : (isMobile ? 0 : 260) }}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          {activeTab === 'products' && (
            <button onClick={() => { resetForm(); setShowProductModal(true); }} style={styles.primaryBtn}>
              <i className="fas fa-plus"></i>
              {!isMobile && <span> Add Product</span>}
            </button>
          )}
          {activeTab === 'categories' && (
            <button onClick={() => setShowCategoryModal(true)} style={styles.primaryBtn}>
              <i className="fas fa-plus"></i>
              {!isMobile && <span> Add Category</span>}
            </button>
          )}
        </header>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : (
            <>
              {/* Dashboard */}
              {activeTab === 'dashboard' && (
                <div>
                  <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                      <div style={{ ...styles.statIcon, background: '#e0e7ff', color: '#4f46e5' }}>
                        <i className="fas fa-box"></i>
                      </div>
                      <div>
                        <div style={styles.statValue}>{products.length}</div>
                        <div style={styles.statLabel}>Products</div>
                      </div>
                    </div>
                    <div style={styles.statCard}>
                      <div style={{ ...styles.statIcon, background: '#dcfce7', color: '#22c55e' }}>
                        <i className="fas fa-tags"></i>
                      </div>
                      <div>
                        <div style={styles.statValue}>{categories.length}</div>
                        <div style={styles.statLabel}>Categories</div>
                      </div>
                    </div>
                    <div style={styles.statCard}>
                      <div style={{ ...styles.statIcon, background: '#fef3c7', color: '#eab308' }}>
                        <i className="fas fa-shopping-cart"></i>
                      </div>
                      <div>
                        <div style={styles.statValue}>{orders.length}</div>
                        <div style={styles.statLabel}>Orders</div>
                      </div>
                    </div>
                    <div style={styles.statCard}>
                      <div style={{ ...styles.statIcon, background: '#e0e7ff', color: '#4f46e5' }}>
                        <i className="fas fa-users"></i>
                      </div>
                      <div>
                        <div style={styles.statValue}>{users.length}</div>
                        <div style={styles.statLabel}>Users</div>
                      </div>
                    </div>
                  </div>

                  <div style={styles.tableContainer}>
                    <h3 style={{ marginBottom: 16 }}>Recent Orders</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 5).map(order => (
                            <tr key={order.id}>
                              <td style={styles.td}>{order.order_number?.slice(-8)}</td>
                              <td style={styles.td}>${order.total_amount}</td>
                              <td style={styles.td}>
                                <span style={{ ...styles.statusBadge, background: getStatusColor(order.status) }}>
                                  {order.status}
                                </span>
                              </td>
                              <td style={styles.td}>{new Date(order.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Table - Responsive */}
              {activeTab === 'products' && (
                <div style={styles.tableContainer}>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Title</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(product => (
                          <tr key={product.id}>
                            <td style={styles.td}>
                              {product.main_image ? (
                                <img src={`${BASE_URL}${product.main_image}`} alt={product.title} style={styles.productImage} />
                              ) : (
                                <div style={styles.placeholderImage}>📷</div>
                              )}
                            </td>
                            <td style={styles.td}><strong>{product.title}</strong></td>
                            <td style={styles.td}>${product.original_price}</td>
                            <td style={styles.td}>
                              {product.size_stock ? (
                                <div style={styles.stockTags}>
                                  {Object.entries(JSON.parse(product.size_stock)).slice(0, 2).map(([size, qty]) => (
                                    <span key={size} style={styles.stockTag}>{size}:{qty}</span>
                                  ))}
                                  {Object.keys(JSON.parse(product.size_stock)).length > 2 && <span>...</span>}
                                </div>
                              ) : '-'}
                            </td>
                            <td style={styles.td}>
                              <button onClick={() => handleEditProduct(product)} style={styles.editBtn}>
                                <i className="fas fa-edit"></i>
                              </button>
                              <button onClick={() => handleDeleteProduct(product.id)} style={styles.deleteBtn}>
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Categories Table */}
              {activeTab === 'categories' && (
                <div style={styles.tableContainer}>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(category => (
                          <tr key={category.id}>
                            <td style={styles.td}>{category.id}</td>
                            <td style={styles.td}><strong>{category.name}</strong></td>
                            <td style={styles.td}>
                              <button onClick={() => handleDeleteCategory(category.id)} style={styles.deleteBtn}>
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Orders Table */}
              {activeTab === 'orders' && (
                <div style={styles.tableContainer}>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td style={styles.td}>{order.order_number?.slice(-8)}</td>
                            <td style={styles.td}>${order.total_amount}</td>
                            <td style={styles.td}>
                              <span style={{ ...styles.statusBadge, background: getStatusColor(order.status) }}>
                                {order.status}
                              </span>
                            </td>
                            <td style={styles.td}>{new Date(order.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Users Table */}
              {activeTab === 'users' && (
                <div style={styles.tableContainer}>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user.id}>
                            <td style={styles.td}>{user.id}</td>
                            <td style={styles.td}><strong>{user.full_name}</strong></td>
                            <td style={styles.td}>{user.email}</td>
                            <td style={styles.td}>
                              <span style={{ ...styles.roleBadge, background: user.role === 'admin' ? '#22c55e' : '#6b7280' }}>
                                {user.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Product Modal */}
      {showProductModal && (
        <div style={styles.modalOverlay} onClick={() => setShowProductModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>{editingProduct ? 'Edit Product' : 'Create Product'}</h2>
              <button onClick={() => setShowProductModal(false)} style={styles.modalClose}>&times;</button>
            </div>
            <form onSubmit={handleCreateProduct} style={styles.modalForm}>
              {/* Form fields - simplified for mobile */}
              <input type="text" placeholder="Title" value={productForm.title} onChange={(e) => setProductForm({...productForm, title: e.target.value})} style={styles.modalInput} required />
              <input type="number" placeholder="Price" value={productForm.original_price} onChange={(e) => setProductForm({...productForm, original_price: e.target.value})} style={styles.modalInput} required />
              <input type="number" placeholder="Discount" value={productForm.discount_price} onChange={(e) => setProductForm({...productForm, discount_price: e.target.value})} style={styles.modalInput} />
              <select value={productForm.category_id} onChange={(e) => setProductForm({...productForm, category_id: e.target.value})} style={styles.modalSelect} required>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <textarea placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} rows="3" style={styles.modalTextarea}></textarea>
              
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowProductModal(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.submitBtn}>{loading ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCategoryModal(false)}>
          <div style={styles.modalSmall} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Create Category</h2>
              <button onClick={() => setShowCategoryModal(false)} style={styles.modalClose}>&times;</button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={(e) => setCategoryForm({name: e.target.value})} style={styles.modalInput} required />
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowCategoryModal(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.submitBtn}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  loginCard: {
    background: 'white',
    padding: '30px 20px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  loginIcon: {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    fontSize: '28px',
    color: 'white',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    margin: '10px 0',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  loginBtn: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
  },
  loginHint: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#94a3b8',
  },
  
  app: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f1f5f9',
    position: 'relative',
  },
  
  menuButton: {
    position: 'fixed',
    top: '10px',
    left: '10px',
    zIndex: 1001,
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    '@media (minWidth: 768px)': {
      display: 'none',
    },
  },
  
  sidebar: {
    width: '260px',
    background: '#0f172a',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    transition: 'transform 0.3s ease',
    zIndex: 1000,
    overflowY: 'auto',
  },
  sidebarClosed: {
    transform: 'translateX(-100%)',
  },
  logo: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    borderBottom: '1px solid #1e293b',
  },
  nav: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#94a3b8',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  navItemActive: {
    background: '#1e293b',
    color: 'white',
  },
  userSection: {
    padding: '16px',
    borderTop: '1px solid #1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    background: '#4f46e5',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
  },
  userRole: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  logoutBtn: {
    marginLeft: 'auto',
    background: '#ef4444',
    border: 'none',
    color: 'white',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  
  main: {
    flex: 1,
    transition: 'margin-left 0.3s ease',
    width: '100%',
  },
  header: {
    background: 'white',
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  headerTitle: {
    margin: 0,
    fontSize: '20px',
    '@media (maxWidth: 480px)': {
      fontSize: '18px',
    },
  },
  primaryBtn: {
    background: '#4f46e5',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  content: {
    padding: '16px',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#94a3b8',
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0,
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px',
  },
  
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  tableWrapper: {
    overflowX: 'auto',
    marginTop: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '500px',
  },
  td: {
    padding: '10px 8px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '13px',
  },
  productImage: {
    width: '40px',
    height: '40px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  placeholderImage: {
    width: '40px',
    height: '40px',
    background: '#f1f5f9',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  stockTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  stockTag: {
    background: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    color: 'white',
    display: 'inline-block',
    whiteSpace: 'nowrap',
  },
  roleBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    color: 'white',
    display: 'inline-block',
  },
  editBtn: {
    background: '#3b82f6',
    color: 'white',
    padding: '6px 10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '5px',
  },
  deleteBtn: {
    background: '#ef4444',
    color: 'white',
    padding: '6px 10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalSmall: {
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
  },
  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#94a3b8',
  },
  modalForm: {
    padding: '20px',
  },
  modalInput: {
    width: '100%',
    padding: '10px 12px',
    marginBottom: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  modalSelect: {
    width: '100%',
    padding: '10px 12px',
    marginBottom: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
  },
  modalTextarea: {
    width: '100%',
    padding: '10px 12px',
    marginBottom: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  modalFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelBtn: {
    padding: '8px 16px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '8px 16px',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

// Add media query styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @media (max-width: 768px) {
    .sidebar-open {
      transform: translateX(0);
    }
    .sidebar-closed {
      transform: translateX(-100%);
    }
  }
  @media (max-width: 480px) {
    .stat-card {
      padding: 12px;
    }
    .stat-value {
      font-size: 20px;
    }
    .stat-icon {
      width: 40px;
      height: 40px;
      font-size: 20px;
    }
  }
`;
document.head.appendChild(styleSheet);

export default App;