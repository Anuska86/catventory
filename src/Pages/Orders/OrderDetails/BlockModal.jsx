import React from "react";
import { useAuth } from "../../../context/AuthContext";

import {
  fetchProductByEan,
  updateBlockedQuantity,
} from "../../../utils/productService";
import { LogAudit } from "../../Utils/UsersTrack/AuditLogger";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";

const BlockModal = ({
  isOpen,
  onClose,
  products,
  productSelections,
  scp,
  onBlockComplete,
  setProducts,
}) => {
  const { currentUser } = useAuth();

  const handleBlock = async () => {
    try {
      for (const ean in productSelections) {
        const selection = productSelections[ean];
        const { supplierId, warehouseKey, blockedQuantity } = selection;

        if (blockedQuantity > 0) {
          const product = await fetchProductByEan(ean);

          // --- Resolve supplierIdentifier ---
          let supplierIdentifier = -1;

          if (Array.isArray(product.supplierList)) {
            supplierIdentifier = product.supplierList.findIndex(
              (s) => s.supplierId === supplierId
            );
          } else if (
            typeof product.supplierList === "object" &&
            product.supplierList !== null
          ) {
            const supplierKey = Object.keys(product.supplierList).find(
              (key) => {
                const supplier = product.supplierList[key];
                return supplier.supplierId === supplierId;
              }
            );

            if (supplierKey) {
              supplierIdentifier = supplierKey;
            } else if (Object.keys(product.supplierList).length === 1) {
              supplierIdentifier = Object.keys(product.supplierList)[0];
            }
          }

          // --- Validate supplier/warehouse presence ---
          const warehouseData =
            product.supplierList?.[supplierIdentifier]?.warehouses?.[
              warehouseKey
            ];

          if (supplierIdentifier === -1 || !warehouseData) {
            console.warn(
              `Supplier/Warehouse not found for EAN: ${ean}, Supplier ID: ${supplierId}`
            );
            continue;
          }

          // --- Accumulate blocked quantity ---
          const currentBlocked = warehouseData.blocked_quantity || 0;
          const newBlockedQuantity = currentBlocked + blockedQuantity;

          const orderQty = product.quantity || selection.quantity || 1;
          if (newBlockedQuantity > orderQty) {
            toast.error(
              `Cannot block more than ordered (${orderQty}) for ${ean}`
            );
            continue;
          }

          // --- Build updated supplierList ---
          const updatedSupplierList = Array.isArray(product.supplierList)
            ? product.supplierList.map((supplier) => {
                if (supplier.supplierId === supplierId) {
                  return {
                    ...supplier,
                    warehouses: {
                      ...supplier.warehouses,
                      [warehouseKey]: {
                        ...supplier.warehouses?.[warehouseKey],
                        blocked_quantity: newBlockedQuantity,
                      },
                    },
                  };
                }
                return supplier;
              })
            : Object.entries(product.supplierList).reduce(
                (acc, [key, supplier]) => {
                  acc[key] = {
                    ...supplier,
                    warehouses: {
                      ...supplier.warehouses,
                      [warehouseKey]: {
                        ...supplier.warehouses?.[warehouseKey],
                        blocked_quantity: newBlockedQuantity,
                      },
                    },
                  };
                  return acc;
                },
                {}
              );

          // --- Persist update ---
          await updateBlockedQuantity(
            product.id,
            "supplierList",
            updatedSupplierList
          );

          const updatedProduct = {
            ...product,
            supplierList: updatedSupplierList,
          };

          setProducts((prev) =>
            prev.map((p) => (p.ean === product.ean ? updatedProduct : p))
          );

          toast.info(`Blocked ${blockedQuantity} units of ${ean}`, {
            icon: "🔒",
          });

          LogAudit({
            user: currentUser?.email || "Unknown",
            action: "block",
            entity: "product",
            details: {
              ean,
              supplierId,
              warehouseKey,
              blockedQuantity,
              orderId: scp,
            },
          });
        }
      }

      if (onBlockComplete) {
        onBlockComplete(productSelections);
      }

      toast.success("Products successfully blocked");
      onClose();
    } catch (error) {
      console.error("Error blocking products:", error);
      toast.error("Failed to block products");
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} toggle={onClose}>
        <ModalHeader toggle={onClose}>Block Products</ModalHeader>
        <ModalBody>
          Are you sure you want to block the selected products in order #{scp}?
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={handleBlock}>
            Block
          </Button>
          <Button color="secondary" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        style={{ top: "80px", zIndex: 2000 }}
      />
    </>
  );
};

export default BlockModal;
