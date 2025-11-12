import React, { useState } from "react";
import "./../../style/AddClientForm.css"

import { db } from "../../../../utils/firebase";
import { collection, addDoc } from "firebase/firestore";

import { nanoid } from "nanoid";

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

const AddClients = () => {
  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientData = {
      ...formData,
      clientId: nanoid(),
      invoiceNumber: parseInt(formData.invoiceNumber),
      spCounter: parseInt(formData.spCounter),
      balance: parseFloat(formData.balance).toFixed(2),
    };

    try {
      await addDoc(collection(db, "clients"), clientData);
      alert("Client added successfully!");
      setFormData(initialState);
    } catch (error) {
      console.error("Error adding client:", error);
    }
  };

  return (
    <form className="add-client-form" onSubmit={handleSubmit}>
      <h2 className="client-form-title">Add New Client</h2>

      <input
        type="text"
        name="name"
        placeholder="Client Name"
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

      <input
        type="text"
        name="country"
        placeholder="Country"
        value={formData.country}
        onChange={handleChange}
      />

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
        placeholder="Balance (€)"
        value={formData.balance}
        onChange={handleChange}
        step="0.01"
        min="0"
      />

      <button type="submit">Add Client</button>
    </form>
  );
};

export default AddClients;
