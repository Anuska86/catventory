import React, { Fragment, useEffect, useState } from "react";
import { LogAudit } from "../../../Utils/UsersTrack/AuditLogger";
import { useAuth } from "../../../../context/AuthContext";

import {
  CSSTransition,
  TransitionGroup,
} from "../../../../utils/TransitionWrapper";
import { Row, Col, Card, CardBody, Button } from "reactstrap";
import ModalForm from "../../../Tables/RegularTables/Examples/ModalForm";

import PageTitle from "../../../../Layout/AppMain/PageTitle";

import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../utils/firebase";

const Simulation = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [currentItem, setCurrentItem] = React.useState(null);
  const [data, setData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Estado para la animación de carga

  const { currentUser } = useAuth();

  const toggleModal = () => setModalOpen(!modalOpen);

  const executeAlgorithm = () => {
    if (selectedRows.length === 0) {
      alert("Por favor, selecciona al menos una orden para ejecutar el algoritmo.");
      return;
    }

    setIsLoading(true); // Activa la animación
    console.log("Órdenes seleccionadas para el algoritmo:", selectedRows);

    LogAudit({
      user: currentUser?.email || "Unknown",
      action: "Execute Algorithm (simulation)",
      entity: "Orders",
      details: {
        poNumbers: selectedRows.map(item => item.poNumber)
      },
    });

    // Simula una operación asíncrona (como si estuvieras enviando datos a un servidor)
    setTimeout(() => {
      setIsLoading(false); // Desactiva la animación después de un tiempo
      console.log("Proceso del algoritmo finalizado.");
      // Aquí puedes añadir más lógica después de la "ejecución"
    }, 2000); // 2 segundos de simulación
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

  const handleRowSelected = (state) => {
    setSelectedRows(state.selectedRows);
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
                  <div>
                    <Button
                      style={{
                        textAlign: "center",
                        padding: "0.5em"
                      }}
                      color="success"
                      size="sm"
                      onClick={executeAlgorithm}
                      disabled={isLoading} // Deshabilita el botón durante la carga
                    >
                      {isLoading ? "Procesando..." : "Launch"}
                    </Button>
                  </div>
                  <DataTable
                    columns={productColumns}
                    data={data}
                    pagination
                    fixedHeader
                    fixedHeaderScrollHeight="400px"
                    onPriceChange={handlePriceChange}
                    selectableRows
                    onSelectedRowsChange={handleRowSelected}
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

export default Simulation;