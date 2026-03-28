import React, { useState } from 'react';
import axios from 'axios';

const SellProduct = ({ onProductAdded }) => {
    const [item, setItem] = useState({ name: '', price: '', image: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/products', item);
            alert("Product listed successfully!");
            setItem({ name: '', price: '', image: '' });
            onProductAdded(); // Refresh the list
        } catch (err) {
            console.error("Error selling product", err);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
            <input type="text" placeholder="Product Name" value={item.name} 
                onChange={(e) => setItem({...item, name: e.target.value})} required />
            <input type="number" placeholder="Price" value={item.price} 
                onChange={(e) => setItem({...item, price: e.target.value})} required />
            <input type="text" placeholder="Image URL" value={item.image} 
                onChange={(e) => setItem({...item, image: e.target.value})} required />
            <button type="submit">Post for Sale</button>
        </form>
    );
};

export default SellProduct;