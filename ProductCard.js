import React from 'react';

const ProductCard = ({ product }) => {
    return (
        <div style={{
            border: '1px solid #ddd',
            borderRadius: '10px',
            padding: '15px',
            width: '200px',
            textAlign: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
            <img 
                src={product.image} 
                alt={product.name} 
                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '5px' }} 
            />
            <h3>{product.name}</h3>
            <p style={{ color: '#27ae60', fontWeight: 'bold' }}>₹{product.price}</p>
            <button style={{
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                cursor: 'pointer'
            }}>
                Buy Now
            </button>
        </div>
    );
};

export default ProductCard;