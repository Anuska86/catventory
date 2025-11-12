import React, { useState, useEffect } from "react";
import "../../Orders/style/CreatePurchase.css";
import { fetchProductsByPartialSku } from "../../../utils/productService";
import {
  FormGroup,
  Label,
  Input,
  Button,
  Row,
  Col,
  Form,
} from "reactstrap";

import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import Notification from '../../Widgets/Notifications/Notification';

const CreatePurchase = () => {
  const [deliveryDate, setDeliveryDate] = useState("");
  const [sku, setSku] = useState("");
  const [ean, setEan] = useState("");
  const [skuOptions, setSkuOptions] = useState([]);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(true);

  const [minDeliveryDate, setMinDeliveryDate] = useState("");

  const [warehouseNames, setWarehouseNames] = useState([]);
  const [clientNames, setClientNames] = useState([]);
  const [clientName, setClientName] = useState("");
  const [warehousesOptions, setWarehousesOptions] = useState([]);
  const [clientsOptions, setClientsOptions] = useState([]);
  const [warehouse, setWarehouse] = useState("");
  const [transport, setTransport] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transportOptions, setTransportOptions] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState({
    status: '',
    message: ''
  });

  const resetFormFields = () => {
    setDeliveryDate("");
    setSku("");
    setEan("");
    setSkuOptions([]);
    setQuantity("");
    setWarehouseNames([]);
    setClientNames([]);
    setWarehousesOptions([]);
    setWarehouse("");
    setSelectedProduct(null);
    setTransportOptions([]);
    setMinDeliveryDate("");
  };

  useEffect(() => {
    if (submissionStatus.message) {
      const timer = setTimeout(() => {
        setSubmissionStatus({ status: '', message: '' });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [submissionStatus]);

  useEffect(() => {
    if (!transportOptions || !transport) {
      setMinDeliveryDate("");
      return;
    }

    const selectedTransport = transportOptions.find(
      (t) => t.name === transport
    );

    if (!selectedTransport || selectedTransport.sla === undefined) {
      setMinDeliveryDate("");
      return;
    }

    const today = new Date();

    // 2. Calcular la fecha mínima con el SLA
    today.setDate(today.getDate());
    const calculatedMinDate = today.toISOString().split("T")[0];

    // 3. Almacenar la fecha mínima
    setMinDeliveryDate(calculatedMinDate);

  }, [transport, transportOptions]); // Se ejecuta solo cuando cambian el transporte o sus opciones
  // -------------------------------------------------------------------

  const fetchClientNames = async () => {
    try {
      const db = getFirestore();
      const clientsCollectionRef = collection(db, "clients");

      const clientSnapshot = await getDocs(clientsCollectionRef);
      const namesList = clientSnapshot.docs.map(doc => doc.data().name);

      setClientNames(namesList);
    } catch (error) {
      console.error("Error al obtener los nombres de los clientes:", error);
    } finally {
      // Indica que la carga ha terminado
      setLoading(false);
    }
  };


  // --- 1. LÓGICA: ACTUALIZACIÓN DE WAREHOUSES CON useEffect ---
  useEffect(() => {
    if (warehousesOptions.length > 0) {
      const list = Array.from(new Set(Array.from(warehousesOptions).map(t => Object.keys(t.warehouses)).flat()));
      setWarehouseNames(list);
    } else {
      setWarehouseNames([]);
    }
  }, [warehousesOptions]);

  useEffect(() => {
    fetchClientNames();
  }, []);
  // -----------------------------------------------------------------


  if (loading) {
    return <p>Cargando nombres de clientes...</p>;
  }
  // --- 2. LÓGICA: MANEJADOR DE CAMBIO DE ALMACÉN Y TRANSPORTE ---

  const handleWarehouseChange = (e) => {
    const warehouseName = e.target.value;
    setWarehouse(warehouseName);
    setTransport("");
    setTransportOptions([]);

    if (!warehouseName) {
      return;
    }
  };

    const handleClientNameChange = (e) => {
    const clientName = e.target.value;
    setClientName(clientName);
    if (!clientName) {
      return;
    }
  };
  
  // -----------------------------------------------------------------

  const handleSkuChange = async (e) => {
    const value = e.target.value;
    setSku(value);

    if (value.length >= 3) {
      try {
        const matches = await fetchProductsByPartialSku(value);
        console.log("SKU matches:", matches);
        setSkuOptions(matches);
      } catch (error) {
        console.error("Error fetching SKUs:", error);
        setSkuOptions([]);
      }
    } else {
      setSkuOptions([]);
    }
  };

  const handleSkuSelect = (e) => {
    const selectedSku = e.target.value;
    if (!selectedSku) return;

    setSku(selectedSku);

    const product = skuOptions.find((p) => p.sku === selectedSku);
    if (!product) return;

    setSelectedProduct(product);
    setEan(product.ean || "");
    console.log("Selected product:", product);

    let suppliers = [];

    if (Array.isArray(product.supplierList)) {
      suppliers = product.supplierList;
    } else if (product.supplierList?.value) {
      suppliers = [product.supplierList.value];
    } else if (product.supplierList?.name || product.supplierList?.warehouses) {
      suppliers = [product.supplierList];
    }

    setWarehousesOptions(suppliers);
    setWarehouse("");
    setSkuOptions([]);
    setMinDeliveryDate("");
  };

  const getMinDeliveryDate = () => {
    return minDeliveryDate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus({ status: '', message: '' });

    const purchaseData = {
      id: uuidv4().slice(0, 10),
      deliveryDate,
      sku,
      ean,
      quantity,
      warehouse,
      clientName,
      creationDate: new Date(),
      status: "pending",
    };

    console.log("Creating purchase:", purchaseData);

    const db = getFirestore();
    const ordersRef = collection(db, "purchases");

    try {
      const docRef = await addDoc(ordersRef, purchaseData);
      console.log("Document successfully written with ID: ", docRef.id);

      setSubmissionStatus({
        status: 'success',
        message: `Orden de compra creada con éxito. ID: ${docRef.id}`
      });

      resetFormFields();

    } catch (error) {
      console.error("Error adding document: ", error);

      setSubmissionStatus({
        status: 'error',
        message: `Error al crear la orden de compra: ${error.message}`
      });
    }
  };
  // ----------------------------

  return (
    <div className="page-container">
      <Notification
        status={submissionStatus.status}
        message={submissionStatus.message}
        onClose={() => setSubmissionStatus({ status: '', message: '' })}
      />
      <div className="form-wrapper">
        <div className="upload-form">
          <h2 className="form-title">Create a Purchase</h2>
          <Form onSubmit={handleSubmit}>
            <Row className="form-row">
              <Col md={6}>
                <FormGroup className="form-group sku-group">
                  <Label for="sku">SKU</Label>
                  <Input
                    type="text"
                    name="sku"
                    id="sku"
                    value={sku}
                    onChange={handleSkuChange}
                    placeholder="Start typing SKU or EAN..."
                    autoComplete="off"
                    className="form-control"
                  />

                  {/* Custom dropdown below input */}
                  {skuOptions.length > 0 && (
                    <div className="sku-dropdown">
                      {skuOptions.map((option) => (
                        <div
                          key={option.id}
                          onClick={() =>
                            handleSkuSelect({ target: { value: option.sku } })
                          }
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          <strong>{option.sku}</strong> {option.name}
                        </div>
                      ))}
                    </div>
                  )}
                </FormGroup>
                <Col md={12}>
                  <FormGroup className="form-group">
                    <Label for="client">Client</Label>
                    <Input
                      type="select"
                      name="clients"
                      id="clients"
                      value={clientName}
                      onChange={handleClientNameChange}
                      className="form-control"
                    >
                      <option value="">Select client</option>
                      {clientNames.map((clientName) => (
                        <option key={clientName} value={clientName}>
                          {clientName}
                        </option>
                      ))}
                    </Input>
                    {warehousesOptions.length === 0 && selectedProduct && (
                      <div style={{ fontSize: "0.9rem", color: "#888" }}>
                        No clients found.
                      </div>
                    )}
                  </FormGroup>
                </Col>
              </Col>
              <Col md={6}>
                <FormGroup className="form-group">
                  <Label for="quantity">Quantity</Label>
                  <Input
                    type="number"
                    name="quantity"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    min="1"
                    className="form-control"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row className="form-row">
              <Col md={6}>
                <FormGroup className="form-group">
                  <Label for="warehouse">Warehouse</Label>
                  <Input
                    type="select"
                    name="warehouses"
                    id="warehouses"
                    value={warehouse}
                    onChange={handleWarehouseChange}
                    className="form-control"
                  >
                    <option value="">Select warehouse</option>
                    {warehouseNames.map((warehouseName) => (
                      <option key={warehouseName} value={warehouseName}>
                        {warehouseName}
                      </option>
                    ))}
                  </Input>
                  {warehousesOptions.length === 0 && selectedProduct && (
                    <div style={{ fontSize: "0.9rem", color: "#888" }}>
                      No warehouses available for this product.
                    </div>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup className="form-group">
                  <Label for="deliveryDate">Delivery Date</Label>
                  <Input
                    type="date"
                    name="deliveryDate"
                    id="deliveryDate"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    placeholder="Select a date"
                    // Usamos la función para obtener el estado calculado
                    min={getMinDeliveryDate()}
                    className="form-control"
                  />
                  {transport && (
                    <div style={{ fontSize: "0.85rem", color: "#666" }}>
                      Earliest delivery: {getMinDeliveryDate()}
                    </div>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <Button
              color="secondary"
              type="submit"
              className="btn-create-purchase"
            >
              Create Purchase
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchase;