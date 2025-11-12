import React, { useState } from "react";
import "./../style/AddSupplierForm.css";

import { db } from "./../../../utils/firebase";
import { collection, addDoc } from "firebase/firestore";

const initialState = {
  name: "",
  billingAddress: "",
  deliveryAddress: "",
  email: "",
  vatNumber: "",
  invoiceNumber: "",
  country: "",
  spCounter: "",
  balance: "",
};

const AddSupplier = () => {
  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedData = {
      ...formData,
      invoiceNumber: parseInt(formData.invoiceNumber),
      spCounter: parseInt(formData.spCounter),
      balance: parseFloat(formData.balance).toFixed(2),
    };

    try {
      await addDoc(collection(db, "suppliers"), formattedData);
      alert("Supplier added successfully!");
      setFormData(initialState);
    } catch (error) {
      console.error("Error adding supplier:", error);
    }
  };

  return (
    <form className="add-supplier-form" onSubmit={handleSubmit}>
      <h2 className="supplier-form-title">Add New Supplier</h2>

      <input
        type="text"
        name="name"
        placeholder="Supplier Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="billingAddress"
        placeholder="Billing Address"
        value={formData.billingAddress}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="deliveryAddress"
        placeholder="Delivery Address"
        value={formData.deliveryAddress}
        onChange={handleChange}
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="vatNumber"
        placeholder="VAT Number"
        value={formData.vatNumber}
        onChange={handleChange}
        required
      />
      <select
        name="country"
        value={formData.country}
        onChange={handleChange}
        required
      >
        <option value="">Select Country</option>
        <option value="Spain">Spain</option>
        <option value="France">France</option>
        <option value="Germany">Germany</option>
        <option value="Italy">Italy</option>
        <option value="Portugal">Portugal</option>
        <option value="EEUU">EEUU</option>
        <option value="UK">United Kingdom</option>
      </select>

      <input
        type="number"
        name="invoiceNumber"
        placeholder="Invoice Number"
        value={formData.invoiceNumber}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="spCounter"
        placeholder="SP Counter"
        value={formData.spCounter}
        onChange={handleChange}
      />

      <input
        type="number"
        name="balance"
        placeholder="Account Balance"
        value={formData.balance}
        onChange={handleChange}
      />

      <button type="submit">Add Supplier</button>
    </form>
  );
};

export default AddSupplier;
