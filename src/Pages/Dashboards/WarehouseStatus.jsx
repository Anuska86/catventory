import React, { useEffect, useState, useMemo } from "react";
import "./style/WarehouseStatus.css"; // Assuming you will create this CSS file

// Import Firebase dependencies (assuming the same setup as your original component)
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";

// Import Recharts and Icons
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { FaBoxes, FaWarehouse, FaExclamationTriangle, FaDollarSign } from "react-icons/fa";

// --- Constants ---
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8A2BE2"];
const THRESHOLD_COLOR = "#FF6347"; // Red for items below threshold

// --- Helper Functions ---

/**
 * Extracts and consolidates all stock data from all supplier warehouses for a single product.
 * @param {Array} supplierList - The list of suppliers for a product.
 * @returns {Array} Consolidated list of all warehouse stocks.
 */
const getConsolidatedStock = (supplierList) => {
  if (!supplierList) return [];
  const stock = [];
  supplierList.forEach(supplier => {
    if (supplier.warehouses) {
      Object.values(supplier.warehouses).forEach(warehouse => {
        stock.push(warehouse);
      });
    }
  });
  return stock;
};

// --- Main Component ---

const WarehouseStatus = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsSnap = await getDocs(collection(db, "products"));
        const productsData = productsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching warehouse data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Data Processing Memoizations ---

  const {
    totalSKUs,
    totalPhysicalUnits,
    totalBlockedUnits,
    totalStockValue,
    lowStockItemsCount,
  } = useMemo(() => {
    let totalSKUs = products.length;
    let totalPhysicalUnits = 0;
    let totalBlockedUnits = 0;
    let totalStockValue = 0;
    let lowStockItemsCount = 0;

    products.forEach((product) => {
      const minThreshold = product.minThreshold || 0;
      let productTotalQuantity = 0;
      let productBlockedQuantity = 0;
      let lowestUnitPrice = Infinity;

      // 1. Consolidate stock from all warehouses
      const consolidatedStock = getConsolidatedStock(product.supplierList);

      consolidatedStock.forEach(warehouse => {
        totalPhysicalUnits += warehouse.quantity || 0;
        totalBlockedUnits += warehouse.blocked_quantity || 0;
        productTotalQuantity += warehouse.quantity || 0;
        productBlockedQuantity += warehouse.blocked_quantity || 0;

        // Find the cheapest unit price across all transport methods for value calculation
        if (warehouse.transport && Array.isArray(warehouse.transport)) {
             warehouse.transport.forEach(t => {
                if (t.unitPrice && t.unitPrice < lowestUnitPrice) {
                    lowestUnitPrice = t.unitPrice;
                }
             });
        }
      });

      // 2. Check for Low Stock (based on TOTAL stock across all warehouses)
      if (productTotalQuantity <= minThreshold) {
        lowStockItemsCount += 1;
      }

      // 3. Calculate Stock Value (using the cheapest unit price found)
      if (lowestUnitPrice !== Infinity) {
        totalStockValue += (productTotalQuantity * lowestUnitPrice);
      }
    });

    return {
      totalSKUs,
      totalPhysicalUnits,
      totalBlockedUnits,
      totalStockValue,
      lowStockItemsCount,
    };
  }, [products]);

  // --- Category Stock Distribution (Pie Chart Data) ---
  const categoryStockData = useMemo(() => {
    const categoryMap = {};

    products.forEach((product) => {
      const category = product.category || "Uncategorized";
      let productTotalQuantity = 0;

      const consolidatedStock = getConsolidatedStock(product.supplierList);
      consolidatedStock.forEach(warehouse => {
        productTotalQuantity += warehouse.quantity || 0;
      });
      
      categoryMap[category] = (categoryMap[category] || 0) + productTotalQuantity;
    });

    return Object.entries(categoryMap)
      .map(([category, units]) => ({ name: category, value: units }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories
  }, [products]);


  // --- Top 5 Stocked Products (Bar Chart Data) ---
  const topStockedProductsData = useMemo(() => {
    return products
      .map(product => {
        let productTotalQuantity = 0;
        getConsolidatedStock(product.supplierList).forEach(warehouse => {
            productTotalQuantity += warehouse.quantity || 0;
        });
        return {
          sku: product.sku,
          units: productTotalQuantity,
          category: product.category,
        };
      })
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [products]);

  // --- Render Logic ---
  if (loading) {
    return <div className="warehouse-status-section">Loading inventory data...</div>;
  }

  return (
    <div className="warehouse-status-section">
      <div className="warehouse-status-header">
        <h2 className="warehouse-title">🏭 Aggregated Warehouse Status</h2>
      </div>

      {/* KPIs */}
      <div className="kpi-container">
        <div className="warehouse-kpi-card">
          <FaWarehouse size={20} color={COLORS[0]} />
          <div>
            <h5>Total SKUs</h5>
            <p>{totalSKUs}</p>
          </div>
        </div>
        <div className="warehouse-kpi-card">
          <FaBoxes size={20} color={COLORS[1]} />
          <div>
            <h5>Total Physical Units</h5>
            <p>{totalPhysicalUnits.toLocaleString()}</p>
          </div>
        </div>
        <div className="warehouse-kpi-card">
          <FaDollarSign size={20} color={COLORS[2]} />
          <div>
            <h5>Total Estimated Value</h5>
            <p>€{totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="warehouse-kpi-card warning-kpi">
          <FaExclamationTriangle size={20} color={THRESHOLD_COLOR} />
          <div>
            <h5>Items Below Min Threshold</h5>
            <p className="warning-text">{lowStockItemsCount}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="dashboard-charts-grid">
        {/* Top Stocked Products (Bar Chart) */}
        <div className="chart-container">
          <h3>📦 Top 5 Stocked SKUs</h3>
          <p className="chart-subtitle">
            Products with the highest current physical quantity.
          </p>

          {topStockedProductsData.length === 0 ? (
            <div className="empty-state">No product stock data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topStockedProductsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                    dataKey="sku" 
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={70}
                />
                <YAxis dataKey="units" />
                <Tooltip 
                    formatter={(value) => [`${value.toLocaleString()} units`, "Stock"]}
                    labelFormatter={(label) => `SKU: ${label}`}
                />
                <Bar dataKey="units" fill={COLORS[3]} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stock Distribution by Category (Pie Chart) */}
        <div className="small-chart">
          <h3>📊 Stock Distribution by Category</h3>
          <p className="chart-highlight">
            Top categories by physical unit count.
          </p>

          {categoryStockData.length === 0 ? (
            <div className="empty-state">No category stock data available.</div>
          ) : (
            <PieChart width={510} height={300}>
              <Pie
                data={categoryStockData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {(categoryStockData ?? []).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value.toLocaleString()} units`, "Stock"]} />
              <Legend 
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: "10px" }}
              />
            </PieChart>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseStatus;