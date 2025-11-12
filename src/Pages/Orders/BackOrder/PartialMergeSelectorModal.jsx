import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Table,
  Input,
  Alert,
  Spinner, // Añadido para mostrar carga
} from "reactstrap";
import {
  collection,
  query,
  where,
  getDocs,
  getFirestore,
  // No usamos updateDoc, doc, setDoc en este componente, puedes quitarlos si quieres
} from "firebase/firestore";

const db = getFirestore();

/**
 * Componente Modal para seleccionar cantidades parciales de productos
 * de pedidos seleccionados para una fusión.
 */
const PartialMergeSelectorModal = ({
  isOpen,
  toggle,
  ordersToMerge,
  clientName,
  onConfirmMerge,
}) => {
  const [mergeItems, setMergeItems] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado de carga

  /**
   * Busca los datos de stock del producto en la colección 'products' por SKU,
   * calcula la disponibilidad total basada en supplierList, y devuelve el objeto.
   * * @param {string} sku - El SKU del producto a buscar.
   * @returns {Promise<Object>} El objeto completo del producto con la propiedad
   * 'totalAvailableStock' calculada, o un objeto vacío.
   */
  const getProductAvailability = async (sku) => {
    if (!sku) return {};

    const productsRef = collection(db, "products");
    const q = query(productsRef, where("sku", "==", sku));

    try {
      const querySnapshot = await getDocs(q);
      let productData = null;

      querySnapshot.forEach((doc) => {
        productData = { ...doc.data(), id: doc.id }; // Incluimos el ID del documento
      });

      if (productData && productData.supplierList) {
        let totalAvailableStock = 0;

        // Recorrer la lista de proveedores
        productData.supplierList.forEach((supplier) => {
          if (supplier.warehouses) {
            // Recorrer los almacenes dentro de cada proveedor
            Object.values(supplier.warehouses).forEach((warehouse) => {
              const wQuantity = warehouse.quantity || 0;
              const wBlocked = warehouse.blocked_quantity || 0;

              // Sumar el stock disponible: (Stock del almacén - Bloqueado del almacén)
              totalAvailableStock += wQuantity - wBlocked;
            });
          }
        });

        // Adjuntamos la disponibilidad total calculada al objeto del producto
        productData.totalAvailableStock = totalAvailableStock;

        return productData;
      }

      // Si no se encuentra el producto o no tiene supplierList
      return { sku, totalAvailableStock: 0 };
    } catch (error) {
      console.error(
        "❌ Error fetching product availability for SKU:",
        sku,
        error
      );
      return { sku, totalAvailableStock: 0 };
    }
  };

  // 1. Aplanar, obtener stock y filtrar los productos disponibles
  useEffect(() => {
    if (!isOpen || ordersToMerge.length === 0) {
      setMergeItems([]);
      return;
    }

    const loadAndFilterProducts = async () => {
      setIsLoading(true);

      const itemsToProcess = ordersToMerge.flatMap((order) =>
        order.products.map((product) => ({
          orderId: order.orderId,
          scp: order.scp,
          sku: product.sku || product.ean,
          description: product.description,
          orderQuantity: product.quantity || 0, // Cantidad que pide el cliente
          unitPrice: product.unitPrice || 0,
        }))
      );

      const loadedProducts = await Promise.all(
        itemsToProcess.map(async (item) => {
          // 1. Obtener el producto completo de Firebase, incluyendo el stock calculado
          const fullProductData = await getProductAvailability(item.sku);

          // 2. Usar la disponibilidad calculada (sumando todos los almacenes)
          const availableStockInDB = fullProductData.totalAvailableStock || 0;

          // 3. Cantidad final a fusionar: el mínimo entre la cantidad pedida
          //    y el stock disponible real.
          const finalAvailableForMerge = Math.min(
            item.orderQuantity,
            availableStockInDB
          );

          return {
            ...item,
            // Usamos el SKU/EAN para mostrar en la tabla (item.sku)
            ean: item.sku,
            // El máximo que el usuario puede fusionar (cantidad disponible)
            originalQuantity: finalAvailableForMerge,
            quantityToMerge: finalAvailableForMerge,
            uniqueId: `${item.orderId}-${item.sku}`,
          };
        })
      );

      // 4. Filtrar: Solo mostrar aquellos productos donde la cantidad a fusionar es mayor que 0
      const filteredProducts = loadedProducts.filter(
        (item) => item.originalQuantity > 0
      );

      setMergeItems(filteredProducts);
      setIsLoading(false);
    };

    loadAndFilterProducts();
  }, [isOpen, ordersToMerge]);

  // Maneja el cambio de cantidad en el input
  const handleQuantityChange = (uniqueId, value) => {
    const newQuantity = parseInt(value) || 0;

    setMergeItems((prevItems) =>
      prevItems.map((item) => {
        if (item.uniqueId === uniqueId) {
          if (newQuantity > item.originalQuantity) {
            setError(
              `Quantity for EAN ${item.ean} exceeds the available quantity of ${item.originalQuantity}.`
            );
            return item;
          }
          setError(null);
          return { ...item, quantityToMerge: newQuantity };
        }
        return item;
      })
    );
  };

  // Calcula el total estimado de la nueva factura fusionada
  const totalEstimatedAmount = useMemo(() => {
    return mergeItems
      .reduce((sum, item) => {
        return sum + item.quantityToMerge * item.unitPrice;
      }, 0)
      .toFixed(2);
  }, [mergeItems]);

  // Maneja la confirmación final de la fusión
  const handleConfirm = () => {
    const validItems = mergeItems.filter((item) => item.quantityToMerge > 0);

    if (validItems.length === 0) {
      setError("Please select at least one product to merge.");
      return;
    }

    const finalMergeData = {
      clientId: ordersToMerge.length > 0 ? ordersToMerge[0].clientId : null,
      clientName: clientName,
      originalOrders: ordersToMerge.map((o) => o.orderId),
      mergedProducts: validItems,
      totalAmount: totalEstimatedAmount,
    };

    onConfirmMerge(finalMergeData);
    toggle();
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="xl">
      <ModalHeader toggle={toggle}>
        Partial Merge Selector for Client: {clientName}
      </ModalHeader>
      <ModalBody>
        <Alert color="info">
          Select the exact quantity to include in the new merged order. The
          maximum quantity for each item is shown in the 'Available QTY' column.
          <br />
          **Only products with positive available stock (Stock - Blocked QTY)
          are shown.**
        </Alert>

        {error && <Alert color="danger">{error}</Alert>}

        {/* Mostramos el spinner mientras se carga el stock de Firebase */}
        {isLoading ? (
          <div className="text-center p-5">
            <Spinner color="primary" />{" "}
            <p className="mt-2">Loading product inventory from database...</p>
          </div>
        ) : (
          <div
            className="table-responsive"
            style={{ maxHeight: "60vh", overflowY: "auto" }}
          >
            <Table bordered striped size="sm">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>SKU/EAN</th>{" "}
                  {/* Título ajustado para reflejar el uso de SKU/EAN */}
                  <th>Description</th>
                  <th>Unit Price</th>
                  <th>Available QTY</th>
                  <th style={{ width: "150px" }}>QTY to Merge</th>
                  <th>Estimated Total</th>
                </tr>
              </thead>
              <tbody>
                {mergeItems.map((item) => (
                  <tr key={item.uniqueId}>
                    <td>{item.scp}</td>
                    <td>{item.ean}</td>
                    <td>{item.description}</td>
                    <td>${item.unitPrice.toFixed(2)}</td>
                    <td>{item.originalQuantity}</td>
                    <td>
                      <Input
                        type="number"
                        min="0"
                        max={item.originalQuantity}
                        value={item.quantityToMerge}
                        onChange={(e) =>
                          handleQuantityChange(item.uniqueId, e.target.value)
                        }
                        style={
                          item.quantityToMerge === 0
                            ? { borderColor: "orange" }
                            : {}
                        }
                      />
                    </td>
                    <td>
                      ${(item.quantityToMerge * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {mergeItems.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      No available products found in the selected orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}

        <h5 className="mt-3 text-end">
          Total Estimated Invoice Amount:{" "}
          <span className="text-success">${totalEstimatedAmount}</span>
        </h5>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          color="success"
          onClick={handleConfirm}
          disabled={error !== null || isLoading || mergeItems.length === 0}
        >
          Confirm Partial Merge (
          {mergeItems.filter((i) => i.quantityToMerge > 0).length} Items)
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default PartialMergeSelectorModal;
