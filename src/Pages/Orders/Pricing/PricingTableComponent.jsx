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
    vatNumber: invoiceData.vatNumber || "", // Se podrían añadir aquí los productos seleccionados si fuera la función de Fusión Parcial // products: invoiceData.products || []
  };

  await addDoc(collection(db, "invoices"), newInvoice);

  for (const order of orders) {
    const orderRef = doc(db, "pricing", order.orderId); // Usar orderId // En la fusión total o envío, se actualiza el estado a 'billing'. // En la fusión parcial, esto solo se hace si el 100% de la orden se fusiona.
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

const PricingTableComponent = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [currentItem, setCurrentItem] = React.useState(null);
  const [data, setData] = useState([]);
  const [clientMap, setClientMap] = useState({});
  const [selectedRows, setSelectedRows] = useState([]); // Pedidos seleccionados en la tabla // --- START: Nuevos estados para Modales ---

  const [toggledClearRows, setToggleClearRows] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [scpsToMerge, setScpsToMerge] = useState([]);
  const [clientToMerge, setClientToMerge] = useState("");
  const [showSendModal, setShowSendModal] = useState(false);
  const [ordersToSend, setOrdersToSend] = useState([]); // Estado para el desplegable (usado en Merge)
  const [sendOption, setSendOption] = useState("all"); // ESTADO PARA EL NUEVO MODAL DE SELECCIÓN DE PRODUCTOS
  const [showProductSelectorModal, setShowProductSelectorModal] =
    useState(false); // ESTADOS PARA APROBACIÓN/RECHAZO
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false); // --- END: Nuevos estados para Modales ---
  const { currentUser } = useAuth();

  const toggleModal = () => setModalOpen(!modalOpen);
  const toggleProductSelectorModal = () =>
    setShowProductSelectorModal(!showProductSelectorModal); // --- Lógica de Manejo de Filas Seleccionadas ---

  const handleRowSelected = React.useCallback((state) => {
    setSelectedRows(state.selectedRows);
  }, []);

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
  }; // --- Lógica de Aprobación/Rechazo de RFQ ---

  const handleApprove = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one RFQ to approve.");
      return;
    }
    setShowApproveModal(true);
  };

  const handleReject = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one RFQ to reject.");
      return;
    }
    setShowRejectModal(true);
  };

  const updateRfqStatus = async (status) => {
    const rfqIds = selectedRows.map((row) => row.orderId);
    if (rfqIds.length === 0) return;

    try {
      for (const orderId of rfqIds) {
        const orderRef = doc(db, "pricing", orderId);
        await updateDoc(orderRef, {
          status: status,
          lastUpdatedBy: currentUser?.email,
          lastUpdated: new Date(),
        });
      }

      LogAudit({
        user: currentUser?.email || "Unknown",
        action: `${status.toUpperCase()} RFQs`,
        entity: "RFQ",
        details: `Updated ${
          rfqIds.length
        } RFQs to status: ${status}. IDs: ${rfqIds.join(", ")}`,
      });

      alert(`${rfqIds.length} RFQ(s) successfully marked as ${status}.`);
    } catch (error) {
      console.error(`Error updating RFQ status to ${status}:`, error);
      alert(
        `Failed to update RFQ status to ${status}. Please check the console.`
      );
    } finally {
      setShowApproveModal(false);
      setShowRejectModal(false);
      setToggleClearRows((prev) => !prev);
      fetchData();
    }
  };

  const handleConfirmApprove = () => updateRfqStatus("approved");
  const handleConfirmReject = () => updateRfqStatus("rejected"); // --- Lógica de Envío (Send) ---

  const handleSendBilling = () => {
    if (selectedRows.length === 0) {
      alert(
        "Por favor, selecciona al menos una fila para enviar la facturación."
      );
      return;
    }
    setOrdersToSend(selectedRows);
    setShowSendModal(true);
  }; // Función de confirmación de envío (limpia, sin lógica parcial)

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

        const totalBlockedAmount = parseFloat(
          order.totalBlockedAmount || 0
        ).toFixed(2);

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

        const invoiceNumber = await createInvoice(
          invoiceData,
          [order],
          currentUser
        );
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
  }; // --- Columna de Tabla (Igual) ---
  const productColumns = [
    {
      name: "Client Name",
      selector: (row) => row.clientName,
      sortable: true,
      width: "140px",
    },
    { name: "Internal ID", selector: (row) => row.scp, sortable: true },
    {
      name: "Creation Date",
      selector: (row) =>
        row.creationDate
          ? row.creationDate.toLocaleDateString()
          : "Date not available",
      sortable: true,
      width: "120px",
    },
    {
      name: "PO Number",
      selector: (row) => row.poNumber,
      sortable: true,
      width: "120px",
    },
    {
      name: "Flexibility",
      selector: (row) => row.backOrder,
      sortable: true,
      width: "100px",
    },
  ]; // --- Lógica de Carga de Datos (Mejorada) ---

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
      const ordersRef = collection(db, "pricing");
      const q = query(ordersRef, where("status", "==", "order"));
      const querySnapshot = await getDocs(q);

      const itemsPromises = querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const clientId = data.clientId || "";
        const clientInfo = clientId
          ? await fetchClientData(clientId)
          : { clientName: "ID de cliente no disponible" };

        const eanList = data.eanList || {};
        const products = Object.values(eanList).map((prod) => ({
          ...prod,
          unitPrice: prod.transport?.unitPrice || 0,
          selectedWarehouse: prod.transport?.warehouse || "—",
        }));

        const totalBlockedAmount = products.reduce(
          (sum, prod) => sum + (prod.isBlocked ? prod.totalPrice || 0 : 0),
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
  }, []); // --- Renderizado del Componente ---

  return (
    <Fragment>
      {" "}
      <PageTitle
        heading="RFQ Status Tables"
        subheading="Manage your RFQs."
        icon="pe-7s-drawer icon-gradient bg-happy-itmeo"
      />
      {" "}
      <TransitionGroup>
        {" "}
        <CSSTransition
          component="div"
          classNames="TabsAnimation"
          appear={true}
          timeout={1500}
          enter={false}
          exit={false}
        >
          {" "}
          <Row>
           {" "}
            <Col lg="12">
              {" "}
              <Card className="main-card mb-3">
                {" "}
                <CardHeader className="card-header-tab">
                  {" "}
                  <div className="card-header-title font-size-lg text-capitalize fw-normal">
                    {" "}
                    <Button
                      color="success"
                      onClick={handleApprove}
                      disabled={selectedRows.length === 0}
                    >
                      Approve {" "}
                    </Button>
                    {" "}
                  </div>
                  {" "}
                  <div className="card-header-title font-size-lg text-capitalize fw-normal">
                    {" "}
                    <Button
                      color="danger"
                      style={{ marginLeft: "15px" }}
                      onClick={handleReject}
                      disabled={selectedRows.length === 0}
                    >
                      Reject {" "}
                    </Button>
                    {" "}
                  </div>
                  {" "}
                </CardHeader>
                {" "}
                <CardBody>
                  {" "}
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
                  {" "}
                  <ModalForm
                    isOpen={modalOpen}
                    toggle={toggleModal}
                    itemData={currentItem}
                    onSave={handleSave}
                  />
                  {" "}
                </CardBody>
                {" "}
              </Card>
              {" "}
            </Col>
            {" "}
          </Row>
          {" "}
        </CSSTransition>
        {" "}
      </TransitionGroup>
       {/* Modal de Confirmación de Aprobación */}     {" "}
      <Modal
        isOpen={showApproveModal}
        toggle={() => setShowApproveModal(false)}
      >
       {" "}
        <ModalHeader toggle={() => setShowApproveModal(false)}>
           Confirm RFQ Approval {" "}
        </ModalHeader>
        {" "}
        <ModalBody>
        You are about to **approve** {selectedRows.length} RFQ(s). 
           This will change their status in the database to
          **'approved'**.  Are you sure you want to proceed? {" "}
        </ModalBody>
        {" "}
        <ModalFooter>
          {" "}
          <Button color="secondary" onClick={() => setShowApproveModal(false)}>
             Cancel {" "}
          </Button>
          {" "}
          <Button color="success" onClick={handleConfirmApprove}>
            Approve RFQ(s) {" "}
          </Button>
         {" "}
        </ModalFooter>
        {" "}
      </Modal>
       {/* Modal de Confirmación de Rechazo */}{" "}
      <Modal isOpen={showRejectModal} toggle={() => setShowRejectModal(false)}>
        {" "}
        <ModalHeader toggle={() => setShowRejectModal(false)}>
          Confirm RFQ Rejection {" "}
        </ModalHeader>
        {" "}
        <ModalBody>
        You are about to **reject** {selectedRows.length} RFQ(s).
          This will change their status in the database to
          **'rejected'**. Are you sure you want to proceed? {" "}
        </ModalBody>
        {" "}
        <ModalFooter>
          {" "}
          <Button color="secondary" onClick={() => setShowRejectModal(false)}>
            Cancel{" "}
          </Button>
         {" "}
          <Button color="danger" onClick={handleConfirmReject}>
           Reject RFQ(s) {" "}
          </Button>
          {" "}
        </ModalFooter>
        {" "}
      </Modal>
      {/* --- END: Modales de Confirmación --- */}{" "}
    </Fragment>
  );
};

export default PricingTableComponent;
