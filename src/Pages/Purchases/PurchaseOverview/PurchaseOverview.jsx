import React, {
  Fragment,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
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
  Nav,
  NavItem,
  NavLink,
} from "reactstrap";
import classnames from "classnames";
import ModalForm from "../../Tables/RegularTables/Examples/ModalForm";

import PageTitle from "../../../Layout/AppMain/PageTitle";

import DataTable from "react-data-table-component";
import ExportCSV from "../../Components/ExportCSV";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../utils/firebase";
import Notification from "../../Widgets/Notifications/Notification";

// 1. NUEVOS ESTADOS/VISTAS Y CAMPOS
const ALGORITHM_STATUS = {
  PENDING: "PENDING",
  IN_EXECUTION: "IN_EXECUTION",
  RESULTS: "RESULTS",
};

const VIEWS = {
  PENDING: "Pending",
  IN_EXECUTION: "InExecution",
  RESULTS: "Results",
};

const PurchaseOverviewComponent = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [data, setData] = useState([]);
  const [activeView, setActiveView] = useState(VIEWS.PENDING);

  const [showSendModal, setShowSendModal] = useState(false);
  const [ordersToSend, setOrdersToSend] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState({
    status: "",
    message: "",
  });

  const { currentUser } = useAuth();

  const toggleModal = () => setModalOpen(!modalOpen);

  const handleCloseNotification = useCallback(() => {
    setSubmissionStatus({ status: "", message: "" });
  }, []);

  const toggleView = (tab) => {
    if (activeView !== tab) {
      setActiveView(tab);
      setSelectedRows([]);
    }
  };

  // 2. LÓGICA DE ENVÍO AL ALGORITMO (PENDING -> IN_EXECUTION)
  const handleSendAlgorithm = () => {
    setSubmissionStatus({ status: "", message: "" });
    if (selectedRows.length === 0) {
      alert(
        "Por favor, selecciona al menos una fila para enviar al algoritmo."
      );
      return;
    }

    let purchaseIds = selectedRows.map((x) => x.id);

    LogAudit({
      user: currentUser?.email || "Unknown",
      action: "Initiate Algorithm",
      entity: "Purchase Algorithm",
      details: {
        selectedRows: purchaseIds,
        count: purchaseIds.length,
      },
    });

    try {
      setSubmissionStatus({
        status: "success",
        message: `${purchaseIds.length} orders sent to Purchases.`,
      });

      // Actualizar el estado interno de los items a 'IN_EXECUTION'
      const updatedData = data.map((item) => ({
        ...item,
        // Solo actualizar si estaba en PENDING y fue seleccionado
        algorithmStatus:
          item.algorithmStatus === ALGORITHM_STATUS.PENDING &&
          purchaseIds.includes(item.id)
            ? ALGORITHM_STATUS.IN_EXECUTION
            : item.algorithmStatus,
      }));

      setData(updatedData);
      setSelectedRows([]);
      setActiveView(VIEWS.IN_EXECUTION); // Mover a la vista de ejecución
    } catch (error) {
      console.error("Error sending to algorithm: ", error);

      setSubmissionStatus({
        status: "error",
        message: `Error sending to algorithm: ${error.message}`,
      });
    }
  };

  const handleEdit = (item) => {
    /* ... */ navigate(`/purchases/${item.id}`);
  };
  const handleRowSelected = useCallback((state) => {
    setSelectedRows(state.selectedRows);
  }, []);
  const handleDelete = (item) => {
    const updatedProducts = data.filter((p) => p.id !== item.id);
    setData(updatedProducts);
  };
  const handleSave = async (updatedItem) => {
    const updatedProducts = data.map((p) =>
      p.id === updatedItem.id ? updatedItem : p
    );
    setData(updatedProducts);
  };
  const purchaseColumns = [
    { name: "Client", selector: (row) => row.clientName, sortable: true },
    { name: "Purchase ID", selector: (row) => row.id, sortable: true, grow: 1 },
    {
      name: "Creation Date",
      selector: (row) => {
        const timestamp = row.creationDate;
        if (!timestamp) {
          return "—";
        }
        const dateObject = timestamp.toDate();
        if (dateObject instanceof Date) {
          return dateObject.toLocaleDateString();
        }

        return "—";
      },
      sortable: true,
    },
    {
      name: "Status Algo",
      selector: (row) => row.algorithmStatus,
      sortable: true,
    },
    { name: "Quantity", selector: (row) => row.quantity, sortable: true },
    {
      name: "Actions",
      cell: (row) =>
        row.algorithmStatus !== ALGORITHM_STATUS.IN_EXECUTION && (
          <div>
            <Button color="primary" size="sm" onClick={() => handleEdit(row)}>
              Edit
            </Button>
            <Button
              color="danger"
              size="sm"
              style={{ marginLeft: "2px" }}
              onClick={() => handleDelete(row)}
            >
              Delete
            </Button>
          </div>
        ),
      ignoreRowClick: true,
    },
  ];

  // --- Lógica de Obtención de Datos (Inicializa el nuevo campo de estado) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const purchasesRef = collection(db, "purchases");
        const querySnapshot = await getDocs(purchasesRef);

        const items = querySnapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            creationDate: data.creationDate?.toDate() || null,
            // Nuevo campo: Si ya estaba ejecutado, va a RESULTS, sino a PENDING
            algorithmStatus: data.executedInAlgorithm
              ? ALGORITHM_STATUS.RESULTS
              : ALGORITHM_STATUS.PENDING,
            ...data, // Mantener el resto de las propiedades
          };
        });
        setData(items);
      } catch (error) {
        console.error("Error fetching purchases:", error);
      }
    };

    fetchData();
  }, []);

  // 3. MOCK DE RABBITMQ: SIMULACIÓN DE TRANSICIÓN IN_EXECUTION -> RESULTS
  useEffect(() => {
    const itemsToUpdate = data.filter(
      (item) => item.algorithmStatus === ALGORITHM_STATUS.IN_EXECUTION
    );

    if (itemsToUpdate.length > 0) {
      // Establecer un temporizador para simular la respuesta asíncrona de RabbitMQ (5 segundos)
      const mockTimer = setTimeout(() => {
        setData((currentData) =>
          currentData.map((item) => ({
            ...item,
            // Mover todos los que están en IN_EXECUTION a RESULTS
            algorithmStatus:
              item.algorithmStatus === ALGORITHM_STATUS.IN_EXECUTION
                ? ALGORITHM_STATUS.RESULTS
                : item.algorithmStatus,
          }))
        );

        // Mostrar notificación de éxito del mock
        setSubmissionStatus({
          status: "success",
          message: `Purchases Queue: ${itemsToUpdate.length} purchases execution validated.`,
        });
      }, 5000);

      return () => clearTimeout(mockTimer); // Limpiar el temporizador al desmontar o re-ejecutar
    }
  }, [data]); // Se ejecuta cada vez que 'data' cambia

  // --- FILTRADO DE DATOS PARA LAS 3 VISTAS ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (activeView === VIEWS.PENDING) {
        return item.algorithmStatus === ALGORITHM_STATUS.PENDING;
      }
      if (activeView === VIEWS.IN_EXECUTION) {
        return item.algorithmStatus === ALGORITHM_STATUS.IN_EXECUTION;
      }
      if (activeView === VIEWS.RESULTS) {
        return item.algorithmStatus === ALGORITHM_STATUS.RESULTS;
      }
      return false;
    });
  }, [data, activeView]);

  // Calcular las longitudes de las vistas usando useMemo
  const pendingCount = useMemo(
    () =>
      data.filter((item) => item.algorithmStatus === ALGORITHM_STATUS.PENDING)
        .length,
    [data]
  );
  const inExecutionCount = useMemo(
    () =>
      data.filter(
        (item) => item.algorithmStatus === ALGORITHM_STATUS.IN_EXECUTION
      ).length,
    [data]
  );
  const resultsCount = useMemo(
    () =>
      data.filter((item) => item.algorithmStatus === ALGORITHM_STATUS.RESULTS)
        .length,
    [data]
  );

  return (
    <Fragment>
      <PageTitle
        heading="Purchase Orders Status"
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
            onClose={handleCloseNotification}
          />
          <Row>
            <Col lg="12">
              <Card className="main-card mb-3">
                <CardHeader className="p-0">
                  {/* NAVEGACIÓN DE 3 PESTAÑAS */}
                  <Nav tabs className="d-flex justify-content-between w-100">
                    <div className="d-flex" style={{ marginLeft: "1rem" }}>
                      {/* Pestaña PENDIENTES */}
                      <NavItem>
                        <NavLink
                          className={classnames({
                            active: activeView === VIEWS.PENDING,
                          })}
                          onClick={() => {
                            toggleView(VIEWS.PENDING);
                          }}
                        >
                          Pending ({pendingCount})
                        </NavLink>
                      </NavItem>
                      {/* Pestaña EN EJECUCIÓN */}
                      <NavItem>
                        <NavLink
                          className={classnames({
                            active: activeView === VIEWS.IN_EXECUTION,
                          })}
                          onClick={() => {
                            toggleView(VIEWS.IN_EXECUTION);
                          }}
                        >
                          In Execution ({inExecutionCount})
                        </NavLink>
                      </NavItem>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="d-flex align-items-center p-2">
                      {/* Botón Send solo visible en la vista PENDIENTE */}
                      {activeView === VIEWS.PENDING && (
                        <Button
                          color="success"
                          onClick={handleSendAlgorithm}
                          disabled={selectedRows.length === 0}
                          className="me-2"
                        >
                          Launch Purchases ({selectedRows.length})
                        </Button>
                      )}

                      {/* Botón Download/ExportCSV */}
                      <ExportCSV
                        data={filteredData}
                        fileName={`${activeView.toLowerCase()}_orders.csv`}
                      />
                    </div>
                  </Nav>
                </CardHeader>

                <CardBody>
                  <DataTable
                    columns={purchaseColumns}
                    data={filteredData}
                    pagination
                    fixedHeader
                    fixedHeaderScrollHeight="400px"
                    selectableRows={activeView === VIEWS.PENDING}
                    onSelectedRowsChange={handleRowSelected}
                    key={activeView}
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

export default PurchaseOverviewComponent;
