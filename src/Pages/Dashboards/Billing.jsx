import React, { useEffect, useState, useMemo } from "react";
import "./style/Billing.css";
import { FaFileInvoiceDollar, FaMoneyBillWave } from "react-icons/fa";

import { db } from "../../utils/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  LineChart,
  Brush,
  ReferenceLine,
} from "recharts";

const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [totalBilled, setTotalBilled] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(true); // Nuevo estado de carga

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const billingSnapshot = await getDocs(collection(db, "invoices"));
        const billingData = billingSnapshot.docs.map((doc) => doc.data());
        setInvoices(billingData);

        const billedAmount = billingData.reduce((sum, invoice) => {
          // Aseguramos que totalBlockedAmount se sume como número (si existe)
          const amount = parseFloat(invoice.totalBlockedAmount || 0);
          return sum + amount;
        }, 0);
        setTotalBilled(billedAmount);
      } catch (error) {
        console.error("Error fetching billing data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, []);

  const COLORS = ["#8A2BE2", "#DDA0DD", "#FF69B4", "#F5F5F5"];
  const BAR_COLORS = [
    "#9370DB", // Medium Purple
    "#FFB6C1", // Light Pink
    "#87CEFA", // Light Sky Blue
    "#FFD700", // Gold
    "#98FB98", // Pale Green
    "#FF6347", // Tomato
  ];

  // 🔹 Top Products from Invoices
  const productChartData = useMemo(() => {
    const productMap = {};
    invoices.forEach((invoice) => {
      const productsObj = invoice.eanList;
      if (productsObj && typeof productsObj === "object") {
        Object.values(productsObj).forEach((product) => {
          const name = product.sku;
          const quantity = product.quantity || 0;
          if (name) {
            productMap[name] = (productMap[name] || 0) + quantity;
          }
        });
      }
    });

    // Filtramos y limitamos al Top 10 para mejor visualización
    return Object.entries(productMap)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  }, [invoices]);

  // 🔹 Financial Status Breakdown
  const statusChartData = useMemo(() => {
    const statusCounts = invoices.reduce((acc, invoice) => {
      const status = invoice.financialStatus || "Unknown"; // Usar 'Unknown' en mayúscula
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [invoices]);

  // 🔹 Shipping Status Overview
  const shippingChartData = useMemo(() => {
    const shippingCounts = invoices.reduce((acc, invoice) => {
      const status = invoice.shippingStatus || "Unknown"; // Usar 'Unknown' en mayúscula
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(shippingCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }, [invoices]);

  // 🔹 Invoice Creation Trend - **Lógica de Fecha Mejorada**
  const creationTrendData = useMemo(() => {
    const creationCounts = {};
    invoices.forEach((invoice) => {
      let date;
      // Manejar timestamp de Firebase o string/number de fecha
      if (invoice.creationDate?.toDate) {
        date = invoice.creationDate.toDate();
      } else if (invoice.creationDate?.seconds) {
        date = new Date(invoice.creationDate.seconds * 1000);
      } else if (
        typeof invoice.creationDate === "string" ||
        typeof invoice.creationDate === "number"
      ) {
        date = new Date(invoice.creationDate);
      }

      // Asegurarse de que la fecha es válida
      if (!date || isNaN(date.getTime())) return;

      // Formatear a 'YYYY-MM-DD' para agrupar y ordenar
      const dateKey = date.toISOString().split("T")[0];
      
      creationCounts[dateKey] = (creationCounts[dateKey] || 0) + 1;
    });

    // Convertir a array y ordenar por fecha (la clave 'dateKey' ya está en formato ordenable)
    return Object.entries(creationCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Ordenar por fecha
  }, [invoices]);


  // 💡 Ayuda visual para el eje X en la tendencia
  const formatTrendXAxis = (tickItem) => {
    // Si hay más de 10 puntos de datos, mostramos solo mes/día
    if (creationTrendData.length > 10) {
        try {
            const date = new Date(tickItem);
            return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        } catch (e) {
            return tickItem;
        }
    }
    return tickItem; // Mostrar la fecha completa si hay pocos datos
  }

  if (loading) {
    return <div className="dashboard-section">Loading billing data...</div>;
  }

  return (
    <div className="billing-dashboard-section">
      <div className="orders-dashboard-header">
        <h2 className="billing-title">💰 Billing Dashboard</h2>
      </div>

      {/* 🔹 KPI Highlights */}
      <div className="kpi-container">
        <div className="billing-kpi-card">
          <FaFileInvoiceDollar size={20} />
          <div>
            <h5>Total Invoices: {invoices.length}</h5>
          </div>
        </div>
        <div className="billing-kpi-card">
          <FaMoneyBillWave size={20} />
          <div>
            <h5>Total Billed: €{totalBilled.toFixed(2)}</h5>
          </div>
        </div>
      </div>

      <div className="dashboard-charts-grid">
        {/* 💼 Financial Status Breakdown */}
        <div className="billing-small-chart">
          <h3>💼 Financial Status Breakdown</h3>
          <div className="financial-status-container">
            {statusChartData.length === 0 ? (
              <div className="empty-state">
                No financial status data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    isAnimationActive={true}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ paddingLeft: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 🚚 Shipping Status Overview */}
        <div className="billing-small-chart">
          <h3>🚚 Shipping Status Overview</h3>
          {shippingChartData.length === 0 ? (
            <div className="empty-state">
              No shipping status data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={shippingChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} /> {/* Asegura que los recuentos sean enteros */}
                <Tooltip />
                <Legend wrapperStyle={{ display: "none" }} />
                <Bar
                  dataKey="count"
                  fill="url(#barGradient)"
                  radius={[10, 10, 0, 0]}
                  isAnimationActive={true}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8A2BE2" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#DDA0DD" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      {/* 🏆 Top Products (Full width section) */}
      <div className="billing-chart-container full-width-chart">
          <h3>🏆 Top {productChartData.length} Billed Products (Units Sold)</h3>
          {productChartData.length === 0 ? (
            <div className="empty-state">No product sales data available.</div>
          ) : (
            <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ display: "none" }} />
                <Bar dataKey="sales" radius={[10, 10, 0, 0]}>
                  {productChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="product-color-legend" style={{ textAlign: 'center', marginTop: '10px' }}>
              {productChartData.map((entry, index) => (
                <div
                  key={entry.name}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    marginRight: "1rem",
                    marginTop: "0.5rem",
                    fontSize: "0.9rem",
                    color: "#2c6089",
                  }}
                >
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                      borderRadius: "50%",
                      display: "inline-block",
                      marginRight: "0.5rem",
                    }}
                  ></span>
                  {entry.name}
                </div>
              ))}
            </div>
            </>
          )}
      </div>

      {/* 📅 Invoice Creation Trend */}
      <div className="billing-chart-container full-width-chart">
        <h3>
          📅 Invoice Creation Trend
          <div
            onMouseEnter={() => setShowHelp(true)}
            onMouseLeave={() => setShowHelp(false)}
            style={{
              display: "inline-block",
              marginLeft: "0.75rem",
              padding: "2px 8px",
              backgroundColor: "#8A2BE2",
              color: "#fff",
              borderRadius: "12px",
              fontSize: "0.75rem",
              cursor: "pointer",
              boxShadow: "0 0 4px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            Brush Help
            {showHelp && (
              <div
                className="custom-tooltip"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "0",
                  marginTop: "6px",
                  backgroundColor: "#fff",
                  color: "#333",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  fontSize: "0.8rem",
                  zIndex: 10,
                  whiteSpace: "nowrap",
                  minWidth: "200px",
                }}
              >
                Drag the purple slider (Brush) below to zoom into specific dates and see the trend over a shorter period.
              </div>
            )}
          </div>
        </h3>
        {creationTrendData.length === 0 ? (
          <div className="empty-state">No invoice creation data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={creationTrendData}>
              {/* 🎨 Gradient Definition */}
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8A2BE2" />
                  <stop offset="100%" stopColor="#FF69B4" />
                </linearGradient>
              </defs>

              {/* 📊 Chart Elements */}
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatTrendXAxis}
                angle={-45} 
                textAnchor="end" 
                height={70} 
                interval="preserveStartEnd" // Mejora la visualización en rangos amplios
              />
              <Brush dataKey="date" height={20} stroke="#8A2BE2" />
              {/* Ejemplo de ReferenceLine, si lo necesitas para un hito específico */}
              {/* <ReferenceLine x="2025-08-01" stroke="red" label="Launch" /> */} 

              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value) => [`${value} invoices`, "Created"]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend wrapperStyle={{ display: "none" }} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={{ r: 4, stroke: "#FF69B4", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="chart-legend" style={{ textAlign: 'center' }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#8A2BE2",
                borderRadius: "50%",
                display: "inline-block",
              }}
            ></span>
            Invoice Count per Day
          </span>
        </div>
      </div>
    </div>
  );
};

export default Billing;