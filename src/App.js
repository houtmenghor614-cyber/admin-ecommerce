/* eslint-disable no-restricted-globals */
import React, { useState, useEffect } from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: '', original_price: '', discount_price: '', category_id: '', description: '', stock: '', colors: '', sizes: ''
  });
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  
  const [mainImage, setMainImage] = useState(null);
  const [subImages, setSubImages] = useState([]);
  const [mainPreview, setMainPreview] = useState(null);
  const [subPreviews, setSubPreviews] = useState([]);

  const API = 'http://127.0.0.1:8000/api';
  const BASE_URL = 'http://127.0.0.1:8000';

  // Fetch all data
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

  // Login
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

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('admin');
    setIsLoggedIn(false);
    setAdmin(null);
  };

  // Check saved login
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
      title: '', original_price: '', discount_price: '', category_id: '', description: '', stock: '', colors: '', sizes: ''
    });
    setMainImage(null);
    setSubImages([]);
    setMainPreview(null);
    setSubPreviews([]);
    setEditingProduct(null);
    setNewSize('');
    setNewColor('');
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

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      original_price: product.original_price,
      discount_price: product.discount_price || '',
      category_id: product.category_id,
      description: product.description || '',
      stock: product.stock,
      colors: product.colors || '',
      sizes: product.sizes || ''
    });
    setMainPreview(product.main_image ? `${BASE_URL}${product.main_image}` : null);
    
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
      if (editingProduct) {
        const productData = {
          title: productForm.title,
          original_price: parseFloat(productForm.original_price),
          discount_price: productForm.discount_price ? parseFloat(productForm.discount_price) : 0,
          category_id: parseInt(productForm.category_id),
          description: productForm.description,
          stock: parseInt(productForm.stock),
          colors: productForm.colors,
          sizes: productForm.sizes
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
          stock: parseInt(productForm.stock),
          colors: productForm.colors,
          sizes: productForm.sizes
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

  const addSize = () => {
    if (newSize.trim()) {
      const current = productForm.sizes ? productForm.sizes.split(',') : [];
      if (!current.includes(newSize.trim().toUpperCase())) {
        current.push(newSize.trim().toUpperCase());
        setProductForm({ ...productForm, sizes: current.join(',') });
        setNewSize('');
      }
    }
  };

  const removeSize = (size) => {
    const current = productForm.sizes.split(',');
    const filtered = current.filter(s => s !== size);
    setProductForm({ ...productForm, sizes: filtered.join(',') });
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

  // Calculate statistics
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'paid').length;
  const lowStockProducts = products.filter(p => p.stock < 10).length;

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
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <i className="fas fa-store" style={{ fontSize: 24 }}></i>
          <span>DYNA STORE</span>
        </div>
        
        <nav style={styles.nav}>
          <button onClick={() => setActivePage('dashboard')} style={{ ...styles.navItem, ...(activePage === 'dashboard' ? styles.navItemActive : {}) }}>
            <i className="fas fa-chart-line"></i>
            <span>Dashboard</span>
          </button>
          <button onClick={() => setActivePage('products')} style={{ ...styles.navItem, ...(activePage === 'products' ? styles.navItemActive : {}) }}>
            <i className="fas fa-box"></i>
            <span>Products</span>
          </button>
          <button onClick={() => setActivePage('categories')} style={{ ...styles.navItem, ...(activePage === 'categories' ? styles.navItemActive : {}) }}>
            <i className="fas fa-tags"></i>
            <span>Categories</span>
          </button>
          <button onClick={() => setActivePage('orders')} style={{ ...styles.navItem, ...(activePage === 'orders' ? styles.navItemActive : {}) }}>
            <i className="fas fa-shopping-cart"></i>
            <span>Orders</span>
          </button>
          <button onClick={() => setActivePage('users')} style={{ ...styles.navItem, ...(activePage === 'users' ? styles.navItemActive : {}) }}>
            <i className="fas fa-users"></i>
            <span>Users</span>
          </button>
        </nav>
        
        <div style={styles.userSection}>
          <div style={styles.userAvatar}>
            {admin?.full_name?.charAt(0) || 'A'}
          </div>
          <div>
            <div style={styles.userName}>{admin?.full_name}</div>
            <div style={styles.userRole}>Administrator</div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <h1>{activePage.charAt(0).toUpperCase() + activePage.slice(1)}</h1>
          {activePage === 'products' && (
            <button onClick={() => { resetForm(); setShowProductModal(true); }} style={styles.primaryBtn}>
              <i className="fas fa-plus"></i> Add Product
            </button>
          )}
          {activePage === 'categories' && (
            <button onClick={() => setShowCategoryModal(true)} style={styles.primaryBtn}>
              <i className="fas fa-plus"></i> Add Category
            </button>
          )}
        </header>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : (
            <>
              {/* Dashboard */}
              {activePage === 'dashboard' && (
                <div>
                  {/* Stats Cards */}
                  <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                      <div style={{ ...styles.statIcon, background: '#e0e7ff', color: '#4f46e5' }}>
                        <i className="fas fa-box"></i>
                      </div>
                      <div>
                        <div style={styles.statValue}>{products.length}</div>
                        <div style={styles.statLabel}>Total Products</div>
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
                        <div style={styles.statLabel}>Total Orders</div>
                      </div>
                    </div>
                    <div style={styles.statCard}>
                      <div style={{ ...styles.statIcon, background: '#e0e7ff', color: '#4f46e5' }}>
                        <i className="fas fa-users"></i>
                      </div>
                      <div>
                        <div style={styles.statValue}>{users.length}</div>
                        <div style={styles.statLabel}>Total Users</div>
                      </div>
                    </div>
                  </div>

                  {/* Second Row Stats */}
                  <div style={styles.statsGrid2}>
                    <div style={styles.statCardLarge}>
                      <div>
                        <div style={styles.statLabel}>Total Revenue</div>
                        <div style={styles.statValueLarge}>${totalRevenue.toLocaleString()}</div>
                      </div>
                      <i className="fas fa-dollar-sign" style={{ fontSize: 32, color: '#10b981' }}></i>
                    </div>
                    <div style={styles.statCardLarge}>
                      <div>
                        <div style={styles.statLabel}>Pending Orders</div>
                        <div style={styles.statValueLarge}>{pendingOrders}</div>
                      </div>
                      <i className="fas fa-clock" style={{ fontSize: 32, color: '#eab308' }}></i>
                    </div>
                    <div style={styles.statCardLarge}>
                      <div>
                        <div style={styles.statLabel}>Completed Orders</div>
                        <div style={styles.statValueLarge}>{completedOrders}</div>
                      </div>
                      <i className="fas fa-check-circle" style={{ fontSize: 32, color: '#22c55e' }}></i>
                    </div>
                    <div style={styles.statCardLarge}>
                      <div>
                        <div style={styles.statLabel}>Low Stock Items</div>
                        <div style={styles.statValueLarge} style={{ color: lowStockProducts > 0 ? '#ef4444' : '#22c55e' }}>
                          {lowStockProducts}
                        </div>
                      </div>
                      <i className="fas fa-exclamation-triangle" style={{ fontSize: 32, color: lowStockProducts > 0 ? '#ef4444' : '#22c55e' }}></i>
                    </div>
                  </div>

                  {/* Recent Orders Table */}
                  <div style={styles.recentOrders}>
                    <h3>Recent Orders</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 5).map(order => (
                            <tr key={order.id}>
                              <td>{order.order_number}</td>
                              <td>User #{order.user_id}</td>
                              <td>${order.total_amount}</td>
                              <td>
                                <span style={{ ...styles.statusBadge, background: order.status === 'delivered' ? '#22c55e' : order.status === 'paid' ? '#3b82f6' : '#eab308' }}>
                                  {order.status}
                                </span>
                              </td>
                              <td>{new Date(order.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Table */}
              {activePage === 'products' && (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Category</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id}>
                          <td>
                            {product.main_image ? (
                              <img src={`${BASE_URL}${product.main_image}`} alt={product.title} style={styles.productImage} />
                            ) : (
                              <div style={styles.placeholderImage}>📷</div>
                            )}
                          </td>
                          <td><strong>{product.title}</strong></td>
                          <td>${product.original_price}</td>
                          <td>
                            <span style={{ color: product.stock > 10 ? '#22c55e' : product.stock > 0 ? '#eab308' : '#ef4444' }}>
                              {product.stock}
                            </span>
                          </td>
                          <td>{product.category_name || '-'}</td>
                          <td>
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
              )}

              {/* Categories Table */}
              {activePage === 'categories' && (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(category => (
                        <tr key={category.id}>
                          <td>{category.id}</td>
                          <td><strong>{category.name}</strong></td>
                          <td>{new Date(category.created_at).toLocaleDateString()}</td>
                          <td>
                            <button onClick={() => handleDeleteCategory(category.id)} style={styles.deleteBtn}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Orders Table */}
              {activePage === 'orders' && (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id}>
                          <td>{order.order_number}</td>
                          <td>User #{order.user_id}</td>
                          <td>${order.total_amount}</td>
                          <td>
                            <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} style={styles.statusSelect}>
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td>{new Date(order.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Users Table */}
              {activePage === 'users' && (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td><strong>{user.full_name}</strong></td>
                          <td>{user.email}</td>
                          <td>{user.phone_number || '-'}</td>
                          <td>
                            <span style={{ ...styles.roleBadge, background: user.role === 'admin' ? '#22c55e' : '#6b7280' }}>
                              {user.role}
                            </span>
                          </td>
                          <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
            <form onSubmit={handleCreateProduct}>
              <div style={styles.formGrid}>
                <input type="text" placeholder="Title" value={productForm.title} onChange={(e) => setProductForm({...productForm, title: e.target.value})} style={styles.input} required />
                <input type="number" placeholder="Price" value={productForm.original_price} onChange={(e) => setProductForm({...productForm, original_price: e.target.value})} style={styles.input} required />
                <input type="number" placeholder="Discount" value={productForm.discount_price} onChange={(e) => setProductForm({...productForm, discount_price: e.target.value})} style={styles.input} />
                <input type="number" placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} style={styles.input} required />
                <select value={productForm.category_id} onChange={(e) => setProductForm({...productForm, category_id: e.target.value})} style={styles.select} required>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <textarea placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} rows="3" style={styles.textarea}></textarea>
              </div>

              <div style={styles.formSection}>
                <label>Sizes</label>
                <div style={styles.tagInput}>
                  <input type="text" value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="Add size (S, M, L, XL)" style={styles.inputSmall} />
                  <button type="button" onClick={addSize} style={styles.smallBtn}>Add</button>
                </div>
                <div style={styles.tagList}>
                  {productForm.sizes && productForm.sizes.split(',').map(s => (
                    <span key={s} style={styles.tag}>{s} <button type="button" onClick={() => removeSize(s)} style={styles.tagRemove}>×</button></span>
                  ))}
                </div>
              </div>

              <div style={styles.formSection}>
                <label>Colors</label>
                <div style={styles.tagInput}>
                  <input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Add color (Red, Blue, Black)" style={styles.inputSmall} />
                  <button type="button" onClick={addColor} style={styles.smallBtn}>Add</button>
                </div>
                <div style={styles.tagList}>
                  {productForm.colors && productForm.colors.split(',').map(c => (
                    <span key={c} style={styles.tag}>{c} <button type="button" onClick={() => removeColor(c)} style={styles.tagRemove}>×</button></span>
                  ))}
                </div>
              </div>

              <div style={styles.formSection}>
                <label>Main Image</label>
                <input type="file" accept="image/*" onChange={handleMainImage} style={styles.fileInput} />
                {mainPreview && <img src={mainPreview} style={styles.preview} alt="preview" />}
              </div>

              <div style={styles.formSection}>
                <label>Additional Images (select multiple)</label>
                <input type="file" accept="image/*" multiple onChange={handleSubImages} style={styles.fileInput} />
                <div style={styles.subPreview}>
                  {subPreviews.map((p, i) => <img key={i} src={p} style={styles.smallPreview} alt="" />)}
                </div>
              </div>

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
              <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={(e) => setCategoryForm({name: e.target.value})} style={styles.input} required />
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
  },
  loginCard: {
    background: 'white',
    padding: '40px',
    borderRadius: '16px',
    width: '420px',
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
  },
  
  sidebar: {
    width: '280px',
    background: '#0f172a',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
  },
  logo: {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '20px',
    fontWeight: 'bold',
    borderBottom: '1px solid #1e293b',
  },
  nav: {
    flex: 1,
    padding: '20px 16px',
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
    padding: '20px',
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
  },
  
  main: {
    flex: 1,
    marginLeft: '280px',
  },
  header: {
    background: 'white',
    padding: '20px 32px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  content: {
    padding: '32px',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#94a3b8',
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
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
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
  },
  
  statsGrid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '32px',
  },
  statCardLarge: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statValueLarge: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#0f172a',
  },
  
  recentOrders: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  tableWrapper: {
    overflowX: 'auto',
    marginTop: '16px',
  },
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
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
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    color: 'white',
  },
  roleBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    color: 'white',
  },
  statusSelect: {
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '12px',
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
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '700px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalSmall: {
    background: 'white',
    borderRadius: '16px',
    width: '450px',
  },
  modalHeader: {
    padding: '20px 24px',
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
  formGrid: {
    padding: '24px',
    display: 'grid',
    gap: '16px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  formSection: {
    padding: '0 24px 20px',
  },
  tagInput: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  inputSmall: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
  },
  smallBtn: {
    padding: '8px 16px',
    background: '#e2e8f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  tag: {
    background: '#f1f5f9',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '13px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  tagRemove: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '0 2px',
  },
  fileInput: {
    width: '100%',
    padding: '8px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  preview: {
    width: '100px',
    marginTop: '10px',
    borderRadius: '8px',
  },
  subPreview: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  smallPreview: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '6px',
  },
  modalFooter: {
    padding: '16px 24px',
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

export default App;