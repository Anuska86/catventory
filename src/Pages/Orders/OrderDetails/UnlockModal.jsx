import React from "react";
import { useAuth } from "../../../context/AuthContext";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../utils/firebase";
import { overwriteBlockedQuantity } from "../../../utils/productService";
import { LogAudit } from "../../Utils/UsersTrack/AuditLogger";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";
import { toast } from "react-toastify";

const UnlockModal = ({
  isOpen,
  onClose,
  products,
  productSelections,
  scp,
  setProducts,
}) => {
  const { currentUser } = useAuth();

  const [isLoading, setIsLoading] = React.useState(false);

  const handleUnlock = async () => {
    setIsLoading(true);
    try {
      let totalUnblocked = 0;
      let auditUnblocked = {};

      for (const ean in productSelections) {
        const selection = productSelections[ean];
        if (!selection.unblockSelected) continue;

        const { supplierId, warehouseKey } = selection;
        if (!supplierId || !warehouseKey) continue;

        const product = products.find((p) => p.ean === ean);
        if (!product?.id) {
          console.warn(`❌ Missing product ID for EAN: ${ean}`);
          toast.error(`Product not found for EAN: ${ean}`);
          continue;
        }

        const productRef = doc(db, "products", product.id);

        let supplierIdentifier = -1;

        if (Array.isArray(product.supplierList)) {
          supplierIdentifier = product.supplierList.findIndex(
            (s) => s.supplierId === supplierId
          );
        } else if (
          typeof product.supplierList === "object" &&
          product.supplierList !== null
        ) {
          const supplierKey = Object.keys(product.supplierList).find((key) => {
            const supplier = product.supplierList[key];
            return supplier.supplierId === supplierId;
          });

          if (supplierKey) {
            supplierIdentifier = supplierKey;
          } else if (Object.keys(product.supplierList).length === 1) {
            supplierIdentifier = Object.keys(product.supplierList)[0];
          }
        }

        if (
          supplierIdentifier === -1 ||
          !product.supplierList?.[supplierIdentifier]
        ) {
          console.warn(`Supplier ${supplierId} not found for product ${ean}`);
          continue;
        }

        const supplierData = product.supplierList[supplierIdentifier];
        const warehouseData = supplierData?.warehouses?.[warehouseKey];
        if (!warehouseData) {
          console.warn(`Supplier/Warehouse not found for product ${ean}`);
          continue;
        }

        const fieldPath = `supplierList.${String(
          supplierIdentifier
        )}.warehouses.${warehouseKey}.blocked_quantity`;

        const unblockQty = selection.unblockQuantity ?? 0;
        const currentBlocked = warehouseData?.blocked_quantity ?? 0;

        if (unblockQty <= 0) {
          toast.warn(`No unblock quantity specified for ${ean}`);
          continue;
        }

        if (unblockQty > currentBlocked) {
          toast.error(
            `Cannot unblock more than ${currentBlocked} units for ${ean}`
          );
          continue;
        }

        const newBlockedQuantity = Math.max(0, currentBlocked - unblockQty);

        try {
          const updatedSupplierList = overwriteBlockedQuantity(
            product.supplierList,
            supplierId,
            warehouseKey,
            newBlockedQuantity
          );
          await updateDoc(productRef, { supplierList: updatedSupplierList });

          const updatedProduct = {
            ...product,
            supplierList: updatedSupplierList,
          };

          setProducts((prev) =>
            prev.map((p) => (p.ean === product.ean ? updatedProduct : p))
          );

          const updatedSnap = await getDoc(productRef);
          const updatedBlocked =
            updatedSnap.data()?.supplierList?.[supplierIdentifier]
              ?.warehouses?.[warehouseKey]?.blocked_quantity;

          toast.info(`Updating ${fieldPath} to ${newBlockedQuantity}`);
        } catch (err) {
          console.error(`Failed to update ${ean}:`, err);
        }

        totalUnblocked += unblockQty;
        auditUnblocked[ean] = unblockQty;
      }

      if (totalUnblocked > 0) {
        LogAudit({
          user: currentUser?.email || "Unknown",
          action: "unblock_batch",
          entity: "order",
          details: {
            orderId: scp,
            unblocked: auditUnblocked,
          },
        });
      }

      toast.success(`${totalUnblocked} units successfully unblocked`);

      onClose();
    } catch (error) {
      console.error("Error unblocking products:", error);
      toast.error("Failed to unblock products");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={onClose}>
      <ModalHeader toggle={onClose}>Unblock Products</ModalHeader>
      <ModalBody>
        <p>
          Are you sure you want to unblock the selected products in order #{scp}
          ?
        </p>
        <ul style={{ paddingLeft: "1rem" }}>
          {Object.entries(productSelections)
            .filter(
              ([_, sel]) => sel.unblockSelected && sel.unblockQuantity > 0
            )
            .map(([ean, sel]) => (
              <li key={ean}>
                <strong>{ean}</strong>: Unblock{" "}
                <strong>{sel.unblockQuantity}</strong> units
              </li>
            ))}
        </ul>
      </ModalBody>
      <ModalFooter>
        <Button color="success" onClick={handleUnlock} disabled={isLoading}>
          {isLoading ? "Unblocking..." : "Unblock"}
        </Button>

        <Button color="secondary" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default UnlockModal;
