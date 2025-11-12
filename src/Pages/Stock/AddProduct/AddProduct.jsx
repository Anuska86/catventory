import React, { useState, useEffect } from "react";
import "./style/AddProduct.css";
import { Form, FormGroup, Label, Input, Button } from "reactstrap";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext";
import { LogAudit } from "../../Utils/UsersTrack/AuditLogger";

const AddProduct = () => {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    brand: "",
    category: "",
    color: "",
    depth: "",
    description: "",
    ean: "",
    height: "",
    minThreshold: "",
    model: "",
    productVariant: "",
    profitMargin: "",
    quantity: "",
    sku: "",
    width: "",
    weight: "",
    unitPrice: "0.0",
    photoUrl: "",
    supplierId: "",
    shippingType: "",
    purchaseCost: "",
    minDeliveryTime: "",
    maxDeliveryPrice: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const db = getFirestore();
      const suppliersRef = collection(db, "suppliers");
      const snapshot = await getDocs(suppliersRef);
      const supplierList = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setSuppliers(supplierList);
    };
    fetchSuppliers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const db = getFirestore();
    const productsRef = collection(db, "products");

    const newProduct = {
      ...formData,
      depth: parseInt(formData.depth),
      height: parseInt(formData.height),
      width: parseInt(formData.width),
      weight: parseInt(formData.weight),
      quantity: parseInt(formData.quantity),
      minThreshold: parseInt(formData.minThreshold),
      profitMargin: parseFloat(formData.profitMargin),
      unitPrice: parseFloat(formData.unitPrice),
      purchaseCost: parseFloat(formData.purchaseCost),
      minDeliveryTime: parseInt(formData.minDeliveryTime),
      maxDeliveryPrice: parseFloat(formData.maxDeliveryPrice),
    };

    try {
      await addDoc(productsRef, newProduct);
      LogAudit({
        user: currentUser?.email || "Unknown",
        action: "Add Product",
        entity: "Product",
        details: {
          sku: newProduct.sku,
          category: newProduct.category,
        },
      });

      setFormData({
        brand: "",
        category: "",
        color: "",
        depth: "",
        description: "",
        ean: "",
        height: "",
        minThreshold: "",
        model: "",
        productVariant: "",
        profitMargin: "",
        quantity: "",
        sku: "",
        width: "",
        weight: "",
        unitPrice: "0.0",
        photoUrl: "",
        supplierId: "",
        shippingType: "",
        purchaseCost: "",
        minDeliveryTime: "",
        maxDeliveryPrice: "",
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product. Please try again.");
    }

    setSubmitting(false);
  };

  return (
    <div className="page-wrapper">
      <div className="upload-form">
        <h2 className="form-title">Add New Product</h2>
        <Form onSubmit={handleSubmit} className="form-center">
          {/* Product Data Section */}
          <h3 className="form-section-title">Product Data</h3>
          <div className="form-grid">
            {[
              "brand",
              "category",
              "color",
              "model",
              "productVariant",
              "sku",
              "ean",
            ].map((field) => (
              <FormGroup className="form-cell" key={field}>
                <Label for={field}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </Label>
                {field === "color" || field === "category" ? (
                  <select
                    name={field}
                    id={field}
                    value={formData[field]}
                    onChange={handleChange}
                    required
                    className="form-control"
                  >
                    <option value="">Select a {field}</option>
                    {(field === "color"
                      ? [
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
                        ]
                      : [
                          "Electronics",
                          "Clothes",
                          "Accessories",
                          "Smart Bottle",
                        ]
                    ).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="text"
                    name={field}
                    id={field}
                    value={formData[field]}
                    onChange={handleChange}
                    required
                  />
                )}
              </FormGroup>
            ))}
          </div>

          <hr className="form-divider" />

          {/* Supplier & Delivery Info Section */}
          <h3 className="form-section-title">Supplier & Delivery Info</h3>
          <div className="form-grid">
            {/* Supplier */}
            <FormGroup className="form-cell">
              <Label for="supplierId">Supplier</Label>
              <Input
                type="select"
                name="supplierId"
                id="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                required
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Input>
            </FormGroup>

            {/* Min Delivery Time */}
            <FormGroup className="form-cell">
              <Label for="minDeliveryTime">Min Delivery Time (days)</Label>
              <Input
                type="number"
                name="minDeliveryTime"
                id="minDeliveryTime"
                min="0"
                value={formData.minDeliveryTime}
                onChange={handleChange}
                required
              />
            </FormGroup>

            {/* Purchase Cost */}
            <FormGroup className="form-cell">
              <Label for="purchaseCost">Purchase Cost (€)</Label>
              <Input
                type="number"
                name="purchaseCost"
                id="purchaseCost"
                step="0.01"
                min="0"
                value={formData.purchaseCost}
                onChange={handleChange}
                required
              />
            </FormGroup>
            {/* Unit Price */}
            <FormGroup className="form-cell">
              <Label for="unitPrice">Unit Price (€)</Label>
              <Input
                type="number"
                name="unitPrice"
                id="unitPrice"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={handleChange}
                required
              />
            </FormGroup>

            {/* Shipping Type */}
            <FormGroup className="form-cell">
              <Label for="shippingType">Shipping Type</Label>
              <Input
                type="select"
                name="shippingType"
                id="shippingType"
                value={formData.shippingType}
                onChange={handleChange}
                required
              >
                <option value="">Select shipping type</option>
                {["Standard", "Express", "Pickup"].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Input>
            </FormGroup>

            {/* Max Delivery Price */}
            <FormGroup className="form-cell">
              <Label for="maxDeliveryPrice">Max Delivery Price (€)</Label>
              <Input
                type="number"
                name="maxDeliveryPrice"
                id="maxDeliveryPrice"
                step="0.01"
                min="0"
                value={formData.maxDeliveryPrice}
                onChange={handleChange}
                required
              />
            </FormGroup>
          </div>

          {/* Full Width Fields */}
          <FormGroup className="full-width">
            <Label for="photoUrl">Photo URL</Label>
            <Input
              type="url"
              name="photoUrl"
              id="photoUrl"
              value={formData.photoUrl}
              onChange={handleChange}
            />
            <small className="text-muted">
              Paste a direct link to an image (e.g.
              https://example.com/photo.jpg)
            </small>

            {formData.photoUrl && (
              <div style={{ marginTop: "1rem", minHeight: "200px" }}>
                <img
                  src={formData.photoUrl}
                  alt="Preview"
                  style={{
                    width: "100%",
                    maxWidth: "300px",
                    borderRadius: "6px",
                    objectFit: "cover",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/300?text=Image+Not+Found";
                  }}
                />
              </div>
            )}
          </FormGroup>

          <FormGroup className="full-width">
            <Label for="description">Description</Label>
            <Input
              type="textarea"
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </FormGroup>

          {/* Submit Button */}
          <FormGroup className="button-wrapper">
            <Button
              type="submit"
              className="submit-button-add-product"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Add Product"}
            </Button>
          </FormGroup>

          {/* Success Message */}
          {submitted && (
            <div className="status success">Product added successfully!</div>
          )}
        </Form>
      </div>
    </div>
  );
};

export default AddProduct;
