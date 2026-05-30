import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img
        src={product.main_image || 'https://via.placeholder.com/300'}
        alt={product.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
        <p className="text-gray-600 text-sm mb-2">{product.category_name}</p>
        <div className="flex items-center justify-between mb-3">
          {product.discount_price ? (
            <>
              <span className="text-lg font-bold text-indigo-600">${product.discount_price}</span>
              <span className="text-sm text-gray-400 line-through">${product.original_price}</span>
            </>
          ) : (
            <span className="text-lg font-bold text-indigo-600">${product.original_price}</span>
          )}
          <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            Stock: {product.stock}
          </span>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/admin/products/edit/${product.id}`}
            className="flex-1 bg-blue-500 text-white text-center px-3 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            <i className="fas fa-edit mr-1"></i> Edit
          </Link>
          <button
            onClick={() => onDelete(product.id)}
            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition"
          >
            <i className="fas fa-trash mr-1"></i> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;