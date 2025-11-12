import React, { useState, useEffect } from "react";
import "./style/SupplierListDisplay.css";
import { useAuth } from "../../../context/AuthContext";
import { LogAudit } from "../../Utils/UsersTrack/AuditLogger";
import { toast } from "react-toastify";

import { fetchSupplierByName } from "../../../utils/productService";
import { fetchAllSupplierNames } from "../../../utils/productService";
import { fetchRegisteredSupplierIdsForProduct } from "../../../utils/productService";
import { fetchWarehouses } from "../../../utils/productService";

function SupplierListDisplay({
  supplierList,
  onEditSupplier,
  onRemoveSupplier,
  onAddSupplier,
  productId,
}) {
  const [showForm, setShowForm] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState("");
  const [supplierOptions, setSupplierOptions] = React.useState([]);
  const [supplierNameMap, setSupplierNameMap] = useState({});

  const [newSupplier, setNewSupplier] = React.useState({
    supplierId: "",
    name: "",
    warehouses: {},
  });

  const isEditingSupplier = !!newSupplier.supplierId;

  const [availableWarehouses, setAvailableWarehouses] = useState([]);
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState([]);

  //Audit
  const { currentUser } = useAuth();

  //Suppliers data
  React.useEffect(() => {
    const loadSupplierData = async () => {
      if (!newSupplier.name) return;

      try {
        const supplierData = await fetchSupplierByName(newSupplier.name);
        setNewSupplier((prev) => ({
          ...prev,
          supplierId: supplierData.supplierId || "",
          name: supplierData.name || "",
          address: supplierData.address || "",
          billingAddress: supplierData.billingAddress || "",
          country: supplierData.country || "",
          email: supplierData.email || "",
          vatNumber: supplierData.vatNumber || "",
          invoiceCounter: supplierData.invoiceCounter || 0,
          warehouses: prev.warehouses,
        }));
        setSelectedCountry(supplierData.country?.toLowerCase() || "");
        console.log("Selected country:", supplierData.country);
      } catch (error) {
        console.warn("Supplier not found:", error.message);
      }
    };

    loadSupplierData();
  }, [newSupplier.name]);

  //Suppliers name with id
  React.useEffect(() => {
    const loadSupplierNames = async () => {
      try {
        const allSuppliers = await fetchAllSupplierNames();
        const registeredIds = await fetchRegisteredSupplierIdsForProduct(
          productId
        );

        console.log("Registered supplier IDs:", registeredIds);

        const unregisteredSuppliers = allSuppliers.filter(
          (supplier) => !registeredIds.includes(supplier.supplierId)
        );

        console.log(
          "Filtered suppliers (unregistered):",
          unregisteredSuppliers
        );

        setSupplierOptions(unregisteredSuppliers);
      } catch (error) {
        console.error("Error loading supplier names:", error);
      }
    };

    if (productId) {
      loadSupplierNames();
    }
  }, [productId]);

  useEffect(() => {
    const loadNames = async () => {
      try {
        const allSuppliers = await fetchAllSupplierNames();
        const map = {};
        allSuppliers.forEach((supplier) => {
          map[supplier.supplierId] = supplier.name;
        });
        setSupplierNameMap(map);
      } catch (error) {
        console.error("Error loading supplier names:", error);
      }
    };

    loadNames();
  }, []);

  //Selected country for the warehouse
  const handleInputChange = (field, value) => {
    setNewSupplier((prev) => ({
      ...prev,
      warehouses: {
        ...prev.warehouses,
        [selectedCountry]: {
          ...prev.warehouses[selectedCountry],
          [field]: value,
        },
      },
    }));
  };

  //Load the warehouses
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const allWarehouses = await fetchWarehouses();

        const normalize = (str) => str?.trim().toLowerCase();

        console.log("Selected country:", selectedCountry);
        console.log("Fetched warehouses:", allWarehouses);

        const filtered = allWarehouses.filter(
          (wh) => normalize(wh.country) === normalize(selectedCountry)
        );

        setAvailableWarehouses(filtered);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      }
    };

    if (selectedCountry) {
      loadWarehouses();
    }
  }, [selectedCountry]);

  //Update the selected warehouse state depending wich is selected
  const toggleWarehouseSelection = (id) => {
    setSelectedWarehouseIds((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
    setNewSupplier((prev) => {
      if (!prev.warehouses[id]) {
        return {
          ...prev,
          warehouses: {
            ...prev.warehouses,
            [id]: {
              quantity: "",
              blocked_quantity: 0,
              transport: [],
              transportDetails: {},
            },
          },
        };
      }
      return prev;
    });
  };
  //Target a sepecific warehouse
  const handleWarehouseInput = (warehouseId, field, value) => {
    setNewSupplier((prev) => ({
      ...prev,
      warehouses: {
        ...prev.warehouses,
        [warehouseId]: {
          ...prev.warehouses[warehouseId],
          [field]: value,
        },
      },
    }));
  };

  //Transport for the choosen warehouse
  const toggleWarehouseTransport = (warehouseId, method) => {
    setNewSupplier((prev) => {
      const currentWarehouse = prev.warehouses[warehouseId] || {};
      const currentTransport = currentWarehouse.transport || [];
      const currentDetails = currentWarehouse.transportDetails || {};

      const isSelected = currentTransport.includes(method);
      const updatedTransport = isSelected
        ? currentTransport.filter((m) => m !== method)
        : [...currentTransport, method];

      const updatedDetails = {
        ...currentDetails,
        [method]: isSelected
          ? currentDetails[method]
          : currentDetails[method] || { sla: "", unitPrice: "" },
      };

      return {
        ...prev,
        warehouses: {
          ...prev.warehouses,
          [warehouseId]: {
            ...currentWarehouse,
            transport: updatedTransport,
            transportDetails: updatedDetails,
          },
        },
      };
    });
  };

  //Transport details
  const handleWarehouseTransportDetail = (
    warehouseId,
    method,
    field,
    value
  ) => {
    setNewSupplier((prev) => {
      const currentWarehouse = prev.warehouses[warehouseId] || {};
      const currentDetails = currentWarehouse.transportDetails || {};

      return {
        ...prev,
        warehouses: {
          ...prev.warehouses,
          [warehouseId]: {
            ...currentWarehouse,
            transportDetails: {
              ...currentDetails,
              [method]: {
                ...currentDetails[method],
                [field]: value,
              },
            },
          },
        },
      };
    });
  };

  const handleSubmit = () => {
    const hasTransport = selectedWarehouseIds.some(
      (id) => newSupplier.warehouses[id]?.transport?.length > 0
    );

    if (!hasTransport) {
      alert("Please select at least one transport method.");
      return;
    }
    // Proceed with saving the supplier
    const cleanedWarehouses = {};

    selectedWarehouseIds.forEach((id) => {
      const warehouse = newSupplier.warehouses[id];
      const cleanedTransport = Object.entries(
        warehouse.transportDetails || {}
      ).map(([method, details]) => ({
        name: method,
        sla: parseInt(details.sla, 10) || 0,
        unitPrice: parseFloat(details.unitPrice) || 0,
      }));

      if (!Array.isArray(cleanedTransport)) {
        console.warn(
          "Transport data malformed for supplier:",
          newSupplier.supplierId
        );
      }

      const { transportDetails, ...rest } = warehouse;

      cleanedWarehouses[id] = {
        ...rest,
        blocked_quantity: warehouse.blocked_quantity ?? 0,
        transport: cleanedTransport,
      };
    });

    const cleanedSupplier = {
      supplierId: newSupplier.supplierId,
      name: newSupplier.name,
      warehouses: cleanedWarehouses,
    };

    if (onAddSupplier) {
      onAddSupplier(cleanedSupplier);

      toast.success("Supplier saved successfully!");

      LogAudit({
        user: currentUser?.email || "Unknown",
        action: "Save Supplier",
        entity: "Supplier",
        details: {
          supplierId: newSupplier.supplierId,
          country: selectedCountry,
          warehouses: selectedWarehouseIds,
          transport: selectedWarehouseIds.map(
            (id) => newSupplier.warehouses[id]?.transport || []
          ),
        },
      });
    }
    setNewSupplier({ supplierId: "", warehouses: {} });
    setSelectedCountry("");
    setShowForm(false);
  };

  if (!Array.isArray(supplierList)) return null;

  const handleClose = () => {
    setShowForm(false);
    setNewSupplier({ supplierId: "", name: "", warehouses: {} });
    setSelectedCountry(""); //
  };

  return (
    <div className="edit-supplier">
      <div className="supplier-list">
        {supplierList.map((supplier, index) => (
          <div
            key={supplier.supplierId || `supplier-${index}`}
            className="supplier-card"
          >
            <h3 className="supplier-id">ID: {supplier.supplierId}</h3>
            <h3 className="supplier-">
              {" "}
              {supplier.name} Name:{" "}
              {supplierNameMap[supplier.supplierId] || "Unnamed Supplier"}
            </h3>

            {supplier.warehouses &&
              Object.entries(supplier.warehouses).map(
                ([country, warehouse]) => (
                  <div
                    key={`${supplier.supplierId}-${country}`}
                    className="warehouse-card"
                  >
                    <h4>
                      {country.toUpperCase()} — {warehouse.name}
                    </h4>
                    <p>
                      <strong>Warehouse Name:</strong> {warehouse.name}
                    </p>
                    <p>
                      <strong>Quantity:</strong> {warehouse.quantity}
                    </p>

                    <div>
                      <strong>Transport:</strong>{" "}
                      <ul>
                        {Array.isArray(warehouse.transport) &&
                        warehouse.transport.length > 0 ? (
                          warehouse.transport.map((method, i) => (
                            <li
                              key={`${supplier.supplierId}-${country}-transport-${i}`}
                            >
                              {method.name}: {method.sla} days — €
                              {method.unitPrice}
                            </li>
                          ))
                        ) : (
                          <li>—</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )
              )}

            <div className="supplier-buttons">
              <button
                className="supplier-button edit"
                onClick={() => onEditSupplier(supplier.supplierId)}
              >
                Edit Supplier
              </button>
              <button
                className="supplier-button remove"
                onClick={() => onRemoveSupplier(supplier.supplierId)}
              >
                Remove Supplier
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="add-new-supplier-form">
        {/* Add Supplier Form */}
        {!showForm && (
          <div className="add-supplier-section">
            <button
              className="supplier-button add"
              onClick={() => setShowForm(true)}
            >
              Add New Supplier For This Product
            </button>
          </div>
        )}

        {showForm && (
          <div className="dropdown-form">
            <h3>Add New Supplier For This Product</h3>
            <select
              value={newSupplier.name || ""}
              onChange={async (e) => {
                const selectedName = e.target.value;
                setNewSupplier((prev) => ({ ...prev, name: selectedName }));

                try {
                  const supplierData = await fetchSupplierByName(selectedName);
                  setNewSupplier((prev) => ({
                    ...prev,
                    supplierId: supplierData.supplierId || "",
                    name: supplierData.name || prev.name,
                    address: supplierData.address || "",
                    billingAddress: supplierData.billingAddress || "",
                    country: supplierData.country || "",
                    email: supplierData.email || "",
                    vatNumber: supplierData.vatNumber || "",
                    invoiceCounter: supplierData.invoiceCounter || 0,
                    warehouses: prev.warehouses,
                  }));
                  setSelectedCountry(supplierData.country?.toLowerCase() || "");
                } catch (error) {
                  console.warn("Supplier not found:", error.message);
                }
              }}
            >
              <option value="">-- Select a supplier --</option>
              {supplierOptions.map((supplier, idx) => (
                <option key={`${supplier.id}-${idx}`} value={supplier.name}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <p className="helper-text">
              Choose an existing supplier to auto-fill details.
            </p>
            <p className="helper-text">
              Name of the supplier (e.g. Supplier01).
            </p>
            {supplierOptions.length === 0 && (
              <p className="helper-text">
                ✅ All suppliers are already registered for this product.
              </p>
            )}

            <input
              type="text"
              placeholder="Supplier ID"
              value={newSupplier.supplierId}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, supplierId: e.target.value })
              }
            />
            <p className="helper-text">Unique identifier for the supplier.</p>

            <p className="selected-country-display">
              <strong>Selected Country:</strong>{" "}
              {selectedCountry
                ? selectedCountry.charAt(0).toUpperCase() +
                  selectedCountry.slice(1)
                : "Loading..."}
            </p>
            {availableWarehouses.length > 0 ? (
              <div className="warehouse-selection">
                <label>Choose your warehouses:</label>
                <div className="country-checkboxes">
                  {availableWarehouses.map(({ id, name, country, address }) => (
                    <div key={id} className="warehouse-config-block">
                      <label
                        htmlFor={id}
                        className="checkbox-label"
                        title={address}
                      >
                        <input
                          type="checkbox"
                          id={id}
                          required
                          checked={selectedWarehouseIds.includes(id)}
                          onChange={() => toggleWarehouseSelection(id)}
                        />
                        {name} ({country})
                      </label>

                      {selectedWarehouseIds.includes(id) && (
                        <div className="warehouse-card">
                          <h4>
                            {name} ({country})
                          </h4>
                          <input
                            type="number"
                            placeholder="Quantity"
                            required
                            value={newSupplier.warehouses[id]?.quantity ?? ""}
                            onChange={(e) =>
                              handleWarehouseInput(
                                id,
                                "quantity",
                                e.target.value === ""
                                  ? ""
                                  : parseFloat(e.target.value)
                              )
                            }
                          />

                          {["Plane", "Truck", "Ship", "Train"].map((method) => {
                            const isSelected =
                              newSupplier.warehouses[id]?.transport?.includes(
                                method
                              );
                            const transportDetails =
                              newSupplier.warehouses[id]?.transportDetails?.[
                                method
                              ] || {};

                            return (
                              <div
                                key={method}
                                className="transport-method-block"
                              >
                                <label className="checkbox-label">
                                  <input
                                    type="checkbox"
                                    value={method}
                                    required
                                    checked={isSelected}
                                    onChange={() =>
                                      toggleWarehouseTransport(id, method)
                                    }
                                  />
                                  {method === "Plane" && "✈️"}
                                  {method === "Truck" && "🚚"}
                                  {method === "Ship" && "🚢"}
                                  {method === "Train" && "🚆"} {method}
                                </label>

                                {isSelected && (
                                  <div className="transport-inputs">
                                    <input
                                      type="number"
                                      placeholder="SLA (days)"
                                      value={
                                        newSupplier.warehouses[id]
                                          ?.transportDetails?.[method]?.sla ??
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleWarehouseTransportDetail(
                                          id,
                                          method,
                                          "sla",
                                          e.target.value
                                        )
                                      }
                                    />

                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="Unit Price (€)"
                                      required
                                      value={
                                        newSupplier.warehouses[id]
                                          ?.transportDetails?.[method]
                                          ?.unitPrice ?? ""
                                      }
                                      onChange={(e) =>
                                        handleWarehouseTransportDetail(
                                          id,
                                          method,
                                          "unitPrice",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="no-warehouses-message">
                No warehouses available for the selected country.
              </p>
            )}

            <div className="button-group">
              <button className="supplier-button close" onClick={handleClose}>
                Close
              </button>

              <button
                className="supplier-button save"
                onClick={handleSubmit}
                disabled={
                  !selectedCountry ||
                  !newSupplier.supplierId ||
                  selectedWarehouseIds.every(
                    (id) => !(newSupplier.warehouses[id]?.transport?.length > 0)
                  )
                }
              >
                Save Supplier
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SupplierListDisplay;
