import React, { Fragment, useEffect, useState, useMemo } from "react";
import { LogAudit } from "../../Utils/UsersTrack/AuditLogger";
import { useAuth } from "../../../context/AuthContext";

import {
    CSSTransition,
    TransitionGroup,
} from "../../../utils/TransitionWrapper";
import { Row, Col, Card, CardBody, Button, Input } from "reactstrap";

import PageTitle from "../../../Layout/AppMain/PageTitle";

import DataTable from "react-data-table-component";
import ExportCSV from "../../Components/ExportCSV";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../../../utils/firebase";
import Notification from "../../Widgets/Notifications/Notification";
import { jsPDF } from "jspdf";

// --- MOCK DATA para Dropdowns ---
// Se han ELIMINADO las variables availableSuppliers y availableTransports
// ya que la lista de opciones se carga de manera DINÁMICA en useEffect.
// ---------------------------------

// *******************************************************************
// FUNCIÓN MEJORADA: Generar PDF con múltiples productos y cálculo de IVA
// *******************************************************************
const generateInvoicePDF = (supplierId, products) => {
    // 1. Cálculos de Totales y Mock Data
    const VAT_RATE = 0.21;
    let subtotal = products.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    let vatAmount = subtotal * VAT_RATE;
    let totalFinal = subtotal + vatAmount;

    // Asumimos que todos los productos tienen la misma fecha y proveedor
    const firstProduct = products[0];

    const invoiceData = {
        invoiceNumber: `${supplierId.substring(0, 4)}-${new Date().getTime().toString().slice(-6)}`.toUpperCase(),
        date: firstProduct.creationDate instanceof Date
            ? firstProduct.creationDate.toLocaleDateString('es-ES')
            : new Date().toLocaleDateString('es-ES'),
        companyName: "Your Company S.A.",
        companyAddress: "123 Company Street",
        companyEmail: "compras@tuempresa.com",
        companyVAT: "ES123456789",
        billToName: supplierId,
        billToVAT: "VATBE0363269255", // Ejemplo
        billToEmail: "test@gmail.com", // Ejemplo
        shipToAddress: firstProduct.warehouse || "Almacén Principal",
        subtotal: subtotal.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        totalFinal: totalFinal.toFixed(2),
    };

    const doc = new jsPDF();
    let y = 10;
    const lineSpacing = 6;
    const margin = 15;
    const pageW = doc.internal.pageSize.getWidth();
    let x;

    // 2. Cabecera y Títulos (INVOICE, Datos de la Compañía)
    doc.setFontSize(36);
    doc.setTextColor("#007bff");
    doc.text("INVOICE", margin, y);
    doc.setTextColor("#000000");
    y += lineSpacing * 1.5;
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, margin, y);
    y += lineSpacing;
    doc.text(`Date: ${invoiceData.date}`, margin, y);
    y += lineSpacing * 2;

    doc.setFontSize(12);
    doc.text(invoiceData.companyName, pageW - margin, 25, { align: "right" });
    doc.setFontSize(10);
    doc.text(invoiceData.companyAddress, pageW - margin, 25 + lineSpacing, { align: "right" });
    doc.text(`Email: ${invoiceData.companyEmail}`, pageW - margin, 25 + lineSpacing * 2, { align: "right" });
    doc.text(`VAT: ${invoiceData.companyVAT}`, pageW - margin, 25 + lineSpacing * 3, { align: "right" });
    y = 25 + lineSpacing * 4; // Ajustamos 'y' después de la cabecera derecha

    doc.setDrawColor("#AAAAAA");
    doc.line(margin, y + 2, pageW - margin, y + 2);
    y += lineSpacing * 2;

    // 3. Secciones Bill To y Ship To
    doc.setFontSize(14);
    doc.text("Bill To:", margin, y);
    doc.text("Ship To:", pageW / 2 + 10, y);
    y += lineSpacing;

    doc.setFontSize(10);
    doc.text(invoiceData.billToName, margin, y);
    doc.text(invoiceData.shipToAddress, pageW / 2 + 10, y);
    y += lineSpacing * 2;

    // 4. Tabla de Productos (Detalle)
    const tableStart = y;
    const colW = [15, 55, 25, 20, 25]; // Qty, SKU/Item, Price, Subtotal, Status

    // Encabezado Azul
    doc.setFillColor("#007bff");
    doc.rect(margin, tableStart - 3, pageW - 2 * margin, lineSpacing, 'F');
    doc.setTextColor("#FFFFFF");

    doc.setFontSize(9);
    x = margin + 2;
    doc.text("Qty", x, tableStart + 1);
    x += colW[0];
    doc.text("SKU / Item Details", x, tableStart + 1);
    x += colW[1];
    doc.text("Unit Price (€)", x, tableStart + 1);
    x += colW[2];
    doc.text("Line Total (€)", x, tableStart + 1);
    x += colW[3];
    doc.text("Status / Transport", x, tableStart + 1);

    y = tableStart + lineSpacing + 2;
    doc.setTextColor("#000000");
    doc.setFontSize(9);

    // Iterar sobre todos los productos del proveedor
    products.forEach(item => {
        const lineTotal = (item.quantity * item.unitPrice).toFixed(2);

        x = margin + 2;
        doc.text(String(item.quantity), x, y);
        x += colW[0];
        doc.text(item.sku, x, y);
        x += colW[1];
        doc.text(`€${item.unitPrice.toFixed(2)}`, x, y);
        x += colW[2];
        doc.text(`€${lineTotal}`, x, y);
        x += colW[3];
        doc.text(`${item.status} / ${item.transport}`, x, y);
        y += lineSpacing;
    });

    y += lineSpacing;

    // 5. Totales (Subtotal, IVA 21%, Total)
    const totalX = pageW - margin - 50;
    doc.setFontSize(10);

    doc.text("Subtotal:", totalX, y);
    doc.text(`€${invoiceData.subtotal}`, pageW - margin, y, { align: "right" });
    y += lineSpacing;

    doc.text(`VAT (${(VAT_RATE * 100).toFixed(0)}%):`, totalX, y);
    doc.text(`€${invoiceData.vatAmount}`, pageW - margin, y, { align: "right" });
    y += lineSpacing + 2;

    doc.setFillColor("#F0F0F0");
    doc.rect(totalX - 5, y - 4, pageW - totalX + 5, lineSpacing * 2, 'F');

    doc.setFontSize(12);
    doc.text("Total Final:", totalX, y + 2);
    doc.text(`€${invoiceData.totalFinal}`, pageW - margin, y + 2, { align: "right" });

    // 6. Descargar el archivo
    const fileName = `OC_${supplierId}_${invoiceData.invoiceNumber}.pdf`;
    doc.save(fileName);
};
// *******************************************************************


// --- Componente PurchaseOrdersComponent ---
const PurchaseOrdersComponent = () => {
    const navigate = useNavigate();
    const [selectedRows, setSelectedRows] = useState([]);
    const [data, setData] = useState([]);
    const [submissionStatus, setSubmissionStatus] = useState({
        status: "",
        message: "",
    });
    const [productsList, setProductsList] = useState([]);
    const { currentUser } = useAuth();

    // *******************************************************************
    // FUNCIÓN DE DESCARGA MÚLTIPLE MEJORADA: Agrupa antes de generar PDF
    // *******************************************************************
    const handleDownloadSelectedPDFs = () => {
        if (selectedRows.length === 0) {
            setSubmissionStatus({ status: "warning", message: "Selecciona al menos una orden para descargar." });
            return;
        }

        // 1. Agrupar las filas seleccionadas por Supplier
        const ordersGroupedBySupplier = selectedRows.reduce((acc, row) => {
            const supplier = row.supplier || "NO_SUPPLIER_ASSIGNED";
            if (!acc[supplier]) {
                acc[supplier] = [];
            }
            acc[supplier].push(row);
            return acc;
        }, {});

        const supplierIds = Object.keys(ordersGroupedBySupplier);

        // 2. Generar una factura por cada proveedor
        supplierIds.forEach((supplierId, index) => {
            const productsForSupplier = ordersGroupedBySupplier[supplierId];

            setTimeout(() => {
                generateInvoicePDF(supplierId, productsForSupplier);
            }, index * 200);
        });

        LogAudit({
            user: currentUser?.email || "Unknown",
            action: "Download Grouped PDFs",
            entity: "Purchase Order",
            details: { count: selectedRows.length, suppliers: supplierIds },
        });

        setSubmissionStatus({ status: "success", message: `Generando ${supplierIds.length} factura(s) para los pedidos seleccionados...` });
    };

    // *******************************************************************
    // FUNCIÓN: Manejo de cambio de campo con lógica de precio/transporte
    // *******************************************************************
    const handleFieldChange = async (itemId, field, value) => {
        let updatedItem = {};
        let newUnitPrice = null;
        let newTransport = null;

        const currentItem = data.find(item => item.id === itemId);
        if (!currentItem) return;

        // Lógica de búsqueda de precio si se cambia el proveedor
        if (field === 'supplier') {
            const selectedSupplierData = currentItem.availableSupplierOptions.find(s => s.supplierId === value);
            
            updatedItem = { supplier: value };
            
            // Si el proveedor tiene información, reiniciamos el transporte y precio por defecto (o al primero)
            if (selectedSupplierData) {
                updatedItem.transport = "—"; // Resetear transporte
                updatedItem.unitPrice = selectedSupplierData.unitPrice || currentItem.unitPrice; // Usar el precio base del proveedor
            }
        } 
        // Lógica de búsqueda de precio si se cambia el transporte
        else if (field === 'transport') {
            const selectedSupplierData = currentItem.availableSupplierOptions.find(s => s.supplierId === currentItem.supplier);
            
            if (selectedSupplierData && selectedSupplierData.warehouses) {
                // Asumimos que la lista de transportes está en el primer almacén o en el que coincida con row.warehouse
                const warehouseKey = currentItem.warehouse?.toLowerCase().replace(/[^a-z0-9]/g, '') || Object.keys(selectedSupplierData.warehouses)[0];
                const warehouseData = selectedSupplierData.warehouses[warehouseKey] || Object.values(selectedSupplierData.warehouses)[0];
                
                const transportList = warehouseData?.transport || [];
                const selectedTransport = transportList.find(t => t.name === value);
                
                if (selectedTransport) {
                    newUnitPrice = selectedTransport.unitPrice || currentItem.unitPrice;
                    updatedItem = { transport: value, unitPrice: newUnitPrice };
                } else {
                    updatedItem = { transport: value };
                }
            } else {
                updatedItem = { transport: value };
            }
        } 
        // Para cualquier otro campo
        else {
            updatedItem = { [field]: value };
        }

        // 1. Actualizar el estado local (data)
        const updatedData = data.map((item) =>
            item.id === itemId
                ? { ...item, ...updatedItem }
                : item
        );
        setData(updatedData);

        // 2. Persistir el cambio en Firestore
        try {
            const docRef = doc(db, "purchases", itemId);
            
            // Creamos un objeto para el update de Firestore, ignorando campos nulos o no relevantes
            const firestoreUpdate = {};
            Object.keys(updatedItem).forEach(key => {
                // Aseguramos que el campo 'unitPrice' se guarde correctamente
                if (key === 'unitPrice' || key === 'supplier' || key === 'transport') {
                     firestoreUpdate[key] = updatedItem[key];
                }
            });

            if (Object.keys(firestoreUpdate).length > 0) {
                await updateDoc(docRef, firestoreUpdate);

                LogAudit({
                    user: currentUser?.email || "Unknown",
                    action: `Update Purchase ${field}`,
                    entity: "Purchase Order",
                    details: { purchaseId: itemId, updates: firestoreUpdate },
                });
            }
        } catch (error) {
            console.error(`Error updating purchase ${itemId}:`, error);
            setSubmissionStatus({ status: "error", message: `Error al actualizar la orden.` });
        }
    };

    const handleRowSelected = React.useCallback((state) => {
        setSelectedRows(state.selectedRows);
    }, []);

    const purchaseColumns = useMemo(() => [
        {
            name: "Purchase ID",
            selector: (row) => row.id,
            sortable: true,
            grow: 1,
            header: <span title="Select All">ID</span>
        },
        { name: "Delivery Date", selector: (row) => row.deliveryDate, sortable: true },
        { name: "SKU", selector: (row) => row.sku, sortable: true },
        { name: "Quantity", selector: (row) => row.quantity, sortable: true },
        { name: "Unit Price", selector: (row) => `€${row.unitPrice?.toFixed(2) || '0.00'}`, sortable: true }, // Muestra el precio actualizado
        { name: "Warehouse", selector: (row) => row.warehouse, sortable: true },
        { name: "Status", selector: (row) => row.status, sortable: true },

        // ************************************************************
        // COLUMNA DE PROVEEDOR (DINÁMICA)
        // ************************************************************
        {
            name: "Supplier",
            selector: (row) => row.supplier,
            sortable: true,
            cell: (row) => {
                const options = row.availableSupplierOptions || [];
                
                return (
                    <Input
                        type="select"
                        bsSize="sm"
                        value={row.supplier || '—'} 
                        onChange={(e) => handleFieldChange(row.id, 'supplier', e.target.value)}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="—" disabled>Select Supplier</option>
                        {options.map((s) => (
                            // ✅ Usamos supplierId como key y value
                            <option key={s.supplierId} value={s.supplierId}>
                                {s.supplierId}
                            </option>
                        ))}
                    </Input>
                );
            },
            ignoreRowClick: true,
            minWidth: '160px'
        },

        // ************************************************************
        // COLUMNA DE TRANSPORTE (DINÁMICA y dependiente de Supplier)
        // ************************************************************
        {
            name: "Transport",
            selector: (row) => row.transport,
            sortable: true,
            cell: (row) => {
                // Busca los datos completos del proveedor actualmente seleccionado
                const selectedSupplierData = row.availableSupplierOptions.find(
                    s => s.supplierId === row.supplier
                );
                
                let transportOptions = [];
                let isDisabled = true;

                if (selectedSupplierData && selectedSupplierData.warehouses) {
                    // Intenta encontrar la lista de transportes asociada al almacén (row.warehouse)
                    // (Esta lógica depende de cómo estén estructurados tus datos de Firestore)
                    const warehouseKey = row.warehouse?.toLowerCase().replace(/[^a-z0-9]/g, '') || Object.keys(selectedSupplierData.warehouses)[0];
                    const warehouseData = selectedSupplierData.warehouses[warehouseKey] || Object.values(selectedSupplierData.warehouses)[0];
                    
                    transportOptions = warehouseData?.transport || [];
                    isDisabled = false;
                }

                return (
                    <Input
                        type="select"
                        bsSize="sm"
                        value={row.transport || '—'}
                        onChange={(e) => handleFieldChange(row.id, 'transport', e.target.value)}
                        disabled={isDisabled || transportOptions.length === 0} 
                        style={{ minWidth: '160px' }}
                    >
                        <option value="—" disabled>Select Transport</option>
                        {transportOptions.map((t) => (
                            // ✅ Usamos el nombre del transporte como key y value
                            <option key={t.name} value={t.name}>
                                {`${t.name} (€${t.unitPrice?.toFixed(2) || '0.00'})`}
                            </option>
                        ))}
                    </Input>
                );
            },
            ignoreRowClick: true,
            minWidth: '170px'
        },
    ], [data]);


    // ************************************************************
    // useEffect para la carga de datos (corregido)
    // ************************************************************
    useEffect(() => {
        const getProductSupplierList = async (sku) => {
            const productsRef = collection(db, "products")
            const result = query(productsRef, where("sku", "==", sku));
            const queryProductsSnapshot = await getDocs(result);
            if (!queryProductsSnapshot.empty) {
                const productData = queryProductsSnapshot.docs[0].data();
                // Devolvemos el array que contiene los objetos de proveedores con transporte/precio anidado.
                return productData.supplierList || [];
            }
            return [];
        }

        const fetchData = async () => {
            try {
                const purchasesRef = collection(db, "purchases");
                const querySnapshot = await getDocs(purchasesRef);

                const itemsPromises = querySnapshot.docs.map(async (doc) => {
                    const data = doc.data();

                    // Traemos la lista de proveedores/transportes disponibles para este SKU
                    const supplierList = await getProductSupplierList(data.sku);

                    return {
                        id: doc.id,
                        creationDate: data.creationDate?.toDate() || null,
                        deliveryDate: data.deliveryDate || "",
                        sku: data.sku || "",
                        quantity: data.quantity || 0,
                        status: data.status || "—",
                        
                        // Usamos los valores guardados en Firestore para el estado actual
                        supplier: data.supplier || "—",
                        transport: data.transport || "—",
                        
                        warehouse: data.warehouse || "—",
                        // Usamos el unitPrice guardado
                        unitPrice: data.unitPrice || 0, 
                        
                        // Guardamos la lista completa de opciones para los selectores
                        availableSupplierOptions: supplierList, 
                    };
                });

                const items = await Promise.all(itemsPromises);
                setData(items);
            } catch (error) {
                console.error("Error fetching purchases:", error);
                setSubmissionStatus({ status: "error", message: "Error al cargar las órdenes de compra." });
            }
        };

        fetchData();
    }, []); // El array de dependencias vacío asegura que se ejecute solo al montar.

    return (
        <Fragment>
            <PageTitle
                heading="Purchase Bills Status"
                subheading="Manage and track your purchase orders."
                icon="pe-7s-shopbag icon-gradient bg-happy-itmeo"
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
                    <Notification
                        status={submissionStatus.status}
                        message={submissionStatus.message}
                        onClose={() => setSubmissionStatus({ status: "", message: "" })}
                    />
                    <Row>
                        <Col lg="12">
                            <Card className="main-card mb-3">
                                <CardBody>

                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h4>Purchase Orders ({data.length})</h4>
                                        <div>
                                            <Button
                                                color="success"
                                                onClick={handleDownloadSelectedPDFs}
                                                disabled={selectedRows.length === 0}
                                                className="mr-2"
                                            >
                                                📥 Download Selected PDFs ({selectedRows.length})
                                            </Button>
                                            <ExportCSV data={data} fileName="purchase_orders.csv" />
                                        </div>
                                    </div>

                                    <DataTable
                                        columns={purchaseColumns}
                                        data={data}
                                        pagination
                                        fixedHeader
                                        fixedHeaderScrollHeight="400px"
                                        selectableRows
                                        onSelectedRowsChange={handleRowSelected}
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

export default PurchaseOrdersComponent;