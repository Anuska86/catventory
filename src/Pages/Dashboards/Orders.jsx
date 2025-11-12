import React, { useEffect, useState, useMemo } from "react";
import "./style/Orders.css";

import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";

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
  Area,
  AreaChart,
} from "recharts";
import { FaShoppingCart, FaUsers, FaEuroSign, FaBoxes } from "react-icons/fa";

const formatXAxisTick = (tickItem) => {
  if (!tickItem) {
    return "";
  }
  const maxLength = 8;
  return tickItem.length > maxLength
    ? `${tickItem.substring(0, maxLength)}...`
    : tickItem;
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState(0);
  const [stock, setStock] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");

  // Constantes de Tiempo para Visualización (se usan en el JSX)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3);
  const quarterLabels = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"];
  const currentQuarterLabel = quarterLabels[currentQuarter];

  const COLORS = ["#8A2BE2", "#DDA0DD", "#FF69B4", "#F5F5F5"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersSnap, clientsSnap, stockSnap, productsSnap] =
          await Promise.all([
            getDocs(collection(db, "orders")),
            getDocs(collection(db, "clients")),
            getDocs(collection(db, "stock")),
            getDocs(collection(db, "products")),
          ]);

        const ordersData = ordersSnap.docs.map((doc) => doc.data());
        setOrders(ordersData);

        setClients(clientsSnap.docs.map((doc) => doc.data()));
        setStock(stockSnap.docs.map((doc) => doc.data()));
        setProductsData(productsSnap.docs.map((doc) => doc.data()));

        const totalSales = ordersData.reduce(
          (sum, order) => sum + (order.totalBlockedAmount || 0),
          0
        );
        setSales(totalSales);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  //TABS - Lógica de Filtrado CORREGIDA
  const filterOrdersByTimeRange = (orders, range) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const currentQuarter = Math.floor(currentMonth / 3); // 0-3

    return orders.filter((order) => {
      // Intenta obtener la fecha de un timestamp de Firebase o de un string/number
      const date =
        order.creationDate?.toDate?.() || new Date(order.creationDate);
      
      // Si la fecha es inválida, descarta la orden
      if (!date || isNaN(date.getTime())) return false;

      const orderYear = date.getFullYear();
      const orderMonth = date.getMonth();
      const orderQuarter = Math.floor(orderMonth / 3);

      if (range === "month") {
        // Filtrar por el MES ACTUAL y el AÑO ACTUAL
        return orderMonth === currentMonth && orderYear === currentYear;
      }
      if (range === "quarter") {
        // Filtrar por el TRIMESTRE ACTUAL y el AÑO ACTUAL
        return orderQuarter === currentQuarter && orderYear === currentYear;
      }
      if (range === "year") {
        // Filtrar por el AÑO ACTUAL
        return orderYear === currentYear;
      }
      return true; // En caso de un rango no especificado, incluir
    });
  };

  const productChartData = useMemo(() => {
    const filteredOrders = filterOrdersByTimeRange(orders, timeRange);
    const productMap = {};

    filteredOrders.forEach((order) => {
      const productsObj = order.eanList;
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

    // Ordenar de mayor a menor y limitar, si es necesario, para mejor visualización
    return Object.entries(productMap)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5); // Mostrar solo el top 5 para el gráfico de barras
  }, [orders, timeRange]);

  //Category
  const categoryChartData = useMemo(() => {
    const filteredOrders = filterOrdersByTimeRange(orders, timeRange);

    const skuToCategory = {};
    productsData.forEach((product) => {
      if (product.sku && product.category) {
        skuToCategory[product.sku] = product.category;
      }
    });

    const categorySalesMap = {};
    filteredOrders.forEach((order) => {
      const eanList = order.eanList || {};
      Object.values(eanList).forEach((item) => {
        const sku = item.sku;
        const quantity = item.quantity || 0;
        const category = skuToCategory[sku] || "Other";
        categorySalesMap[category] =
          (categorySalesMap[category] || 0) + quantity;
      });
    });

    return Object.entries(categorySalesMap).map(([category, value]) => ({
      category,
      value,
    }));
  }, [orders, productsData, timeRange]);

  const topCategory = categoryChartData.reduce(
    (max, entry) => (entry.value > max.value ? entry : max),
    { category: "N/A", value: 0 }
  );

  //Monthly sales
  const monthlySalesData = useMemo(() => {
    const monthlyMap = {};
    orders.forEach((order) => {
      let date;
      if (order.creationDate?.toDate) {
        date = order.creationDate.toDate();
      } else if (
        typeof order.creationDate === "string" ||
        typeof order.creationDate === "number"
      ) {
        date = new Date(order.creationDate);
      }

      if (!date || isNaN(date.getTime())) return;

      // Solo incluimos órdenes del año actual para el gráfico de tendencia
      if (date.getFullYear() !== currentYear) return;

      // Usamos el formato numérico para ordenar correctamente antes de formatear
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`; // Ej: 2023-10
      const monthLabel = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      monthlyMap[monthKey] = {
        month: monthLabel,
        sales: (monthlyMap[monthKey]?.sales || 0) + (order.totalBlockedAmount || 0),
        date: date,
      };
    });

    // Convertir el mapa a array, ordenar por clave (fecha) y luego mapear a la estructura final
    return Object.entries(monthlyMap)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([, { month, sales }]) => ({ month, sales }));
  }, [orders, currentYear]); // Dependencia agregada

  const bestMonth = useMemo(() => {
    if (!monthlySalesData || monthlySalesData.length === 0) {
      return { month: "", sales: 0 };
    }
    return monthlySalesData.reduce(
      (max, entry) => (entry.sales > max.sales ? entry : max),
      { month: "", sales: 0 }
    );
  }, [monthlySalesData]);

  const totalMonthlySales = useMemo(() => {
    // Cálculo de las ventas TOTALES del período del gráfico (el año actual)
    return monthlySalesData.reduce((sum, entry) => sum + entry.sales, 0);
  }, [monthlySalesData]);

  const topProducts = useMemo(() => {
    return [...productChartData].sort((a, b) => b.sales - a.sales).slice(0, 3);
  }, [productChartData]);

  if (loading) {
    return <div className="dashboard-section">Loading data...</div>;
  }

  return (
    <div className="orders-dashboard-section">
      <div className="orders-dashboard-header">
        <h2 className="orders-title">📦 Orders Dashboard</h2>
      </div>

      {/* KPIs */}
      <div className="kpi-container">
        <div className="orders-kpi-card">
          <FaShoppingCart size={20} />
          <div>
            <h5>Total Orders: {orders?.length ?? 0}</h5>
          </div>
        </div>
        <div className="orders-kpi-card">
          <FaUsers size={20} />
          <div>
            <h5>Total Clients: {clients?.length ?? 0}</h5>
          </div>
        </div>
        <div className="orders-kpi-card" style={{display:"none"}}>
          <FaEuroSign size={20} />
          <div>
            {/* El total de ventas global no cambia con el filtro de tiempo, por eso usamos `sales` del estado */}
            <h5>Total Sales: €{(sales ?? 0).toFixed(2)}</h5>
          </div>
        </div>
        <div className="orders-kpi-card">
          <FaBoxes size={20} />
          <div>
            <h5>Total Stock Items: {stock?.length ?? 0}</h5>
          </div>
        </div>
      </div>

      <div className="dashboard-charts-grid">
        {/* Top-Selling Products */}

        <div className="chart-container">
          <h3>🏆 Top-Selling Products</h3>
          <div className="time-tabs">
            {["month", "quarter", "year"].map((range) => (
              <button
                key={range}
                className={timeRange === range ? "active-tab" : ""}
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          <p className="chart-subtitle">
            Showing data for:{" "}
            {timeRange === "month"
              ? `${now.toLocaleString("default", {
                  month: "long",
                })} ${currentYear}`
              : timeRange === "quarter"
                ? `Q${currentQuarter + 1} (${currentQuarterLabel} ${currentYear})`
                : `${currentYear}`}
          </p>

          <div className="top-products-container">
            {productChartData.length === 0 ? (
              <div className="empty-state">
                No orders found for the current period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={productChartData}>
                  <XAxis
                    dataKey="name"
                    tickFormatter={formatXAxisTick}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={70}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="sales"
                    fill="url(#barGradient)"
                    radius={[10, 10, 0, 0]}
                  />
                  <defs>
                    <linearGradient
                      id="barGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#8A2BE2" stopOpacity={0.8} />
                      <stop
                        offset="100%"
                        stopColor="#DDA0DD"
                        stopOpacity={0.6}
                      />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="chart-legend">
            <strong>Top Products:</strong>{" "}
            {topProducts.length > 0
              ? topProducts.map((p, i) => (
                  <span key={p.name}>
                    {p.name}
                    {i < topProducts.length - 1 ? ", " : ""}
                  </span>
                ))
              : "N/A"}
          </div>
        </div>

        {/* Sales by Category */}
        <div className="small-chart">
          <h3>📊 Sales by Category</h3>
          <p className="chart-highlight">
            Most sold category: <strong>{topCategory.category}</strong> (
            {topCategory.value} units)
          </p>

          <div className="categories-container">
            {categoryChartData.length === 0 ? (
              <div className="empty-state">No category data available for the current period.</div>
            ) : (
              <PieChart width={510} height={250}>
                {" "}
                <Pie
                  data={categoryChartData}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  label={({ category, percent }) =>
                    `${category} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {(categoryChartData ?? []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: "10px" }}
                />
              </PieChart>
            )}
          </div>
          {/* Duplicar el subtítulo del tiempo no es necesario aquí, ya que el filtro se aplica en el gráfico de productos */}
          <p className="chart-total">
            Total units sold:{" "}
            {categoryChartData.reduce((sum, entry) => sum + entry.value, 0)}
          </p>
        </div>
      </div>

      {/* Monthly Sales Trend */}
      <div className="chart-container-monthly-sales">
        <h3>📈 Monthly Sales Trend (Current Year)</h3>
        <div className="sales-container">
          {monthlySalesData.length === 0 ? (
            <div className="empty-state">No monthly sales data available for {currentYear}.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlySalesData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8A2BE2" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#DDA0DD" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} // Formateo simple para evitar números grandes
                />
                <Tooltip formatter={(value) => [`€${value.toFixed(2)}`, "Sales"]} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#8A2BE2"
                  fill="url(#areaGradient)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        {monthlySalesData.length > 0 && (
          <div className="chart-legend">
            🏆 Highest Sales: <strong>{bestMonth.month}</strong> (€
            {bestMonth.sales.toFixed(2)})
          </div>
        )}
        <div className="dashboard-summary">
          <p>💰 Total Sales (Current Year): €{totalMonthlySales.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default Orders;