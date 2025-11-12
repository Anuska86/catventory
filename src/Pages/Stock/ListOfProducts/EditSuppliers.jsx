import React from "react";
import { useParams, Link } from "react-router-dom";
import SupplierListDisplay from "./SupplierListDisplay";
import "./style/EditSuppliers.css";

import { addSupplierToProduct } from "../../../utils/productService";
import { fetchProductById } from "../../../utils/productService";

function EditSuppliers() {
  const { id } = useParams();
  const [product, setProduct] = React.useState(null);

  React.useEffect(() => {
    const loadProduct = async () => {
      try {
        const productData = await fetchProductById(id);
        setProduct(productData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    loadProduct();
  }, [id]);

  const handleEditSupplier = (supplierId) => {
    console.log("Edit supplier:", supplierId);
    // Navigate to edit form or open modal
  };

  const handleRemoveSupplier = (supplierId) => {
    console.log("Remove supplier:", supplierId);
    // Trigger Firestore update or confirmation modal
  };

  const handleAddSupplier = async (newSupplier) => {
    try {
      await addSupplierToProduct(id, newSupplier);
      setProduct((prev) => ({
        ...prev,
        supplierList: [...(prev.supplierList || []), newSupplier],
      }));
    } catch (error) {
      console.error("Failed to add supplier:", error);
    }
  };

  if (!product) return <div>Loading product info...</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <Link
        to={`/stock/details/${id}`}
        style={{ textDecoration: "none", color: "#007bff" }}
      >
        ← Back to Product Details
      </Link>

      <h2 style={{ margin: "2rem 0", textAlign: "center" }}>
        Edit Suppliers for: <br />
        <span style={{ fontWeight: "bold" }}>
          {product.brand} - {product.model}
        </span>
      </h2>

      <SupplierListDisplay
        supplierList={product.supplierList}
        onEditSupplier={handleEditSupplier}
        onRemoveSupplier={handleRemoveSupplier}
        onAddSupplier={handleAddSupplier}
        productId={product.id}
      />
    </div>
  );
}

export default EditSuppliers;
