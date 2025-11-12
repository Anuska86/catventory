import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProductById } from "../../../utils/productService";

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await fetchProductById(id);
        setProduct(data);
      } catch (error) {
        console.error("Product not found:", error);
      }
    };
    loadProduct();
  }, [id]);

  if (!product) return <div>Loading...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link
          to="/stock/list-of-products"
          style={{ textDecoration: "none", color: "#007bff" }}
        >
          ← Back to Product List
        </Link>
      </div>
      <h2 style={{ textAlign: "center", margin: "2rem 0" }}>
        {product.brand} - {product.model}
      </h2>
      <div style={{ textAlign: "center", margin: "2rem 0" }}>
        <img
          src={product.image}
          alt={product.model}
          style={{
            maxWidth: "300px",
            width: "100%",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        />
      </div>

      <ul>
        <li>
          <strong>Category:</strong> {product.category}
        </li>
        <li>
          <strong>Color:</strong> {product.color}
        </li>
        <li>
          <strong>Dimensions:</strong> {product.width}W × {product.height}H ×{" "}
          {product.depth}D
        </li>
        <li>
          <strong>Weight:</strong> {product.weight}g
        </li>
        <li>
          <strong>Quantity:</strong> {product.quantity}
        </li>
        <li>
          <strong>SKU:</strong> {product.sku}
        </li>
        <li>
          <strong>EAN:</strong> {product.ean}
        </li>
        <li>
          <strong>Profit Margin:</strong> {product.profitMargin}%
        </li>
        <li>
          <strong>Min Threshold:</strong> {product.minThreshold}
        </li>
        <li>
          <strong>Variant:</strong> {product.productVariant}
        </li>
        <li>
          <strong>Description:</strong> {product.description}
        </li>
      </ul>
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Link
          to={`/stock/edit-suppliers/${id}`}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#b265be",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "5px",
            fontWeight: "bold",
          }}
        >
          ✏️ Edit Suppliers List
        </Link>
      </div>
    </div>
  );
}

export default ProductDetails;
