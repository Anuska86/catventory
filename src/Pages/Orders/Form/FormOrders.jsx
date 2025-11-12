import React, { Component } from "react";
import "../style/FormOrder.css";

import { AuthContext } from "../../../../src/context/AuthContext.js";
import { LogAudit } from "../../Utils/UsersTrack/AuditLogger";

import {
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  ListGroup,
  ListGroupItem,
  UncontrolledTooltip,
} from "reactstrap";
import {
  getFirestore,
  collection,
  query,
  addDoc,
  getDocs,
  limit,
  doc,
  updateDoc,
  increment,
  writeBatch,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

const validateOrderSchema = (order) => {
  if (!order.clientId || !order.poNumber || !order.eanList) return false;
  for (const ean in order.eanList) {
    const item = order.eanList[ean];
    if (
      !item.transport ||
      !item.transport.unitPrice ||
      !item.transport.warehouse
    )
      return false;
  }
  return true;
};

class OrderForm extends Component {
  static contextType = AuthContext;

  state = {
    client: "",
    selectedClient: null,
    selectedProduct: null,
    searchType: "sku",
    searchQuery: "",
    quantity: 1,
    unitPrice: 0,
    currency: "",
    basket: [],
    submitting: false,
    submitted: false,
    results: [],
    showResults: false,
    clients: [],
    poNumber: "",
    deliveryDate: null,
    selectedSupplier: null,
    supplierOptions: [],
    selectedTransport: [],
    inputPrice: 0,
    backOrder: "",
  };

  componentDidMount() {
    this.fetchClients();
  }

  generateRandomCode = (prefix) => {
    return `${prefix}${Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase()}`;
  };

  fetchClients = async () => {
    const db = getFirestore();
    const clientsRef = collection(db, "clients");
    const snapshot = await getDocs(clientsRef);

    const clients = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        clientId: data.clientId,
        currency: data.currency || "€",
        scpCounter: data.scpCounter || 0,
      };
    });

    this.setState({ clients });
  };

  searchProducts = (query) => {
    const { searchType, products } = this.state;

    if (!products || products.length === 0) return;

    const results = products.filter((product) =>
      product[searchType].toLowerCase().includes(query.toLowerCase())
    );

    this.setState({ searchResults: results });
  };

  fetchProducts = async () => {
    console.log("🚀 fetchProducts triggered");

    const { searchQuery, searchType } = this.state;

    if (searchQuery.length < 4) {
      this.setState({ results: [], showResults: false, selectedProduct: null });
      return;
    }

    const db = getFirestore();
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
    });

    const normalize = (str) =>
      str
        ?.toLowerCase()
        .trim()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9\-]/gi, "");

    const normalizedQuery = normalize(searchQuery);

    const matched = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((product) => {
        const value = searchType === "ean" ? product.ean : product.sku;
        return (
          typeof value === "string" &&
          normalize(value).includes(normalizedQuery)
        );
      });

    const exactMatch = matched.find((product) => {
      const value = searchType === "ean" ? product.ean : product.sku;
      return typeof value === "string" && normalize(value) === normalizedQuery;
    });

    this.setState({
      results: matched,
      showResults: true,
      selectedProduct: exactMatch || null,
      unitPrice: exactMatch ? exactMatch.unitPrice || 0 : 0,
    });
  };

  handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "client") {
      const selectedClient = this.state.clients.find(
        (client) => client.id === value
      );

      const now = new Date();
      const formattedDate = now
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .slice(0, 12);

      const poNumber = `PO-${selectedClient.name
        .replace(/\s+/g, "")
        .substring(0, 5)
        .toUpperCase()}-${selectedClient.id.substring(0, 6)}-${formattedDate}`;

      this.setState({ client: value, selectedClient, poNumber });
    } else {
      this.setState({ [name]: value }, () => {
        if (name === "searchQuery") {
          this.fetchProducts();
        }
      });
    }
  };

  //Delivery Date
  getMinDeliveryDate() {
    const { selectedTransport, selectedSupplier } = this.state;
    if (!selectedTransport || !selectedSupplier) return "";

    const allTransports = Object.values(
      selectedSupplier?.warehouses || {}
    ).flatMap((warehouse) => warehouse.transport || []);

    const selectedTransportObject = allTransports.find(
      (t) => t.name === selectedTransport
    );

    if (!selectedTransportObject || !selectedTransportObject.sla) return "";

    const today = new Date();
    today.setDate(today.getDate() + selectedTransportObject.sla);
    return today.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ submitting: true });

    const { selectedClient, basket } = this.state;

    if (!selectedClient || basket.length === 0) {
      alert("Please select a client and add at least one product.");
      this.setState({ submitting: false });
      return;
    }

    const invalidItems = basket.filter((item) => {
      const productPriceValid = item.unitPrice && item.unitPrice > 0;
      const transportPriceValid =
        item.transport?.unitPrice && item.transport.unitPrice > 0;
      return !productPriceValid || !transportPriceValid;
    });

    if (invalidItems.length > 0) {
      const issues = invalidItems
        .map((item, i) => {
          const productIssue =
            !item.unitPrice || item.unitPrice <= 0
              ? "- Missing product price"
              : "";
          const transportIssue =
            !item.transport?.unitPrice || item.transport.unitPrice <= 0
              ? "- Missing transport price"
              : "";
          return `Item ${i + 1} (${
            item.sku
          }):\n${productIssue}\n${transportIssue}`;
        })
        .join("\n\n");

      alert(
        `⚠️ Please fix the following issues before submitting:\n\n${issues}`
      );
      this.setState({ submitting: false });
      return;
    }

    const db = getFirestore();
    const ordersRef = collection(db, "orders");
    const clientDocRef = doc(db, "clients", selectedClient.id);
    const updatedCounter = (selectedClient.scpCounter || 0) + 1;

    const orderDate = new Date();
    const formattedDate = orderDate
      .toISOString()
      .slice(0, 19)
      .replace(/T|:/g, "");
    const scp = `${selectedClient.name
      .substring(0, 3)
      .toUpperCase()}${selectedClient.id.substring(0, 6)}${uuidv4().slice(
      0,
      10
    )}${formattedDate}_${updatedCounter}`;

    console.log("Basket contents:", this.state.basket);

    const eanList = this.state.basket.reduce((acc, item) => {
      acc[item.ean] = {
        isBlocked: false,
        quantity: item.quantity,
        sku: item.sku,
        description: item.description,
        transport: item.transport || null,
        estimatedDelivery: item.estimatedDelivery,
        supplierId: item.supplierId || null,
      };
      return acc;
    }, {});

    console.log("Confirmed Supplier", this.state.confirmedSupplier);
    const newOrder = {
      clientId: selectedClient.id,
      creationDate: orderDate,
      status: "order",
      currency: selectedClient.currency,
      poNumber: this.state.poNumber || this.generateRandomCode("PO"),
      scp: scp,
      eanList: eanList,
      delivery_date: this.state.deliveryDate,
      backOrder: String(this.state.backOrder).toLowerCase() === "yes",
    };

    try {
      const batch = writeBatch(db);

      function validateOrderSchema(order) {
        if (!order.clientId || !order.creationDate || !order.eanList)
          return false;

        for (const ean in order.eanList) {
          const item = order.eanList[ean];
          if (
            !item.quantity ||
            !item.sku ||
            !item.description ||
            !item.transport ||
            !item.transport.unitPrice ||
            !item.transport.warehouse ||
            !item.supplierId
          ) {
            console.warn(`Missing required fields in item ${ean}`);
            return false;
          }
        }

        return true;
      }

      batch.update(clientDocRef, { scpCounter: increment(1) });
      batch.set(doc(ordersRef), newOrder);

      console.log("Order to be saved:", newOrder);
      await batch.commit();

      const { currentUser } = this.context;

      LogAudit({
        user: currentUser?.email || "Unknown",
        action: "Create Order",
        entity: `PO: ${newOrder.poNumber}`,
        details: `Order ${newOrder.scp} created by ${currentUser?.email} for client ${selectedClient.name} with ${basket.length} items`,
      });

      this.setState({
        submitting: false,
        submitted: true,
        basket: [],
        searchQuery: "",
        quantity: 1,
        selectedProduct: null,
      });
      setTimeout(() => this.setState({ submitted: false }), 5000);
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Failed to save order. Please try again.");
      this.setState({ submitting: false });
    }
  };

  addToBasket = () => {
    const { selectedProduct, quantity, basket, selectedTransport, inputPrice } =
      this.state;

    if (!selectedProduct || !quantity || quantity < 1) {
      alert("Please select a valid product and a quantity greater than 0.");
      return;
    }

    if (!selectedTransport || inputPrice === 0) {
      alert("Please select a transport method before adding to basket.");
      return;
    }

    const allTransports = Object.values(
      this.state.selectedSupplier?.warehouses || {}
    ).flatMap((warehouse) => warehouse.transport || []);

    const selectedTransportObject = allTransports.find(
      (t) => t.name === this.state.selectedTransport
    );
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(
      estimatedDelivery.getDate() + (selectedTransportObject?.sla || 0)
    );

    const selectedWarehouseRegion = Object.entries(
      this.state.selectedSupplier?.warehouses || {}
    ).find(([_, warehouse]) =>
      (warehouse.transport || []).some((t) => t.name === selectedTransport)
    )?.[0];

    const newItem = {
      ean: selectedProduct.ean,
      sku: selectedProduct.sku,
      description: selectedProduct.description,
      quantity: parseInt(quantity),
      unitPrice: selectedTransportObject?.unitPrice || inputPrice,
      isBlocked: false,
      selectedWarehouse: selectedWarehouseRegion || "",
      transport: {
        name: selectedTransportObject?.name || selectedTransport,
        unitPrice: selectedTransportObject?.unitPrice || inputPrice,
        sla: selectedTransportObject?.sla || null,
        warehouse: selectedWarehouseRegion || null,
      },

      estimatedDelivery: estimatedDelivery.toLocaleDateString(),
      supplierId: this.state.selectedSupplier?.supplierId || null,
    };

    console.log("Transport selected:", selectedTransport, inputPrice);

    this.setState({
      basket: [...basket, newItem],
      selectedProduct: null,
      searchQuery: "",
      quantity: 1,
      unitPrice: selectedTransportObject?.unitPrice || inputPrice,
      selectedTransport: null,
      inputPrice: 0,
      confirmedSupplier: this.state.selectedSupplier,
      selectedSupplier: null,

      supplierOptions: [],
    });
  };

  removeFromBasket = (indexToRemove) => {
    const updatedBasket = this.state.basket.filter(
      (_, index) => index !== indexToRemove
    );
    this.setState({ basket: updatedBasket });
  };

  updateBasketQuantity = (index, newQuantity) => {
    const updatedBasket = [...this.state.basket];
    updatedBasket[index].quantity = parseInt(newQuantity) || 1;
    this.setState({ basket: updatedBasket });
  };

  render() {
    const {
      client,
      searchType,
      searchQuery,
      quantity,
      submitting,
      submitted,
      results,
      showResults,
    } = this.state;

    return (
      <div className="upload-form">
        <h2 className="create-order-title">Create an Order</h2>

        <Form onSubmit={this.handleSubmit} className="form-center">
          <FormGroup>
            <Label for="clientSelect">Client</Label>
            <Input
              type="select"
              name="client"
              id="clientSelect"
              value={client}
              onChange={this.handleChange}
              required
            >
              <option value="">Select a client...</option>
              {this.state.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Input>
            {this.state.selectedClient && (
              <div className="selected-client mt-2">
                Client ID: <strong>{this.state.selectedClient.id}</strong>
              </div>
            )}
          </FormGroup>
          <FormGroup>
            <Label for="poNumber">
              PO Number
              <span
                id="poTooltip"
                style={{ marginLeft: "6px", cursor: "pointer" }}
              >
                ℹ️
              </span>
            </Label>
            <Input
              type="text"
              name="poNumber"
              id="poNumber"
              value={this.state.poNumber}
              onChange={this.handleChange}
              placeholder="Auto-generated or custom PO number"
            />
            <UncontrolledTooltip placement="right" target="poTooltip">
              Auto-generated from client info, but you can edit it.
            </UncontrolledTooltip>
          </FormGroup>

          <FormGroup>
            <Label for="searchTypeSelect">Product Search by</Label>
            <Input
              type="select"
              name="searchType"
              id="searchTypeSelect"
              value={searchType}
              onChange={this.handleChange}
              required
            >
              <option value="sku">SKU</option>
              <option value="ean">EAN</option>
            </Input>
          </FormGroup>

          <FormGroup>
            <Label for="searchInput">
              {searchType === "ean" ? "EAN" : "SKU"}
            </Label>
            <Input
              type="text"
              name="searchQuery"
              id="searchInput"
              className="product-search-input"
              placeholder={`Search by ${searchType.toUpperCase()} (min. 4 characters)`}
              value={searchQuery}
              onChange={this.handleChange}
            />
            {searchQuery.length > 0 && searchQuery.length < 4 && (
              <div className="text-warning mt-2">
                Please enter at least 4 characters to search.
              </div>
            )}
          </FormGroup>

          {showResults && results.length > 0 && (
            <ListGroup className="product-search-results show">
              {results.map((product) => (
                <ListGroupItem
                  key={product.id}
                  tag="button"
                  action
                  onClick={() => {
                    const selected = product;
                    const supplierOptions = selected.supplierList || [];

                    this.setState({
                      searchQuery:
                        searchType === "ean" ? selected.ean : selected.sku,
                      selectedProduct: selected,
                      showResults: false,
                      results: [],
                      quantity: 1,
                      unitPrice: selected.unitPrice || null,
                      transport: {
                        name: this.state.selectedTransport,
                        unitPrice: this.state.inputPrice,
                      },

                      supplierOptions,
                      selectedSupplier: null,
                      selectedTransport: null,
                      inputPrice: 0,
                    });
                  }}
                >
                  {searchType === "ean" ? product["ean"] : product["sku"]}
                </ListGroupItem>
              ))}
            </ListGroup>
          )}
          {showResults && results.length === 0 && searchQuery.length >= 4 && (
            <div className="no-results">No matching products found.</div>
          )}
          <FormGroup>
            <Label for="quantityInput">Quantity</Label>
            <Input
              type="number"
              name="quantity"
              id="quantityInput"
              placeholder="Set an amount"
              step="1"
              min="1"
              value={quantity}
              onChange={this.handleChange}
              required
            />
            {this.state.selectedProduct && !this.state.selectedSupplier && (
              <div
                style={{
                  color: "red",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                Please select a supplier to continue.
              </div>
            )}
            <FormGroup>
              <Label for="supplierSelect">Select Supplier</Label>
              <Input
                type="select"
                name="selectedSupplier"
                id="supplierSelect"
                value={this.state.selectedSupplier?.supplierId || ""}
                onChange={(e) => {
                  const supplierId = e.target.value;
                  const supplier = this.state.supplierOptions.find(
                    (s) => s.supplierId === supplierId
                  );
                  this.setState({
                    selectedSupplier: supplier,
                    selectedTransport: null,
                    inputPrice: 0,
                  });
                }}
              >
                <option value="">Choose a supplier...</option>
                {this.state.supplierOptions.map((s, i) => (
                  <option key={i} value={s.supplierId}>
                    {s.supplierId}
                  </option>
                ))}
              </Input>
            </FormGroup>
            {this.state.selectedSupplier && (
              <FormGroup>
                {/* Transport warning */}
                {(!this.state.selectedTransport ||
                  this.state.inputPrice <= 0) && (
                  <div
                    style={{
                      color: "red",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Please select a transport method to enable the button.
                  </div>
                )}
                {Object.keys(this.state.selectedSupplier?.warehouses || {})
                  .length === 0 && (
                  <div style={{ fontSize: "0.85rem", color: "#888" }}>
                    No transport options available for this supplier.
                  </div>
                )}

                <Label for="transportSelect">Select Transport</Label>
                <Input
                  type="select"
                  name="selectedTransport"
                  id="transportSelect"
                  value={this.state.selectedTransport || ""}
                  onChange={(e) => {
                    const transportName = e.target.value;

                    const allTransports = Object.values(
                      this.state.selectedSupplier?.warehouses || {}
                    ).flatMap((warehouse) => warehouse.transport || []);

                    const selectedTransportObject = allTransports.find(
                      (t) => t.name === transportName
                    );

                    this.setState({
                      selectedTransport: selectedTransportObject?.name || "",
                      inputPrice: selectedTransportObject?.unitPrice || 0,
                    });

                    // Auto-set delivery date based on SLA
                    if (selectedTransportObject?.sla) {
                      const today = new Date();
                      today.setDate(
                        today.getDate() + selectedTransportObject.sla
                      );
                      this.setState({ deliveryDate: today });
                    }
                  }}
                >
                  <option value="">Choose transport...</option>
                  {Object.entries(
                    this.state.selectedSupplier.warehouses || {}
                  ).flatMap(([regionName, warehouse]) =>
                    (warehouse.transport || []).map((t, i) => (
                      <option key={`${regionName}-${i}`} value={t.name}>
                        {t.name} ({regionName}) – {this.state.selectedClient.currency}{t.unitPrice}, SLA: {t.sla}{" "}
                        days
                      </option>
                    ))
                  )}
                </Input>
              </FormGroup>
            )}

            {this.state.inputPrice > 0 && (
              <FormGroup>
                <Label>Unit Price</Label>
                <div className="price-display">
                  {this.state.inputPrice} {this.state.selectedClient.currency}
                </div>
              </FormGroup>
            )}
            <FormGroup>
              <Label for="deliveryDate">Delivery Date</Label>
              <Input
                type="date"
                name="deliveryDate"
                id="deliveryDate"
                value={
                  this.state.deliveryDate
                    ? new Date(this.state.deliveryDate)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  const minDate = new Date(this.getMinDeliveryDate());
                  selectedDate.setHours(0, 0, 0, 0);
                  minDate.setHours(0, 0, 0, 0);

                  if (selectedDate >= minDate) {
                    this.setState({ deliveryDate: selectedDate });
                  } else {
                    alert(
                      `Please select a date on or after ${minDate.toLocaleDateString()}`
                    );
                  }
                }}
                placeholder="Select a date"
                min={this.getMinDeliveryDate()}
              />
              {this.state.selectedTransport && (
                <div style={{ fontSize: "0.85rem", color: "#666" }}>
                  Earliest delivery: {this.getMinDeliveryDate()}
                </div>
              )}
            </FormGroup>
            <Button
              className="basket-button"
              color="secondary"
              onClick={this.addToBasket}
              disabled={
                !this.state.selectedProduct ||
                this.state.quantity < 1 ||
                !this.state.selectedTransport ||
                this.state.inputPrice <= 0
              }
            >
              Add to Basket
            </Button>
            {this.state.basket.length > 0 &&
              (() => {
                const totalOrderCost = this.state.basket.reduce((sum, item) => {
                  const itemTotal =
                    (item.unitPrice || 0) * item.quantity +
                    (item.transport?.unitPrice || 0) * item.quantity;
                  return sum + itemTotal;
                }, 0);

                return (
                  <div className="basket-preview mt-4">
                    <h5>Order Preview</h5>
                    <ListGroup>
                      {this.state.basket.map((item, index) => {
                        const itemTotal =
                          (item.unitPrice || 0) * item.quantity +
                          (item.transport?.unitPrice || 0) * item.quantity;

                        return (
                          <ListGroupItem
                            key={index}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div className="basket-item-info">
                              <strong>{item.sku}</strong> (EAN: {item.ean})
                              <br />
                              Quantity: {item.quantity}
                              <br />
                              Estimated Delivery:{" "}
                              {new Date(
                                item.estimatedDelivery
                              ).toLocaleDateString()}
                              <br />
                              <div className="basket-desglosed-costs">
                                Unit Price: {this.state.selectedClient.currency}
                                {item.unitPrice?.toFixed(2) || "0.00"}
                                <br />
                                <strong>
                                  Total Cost (Products + Transport):
                                </strong>{" "}
                                {this.state.selectedClient.currency}{itemTotal.toFixed(2)}
                              </div>
                            </div>

                            <div className="basket-item-controls d-flex align-items-center">
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  this.updateBasketQuantity(
                                    index,
                                    e.target.value
                                  )
                                }
                                className="basket-quantity-input me-2"
                                style={{ width: "80px" }}
                              />
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => this.removeFromBasket(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          </ListGroupItem>
                        );
                      })}
                    </ListGroup>

                    <div className="mt-3 text-end">
                      <h6>
                        <strong>Total Order Cost:</strong> {this.state.selectedClient.currency}
                        {totalOrderCost.toFixed(2)}
                      </h6>
                    </div>

                    <div className="mt-3 text-end">
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to clear the entire basket?"
                            )
                          ) {
                            this.setState({ basket: [] });
                          }
                        }}
                        className="clear-basket-button"
                      >
                        Clear Basket
                      </Button>
                    </div>
                  </div>
                );
              })()}
          </FormGroup>
          {/*
          <FormGroup>
            <Label for="currencySelect">Currency</Label>
            <Input
              type="select"
              name="currency"
              id="currencySelect"
              value={this.state.currency}
              onChange={this.handleChange}
              required
            >
              <option value="€">Euro (€)</option>
              <option value="£">Pound Sterling (£)</option>
              <option value="$">US Dollar ($)</option>
            </Input>
          </FormGroup>
          */}
          <FormGroup>
            <Label for="backOrder">Flexibility</Label>
            <Input
              type="select"
              name="backOrder"
              id="backOrder"
              value={this.state.backOrder || ""}
              onChange={this.handleChange}
              required
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Input>
          </FormGroup>

          <FormGroup>
            <Button
              type="submit"
              className="submit-button"
              disabled={submitting || this.state.basket.length === 0}
            >
              {submitting ? "Submitting..." : "Save Order"}
            </Button>
          </FormGroup>

          {submitted && (
            <div className="status success">Order submitted successfully!</div>
          )}
        </Form>
      </div>
    );
  }
}

export default OrderForm;
