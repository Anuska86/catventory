import React, { Fragment, useEffect, useState } from "react";
import { LogAudit } from "../../Utils/UsersTrack/AuditLogger";
import { useAuth } from "../../../context/AuthContext";

import {
  CSSTransition,
  TransitionGroup,
} from "../../../utils/TransitionWrapper";
import {
  Row,
  Col,
  Card,
  CardBody,
  Button,
  CardHeader,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import ModalForm from "../../Tables/RegularTables/Examples/ModalForm";

import PageTitle from "../../../Layout/AppMain/PageTitle";

import DataTable from "react-data-table-component";
import ExportCSV from "../../Components/ExportCSV";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../utils/firebase";

// Importar el nuevo modal de selección para la fusión parcial
import PartialMergeSelectorModal from './PartialMergeSelectorModal'; 


// --- START: Funciones Auxiliares de Facturación (Copiadas) ---

const generateSCA = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const randomChars = Math.random().toString(36).substring(2, 6);

  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
  return `${timestamp}-${randomChars}`.toUpperCase();
};

const getInvoiceNumber = async (clientId) => {
  const clientsRef = collection(db, "clients");
  const q = query(clientsRef, where("id", "==", clientId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.error(`Cliente con clientId ${clientId} no encontrado.`);
    return 1;
  }

  const clientDoc = querySnapshot.docs[0];
  const newInvoiceNumber = (clientDoc.data().invoiceCounter || 0) + 1;

  await updateDoc(doc(db, "clients", clientDoc.id), {
    invoiceCounter: newInvoiceNumber,
  });
  return newInvoiceNumber;
};

// **NOTA IMPORTANTE:** Esta función createInvoice se usa aquí para la fusión total 
// y el envío individual. Para la Fusión Parcial, deberá ser adaptada,
// o se deberá crear una nueva función que gestione el *split* de órdenes.
const createInvoice = async (invoiceData, orders, currentUser) => {
  const newInvoiceNumber = await getInvoiceNumber(invoiceData.clientId);
  const newSCA = generateSCA();

  const newInvoice = {
    invoiceNumber: newInvoiceNumber,
    creationDate: new Date(),
    status: "billing",
    financialStatus: "pending",
    shippingStatus: "send",
    sca: newSCA,
    scps: invoiceData.scps,
    totalAmount: invoiceData.totalAmount || 0,
    totalBlockedAmount: invoiceData.totalBlockedAmount || 0,
    billingAddress: invoiceData.billingAddress || "",
    clientId: invoiceData.clientId || "",
    deliveryAddress: invoiceData.deliveryAddress || "",
    email: invoiceData.email || "",
    incoterm: invoiceData.incoterm || "",
    name: invoiceData.name || "",
    paymentDueDates: invoiceData.paymentDueDates || 0,
    vatNumber: invoiceData.vatNumber || "",
    // Se podrían añadir aquí los productos seleccionados si fuera la función de Fusión Parcial
    // products: invoiceData.products || []
  };

  await addDoc(collection(db, "invoices"), newInvoice);

  for (const order of orders) {
    const orderRef = doc(db, "orders", order.orderId); // Usar orderId
    // En la fusión total o envío, se actualiza el estado a 'billing'.
    // En la fusión parcial, esto solo se hace si el 100% de la orden se fusiona.
    await updateDoc(orderRef, {
      status: "billing",
    });
  }

  LogAudit({
    user: currentUser?.email || "Unknown",
    action: "Create Invoice",
    entity: "Invoice",
    details: {
      invoiceNumber: newInvoiceNumber,
      sca: newSCA,
      client: invoiceData.name,
      scps: invoiceData.scps,
      totalAmount: invoiceData.totalAmount,
      totalBlockedAmount: invoiceData.totalBlockedAmount,
    },
  });

  return newInvoiceNumber;
};

// --- END: Funciones Auxiliares de Facturación ---

const BackOrderComponent = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [currentItem, setCurrentItem] = React.useState(null);
  const [data, setData] = useState([]);
  const [clientMap, setClientMap] = useState({});
  const [selectedRows, setSelectedRows] = useState([]); // Pedidos seleccionados en la tabla

  // --- START: Nuevos estados para Modales ---
  const [toggledClearRows, setToggleClearRows] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [scpsToMerge, setScpsToMerge] = useState([]);
  const [clientToMerge, setClientToMerge] = useState("");
  const [showSendModal, setShowSendModal] = useState(false);
  const [ordersToSend, setOrdersToSend] = useState([]);
  // Estado para el desplegable (usado en Merge)
  const [sendOption, setSendOption] = useState('all'); 
  // ESTADO PARA EL NUEVO MODAL DE SELECCIÓN DE PRODUCTOS
  const [showProductSelectorModal, setShowProductSelectorModal] = useState(false);
  // --- END: Nuevos estados para Modales ---

  const { currentUser } = useAuth();

  const toggleModal = () => setModalOpen(!modalOpen);
  const toggleProductSelectorModal = () => 
      setShowProductSelectorModal(!showProductSelectorModal);

  // --- Lógica de Manejo de Filas Seleccionadas ---
  const handleRowSelected = React.useCallback((state) => {
    setSelectedRows(state.selectedRows);
  }, []);

  // --- Lógica de Fusión (Merge) ---

  // **NUEVA FUNCIÓN:** Maneja la fusión después de que el usuario selecciona cantidades parciales.
  const handleFinalPartialMerge = async (finalMergeData) => {
    // Cierra el modal de selección de productos
    toggleProductSelectorModal();

    console.log("Datos listos para la fusión parcial:", finalMergeData);

    try {
        // 1. Obtener los datos base del primer pedido seleccionado (para la cabecera de la factura)
        const firstOrder = selectedRows.find(o => o.clientId === finalMergeData.clientId);
        if (!firstOrder) throw new Error("Could not find base order data.");

        // 2. Crear el objeto invoiceData con la información parcial/fusionada.
        const invoiceData = {
            ...firstOrder, // Copiar cabeceras como billingAddress, incoterm, etc.
            name: finalMergeData.clientName,
            clientId: finalMergeData.clientId,
            // Lista de SCPs originales que se están fusionando
            scps: finalMergeData.originalOrders.map(id => selectedRows.find(r => r.orderId === id)?.scp).filter(Boolean),
            totalAmount: parseFloat(finalMergeData.totalAmount),
            totalBlockedAmount: 0, // Recalcular si es necesario, pero simplificamos a 0 aquí.
            // **IMPORTANTE:** Aquí se incluiría la lista de productos y cantidades seleccionadas
            products: finalMergeData.mergedProducts, 
        };

        // 3. Crear la factura
        // **NOTA:** Aquí se usa la función `createInvoice` original, que actualiza las órdenes a 'billing'.
        // Para una fusión *realmente* parcial, DEBERÍAS:
        // a) Crear una NUEVA orden "remnant" con las cantidades restantes.
        // b) O, si la orden se vacía, actualizar su estado a 'billing'/'closed'.
        
        // **Por simplicidad, en este PLACEHOLDER, solo creamos la factura y mostramos el resultado.**
        const invoiceNumber = await getInvoiceNumber(invoiceData.clientId); // Solo obtenemos el número
        
        // Simular la creación de la factura (omitiendo la llamada a addDoc y updateDoc por la complejidad del split)
        // const invoiceNumber = await createInvoice(invoiceData, selectedRows, currentUser); 

        alert(
            `Fusión Parcial Exitosa (SIMULADA). Factura #${invoiceNumber} creada con ${finalMergeData.mergedProducts.length} ítems. **PENDIENTE DE LÓGICA DE SPLIT EN FIREBASE.**`
        );
        
        // Limpiar el estado y refrescar la tabla
        setToggleClearRows(!toggledClearRows);
        setSelectedRows([]);
        fetchData(); 

    } catch (error) {
        console.error("Error al completar la Fusión Parcial:", error);
        alert("Ocurrió un error al procesar la fusión parcial: " + error.message);
    }
  };


  const handleMergeBilling = () => {
    if (selectedRows.length < 2) {
      alert("Por favor, selecciona al menos dos filas para fusionar.");
      return;
    }

    const firstClientId = selectedRows[0].clientId;
    const allSameClient = selectedRows.every(
      (row) => row.clientId === firstClientId
    );

    if (!allSameClient) {
      alert("Solo se pueden fusionar pedidos del mismo cliente.");
      return;
    }

    const selectedScps = selectedRows.map((row) => row.scp);
    const clientName = selectedRows[0].clientName;

    LogAudit({
      user: currentUser?.email || "Unknown",
      action: "Initiate BackOrder Merge",
      entity: "Invoice",
      details: {
        scps: selectedScps,
        client: clientName,
      },
    });

    setScpsToMerge(selectedScps);
    setClientToMerge(selectedRows[0].clientName);
    setShowMergeModal(true);
  };

  const handleConfirmMerge = async (selectedOption) => {
    // 1. CIERRA el modal de Fusión
    setShowMergeModal(false); 

    // Lógica para Fusión Parcial: Abre el selector de productos
    if (selectedOption === 'partial') {
        // 2. ABRE el modal de selección de productos
        setShowProductSelectorModal(true); 
        
        // La fusión real ocurre al confirmar el segundo modal (handleFinalPartialMerge)
        return; 
    }

    // Lógica para Fusión Total: Procede con la factura (Si selectedOption === 'all')
    try {
      const firstOrder = selectedRows[0];
      // ... (código de fusión total)
      if (!firstOrder.clientId) {
        alert(
          "No se pudo encontrar el ID del cliente para el pedido seleccionado."
        );
        return;
      }

      const totalBlockedAmount = selectedRows.reduce(
        (total, row) => total + (parseFloat(row.totalBlockedAmount) || 0),
        0
      );

      const invoiceData = {
        billingAddress: firstOrder.billingAddress,
        clientId: firstOrder.clientId,
        deliveryAddress: firstOrder.deliveryAddress,
        email: firstOrder.email,
        incoterm: firstOrder.incoterm,
        name: firstOrder.clientName,
        paymentDueDates: firstOrder.paymentDueDates,
        vatNumber: firstOrder.vatNumber,
        scps: selectedRows.map((row) => row.scp),
        totalAmount: selectedRows.reduce(
          (total, row) => total + (row.totalAmount || 0),
          0
        ),
        totalBlockedAmount: parseFloat(totalBlockedAmount.toFixed(2)),
      };

      const invoiceNumber = await createInvoice(invoiceData, selectedRows, currentUser);

      alert(
        `Se han fusionado los SCPs seleccionados en la factura #${invoiceNumber} (Modo: Total).`
      );
      setToggleClearRows(!toggledClearRows);
      setSelectedRows([]);
      fetchData(); // Volver a cargar los datos para ver los cambios
    } catch (error) {
      console.error("Error al fusionar SCPs:", error);
      alert("Hubo un error al fusionar los SCPs.");
    }
  };

  // --- Lógica de Envío (Send) ---

  const handleSendBilling = () => {
    if (selectedRows.length === 0) {
      alert(
        "Por favor, selecciona al menos una fila para enviar la facturación."
      );
      return;
    }
    
    setOrdersToSend(selectedRows);
    setShowSendModal(true);
  };

  // Función de confirmación de envío (limpia, sin lógica parcial)
  const handleConfirmSend = async () => { 
    setShowSendModal(false);

    try {
      // Se itera sobre todos los pedidos seleccionados para facturar
      for (const order of ordersToSend) {
        if (!order.clientId) {
          alert(
            `No se pudo encontrar el ID del cliente para el ID ${order.scp}.`
          );
          continue;
        }

        const totalBlockedAmount = parseFloat(order.totalBlockedAmount || 0).toFixed(2);

        const invoiceData = {
          billingAddress: order.billingAddress,
          clientId: order.clientId,
          deliveryAddress: order.deliveryAddress,
          email: order.email,
          incoterm: order.incoterm,
          name: order.clientName,
          paymentDueDates: order.paymentDueDates,
          vatNumber: order.vatNumber,
          scps: [order.scp],
          totalAmount: order.totalAmount,
          totalBlockedAmount: parseFloat(totalBlockedAmount),
        };

        const invoiceNumber = await createInvoice(invoiceData, [order], currentUser);
        
        LogAudit({
          user: currentUser?.email || "Unknown",
          action: "BackOrder Invoice Created",
          entity: "Invoice",
          details: {
            invoiceNumber,
            scp: order.scp,
            clientId: order.clientId,
            clientName: order.clientName,
            totalAmount: order.totalAmount,
          },
        });
      }

      alert(
        `Se ha enviado la facturación de ${ordersToSend.length} pedidos y se ha actualizado su estado.`
      );
      setToggleClearRows(!toggledClearRows);
      fetchData(); 
      setOrdersToSend([]);
    } catch (error) {
      console.error(
        "Error al enviar la facturación o actualizar la orden:",
        error
      );
      alert("Hubo un error al procesar la solicitud.");
    }
  };

  const handleEdit = (item) => {
    if (!item?.scp) return;
    navigate(`/orders/${item.scp}`, { state: { clientName: item.clientName, poNumber: item.poNumber } });
  };

  const handleDelete = (item) => {
    alert(`Deleting item with id: ${item.orderId}`);
    const updatedProducts = data.filter((p) => p.orderId !== item.orderId);
    setData(updatedProducts);
  };

  const handleSave = (updatedItem) => {
    const updatedProducts = data.map((p) =>
      p.orderId === updatedItem.orderId ? updatedItem : p
    );
    setData(updatedProducts);
  };

  const handlePriceChange = (itemId, newPrice) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.orderId === itemId
          ? { ...item, unitPrice: parseFloat(newPrice) || 0 }
          : item
      )
    );
  };
  
  // --- Columna de Tabla (Igual) ---
  const productColumns = [
    { name: "Client Name", selector: (row) => row.clientName, sortable: true, width: "140px", },
    { name: "Internal ID", selector: (row) => row.scp, sortable: true, },
    { name: "Creation Date", selector: (row) => row.creationDate ? row.creationDate.toLocaleDateString() : "Date not available", sortable: true, width: "120px", },
    { name: "PO Number", selector: (row) => row.poNumber, sortable: true, width: "120px", },
    { name: "Status", selector: (row) => row.status, sortable: true, width: "120px", },
    { name: "Flexibility", selector: (row) => row.backOrder, sortable: true, width: "100px", },
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <Button color="primary" size="sm" onClick={() => handleEdit(row)}>Edit</Button>
          <Button color="danger" size="sm" style={{ marginLeft: "2px" }} onClick={() => handleDelete(row)}>Delete</Button>
        </div>
      ),
      ignoreRowClick: true,
      width: "120px",
    },
  ];

  // --- Lógica de Carga de Datos (Mejorada) ---

  const fetchClientData = async (clientId) => {
    const clientsRef = collection(db, "clients");
    const qClients = query(clientsRef, where("id", "==", clientId)); 
    const clientDocs = await getDocs(qClients);

    if (!clientDocs.empty) {
      const clientData = clientDocs.docs[0].data();
      return {
        clientName: clientData.name || "Nombre no disponible",
        billingAddress: clientData.billingAddress || "",
        deliveryAddress: clientData.deliveryAddress || "",
        email: clientData.email || "",
        incoterm: clientData.incoterm || "",
        paymentDueDates: clientData.paymentDueDates || 0,
        vatNumber: clientData.vatNumber || "",
      };
    }
    return { clientName: "Cliente no encontrado" };
  };

  const fetchData = async () => {
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("status", "==", 'order'));
      const querySnapshot = await getDocs(q);

      const itemsPromises = querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const clientId = data.clientId || "";
        const clientInfo = clientId ? await fetchClientData(clientId) : { clientName: "ID de cliente no disponible" };

        const eanList = data.eanList || {};
        const products = Object.values(eanList).map((prod) => ({
          ...prod,
          unitPrice: prod.transport?.unitPrice || 0,
          selectedWarehouse: prod.transport?.warehouse || "—",
        }));

        const totalBlockedAmount = products.reduce(
          (sum, prod) => sum + (prod.isBlocked ? (prod.totalPrice || 0) : 0),
          0
        );
        return {
          orderId: doc.id,
          clientId,
          ...clientInfo, 
          creationDate: data.creationDate?.toDate() || null,
          currency: data.currency || "",
          poNumber: data.poNumber || "",
          backOrder: data.backOrder === true ? "Yes" : "No",
          status: data.status || "",
          scp: data.scp || "",
          products,
          totalAmount: data.totalAmount || 0, 
          totalBlockedAmount: totalBlockedAmount.toFixed(2), 
        };
      });

      const items = await Promise.all(itemsPromises);
      setData(items);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); 

  // --- Renderizado del Componente ---

  return (
    <Fragment>
      <PageTitle
        heading="Order Status Tables"
        subheading="Manage your orders with status tables."
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
              <Card className="main-card mb-3">
                <CardHeader className="card-header-tab">
                  <div className="card-header-title font-size-lg text-capitalize fw-normal">
                    <Button
                      color="success"
                      onClick={handleSendBilling}
                      disabled={selectedRows.length === 0}
                    >
                      Send Billing
                    </Button>
                  </div>
                  <div className="card-header-title font-size-lg text-capitalize fw-normal">
                    <Button
                      color="info"
                      style={{ marginLeft: "15px" }}
                      onClick={handleMergeBilling}
                      disabled={selectedRows.length < 2}
                    >
                      Merge Billing
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  <DataTable
                    columns={productColumns}
                    data={data}
                    pagination
                    fixedHeader
                    fixedHeaderScrollHeight="400px"
                    selectableRows
                    onSelectedRowsChange={handleRowSelected}
                    onPriceChange={handlePriceChange}
                    clearSelectedRows={toggledClearRows}
                    actions={<ExportCSV data={data} fileName="products.csv" />}
                  />
                  <ModalForm
                    isOpen={modalOpen}
                    toggle={toggleModal}
                    itemData={currentItem}
                    onSave={handleSave}
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </CSSTransition>
      </TransitionGroup>

      {/* --- START: Modales de Confirmación --- */}
      
      {/* 1. MODAL DE FUSIÓN (CON DESPLEGABLE DE OPCIÓN) */}
      <Modal
        isOpen={showMergeModal}
        toggle={() => setShowMergeModal(!showMergeModal)}
      >
        <ModalHeader toggle={() => setShowMergeModal(!showMergeModal)}>
          Confirm Order Merger
        </ModalHeader>
        <ModalBody>
          Are you sure you want to merge the following orders (
          {scpsToMerge.length}) from customer <strong>{clientToMerge}</strong> into a single delivery note?
          <br />
          <br />

          {/* DESPLEGABLE EN EL MODAL DE FUSIÓN */}
          <div className="mb-3">
            <label htmlFor="merge-option" className="form-label">
              <strong>Select the product merging mode:</strong>
            </label>
            <select
              id="merge-option"
              className="form-control"
              value={sendOption}
              onChange={(e) => setSendOption(e.target.value)}
            >
              <option value="all">Merge ALL products from the orders</option>
              <option value="partial">Merge ONLY SOME products from each order</option>
            </select>

            {/* Mensaje de ayuda basado en la opción */}
            {sendOption === 'partial' && (
              <small className="text-warning mt-2 d-block">
                When you select 'ONLY SOME', a product selection window will open upon confirmation.
              </small>
            )}
          </div>

          <strong>Orders to be merged:</strong>
          <ul>
            {scpsToMerge.map((scpItem) => (
              <li key={scpItem}>{scpItem}</li>
            ))}
          </ul>
          Are you sure you want to contact the warehouse?
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setShowMergeModal(false)}>
            Cancel
          </Button>
          {/* PASAR LA OPCIÓN SELECCIONADA A LA FUNCIÓN DE CONFIRMACIÓN DE MERGE */}
          <Button color="primary" onClick={() => handleConfirmMerge(sendOption)}>
            OK (Merge/Continue)
          </Button>
        </ModalFooter>
      </Modal>

      {/* 2. MODAL DE ENVÍO (LIMPIO) */}
      <Modal
        isOpen={showSendModal}
        toggle={() => setShowSendModal(!showSendModal)}
      >
        <ModalHeader toggle={() => setShowSendModal(!showSendModal)}>
          Confirm Shipping to Billing
        </ModalHeader>
        <ModalBody>
          Are you sure you want to send the following orders to billing ({ordersToSend.length})?
          <br />
          <br />

          <strong>Orders to be sent:</strong>
          <ul>
            {ordersToSend.map((order) => (
              <li key={order.orderId}>
                {order.scp} ({order.clientName})
              </li>
            ))}
          </ul>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setShowSendModal(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleConfirmSend}>
            OK (Send)
          </Button>
        </ModalFooter>
      </Modal>

      {/* 3. MODAL DE SELECCIÓN DE PRODUCTOS (Ahora usando el componente PartialMergeSelectorModal) */}
      <PartialMergeSelectorModal
          isOpen={showProductSelectorModal}
          toggle={toggleProductSelectorModal}
          ordersToMerge={selectedRows}
          clientName={clientToMerge}
          onConfirmMerge={handleFinalPartialMerge} // Función que ejecuta la lógica de Firebase
      />
      {/* --- END: Modales de Confirmación --- */}
    </Fragment>
  );
};

export default BackOrderComponent;