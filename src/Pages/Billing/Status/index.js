import React, { Fragment, useEffect, useState } from "react";
import { LogAudit } from "../../Utils/UsersTrack/AuditLogger";
import { useAuth } from "../../../context/AuthContext";

import {
  CSSTransition,
  TransitionGroup,
} from "../../../utils/TransitionWrapper";
import PageTitle from "../../../Layout/AppMain/PageTitle";
import { Row, Col, Button, Card, CardBody } from "reactstrap";
import DataTable from "react-data-table-component";
import {
  collection,
  getDocs,
  query,
  where,
  documentId,
} from "firebase/firestore";
import { db } from "../../../utils/firebase";
import ExportCSV from "../../Components/ExportCSV";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const StatusComponent = () => {
  const { currentUser } = useAuth();

  const [data, setData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [toggledClearRows, setToggleClearRows] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleDownloadInvoicePdf = async (row) => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();

    const {
      invoiceCounter,
      name,
      billingAddress,
      deliveryAddress,
      vatNumber,
      email,
      scps,
      totalAmount,
      totalBlockedAmount,
      shippingStatus, // 1. Added shippingStatus
    } = row;

    // --- Lógica para determinar el tipo de documento ---
    const isInvoice = shippingStatus !== 'pending';
    const documentTitle = isInvoice ? "INVOICE" : "DELIVERY NOTE";
    const documentTypeLabel = isInvoice ? "Invoice" : "Delivery Note";
    const documentFilename = isInvoice ? `invoice_details_${invoiceCounter}.pdf` : `delivery_note_details_${invoiceCounter}.pdf`;

    // --- Generar la primera página del documento ---
    doc.setFontSize(26);
    doc.setTextColor(30, 144, 255);
    // 3. Usar el título determinado
    doc.text(documentTitle, 10, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    // Usar la etiqueta determinada
    doc.text(`${documentTypeLabel} #: ${invoiceCounter}`, 10, 28);
    doc.text(`Date: ${currentDate}`, 10, 34);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Your Company S.A.", 150, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("123 Company Street", 150, 25);
    doc.text("City, Country, 12345", 150, 30);
    doc.text("Email: company@email.com", 150, 35);
    doc.text("VAT: ES123456789", 150, 40);

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 45, 200, 45);

    let yPos = 55;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Bill To:", 10, yPos);
    yPos += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(name || "N/A", 10, yPos);
    yPos += 5;
    doc.text(billingAddress || "N/A", 10, yPos);
    yPos += 5;
    doc.text(`VAT: ${vatNumber || "N/A"}`, 10, yPos);
    yPos += 5;
    doc.text(`Email: ${email || "N/A"}`, 10, yPos);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Ship To:", 100, 55);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(deliveryAddress || "N/A", 100, 62);

    yPos = 80;

    const summaryTableHeaders = [["ID", "Status", "Total Amount"]];
    const summaryTableData = scps
      ? scps.map((scp) => {
        const total = 0; // Se mantiene 0 ya que los datos reales de 'total' parecen faltar aquí
        // Añadir el shippingStatus si estamos en un Delivery Note
        const status = isInvoice ? "N/A" : shippingStatus.toUpperCase();
        return [scp, status, `$${total.toFixed(2)}`];
      })
      : [];
    if (summaryTableData.length === 0) {
      summaryTableData.push(["No items found", "", ""]);
    }

    doc.autoTable({
      startY: yPos,
      head: summaryTableHeaders,
      body: summaryTableData,
      theme: "striped",
      headStyles: { fillColor: [30, 144, 255] },
    });

    yPos = doc.autoTable.previous.finalY + 10;
    if (isInvoice) {
      const taxes = 21;
      const taxRateMultiplier = 1 + (taxes / 100);
      const taxAmount = totalAmount * (taxes / 100);

      const totals = [
        ["Subtotal:", `$${totalAmount.toFixed(2)}`],
        ["Taxes:", `$${taxAmount.toFixed(2)}`],
        [
          "Total:",
          `$${(totalAmount * taxRateMultiplier).toFixed(2)}`,
        ],
      ];

      doc.autoTable({
        startY: yPos,
        body: totals,
        theme: "plain",
        styles: { fontSize: 10, fontStyle: "bold" },
        columnStyles: {
          0: { halign: "right" },
          1: { halign: "right" },
        },
        bodyStyles: { fillColor: [245, 245, 245] },
        margin: { left: 140 },
      });

      // Actualizar yPos para el texto final
      yPos = doc.autoTable.previous.finalY + 10;
    } else {
      // Si es un Albarán, se añade un espacio o se sigue la posición
      yPos = yPos + 40;
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "This document is a Delivery Note and does not include pricing information.",
        10,
        yPos
      );
    }

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Restablecer color para el texto final
    doc.text(
      "Thank you for your business!",
      10,
      doc.internal.pageSize.height - 10
    );

    // --- Generar la segunda página con el desglose ---
    doc.addPage();

    doc.setFontSize(20);
    doc.setTextColor(30, 144, 255);
    doc.text(`Details per ID (${documentTypeLabel})`, 10, 20); // Título de la segunda página
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${documentTypeLabel} #: ${invoiceCounter}`, 10, 28);
    doc.text(`Customer: ${name}`, 10, 34);

    let detailYPos = 40;
    let ordersData = [];
    if (scps && scps.length > 0) {
      const ordersRef = collection(db, "orders");
      const scpChunks = [];
      for (let i = 0; i < scps.length; i += 10) {
        scpChunks.push(scps.slice(i, i + 10));
      }

      for (const chunk of scpChunks) {
        try {
          const q = query(ordersRef, where("scp", "in", chunk));
          const querySnapshot = await getDocs(q);

          querySnapshot.docs.forEach((orderDoc) => {
            const order = orderDoc.data();
            const scpId = orderDoc.id;

            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text(`ID: ${scpId}`, 10, detailYPos);

            detailYPos += 5;

            // El código de mapeo de productos interno es complejo y redundante, lo simplificamos un poco
            // y nos aseguramos de no mostrar precios si es un Albarán.

            // Recolectar datos de órdenes (simplificando la estructura anidada)
            let currentOrdersData = [];

            // Asumiendo que la estructura correcta para obtener productos es order.eanList
            if (order.eanList && typeof order.eanList === "object") {
              Object.keys(order.eanList).forEach((ean) => {
                const product = order.eanList[ean];
                if (product && typeof product === "object") {
                  currentOrdersData.push({
                    description: product.description || "N/A",
                    quantity: product.quantity || 1,
                    unitPrice: product.unitPrice || 0,
                    totalPrice: (product.quantity || 0) * (product.unitPrice || 0),
                  });
                }
              });
            }

            const productTableBody = currentOrdersData.map((product) => {
              const row = [
                product.description,
                product.quantity,
                isInvoice ? `$${product.unitPrice.toFixed(2)}` : "---", // Ocultar precio unitario
                isInvoice ? `$${product.totalPrice.toFixed(2)}` : "---", // Ocultar precio total
              ];
              return row;
            });

            // Si hay datos para la tabla, la dibujamos
            if (productTableBody.length > 0) {
              detailYPos += 2;
              doc.autoTable({
                startY: detailYPos,
                head: [["Item", "Quantity", "Unit Price", "Total"]],
                body: productTableBody,
                theme: "striped",
                headStyles: { fillColor: [100, 100, 100] },
                didDrawPage: (data) => {
                  // Asegurar que el siguiente texto comience después de la tabla o en la nueva página
                  detailYPos = data.cursor.y + 5;
                }
              });
              detailYPos = doc.autoTable.previous.finalY + 5;
            }

            // Manejo de salto de página
            if (detailYPos > 250) {
              doc.addPage();
              detailYPos = 20;
            }
          });
        } catch (error) {
          console.error("Error fetching orders data:", error);
          doc.text(
            `Error fetching details for: ${chunk.join(", ")}`,
            10,
            detailYPos
          );
          detailYPos += 10;
        }
      }
    } else {
      doc.text(`No SCPs found for this ${documentTypeLabel}.`, 10, detailYPos);
    }

    // 4. Usar el nombre de archivo determinado
    doc.save(documentFilename);

    LogAudit({
      user: currentUser?.email || "Unknown",
      action: `Download ${documentTitle} PDF`, // Loggear el tipo de documento correcto
      entity: documentTitle,
      details: {
        invoiceCounter,
        clientName: name,
        scps: scps,
        totalAmount: isInvoice ? totalAmount : "N/A", // Ocultar en el log si es albarán
        totalBlockedAmount: isInvoice ? totalBlockedAmount : "N/A",
        documentType: documentTitle, // Añadir el tipo de documento al log
      },
    });
  };

  const columns = [
    {
      name: "#Invoice",
      selector: (row) => row.invoiceCounter,
      sortable: true,
      reorder: true,
      conditionalCellStyles: [
        {
          when: (row) => row.financialStatus === "paid",
          style: { borderLeft: "4px solid green" },
        },
        {
          when: (row) => row.financialStatus === "pending",
          style: { borderLeft: "4px solid orange" },
        },
        {
          when: (row) => row.financialStatus === "overdue",
          style: { borderLeft: "4px solid red" },
        },
      ],
    },
    {
      name: "Customer Name",
      selector: (row) => row.name,
      sortable: true,
      reorder: true,
    },
    {
      name: "Creation Date",
      selector: (row) =>
        row.creationDate
          ? row.creationDate.toDate().toLocaleDateString()
          : "N/A",
      sortable: true,
      reorder: true,
    },
    {
      name: "Financial Status",
      selector: (row) => row.financialStatus,
      sortable: true,
      reorder: true,
    },
    {
      name: "Shipping Status",
      selector: (row) => row.shippingStatus,
      sortable: true,
      reorder: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <Button
          color="primary"
          size="sm"
          onClick={() => handleDownloadInvoicePdf(row)}
        >
          Download PDF
        </Button>
      ),
      ignoreRowClick: true,
    },
  ];

  const handleRowSelected = React.useCallback((state) => {
    setSelectedRows(state.selectedRows);
  }, []);

  const fetchClientData = async (clientId) => {
    if (!clientId) return "Unknown Client";
    const clientsRef = collection(db, "clients");
    const q = query(clientsRef, where("id", "==", clientId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const clientData = querySnapshot.docs[0].data();
      return clientData || "Unnamed Client";
    } else {
      return null;
    }
  }

  const fetchData = async () => {
    try {
      const ordersRef = collection(db, "orders");
      const qInvoices = query(
        ordersRef,
        where("status", "==", "billing")
      );
      const querySnapshot = await getDocs(qInvoices);
      const promises = querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const totalAmount = parseFloat(data.totalAmount);
        const totalBlockedAmount = parseFloat(data.totalBlockedAmount);
        const clientData = await fetchClientData(data.clientId);

        return {
          id: doc.id,
          ...data,
          name: clientData?.name || "N/A",
          creationDate: data.creationDate || null,
          invoiceCounter: clientData?.invoiceCounter ?? "N/A",
          totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
          totalBlockedAmount: isNaN(totalBlockedAmount) ? 0 : totalBlockedAmount,
          financialStatus: data.financialStatus || "pending",
          shippingStatus: data.shippingStatus || "pending",
          billingAddress: clientData?.billingAddress || "N/A",
          deliveryAddress: clientData?.deliveryAddress || "N/A",
          vatNumber: clientData?.vatNumber || "N/A",
          email: clientData?.email || "N/A",
          totalAmount,
          totalBlockedAmount,
        };
      });

      // 2. Esperamos a que TODAS las promesas en el array 'promises' se resuelvan
      const items = await Promise.all(promises);

      // 3. Ahora 'items' contiene el array de objetos con los datos completos
      setData(items);
    } catch (error) {
      console.error("Error al obtener los datos de Firestore:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🌟 AÑADIR LA LÓGICA DE FILTRADO AQUÍ 🌟
  const filteredData = data.filter((row) => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    if (!lowerCaseSearch) {
      return true; // Mostrar todo si la búsqueda está vacía
    }

    // Combina los campos que quieres buscar en una sola cadena
    const invoiceCounter = row.invoiceCounter || "";
    const name = row.name || "";
    const financialStatus = row.financialStatus || "";
    const shippingStatus = row.shippingStatus || "";

    const rowData = (
      invoiceCounter +
      name +
      financialStatus +
      shippingStatus
    ).toLowerCase();

    return rowData.includes(lowerCaseSearch);
  });
  // ------------------------------------------

  return (
    <Fragment>
      <PageTitle
        heading="Billing Status Tables"
        subheading="Manage your billing with status tables."
        icon="pe-7s-drawer icon-gradient bg-happy-itmeo"
      />
      <TransitionGroup>
        <CSSTransition
          component="div"
          classNames="TabsAnimation"
          appear={true}
          timeout={1500}
          enter={false}
          exit={false}
        >
          <Row>
            <Col lg="12">
              <Card className="mb-3">
                <CardBody>
                  <div
                    className="search-bar"
                    style={{ textAlign: "left", marginBottom: "1rem" }}
                  >
                    <div
                      className="search-wrapper"
                      style={{
                        position: "relative",
                        width: "220px",
                        display: "inline-block",
                      }}
                    >
                      <svg
                        className="search-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                        style={{
                          position: "absolute",
                          left: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 2,
                          pointerEvents: "none",
                        }}
                      >
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
                      </svg>

                      <input
                        type="text"
                        placeholder="Search by Invoice, Name or Status" // Placeholder mejorado
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="list-product-search-input"
                        style={{
                          paddingLeft: "30px",
                          paddingRight: "30px",
                          paddingTop: "6px",
                          paddingBottom: "6px",
                          width: "100%",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          height: "32px",
                          boxSizing: "border-box",
                          backgroundColor: "white",
                        }}
                      />

                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          style={{
                            position: "absolute",
                            right: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            backgroundColor: "#eee",
                            border: "none",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#555",
                            transition: "background-color 0.3s ease",
                            zIndex: 3,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#ccc")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#eee")
                          }
                          aria-label="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <ExportCSV data={filteredData} fileName="invoices.csv" />
                  </div>
                  <DataTable
                    data={filteredData}
                    columns={columns}
                    pagination
                    fixedHeader
                    fixedHeaderScrollHeight="400px"
                    onSelectedRowsChange={handleRowSelected}
                    clearSelectedRows={toggledClearRows}
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </CSSTransition>
      </TransitionGroup>
    </Fragment>
  );
};

export default StatusComponent;