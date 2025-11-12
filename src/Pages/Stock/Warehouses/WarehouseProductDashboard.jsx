import React, { useState, useEffect, useMemo } from "react";
// IMPORTANTE: Asegúrate de tener instalado e importado DataTable si usas esta estructura.
import DataTable from "react-data-table-component";
import { db } from "../../../utils/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Button } from "reactstrap";
import { useNavigate } from "react-router-dom";

// --- ESTILOS COMPACTOS (Se mantienen para los otros elementos) ---
const STYLES = {
  filterInput: {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    width: "300px",
    marginRight: "15px",
  },
  chartBarAvailable: {
    height: "100%",
    backgroundColor: "#4CAF50",
    transition: "width 0.5s ease-in-out",
  },
  chartBarBlocked: {
    height: "25px",
    width: "100%",
    backgroundColor: "#F44336",
    borderRadius: "4px",
    overflow: "hidden",
  },
};

// Componente principal
const WarehouseProductDashboard = () => {
  const navigate = useNavigate();
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [selectedWarehouseName, setSelectedWarehouseName] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- ESTADOS DE FILTRO DE TEXTO ---
  // DataTable maneja la paginación y el ordenamiento internamente,
  // por lo que solo necesitamos el estado para el filtro global.
  const [filterText, setFilterText] = useState("");

  // --- EFECTOS: Cargar opciones y datos de productos (Sin cambios) ---
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const warehousesCol = collection(db, "warehouses");
        const warehouseSnapshot = await getDocs(warehousesCol);
        const names = warehouseSnapshot.docs.map((doc) => doc.data().name);
        setWarehouseOptions(names);
        if (names.length > 0) setSelectedWarehouseName(names[0]);
      } catch (err) {
        setError("Error loading warehouse options.");
      }
    };
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsCol = collection(db, "products");
        const productSnapshot = await getDocs(productsCol);
        const products = productSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setAllProducts(products);
      } catch (err) {
        setError("Error loading product data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // --- LÓGICA MEMORIZADA: Filtrar, Agregar y Calcular Totales ---
  const { filteredProducts, totalChartData } = useMemo(() => {
    let totalAvailableStock = 0;
    let totalBlockedStock = 0;
    const aggregatedDataByWarehouse = [];

    // 1. FILTRAR POR ALMACÉN Y AGREGAR DATOS
    if (selectedWarehouseName && allProducts.length > 0) {
      for (const product of allProducts) {
        let totalAvailable = 0;
        let totalBlocked = 0;
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        let foundWarehouse = false;

        if (product.supplierList && Array.isArray(product.supplierList)) {
          for (const supplier of product.supplierList) {
            if (
              supplier.warehouses &&
              typeof supplier.warehouses === "object"
            ) {
              for (const key in supplier.warehouses) {
                const warehouse = supplier.warehouses[key];

                if (warehouse.name === selectedWarehouseName) {
                  foundWarehouse = true;
                  totalAvailable += warehouse.quantity || 0;
                  totalBlocked += warehouse.blocked_quantity || 0;

                  if (
                    warehouse.transport &&
                    Array.isArray(warehouse.transport)
                  ) {
                    for (const transportOption of warehouse.transport) {
                      const price = transportOption.unitPrice;
                      if (price !== undefined && price !== null) {
                        minPrice = Math.min(minPrice, price);
                        maxPrice = Math.max(maxPrice, price);
                      }
                    }
                  }
                }
              }
            }
          }
        }

        if (foundWarehouse) {
          // Acumular totales para el gráfico
          totalAvailableStock += totalAvailable;
          totalBlockedStock += totalBlocked;

          aggregatedDataByWarehouse.push({
            // Usar 'ean' como clave única si está disponible
            id: product.ean || product.id,
            name: product.description || product.productVariant || "N/A",
            ean: product.ean || "N/A",
            totalAvailable,
            totalBlocked,
            minPrice:
              minPrice === Infinity ? "N/A" : parseFloat(minPrice).toFixed(2),
            maxPrice:
              maxPrice === -Infinity ? "N/A" : parseFloat(maxPrice).toFixed(2),
          });
        }
      }
    }

    // 2. APLICAR FILTRO POR TEXTO
    let finalFilteredData = aggregatedDataByWarehouse;
    if (filterText) {
      const lowerCaseFilter = filterText.toLowerCase();
      finalFilteredData = aggregatedDataByWarehouse.filter((item) => {
        const productName = item.name.toLowerCase();
        const productEan = item.ean.toLowerCase();
        // Filtra si el nombre o el EAN contienen el texto
        return (
          productName.includes(lowerCaseFilter) ||
          productEan.includes(lowerCaseFilter)
        );
      });
    }

    // 3. DATOS PARA EL GRÁFICO (usa los totales antes de la paginación)
    const chartData = [
      {
        name: "Stock Disponible",
        value: totalAvailableStock,
        color: "#4CAF50",
      },
      { name: "Stock Bloqueado", value: totalBlockedStock, color: "#F44336" },
    ];

    return {
      filteredProducts: finalFilteredData,
      totalChartData: chartData,
    };
  }, [allProducts, selectedWarehouseName, filterText]);

  if (loading) return <div>Loading dashboard data...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  // --- DEFINICIÓN DE COLUMNAS PARA DATATABLE ---
  const productColumns = [
    {
      name: "Product Name / Description",
      selector: (row) => row.name,
      sortable: true,
      wrap: true,
      width: "400px",
    },
    { name: "EAN", selector: (row) => row.ean, sortable: true,width: "300" },
    {
      name: "Available Qty",
      selector: (row) => row.totalAvailable,
      sortable: true,
      width: "160px",
    },
    {
      name: "Blocked Qty",
      selector: (row) => row.totalBlocked,
      sortable: true,
      width: "160px",
    },
    {
      name: "Min Price (€)",
      selector: (row) => row.minPrice,
      sortable: true,
      width: "160px",
    },
    {
      name: "Max Price (€)",
      selector: (row) => row.maxPrice,
      sortable: true,
      width: "160px",
    },
    {
      name: "Next Arrival (days)",
      selector: (row) => Math.floor(Math.random() * 30) + 1,
      sortable: true,
      width: "160px",
    },
  ];

  // --- FUNCIÓN DE RENDERIZADO DEL GRÁFICO (Sin cambios) ---
  const renderChart = () => {
    const totalStock = totalChartData[0].value + totalChartData[1].value;
    if (totalStock === 0)
      return <p>There is no stock data to generate the chart.</p>;

    const availablePct = ((totalChartData[0].value / totalStock) * 100).toFixed(
      1
    );

    return (
      <div
        style={{
          marginTop: "30px",
          borderTop: "1px solid #ccc",
          paddingTop: "20px",
        }}
      >
        <h3>📊 Total Stock Distribution in {selectedWarehouseName}</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
            fontWeight: "bold",
          }}
        >
          <span style={{ color: totalChartData[0].color }}>
            Available: {totalChartData[0].value} ({availablePct}%)
          </span>
          <span style={{ color: totalChartData[1].color }}>
            Blocked: {totalChartData[1].value} (
            {(100 - availablePct).toFixed(1)}%)
          </span>
        </div>

        {/* Barra de progreso simplificada */}
        <div style={STYLES.chartBarBlocked}>
          <div
            style={{ ...STYLES.chartBarAvailable, width: `${availablePct}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>📦 Product Inventory by Warehouse</h2>

      {/* Controles de Filtro (Almacén y Texto) */}
      <div
        style={{ marginBottom: "20px", display: "flex", alignItems: "center" }}
      >
        {/* Filtro por Almacén */}
        <label
          htmlFor="warehouse-select"
          style={{ marginRight: "10px", fontWeight: "bold" }}
        >
          Filter by Warehouse:
        </label>
        <select
          id="warehouse-select"
          value={selectedWarehouseName}
          onChange={(e) => {
            setSelectedWarehouseName(e.target.value);
            setFilterText("");
          }}
          style={{ padding: "8px", borderRadius: "4px", marginRight: "30px" }}
        >
          {warehouseOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {/* Filtro por Nombre/EAN (Integrado con la lógica de useMemo) */}
        <input
          type="text"
          placeholder="Filter by Product Name or EAN"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={STYLES.filterInput}
        />
        <button onClick={() => navigate(`/stock/warehouse/next-arrivals`,{ state: { selectedWarehouseName: selectedWarehouseName } })}>Incoming</button>
      </div>

      {/* TÍTULO DE LA TABLA */}
      <h3>
        Inventory for: {selectedWarehouseName} (Found {filteredProducts.length}{" "}
        items)
      </h3>

      {/* IMPLEMENTACIÓN DE DATATABLE */}
      <DataTable
        columns={productColumns}
        data={filteredProducts} // Le pasamos la lista ya filtrada por almacén y texto
        pagination // Habilita la paginación automática de DataTable
        fixedHeader
        fixedHeaderScrollHeight="400px"
        // No se necesita selectableRows aquí, pero se podría añadir si fuera necesario
        // actions={<ExportCSV data={filteredProducts} fileName="inventory.csv" />} // Asume ExportCSV si está disponible
        noDataComponent={
          <p>No products found for this warehouse or matching the filter.</p>
        }
      />

      {/* Gráfico */}
      {renderChart()}
    </div>
  );
};

export default WarehouseProductDashboard;
