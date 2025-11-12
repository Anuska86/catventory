import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import {
  fetchAllSupplierNames,
  deleteSupplierById,
} from "../../../utils/productService";

const SuppliersList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const supplierList = await fetchAllSupplierNames();
        console.log("Loaded suppliers:", supplierList);
        setSuppliers(supplierList);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };

    loadSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Email", selector: (row) => row.email, sortable: true },
    { name: "Country", selector: (row) => row.country, sortable: true },
    { name: "Address", selector: (row) => row.address },
    { name: "Billing Address", selector: (row) => row.billingAddress },
    { name: "VAT Number", selector: (row) => row.vatNumber },
    { name: "Invoices", selector: (row) => row.invoiceCounter },
    {
      name: "Actions",
      cell: (row) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => console.log("Edit", row.id)}
            style={{ padding: "0.3rem 0.6rem" }}
          >
            Edit
          </button>
          <button
            onClick={async () => {
              const confirmDelete = window.confirm(`Delete ${row.name}?`);
              if (confirmDelete) {
                try {
                  await deleteSupplierById(row.id);
                  setSuppliers((prev) => prev.filter((s) => s.id !== row.id));
                } catch {
                  alert("Failed to delete supplier.");
                }
              }
            }}
            style={{
              backgroundColor: "#e74c3c",
              color: "white",
              border: "none",
              padding: "0.3rem 0.6rem",
              borderRadius: "4px",
            }}
          >
            Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      minWidth: "180px", 
    },
  ];

  return (
    <div className="supplier-table-container">
      <h2>Suppliers</h2>
      <input
        type="text"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "300px" }}
      />
      <DataTable
        columns={columns}
        data={filteredSuppliers}
        pagination
        highlightOnHover
        striped
        responsive
      />
    </div>
  );
};

export default SuppliersList;
