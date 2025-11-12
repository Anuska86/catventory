import React, { useState } from "react";
import {
  Table,
  Input,
  Button,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getFirestore,
  setDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const db = getFirestore();

const ProductTable = ({
  products,
  warehouses,
  currency,
  scp,
  onBlock,
  onUnblock,
  productSelections,
  updateProductSelection,
}) => {
  const navigate = useNavigate();
  const [billingModal, setBillingModal] = useState(false);
  const [billingWarning, setBillingWarning] = useState({
    // Renombramos las claves para reflejar la nueva lógica: "sendable" (enviables) y "unsendable" (no enviables).
    sendable: [], // Incluye Available, Blocked, Partial Blocked
    unsendable: [], // Solo Unavailable
  });

  const toggleBillingModal = () => setBillingModal(!billingModal);

  // Reutilizamos la lógica del estado del producto para clasificar
  const getProductStatus = (product, selection, warehouseData) => {
    const orderQty = product.quantity || selection.quantity || 1;

    const blockedQty =
      typeof warehouseData?.blocked_quantity === "number"
        ? warehouseData.blocked_quantity
        : selection.blockedQuantity || 0;

    // 🚨 LÓGICA DE DISPONIBILIDAD 🚨
    const currentAvailableQty =
      typeof warehouseData?.quantity === "number"
        ? warehouseData.quantity
        : null;

    // Si el almacén seleccionado tiene 0 unidades, es "Unavailable" y NO ENVIABLE.
    if (currentAvailableQty === 0) {
      return "Unavailable";
    }

    // Lógica de bloqueo existente
    if (blockedQty === orderQty) return "Blocked";
    if (blockedQty > 0 && blockedQty < orderQty) return "Partial Blocked";

    // Este caso se mantiene por si orderQty es 0, aunque ya no es el chequeo principal de "Unavailable"
    if (!orderQty || orderQty === 0) return "Unavailable";

    return "Available";
  };

  const sendToBillingAPI = async (eans, unbillingeans) => {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("scp", "==", scp));

    try {
      const querySnapshot = await getDocs(q);
      let orderData = {};

      querySnapshot.forEach((doc) => {
        orderData = doc.data();
      });

      const orderToBill = cleanSelectedEans(orderData, unbillingeans);
      const orderToBackOrder = cleanSelectedEans(orderData, eans);
      if (orderToBackOrder != null) {
        manageUnbillingEans(orderData.backOrder, orderData.scp, orderToBackOrder)
      }

      if (querySnapshot.empty) {
        console.warn(
          `⚠️ No se encontró ninguna orden con el código ID: ${scp}.`
        );
        return;
      }

      const updates = querySnapshot.docs.map(async (document) => {
        await updateDoc(document.ref, {
          eanList: orderToBill.eanList,
          status: "billing",
          financialStatus: "pending",
          shippingStatus: "pending",
        });
      });

      await Promise.all(updates);
      console.log(
        `✅ Éxito: Se actualizaron ${updates.length} documentos a 'billing' para el ID ${scp}.`
      );
      alert(
        `Éxito: Se han enviado ${eans.length} productos disponibles a Billing.`
      );
      navigate("/orders/backorder");
    } catch (error) {
      console.error(
        "❌ Error en la operación UPDATE WHERE en Firebase:",
        error
      );
    }
  };

  const manageUnbillingEans = async (backOrder, orderScp, order) => {
    const newSCP = uuidv4().slice(0, 10);
    const formattedOrderData = {
      ...order,
      scp: newSCP,
      status: "order",
      relatedScp: orderScp,
      creationDate: new Date(),
    };
    let ordersCollectionRef;
    let reference = "ordersBacklog";
    if (backOrder === true) {
      ordersCollectionRef = collection(db, "orders");
      reference = "orders";
    } else {
      ordersCollectionRef = collection(db, "ordersBacklog");
    }
    const newOrderRef = doc(ordersCollectionRef);
    try {
      await setDoc(newOrderRef, formattedOrderData);
      console.log(`✅ Éxito: Se creó una nueva orden en ${reference} con ID: ${newSCP}`);
    } catch (error) {
      console.error(`❌ Error al crear la orden en ${reference}:`, error);
    }
  }

  const handleSendToBillingClick = () => {
    const sendableProducts = [];
    const unsendableProducts = [];

    products.forEach((product) => {
      const selection = productSelections[product.ean] || {};
      const orderQuantity = product.quantity || selection.quantity || 1;
      let selectedWarehouseData = null;

      // Replicación de la lógica para obtener la data del almacén
      if (product.supplierList && selection.warehouseKey) {
        const supplierListArray = Array.isArray(product.supplierList)
          ? product.supplierList
          : Object.values(product.supplierList || {});

        const selectedSupplier = supplierListArray.find(
          (s) => s.supplierId === selection.supplierId
        );

        if (selectedSupplier) {
          selectedWarehouseData =
            selectedSupplier.warehouses?.[selection.warehouseKey];
        } else if (
          !Array.isArray(product.supplierList) &&
          supplierListArray.length === 1 &&
          selection.supplierId
        ) {
          selectedWarehouseData =
            supplierListArray[0].warehouses?.[selection.warehouseKey];
        }
      }

      // 🚨 Usamos la función de estado actualizada 🚨
      const productStatus = getProductStatus(
        product,
        selection,
        selectedWarehouseData
      );

      const blockedQuantity =
        typeof selectedWarehouseData?.blocked_quantity === "number"
          ? selectedWarehouseData.blocked_quantity
          : selection.blockedQuantity || 0;

      const productData = {
        sku: product.sku,
        ean: product.ean,
        status: productStatus,
        blocked: blockedQuantity,
        ordered: orderQuantity,
      };

      // Clasificar: Solo se envía si el estado NO es "Unavailable"
      if (productStatus !== "Unavailable") {
        sendableProducts.push(productData);
      } else {
        unsendableProducts.push(productData);
      }
    });

    setBillingWarning({
      sendable: sendableProducts,
      unsendable: unsendableProducts,
    });
    setBillingModal(true);
  };

  const handleConfirmBilling = () => {
    toggleBillingModal();
    const eansToBill = billingWarning.sendable.map((p) => p.ean);
    const unbillingeans = billingWarning.unsendable.map((p) => p.ean);
    sendToBillingAPI(eansToBill, unbillingeans);
  };

  const cleanSelectedEans = (orderObject, keysToDelete) => {
    const orderClone = { ...orderObject };
    if (orderClone.eanList) {
      orderClone.eanList = { ...orderObject.eanList };
    }
    keysToDelete.forEach(key => {
      if (orderClone.eanList.hasOwnProperty(key)) {
        delete orderClone.eanList[key];
      }
    });
    return orderClone;
  }
  // =================================================================
  // ⬆️ LÓGICA DE SEND TO BILLING (MODIFICADA) ⬆️
  // =================================================================

  const hasUnblockSelection = Object.values(productSelections).some(
    (sel) => sel.unblockSelected
  );

  return (
    <div className="product-table">
      <Table bordered responsive>
        <thead>
          <tr>
            <th>Unblock</th>
            <th>SKU + Description on hover</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
            <th>Supplier</th>
            <th>Warehouse</th>
            <th>Transport</th>
            <th>Blocked Quantity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const selection = productSelections[product.ean] || {};

            const orderQuantity = product.quantity || selection.quantity || 1;

            let selectedWarehouseData = null;

            if (product.supplierList && selection.warehouseKey) {
              // ... Lógica de selección de almacén (sin cambios) ...
              const supplierListArray = Array.isArray(product.supplierList)
                ? product.supplierList
                : Object.values(product.supplierList || {});

              const selectedSupplier = supplierListArray.find(
                (s) => s.supplierId === selection.supplierId
              );

              if (selectedSupplier) {
                selectedWarehouseData =
                  selectedSupplier.warehouses?.[selection.warehouseKey];
              } else if (
                !Array.isArray(product.supplierList) &&
                supplierListArray.length === 1 &&
                selection.supplierId
              ) {
                selectedWarehouseData =
                  supplierListArray[0].warehouses?.[selection.warehouseKey];
              }
            }

            const blockedQuantityToDisplay =
              typeof selectedWarehouseData?.blocked_quantity === "number"
                ? selectedWarehouseData.blocked_quantity
                : selection.blockedQuantity || 0;

            const productStatus = getProductStatus(
              product,
              selection,
              selectedWarehouseData
            );

            const availableQuantity =
              typeof selectedWarehouseData?.quantity === "number"
                ? selectedWarehouseData.quantity
                : "—";

            const isUnavailable = productStatus === "Unavailable";

            return (
              <tr
                key={product.ean}
                style={{
                  backgroundColor: isUnavailable
                    ? "#f0f0f0"
                    : productStatus === "Blocked" || productStatus === "Available"
                      ? "#e6ffe6"
                      : productStatus.startsWith("Partial")
                        ? "#fff4e6"
                        : "#ffe6e6",
                  // Opcional: Cambiar cursor para indicar que está bloqueada
                  cursor: isUnavailable ? "not-allowed" : "default",
                  opacity: isUnavailable ? 0.6 : 1, // Atenuar la fila

                  // ... (el resto de tus estilos de bordeLeft)
                  borderLeft: `6px solid ${productStatus === "Blocked" || productStatus === "Available"
                    ? "green"
                    : productStatus.startsWith("Partial")
                      ? "orange"
                      : isUnavailable // Borde rojo para Unavailable y Available
                        ? "red"
                        : "red"
                    }`,
                }}
              >
                {/* Unblocked */}
                <td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Input
                      type="checkbox"
                      checked={
                        !!productSelections[product.ean]?.unblockSelected
                      }
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateProductSelection(
                          product.ean,
                          "unblockSelected",
                          checked
                        );
                        if (
                          checked &&
                          !productSelections[product.ean]?.unblockQuantity
                        ) {
                          updateProductSelection(
                            product.ean,
                            "unblockQuantity",
                            selectedWarehouseData?.blocked_quantity || 0
                          );
                        }
                      }}
                      // Deshabilitar si es Unavailable o no hay nada que desbloquear
                      disabled={isUnavailable || blockedQuantityToDisplay === 0}
                      title={
                        isUnavailable
                          ? "Unavailable: Cannot unblock if out of stock"
                          : blockedQuantityToDisplay === 0
                            ? "No units blocked"
                            : "Select to unblock this product"
                      }
                    />
                    {productSelections[product.ean]?.unblockSelected ? (
                      <>
                        <Badge color="light" pill>
                          Qty
                        </Badge>

                        <Input
                          type="number"
                          min={0}
                          max={selectedWarehouseData?.blocked_quantity || 0}
                          value={
                            productSelections[product.ean]?.unblockQuantity ||
                            ""
                          }
                          onChange={(e) =>
                            updateProductSelection(
                              product.ean,
                              "unblockQuantity",
                              parseInt(e.target.value)
                            )
                          }
                          placeholder="Unblock Q"
                          style={{ width: "100px" }}
                        />
                      </>
                    ) : (
                      <span style={{ color: "#ccc", fontSize: "0.85rem" }}>
                        —
                      </span>
                    )}
                  </div>
                </td>

                {/* SKU */}
                <td title={product.description}>{product.sku}</td>

                {/* Quantity to Order */}
                <td>
                  <label style={{ fontSize: "0.85rem", marginBottom: "4px" }}>
                    Quantity to Order
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={orderQuantity}
                    onChange={(e) =>
                      updateProductSelection(
                        product.ean,
                        "quantity",
                        parseInt(e.target.value)
                      )
                    }
                    // Deshabilitar si es Unavailable
                    disabled={isUnavailable || product.isBlocked}
                    style={{ width: "80px" }}
                  />
                </td>
                <td>
                  {currency} {product.unitPrice?.toFixed(2) || "0.00"}
                </td>
                <td>
                  {currency} {product.total?.toFixed(2) || "0.00"}
                </td>
                <td>
                  <span className="text-muted">
                    {selection.supplierId || "—"}
                  </span>
                </td>
                <td>{product.warehouseName || "—"}</td>
                <td>{product.selectedTransportName || "—"}</td>

                {/* Blocked Quantity - Lógica de bloqueo sin cambios */}
                <td>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {blockedQuantityToDisplay < orderQuantity ? (
                      <>
                        <label
                          style={{ fontSize: "0.85rem", marginBottom: "4px" }}
                        >
                          Add More Units to Block
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max={orderQuantity - blockedQuantityToDisplay}
                          value={selection.blockedQuantity || ""}
                          onChange={(e) => {
                            const val = Math.min(
                              orderQuantity - blockedQuantityToDisplay,
                              Math.max(0, parseInt(e.target.value))
                            );
                            updateProductSelection(
                              product.ean,
                              "blockedQuantity",
                              val
                            );
                          }}
                          // Deshabilitar si es Unavailable
                          disabled={isUnavailable}
                          style={{ width: "80px", marginBottom: "4px" }}
                          placeholder="Add block qty"
                        />
                      </>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "green",
                          fontWeight: "bold",
                        }}
                      >
                        Fully blocked 🔒
                      </span>
                    )}
                    {/*Remain units to block */}
                    <small style={{ fontSize: "0.75rem", color: "#555" }}>
                      Already blocked: {blockedQuantityToDisplay} /{" "}
                      {orderQuantity}
                    </small>

                    {/* Available quantity logic (from fix 1) remains here */}
                    <small style={{ fontSize: "0.75rem", color: "#555" }}>
                      Available: {availableQuantity}
                    </small>
                  </div>
                </td>

                {/* Status */}
                <td>
                  <span
                    style={{
                      color:
                        productStatus === "Blocked" || productStatus === "Available"
                          ? "green"
                          : productStatus.startsWith("Partial")
                            ? "orange"
                            : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {productStatus}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <div className="actions mt-3">
        <Button color="danger" onClick={onBlock}>
          Block Products
        </Button>{" "}
        <Button
          color="success"
          onClick={onUnblock}
          disabled={!hasUnblockSelection}
          title={!hasUnblockSelection ? "Select products to unblock" : ""}
        >
          Unblock Products
        </Button>
        {/* 🚨 BOTÓN PARA FACTURACIÓN 🚨 */}
        <Button
          color="warning"
          style={{ color: "white" }}
          onClick={handleSendToBillingClick}
          disabled={!products.length}
          title={
            !products.length
              ? "No products to send"
              : "Send available products (not Unavailable) to Billing"
          }
        >
          Send to Billing
        </Button>
      </div>

      {/* 🚨 MODAL DE ADVERTENCIA DE FACTURACIÓN (MODIFICADA) 🚨 */}
      <Modal isOpen={billingModal} toggle={toggleBillingModal}>
        <ModalHeader toggle={toggleBillingModal}>
          Solicitud de Productos Disponibles
        </ModalHeader>
        <ModalBody>
          <p>
            A continuación se muestra el resumen de los productos según su
            disponibilidad. **Solo los productos que NO estén "Unavailable" (sin
            stock) se enviarán a almacén para su preparación**.
          </p>

          {/* Productos Enviables (Available, Blocked, Partial Blocked) */}
          {billingWarning.sendable.length > 0 && (
            <div className="mb-3">
              <h5 className="text-success">
                ✅ Productos Listos para Facturar (
                {billingWarning.sendable.length})
              </h5>
              <p className="text-success">
                Estos productos (con stock disponible) **se enviarán a
                facturación**.
              </p>
              <ul>
                {billingWarning.sendable.map((p) => (
                  <li key={p.ean}>
                    **{p.sku}** ({p.ean}): **{p.status}** ({p.blocked} de{" "}
                    {p.ordered} unidades bloqueadas).
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Productos No Enviables (Unavailable) */}
          {billingWarning.unsendable.length > 0 && (
            <div>
              <h5 className="text-danger">
                ❌ No Enviables / Sin Stock ({billingWarning.unsendable.length})
              </h5>
              <p className="text-danger">
                Estos productos tienen el estado **Unavailable** y **NO se
                enviarán a facturación**.
              </p>
              <ul>
                {billingWarning.unsendable.map((p) => (
                  <li key={p.ean}>
                    **{p.sku}** ({p.ean}): **{p.status}**.
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleBillingModal}>
            Cancelar
          </Button>
          <Button
            color="warning"
            onClick={handleConfirmBilling}
            disabled={billingWarning.sendable.length === 0}
          >
            Confirmar Envío a Facturación ({billingWarning.sendable.length}{" "}
            Prod.)
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ProductTable;
