import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

import { Card, CardBody, CardTitle, Row, Col, Table } from "reactstrap";
import "./../style/OrderSummary.css";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../../../utils/firebase";

const OrderSummary = () => {
  const [invoices, setInvoices] = useState([]);

  //PDFs
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    // Company name
    doc.setFontSize(16);
    doc.text("Quantum Mads", 30, 20);

    // Timestamp
    const now = new Date().toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    doc.setFontSize(10);
    doc.text(`Generated on: ${now}`, 14, 30);

    // Line separator
    doc.setDrawColor(180);
    doc.setLineWidth(0.5);
    doc.line(14, 32, 195, 32);

    // Logo (make sure logoBase64 is defined and valid)

    const logoBase64 =
      "data:image/png;base64,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";

    doc.addImage(logoBase64, "PNG", 14, 12, 12, 12); // x, y, width, height

    const tableColumn = [
      "Invoice #",
      "Created At",
      "Client ID",
      "Billing Address",
      "Delivery Address",
      "Quantity",
      "Total (€)",
      "Paid",
      "Shipping",
      "VAT",
    ];

    const tableRows = invoices.map((invoice) => [
      invoice.invoiceNumber || "—",
      invoice.creationDate?.toDate
        ? invoice.creationDate.toDate().toLocaleString("es-ES", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : new Date(invoice.creationDate).toLocaleString("es-ES", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
      invoice.clientId || "—",
      invoice.billingAddress || "—",
      invoice.deliveryAddress || "—",
      Array.isArray(invoice.eanList)
        ? invoice.eanList.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : "0",
      invoice.total?.toFixed(2) || "0.00",
      invoice.paid ? "Yes" : "No",
      invoice.shippingStatus || "—",
      invoice.vatNumber || "—",
    ]);

    doc.autoTable({
      startY: 45,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 10 },
      headStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 20 }, // Invoice #
        1: { cellWidth: 35 }, // Created At
        2: { cellWidth: 35 }, // Client ID
        3: { cellWidth: 35 }, // Billing Address
        4: { cellWidth: 35 }, // Delivery Address
        5: { cellWidth: 20 }, // Quantity
        6: { cellWidth: 25 }, // Total (€)
        7: { cellWidth: 20 }, // Paid
        8: { cellWidth: 25 }, // Shipping
        9: { cellWidth: 30 }, // VAT
      },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 180, 290);
    }

    const timestamp = new Date();
    const datePart = timestamp.toISOString().split("T")[0]; // "2025-09-23"
    const timePart = timestamp.toTimeString().split(" ")[0].replace(/:/g, ""); // "1225"
    doc.save(`invoices_${datePart}_${timePart}.pdf`);
  };

  //Fetch the invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      const snapshot = await getDocs(collection(db, "invoices"));
      const data = snapshot.docs.map((doc) => {
        const raw = doc.data();

        // Transform eanList from map to array
        const eanList = raw.eanList
          ? Object.entries(raw.eanList).map(([ean, item]) => ({
              ean,
              ...item,
            }))
          : [];

        // Calculate total from eanList
        const calculatedTotal = eanList.reduce(
          (sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0),
          0
        );

        return {
          id: doc.id,
          ...raw,
          eanList,
          total: calculatedTotal,
        };
      });

      setInvoices(data);
    };

    fetchInvoices();
  }, []);

  return (
    <Card className="mb-4">
      <CardBody>
        <CardTitle tag="h5">All Invoices</CardTitle>
        <Table responsive bordered hover>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Created At</th>
              <th>Client ID</th>
              <th>Billing Address</th>
              <th>Delivery Address</th>
              <th>Products</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Shipping Status</th>
              <th>VAT Number </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNumber || "—"}</td>
                <td>{/* Created At logic */}</td>
                <td>{invoice.clientId || "—"}</td>
                <td>{invoice.billingAddress || "—"}</td>
                <td>{invoice.deliveryAddress || "—"}</td>
                <td>
                  {Array.isArray(invoice.eanList) &&
                  invoice.eanList.length > 0 ? (
                    <ul style={{ paddingLeft: "1rem", marginBottom: 0 }}>
                      {invoice.eanList.map((item, index) => (
                        <li key={index}>
                          {item.description} ({item.sku || item.ean}) —{" "}
                          {item.quantity} × {item.unitPrice.toFixed(2)} € ={" "}
                          <strong>
                            {(item.unitPrice * item.quantity).toFixed(2)} €
                          </strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {Array.isArray(invoice.eanList) && invoice.eanList.length > 0
                    ? invoice.eanList.reduce(
                        (sum, item) => sum + (item.quantity || 0),
                        0
                      )
                    : "0"}
                </td>
                <td>{invoice.total?.toFixed(2) || "0.00"} €</td>
                <td>{invoice.paid ? "Yes" : "No"}</td>
                <td>{invoice.shippingStatus || "—"}</td>
                <td>{invoice.vatNumber || "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="export-buttons">
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>
            Disabled for now
          </p>

          <button className="btn btn-outline-secondary" onClick={exportPDF}>
            📊 Export as PDF
          </button>
        </div>
      </CardBody>
    </Card>
  );
};

export default OrderSummary;
