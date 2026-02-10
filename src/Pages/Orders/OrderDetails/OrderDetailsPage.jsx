import React, { useState, useEffect } from "react";
import { useParams, useLocation  } from "react-router-dom";

//hooks
import { fetchProductByEan } from "../../../utils/productService";
import { useOrderDetails } from "../../../hooks/useOrderDetails";
import { useClient } from "../../../hooks/useClient";
import { useProducts } from "../../../hooks/useProducts";

import OrderSummary from "./OrderSummary";
import ProductTable from "./ProductTable";
import BlockModal from "./BlockModal";
import UnlockModal from "./UnlockModal";

const OrderDetailsPage = () => {
  const { scp } = useParams();
  const location = useLocation();
  const {clientName, poNumber} = location.state; 

  const [currency, setCurrency] = useState("€");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const { order, loading: orderLoading } = useOrderDetails(scp);

  // Wait until order is loaded before calling dependent hooks
  const { client, loading: clientLoading } = useClient(order?.clientId ?? null);

  const {
    products,
    warehouses,
    loading: productsLoading,
  } = useProducts(order?.eanList);

  const [productSelections, setProductSelections] = useState({});
  const [localProducts, setLocalProducts] = useState([]);

  const updateProductSelection = (ean, field, value) => {
    setProductSelections((prev) => ({
      ...prev,
      [ean]: {
        ...prev[ean],
        [field]: value,
      },
    }));
  };

  const handleBlockComplete = (blockedSelections) => {
    const updatedProducts = localProducts.map((p) => {
      const selection = blockedSelections[p.ean];
      if (!selection) return p;

      const supplierIndex = Array.isArray(p.supplierList)
        ? p.supplierList.findIndex((s) => s.supplierId === selection.supplierId)
        : -1;

      if (supplierIndex === -1) return p;

      const supplier = p.supplierList[supplierIndex];
      const warehouse = supplier?.warehouses?.[selection.warehouseKey];

      if (!warehouse) return p;

      const updatedWarehouse = {
        ...warehouse,
        blocked_quantity: selection.blockedQuantity,
      };
      const updatedSupplierList = [...p.supplierList];

      updatedSupplierList[supplierIndex] = {
        ...supplier,
        warehouses: {
          ...supplier.warehouses,
          [selection.warehouseKey]: updatedWarehouse,
        },
      };

      return {
        ...p,
        supplierList: updatedSupplierList,
        isBlocked: true,
      };
    });

    setLocalProducts(updatedProducts);

    //Available
    const getAvailableQuantity = async (ean, supplierId, warehouseKey) => {
      const product = await fetchProductByEan(ean);
      const supplier = product.supplierList?.find(
        (s) => s.supplierId === supplierId
      );
      if (!supplier) return null;
      const warehouse = supplier.warehouses?.[warehouseKey];
      return warehouse?.quantity ?? null;
    };

    // Optionally update productSelections too

    setProductSelections((prev) => {
      const updated = { ...prev };
      for (const ean in blockedSelections) {
        updated[ean] = {
          ...updated[ean],
          blockedQuantity: blockedSelections[ean].blockedQuantity,
        };
      }
      return updated;
    });
  };

  useEffect(() => {
    if (order?.eanList) {
      const initialSelections = {};
      Object.entries(order.eanList).forEach(([ean, data]) => {
        initialSelections[ean] = {
          supplierId: data.supplierId || "",
          warehouseKey: data.transport?.warehouse || "",
          transportName: data.transport?.name || "",
          quantity: data.quantity || 1,
          blockedQuantity: data.blocked_quantity || 0,
        };
      });
      setProductSelections(initialSelections);
    }
  }, [order]);

  useEffect(() => {
    if (products?.length) {
      setLocalProducts(products);
    }
  }, [products]);

  if (orderLoading) return <div>Loading order...</div>;
  if (!order?.eanList) return <div>No products found in this order.</div>;

  return (
    <div className="order-details-page">
      <h2>Order #{scp}</h2>
      <p style={{ "borderBottom": "1.5px solid #2c6089"}}><b>Client:</b> {clientName}, <b>PONumber:</b> {poNumber}</p>
      <ProductTable
        products={localProducts}
        warehouses={warehouses}
        currency={currency}
        productSelections={productSelections}
        scp={scp}
        updateProductSelection={updateProductSelection}
        onBlock={() => setShowBlockModal(true)}
        onUnblock={() => setShowUnlockModal(true)}
      />
      <BlockModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        products={localProducts}
        productSelections={productSelections}
        scp={scp}
        onBlockComplete={handleBlockComplete}
        setProducts={setLocalProducts}
      />

      <UnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        products={localProducts}
        productSelections={productSelections}
        setProducts={setLocalProducts}
        scp={scp}
      />
    </div>
  );
};

export default OrderDetailsPage;
