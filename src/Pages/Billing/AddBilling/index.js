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
  Button,
  CardHeader,
  Card,
  CardBody,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import PageTitle from "../../../Layout/AppMain/PageTitle";

import DataTable from "react-data-table-component";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../utils/firebase";

const columns = [
  {
    name: "Client",
    selector: (row) => row.clientName,
    sortable: true,
    reorder: true,
  },
  {
    name: "Creation Date",
    selector: (row) => row.creationDate.toDate().toLocaleDateString(),
    sortable: true,
    reorder: true,
  },
  {
    name: "#PO",
    selector: (row) => row.poNumber,
    sortable: true,
    reorder: true,
  },
  {
    name: "Internal ID",
    selector: (row) => row.scp,
    sortable: true,
    reorder: true,
  },
  {
    name: "Blocked Amount",
    selector: (row) => row.totalBlockedAmount,
    sortable: true,
    reorder: true,
  },
];

const AddBillingComponent = () => {
  const [data, setData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [toggledClearRows, setToggleClearRows] = useState(false);

  // Estados para el modal de fusión
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [scpsToMerge, setScpsToMerge] = useState([]);
  const [clientToMerge, setClientToMerge] = useState("");

  // Nuevos estados para el modal de envío
  const [showSendModal, setShowSendModal] = useState(false);
  const [ordersToSend, setOrdersToSend] = useState([]);

  //Audit
  const { currentUser } = useAuth();

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
    const q = query(clientsRef, where("clientId", "==", clientId));
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

  const createInvoice = async (invoiceData, orders, currentUser) => {
    const newInvoiceNumber = await getInvoiceNumber(invoiceData.clientId);
    const newSCA = generateSCA();

    const newInvoice = {
      invoiceNumber: newInvoiceNumber,
      creationDate: new Date(),
      status: "billing",
      financialStatus: "pending",
      shippingStatus: "warehouse",
      sca: newSCA,
      scps: invoiceData.scps,
      totalAmount: invoiceData.totalAmount || 0,
      totalBlockedAmount: invoiceData.totalBlockedAmount.toFixed(2) || 0,
      billingAddress: invoiceData.billingAddress || "",
      clientId: invoiceData.clientId || "",
      deliveryAddress: invoiceData.deliveryAddress || "",
      email: invoiceData.email || "",
      incoterm: invoiceData.incoterm || "",
      name: invoiceData.name || "",
      paymentDueDates: invoiceData.paymentDueDates || 0,
      vatNumber: invoiceData.vatNumber || "",
    };

    await addDoc(collection(db, "invoices"), newInvoice);

    for (const order of orders) {
      const orderRef = doc(db, "orders", order.id);
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
      action: "Initiate Merge",
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

  const handleConfirmMerge = async () => {
    setShowMergeModal(false);

    try {
      const firstOrder = selectedRows[0];

      if (!firstOrder.clientId) {
        alert(
          "No se pudo encontrar el ID del cliente para el pedido seleccionado."
        );
        return;
      }

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
        totalBlockedAmount: selectedRows.reduce(
          (total, row) => total + (parseFloat(row.totalBlockedAmount) || 0),
          0
        ),
      };

      const invoiceNumber = await createInvoice(invoiceData, selectedRows);

      alert(
        `Se han fusionado los SCPs seleccionados en la factura #${invoiceNumber}.`
      );
      setToggleClearRows(!toggledClearRows);
      setSelectedRows([]);
      fetchData();
    } catch (error) {
      console.error("Error al fusionar SCPs:", error);
      alert("Hubo un error al fusionar los SCPs.");
    }
  };

  const handleSendBilling = () => {
    if (selectedRows.length === 0) {
      alert(
        "Por favor, selecciona al menos una fila para enviar la facturación."
      );
      return;
    }

    const selectedScps = selectedRows.map((row) => row.scp);
    const clientNames = [...new Set(selectedRows.map((row) => row.clientName))];

    LogAudit({
      user: currentUser?.email || "Unknown",
      action: "Initiate Billing Send",
      entity: "Invoice",
      details: {
        scps: selectedScps,
        clients: clientNames,
        count: selectedRows.length,
      },
    });

    setOrdersToSend(selectedRows);
    setShowSendModal(true);
  };

  const handleConfirmSend = async () => {
    setShowSendModal(false);

    try {
      for (const order of ordersToSend) {
        if (!order.clientId) {
          alert(
            `No se pudo encontrar el ID del cliente para el ID ${order.scp}.`
          );
          continue;
        }

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
          totalBlockedAmount: order.totalBlockedAmount.toFixed(2),
        };

        const invoiceNumber = await createInvoice(invoiceData, [order]);
        console.log(
          `Factura #${invoiceNumber} para el ID ${order.scp} creada.`
        );

        LogAudit({
          user: currentUser?.email || "Unknown",
          action: "Invoice Created",
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

  const fetchData = async () => {
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("status", "==", "order"));
      const querySnapshot = await getDocs(q);

      const promises = querySnapshot.docs.map(async (orderDoc) => {
        const orderData = {
          id: orderDoc.id,
          ...orderDoc.data(),
        };

        if (orderData.clientId) {
          const clientsRef = collection(db, "clients");
          const qClients = query(
            clientsRef,
            where("clientId", "==", orderData.clientId)
          );
          const clientDocs = await getDocs(qClients);

          if (!clientDocs.empty) {
            const clientData = clientDocs.docs[0].data();
            orderData.clientName = clientData.name || "Nombre no disponible";
            orderData.billingAddress = clientData.billingAddress || "";
            orderData.deliveryAddress = clientData.deliveryAddress || "";
            orderData.email = clientData.email || "";
            orderData.incoterm = clientData.incoterm || "";
            orderData.paymentDueDates = clientData.paymentDueDates || 0;
            orderData.vatNumber = clientData.vatNumber || "";
          } else {
            orderData.clientName = "Cliente no encontrado";
          }
        } else {
          orderData.clientName = "ID de cliente no disponible";
        }

        // Asegurar que totalAmount es un número
        const amount = parseFloat(orderData.totalAmount);
        orderData.totalAmount = isNaN(amount) ? 0 : amount;

        // Asegurar que totalBlockedAmount es un número
        const blockedAmount = parseFloat(orderData.totalBlockedAmount);
        orderData.totalBlockedAmount = isNaN(blockedAmount)
          ? 0
          : blockedAmount.toFixed(2);

        return orderData;
      });

      const items = await Promise.all(promises);
      setData(items);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Fragment>
      <PageTitle
        heading="Order to Billing Manager"
        subheading="Set your orders as billing."
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
                <CardHeader className="card-header-tab">
                  <div className="card-header-title font-size-lg text-capitalize fw-normal">
                    <Button
                      color="success"
                      onClick={handleSendBilling}
                      disabled={selectedRows.length === 0}
                    >
                      Send
                    </Button>
                  </div>
                  <div className="card-header-title font-size-lg text-capitalize fw-normal">
                    <Button
                      color="info"
                      style={{ marginLeft: "15px" }}
                      onClick={handleMergeBilling}
                      disabled={selectedRows.length < 2}
                    >
                      Merge
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  <DataTable
                    data={data}
                    columns={columns}
                    pagination
                    fixedHeader
                    fixedHeaderScrollHeight="400px"
                    selectableRows
                    onSelectedRowsChange={handleRowSelected}
                    clearSelectedRows={toggledClearRows}
                  />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </CSSTransition>
      </TransitionGroup>

      {/* Modal de confirmación para FUSIONAR */}
      <Modal
        isOpen={showMergeModal}
        toggle={() => setShowMergeModal(!showMergeModal)}
      >
        <ModalHeader toggle={() => setShowMergeModal(!showMergeModal)}>
          Confirm Order Merger
        </ModalHeader>
        <ModalBody>
          Are you sure you want to merge the following orders (
          {scpsToMerge.length}) from customer **{clientToMerge}** into a single delivery note?
          <br />
          <br />
          **Orders to merge:**
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
          <Button color="primary" onClick={handleConfirmMerge}>
            OK
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de confirmación para ENVIAR */}
      <Modal
        isOpen={showSendModal}
        toggle={() => setShowSendModal(!showSendModal)}
      >
        <ModalHeader toggle={() => setShowSendModal(!showSendModal)}>
          Confirm Shipping and Billing
        </ModalHeader>
        <ModalBody>
          Are you sure you want to send the following orders to billing ({ordersToSend.length})?
          <br />
          <br />
          **Orders to be sent:**
          <ul>
            {ordersToSend.map((order) => (
              <li key={order.id}>
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
            OK
          </Button>
        </ModalFooter>
      </Modal>
    </Fragment>
  );
};

export default AddBillingComponent;
