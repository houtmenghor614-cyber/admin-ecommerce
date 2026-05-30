import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct } from '../../services/adminProductService';
import { getCategories } from '../../services/adminCategoryService';
import toast from 'react-hot-toast';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        toast.success('Product deleted successfully');
        loadData();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  // Calculate discount percentage
  const getDiscountPercent = (originalPrice, discountPrice) => {
    if (!discountPrice || discountPrice >= originalPrice) return 0;
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  // Get display price (show discount price if available, otherwise original)
  const getDisplayPrice = (product) => {
    if (product.discount_price && product.discount_price > 0) {
      return {
        price: product.discount_price,
        original: product.original_price,
        hasDiscount: true,
        discountPercent: getDiscountPercent(product.original_price, product.discount_price)
      };
    }
    return {
      price: product.original_price,
      original: null,
      hasDiscount: false,
      discountPercent: 0
    };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product inventory</p>
        </div>
        <Link
          to="/admin/products/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> Add Product
        </Link>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="w-full md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const displayPrice = getDisplayPrice(product);
          
          return (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Product Image */}
              <div className="relative h-48 overflow-hidden bg-gray-100">
                {product.main_image ? (
                  <img
                    src={`http://127.0.0.1:8000${product.main_image}`}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-image text-4xl text-gray-400"></i>
                  </div>
                )}
                {displayPrice.hasDiscount && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                    -{displayPrice.discountPercent}%
                  </div>
                )}
                {product.stock <= 5 && product.stock > 0 && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                    Low Stock: {product.stock}
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                    Out of Stock
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-1 line-clamp-1">
                  {product.title}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {product.category_name || 'Uncategorized'}
                </p>
                
                {/* Price Display - Shows Discount Price prominently */}
                <div className="mb-3">
                  {displayPrice.hasDiscount ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-indigo-600">
                          ${displayPrice.price}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          ${displayPrice.original}
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Save ${(displayPrice.original - displayPrice.price).toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-indigo-600">
                      ${displayPrice.price}
                    </span>
                  )}
                </div>
                
                {/* Stock Status */}
                <div className="mb-3">
                  {product.stock > 10 ? (
                    <span className="text-xs text-green-600">
                      <i className="fas fa-check-circle mr-1"></i> In Stock ({product.stock})
                    </span>
                  ) : product.stock > 0 ? (
                    <span className="text-xs text-yellow-600">
                      <i className="fas fa-exclamation-triangle mr-1"></i> Low Stock ({product.stock})
                    </span>
                  ) : (
                    <span className="text-xs text-red-600">
                      <i className="fas fa-times-circle mr-1"></i> Out of Stock
                    </span>
                  )}
                </div>
                
                {/* Colors Preview */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-3">
                    <div className="flex gap-1">
                      {product.colors.slice(0, 4).map((color, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.toLowerCase() }}
                          title={color}
                        ></div>
                      ))}
                      {product.colors.length > 4 && (
                        <span className="text-xs text-gray-500 ml-1">
                          +{product.colors.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Sizes Preview */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {product.sizes.slice(0, 4).map((size, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                        >
                          {size}
                        </span>
                      ))}
                      {product.sizes.length > 4 && (
                        <span className="text-xs text-gray-500 ml-1">
                          +{product.sizes.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Link
                    to={`/admin/products/edit/${product.id}`}
                    className="flex-1 bg-blue-500 text-white text-center py-2 rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                  >
                    <i className="fas fa-edit mr-1"></i> Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition text-sm font-medium"
                  >
                    <i className="fas fa-trash mr-1"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">No products found</p>
          <Link
            to="/admin/products/create"
            className="inline-block mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Add your first product
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductList;