import React, { useEffect, useState } from "react";
import "./style/ProductEdit.css";
import { useParams } from "react-router-dom";
import { fetchProductById } from "../../../utils/productService";

export default function ProductEdit() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const item = await fetchProductById(id);
        setProduct(item);
      } catch (error) {
        console.error("Error loading product:", error);
      }
    };

    loadProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Saving product:", product);
  };

  return (
    <div className="product-edit-page">
      <h3 className="edit-product-title">Edit Product</h3>
      {product ? (
        <form onSubmit={handleSubmit} className="product-edit-form">
          {/* Image Preview */}
          <div className="form-group full-width image-preview">
            <h4>Product Preview</h4>
            <img src={product.photoUrl || "/default-image.jpg"} alt="Product" />
          </div>

          {/* Basic Info */}
          <h4 className="section-title">Basic Info</h4>
          <div className="form-group full-width">
            <label>Image URL:</label>
            <input
              name="photoUrl"
              value={product.photoUrl}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Brand:</label>
            <input name="brand" value={product.brand} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Model:</label>
            <input name="model" value={product.model} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Category:</label>
            <select
              name="category"
              value={product.category}
              onChange={handleChange}
            >
              <option value="">Select category</option>
              <option value="electronics">Electronics</option>
              <option value="clothes">Clothes</option>
              <option value="accessories">Accessories</option>
              <option value="smart bottle">Smart Bottle</option>
            </select>
          </div>
          <div className="form-group">
            <label>Color:</label>
            <select name="color" value={product.color} onChange={handleChange}>
              <option value="">Select color</option>
              {[
                "Black",
                "White",
                "Gray",
                "Blue",
                "Red",
                "Green",
                "Yellow",
                "Purple",
                "Pink",
                "Ocean Blue",
              ].map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Product Variant:</label>
            <input
              name="productVariant"
              value={product.productVariant}
              onChange={handleChange}
            />
          </div>

          {/* Dimensions */}
          <h4 className="section-title">Dimensions</h4>
          <div className="form-group">
            <label>Depth:</label>
            <input
              name="depth"
              type="number"
              value={product.depth}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Height:</label>
            <input
              name="height"
              type="number"
              value={product.height}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Width:</label>
            <input
              name="width"
              type="number"
              value={product.width}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Weight (g):</label>
            <input
              name="weight"
              type="number"
              value={product.weight}
              onChange={handleChange}
            />
          </div>

          {/* Identifiers */}
          <h4 className="section-title">Identifiers</h4>
          <div className="form-group">
            <label>EAN:</label>
            <input name="ean" value={product.ean} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>SKU:</label>
            <input name="sku" value={product.sku} onChange={handleChange} />
          </div>

          {/* Pricing */}
          <h4 className="section-title">Pricing</h4>
          <div className="form-group">
            <label>Unit Price (€):</label>
            <input
              name="unitPrice"
              type="number"
              value={product.unitPrice}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Profit Margin (%):</label>
            <input
              name="profitMargin"
              type="number"
              value={product.profitMargin}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Purchase Cost (€):</label>
            <input
              name="purchaseCost"
              type="number"
              step="0.01"
              value={product.purchaseCost}
              onChange={handleChange}
            />
          </div>

          {/* Inventory */}
          <h4 className="section-title">Inventory</h4>
          <div className="form-group">
            <label>Quantity:</label>
            <input
              name="quantity"
              type="number"
              value={product.quantity}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Min Threshold:</label>
            <input
              name="minThreshold"
              type="number"
              value={product.minThreshold}
              onChange={handleChange}
            />
          </div>

          {/* Supplier & Delivery Info */}
          <h4 className="section-title">Supplier & Delivery Info</h4>
          <div className="form-group">
            <label>Supplier:</label>
            <select
              name="supplierId"
              value={product.supplierId || ""}
              onChange={handleChange}
            >
              <option value="">Select a supplier</option>
              <option value="supplier1">Supplier 1</option>
              <option value="supplier2">Supplier 2</option>
              {/* Replace with dynamic options if needed */}
            </select>
          </div>
          <div className="form-group">
            <label>Shipping Type:</label>
            <select
              name="shippingType"
              value={product.shippingType || ""}
              onChange={handleChange}
            >
              <option value="">Select shipping type</option>
              <option value="Standard">Standard</option>
              <option value="Express">Express</option>
              <option value="Pickup">Pickup</option>
            </select>
          </div>
          <div className="form-group">
            <label>Min Delivery Time (days):</label>
            <input
              name="minDeliveryTime"
              type="number"
              value={product.minDeliveryTime}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Max Delivery Price (€):</label>
            <input
              name="maxDeliveryPrice"
              type="number"
              step="0.01"
              value={product.maxDeliveryPrice}
              onChange={handleChange}
            />
          </div>

          {/* Description */}
          <div className="form-group full-width">
            <label>Description:</label>
            <textarea
              name="description"
              value={product.description}
              onChange={handleChange}
            />
          </div>

          {/* Submit */}
          <div className="button-wrapper">
            <button type="submit" className="save-button">
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <p>Loading product...</p>
      )}
    </div>
  );
}
