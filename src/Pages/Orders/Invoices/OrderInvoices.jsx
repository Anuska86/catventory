import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import "./style/OrderInvoices.css";

const OrderInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { name: "Client ID", selector: (row) => row.clientId, sortable: true },
    { name: "Internal ID", selector: (row) => row.scp, sortable: true },
    {
      name: "Creation Date",
      selector: (row) =>
        row.creationDate
          ? new Date(row.creationDate).toLocaleDateString()
          : "—",
      sortable: true,
    },
    { name: "PO Number", selector: (row) => row.poNumber, sortable: true },
    { name: "Status", selector: (row) => row.status, sortable: true },
    { name: "SKU", selector: (row) => row.sku, sortable: true },
    {
      name: "Description",
      selector: (row) => row.description,
      sortable: false,
    },
    { name: "Quantity", selector: (row) => row.quantity, sortable: true },
    {
      name: "Unit Price",
      selector: (row) => `${row.unitPrice.toFixed(2)} ${row.currency}`,
      sortable: true,
    },
    {
      name: "Warehouse",
      selector: (row) => row.selectedWarehouse,
      sortable: true,
    },
    {
      name: "Blocked",
      selector: (row) => (row.isBlocked ? "Yes" : "No"),
      sortable: true,
    },
    {
      name: "Blocked Amount",
      selector: (row) =>
        row.totalBlockedAmount
          ? `${row.totalBlockedAmount.toFixed(2)} ${row.currency}`
          : "—",
      sortable: true,
      right: true,
    },
  ];

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const db = getFirestore();
        const snapshot = await getDocs(collection(db, "orders"));

        const items = snapshot.docs.flatMap((doc) => {
          const data = doc.data();
          const baseFields = {
            orderId: doc.id,
            clientId: data.clientId || "",
            creationDate: data.creationDate?.toDate() || null,
            currency: data.currency || "€",
            poNumber: data.poNumber || "",
            status: data.status || "",
            scp: data.scp || "",
          };

          const eanList = data.eanList || {};
          return Object.entries(eanList).map(([ean, product]) => ({
            ...baseFields,
            ean,
            sku: product.sku || "",
            description: product.description || "",
            quantity: product.quantity || 0,
            unitPrice: product.unitPrice || 0,
            selectedWarehouse: product.selectedWarehouse || "",
            isBlocked: product.isBlocked || false,
            totalBlockedAmount:
              product.totalBlockedAmount ??
              (product.isBlocked ? product.unitPrice * product.quantity : 0),
          }));
        });
        console.log("Fetched items:", items);

        setInvoices(items);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  return (
    <div className="order-invoices">
      <h2>Order Invoices</h2>
      <p>{JSON.stringify(invoices)}</p>

      <DataTable
        columns={columns}
        data={invoices}
        progressPending={loading}
        pagination
        highlightOnHover
        striped
        responsive
      />
    </div>
  );
};

export default OrderInvoices;
