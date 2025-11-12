import React, { Fragment, useEffect, useState } from "react";
import { LogAudit } from "../../../Utils/UsersTrack/AuditLogger";
import { useAuth } from "../../../../context/AuthContext";

import {
  CSSTransition,
  TransitionGroup,
} from "../../../../utils/TransitionWrapper";
import { Row, Col, Card, CardBody, Button } from "reactstrap";
import ModalForm from "../../../Tables/RegularTables/Examples/ModalForm";

import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../utils/firebase";

const Executions = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [currentItem, setCurrentItem] = React.useState(null);
  const [data, setData] = useState([]);

  const { currentUser } = useAuth();

  const toggleModal = () => setModalOpen(!modalOpen);

  const executeAlgorithm = (item) => {
    LogAudit({
      user: currentUser?.email || "Unknown",
      action: "Edit Order",
      entity: "Order",
      details: { orderId: item.id, scp: item.scp },
    });

    navigate(`/orders/${item.scp}`, {
      state: { clientName: item.clientName }, // Puedes añadir más datos aquí
    });
  };

  const handleSave = (updatedItem) => {
    LogAudit({
      user: currentUser?.email || "Unknown",
      action: "Save Order Changes",
      entity: "Order",
      details: { orderId: updatedItem.id, changes: updatedItem },
    });

    console.log("Saving changes for item:", updatedItem);
    const updatedProducts = data.map((p) =>
      p.id === updatedItem.id ? updatedItem : p
    );
    setData(updatedProducts);
  };

  const handlePriceChange = (itemId, newPrice) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.id === itemId
          ? { ...item, unitPrice: parseFloat(newPrice) || 0 }
          : item
      )
    );
  };

  const productColumns = [
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
      name: "Status",
      cell: (row) => (
        <div>
          Running
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  useEffect(() => {
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
            const clientDocRef = collection(db, "clients");
            const qc = query(
              clientDocRef,
              where("clientId", "==", orderData.clientId)
            );
            const clientDoc = await getDocs(qc);
            if (!clientDoc.empty) {
              const clientData = clientDoc.docs[0].data();
              orderData.clientName = clientData.name || "Nombre no disponible";
            } else {
              orderData.clientName = "Cliente no encontrado";
            }
          } else {
            orderData.clientName = "ID de cliente no disponible";
          }

          return orderData;
        });

        const items = await Promise.all(promises);
        setData(items);
        console.log("Datos obtenidos con nombres de cliente:", items);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <Fragment>
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
                <CardBody>
                  <DataTable
                    columns={productColumns}
                    data={data}
                    pagination
                    fixedHeader
                    fixedHeaderScrollHeight="400px"
                    onPriceChange={handlePriceChange}
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
    </Fragment>
  );
};

export default Executions;
