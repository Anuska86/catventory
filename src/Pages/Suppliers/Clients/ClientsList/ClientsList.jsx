import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import {
  fetchClients,
  deleteClientById,
} from "../../../../utils/productService";

const ClientsList = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await fetchClients();
        setClients(data);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };

    loadClients();
  }, []);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Email", selector: (row) => row.email, sortable: true },
    { name: "Country", selector: (row) => row.country, sortable: true },
    { name: "Billing Address", selector: (row) => row.billingAddress },
    { name: "Delivery Address", selector: (row) => row.deliveryAddress },
    { name: "VAT", selector: (row) => row.vatNumber },
    {
      name: "Balance (€)",
      selector: (row) => `€${row.balance}`,
      sortable: true,
    },
    { name: "Invoices", selector: (row) => row.invoiceCounter },
    { name: "ID Count", selector: (row) => row.scpCounter },
    {
      name: "Actions",
      width: "120px",
      cell: (row) => (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap:"0.3rem",
            width: "100%",
          }}
        >
          <button
            onClick={() => console.log("Edit", row.id)}
            style={{
              padding: "0.3rem 0.6rem",
              backgroundColor: "#6c5ce7",
              color: "white",
              border: "none",
              borderRadius: "4px",
              flex: "1 1 45%",
            }}
          >
            Edit
          </button>
          <button
            onClick={async () => {
              const confirmDelete = window.confirm(`Delete ${row.name}?`);
              if (confirmDelete) {
                try {
                  await deleteClientById(row.id);
                  setClients((prev) => prev.filter((c) => c.id !== row.id));
                } catch {
                  alert("Failed to delete client.");
                }
              }
            }}
            style={{
              backgroundColor: "#e74c3c",
              color: "white",
              border: "none",
              padding: "0.3rem 0.6rem",
              borderRadius: "4px",
              flex: "1 1 45%",
            }}
          >
            Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
    },
  ];

  return (
    <div className="client-table-container">
      <h2>Clients</h2>
      <input
        type="text"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "300px" }}
      />
      <DataTable
        columns={columns}
        data={filteredClients}
        pagination
        highlightOnHover
        striped
        responsive
      />
    </div>
  );
};

export default ClientsList;
