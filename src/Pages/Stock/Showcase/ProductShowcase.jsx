import React, { useEffect, useState, lazy, Suspense } from "react";
import { Row, Col } from "reactstrap";
import { fetchProducts } from "../../../utils/productService";
import "./style/ProductShowcase.css";

const ProductCard = React.lazy(() => import("./ProductCard"));

//For rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Failed to load product card.</div>;
    }

    return this.props.children;
  }
}

const ProductShowcase = () => {
  console.log("ProductShowcase component rendered");

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      const items = await fetchProducts();
      console.log("Fetched products:", items);

      setProducts(items.products || []);
    };

    loadProducts();
  }, []);

  return (
    <div className="products-container">
      <ErrorBoundary>
        <Suspense fallback={<div>Loading product...</div>}>
          <div className="card-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default ProductShowcase;
