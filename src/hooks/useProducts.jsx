import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";

export const useProducts = (eanList) => {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!eanList || Object.keys(eanList).length === 0) {
        setLoading(false);
        return;
      }

      try {
        const eanKeys = Object.keys(eanList);
        const productsQuery = query(
          collection(db, "products"),
          where("ean", "in", eanKeys)
        );
        const snapshot = await getDocs(productsQuery);

        let allWarehouses = new Set();
        const productsData = snapshot.docs.map((doc) => {
          const raw = doc.data();
          const orderData = eanList[raw.ean] || {};

          // 1. Robustly access supplierList (handles Map or Array inconsistency)
          const productSuppliers = Array.isArray(raw.supplierList)
            ? raw.supplierList
            : Object.values(raw.supplierList || {}); // FIX: Convert Map to Array of values

          // 2. Identify the specific supplier/warehouse chosen in the Order
          const selectionSupplierId = orderData.supplierId;
          const selectionWarehouseKey =
            orderData.warehouse ||
            Object.keys(productSuppliers[0]?.warehouses || {})[0] ||
            "";

          let selectedWarehouseData = {};

          // Find the supplier object in the product list that matches the ID in the Order
          const matchingSupplier = productSuppliers.find(
            (s) => s.supplierId === selectionSupplierId
          );

          if (matchingSupplier) {
            // Case 1: Supplier found by ID (works for multi-supplier arrays)
            selectedWarehouseData =
              matchingSupplier.warehouses?.[selectionWarehouseKey] || {};
          } else if (productSuppliers.length === 1) {
            // Case 2: Fallback for the inconsistent single-entry MAP (Gre-Gr-M-271-7)
            // If ID didn't match (because it's missing in the object value), use the single entry.
            selectedWarehouseData =
              productSuppliers[0].warehouses?.[selectionWarehouseKey] || {};
          }

          // 3. Collect all unique warehouse keys for the dropdown (for completeness)
          productSuppliers.forEach((s) =>
            Object.keys(s.warehouses || {}).forEach((w) => allWarehouses.add(w))
          );

          const transportOptions = selectedWarehouseData.transport || [];
          const selectedTransport =
            transportOptions.find(
              (t) => t.name === orderData.transport?.name
            ) || transportOptions[0];

          const unitPrice =
            orderData.unitPrice ?? selectedTransport?.unitPrice ?? 0;
          const selectedTransportName = selectedTransport?.name ?? "";
          const warehouseName = selectedWarehouseData?.name ?? "";

          const quantity = orderData.quantity || 0; // The order quantity

          return {
            id: doc.id,
            ...raw,

            supplierId: selectionSupplierId,
            warehouseKey: selectionWarehouseKey,

            quantityInOrder: quantity,
            unitPrice,
            total: unitPrice * quantity,
            isBlocked: orderData.isBlocked || false,
            selectedTransportName,
            warehouseName,
          };
        });

        setProducts(productsData);
        setWarehouses([...allWarehouses]);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [eanList]);

  return { products, warehouses, loading };
};
