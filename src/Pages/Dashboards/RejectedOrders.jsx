import React, { useEffect, useState, useMemo } from "react";
import "./style/RejectedOrders.css"; // Styles for Rejected Orders Dashboard

// Import Firebase dependencies (assuming the same setup)
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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { FaTimesCircle, FaEuroSign, FaChartLine, FaExclamationCircle } from "react-icons/fa";

// --- Constants ---
const REJECTION_COLORS = ["#FF6347", "#FFB6C1", "#FA8072", "#E9967A", "#CD5C5C"]; // Shades of Red/Warning

// --- Helper Functions ---
const formatXAxisTick = (tickItem) => {
    if (!tickItem) return "";
    const maxLength = 8;
    return tickItem.length > maxLength
        ? `${tickItem.substring(0, maxLength)}...`
        : tickItem;
};

// Function to calculate the total value of a single order
const calculateOrderTotal = (eanList) => {
    let total = 0;
    if (eanList && typeof eanList === "object") {
        Object.values(eanList).forEach(item => {
            const quantity = item.quantity || 0;
            // Assuming unitPrice is the cost the user would have paid
            const unitPrice = item.transport?.unitPrice || 0; 
            total += quantity * unitPrice;
        });
    }
    return total;
};


// --- Main Component ---

const RejectedOrders = () => {
    const [rejectedOrders, setRejectedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("month");

    // Time Constants
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    const quarterLabels = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"];
    const currentQuarterLabel = quarterLabels[currentQuarter];

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // NOTE: Assuming a 'rejected_orders' collection exists
                const rejectedOrdersSnap = await getDocs(collection(db, "ordersBacklog"));
                
                // Add a dummy rejectionReason for demonstration, as it's critical for analysis
                const ordersData = rejectedOrdersSnap.docs.map((doc) => {
                    const data = doc.data();
                    const reasons = ["Out of Stock", "Client Cancellation", "Delivery Issue", "Price Mismatch"];
                    // Add a mock reason if it doesn't exist
                    return {
                        ...data,
                        rejectionReason: data.rejectionReason || reasons[Math.floor(Math.random() * reasons.length)],
                    };
                });
                
                setRejectedOrders(ordersData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching rejected orders data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- Filtering Logic ---
    const filterOrdersByTimeRange = (orders, range) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); 
        const currentQuarter = Math.floor(currentMonth / 3); 

        return orders.filter((order) => {
            const date = order.creationDate?.toDate?.() || new Date(order.creationDate);
            if (!date || isNaN(date.getTime())) return false;

            const orderYear = date.getFullYear();
            const orderMonth = date.getMonth();
            const orderQuarter = Math.floor(orderMonth / 3);

            if (range === "month") {
                return orderMonth === currentMonth && orderYear === currentYear;
            }
            if (range === "quarter") {
                return orderQuarter === currentQuarter && orderYear === currentYear;
            }
            if (range === "year") {
                return orderYear === currentYear;
            }
            return true;
        });
    };

    // --- Memoized Calculations ---

    const filteredOrders = useMemo(() => {
        return filterOrdersByTimeRange(rejectedOrders, timeRange);
    }, [rejectedOrders, timeRange]);

    // KPI: Total Lost Revenue for the filtered period
    const totalLostRevenue = useMemo(() => {
        return filteredOrders.reduce((sum, order) => sum + calculateOrderTotal(order.eanList), 0);
    }, [filteredOrders]);

    // KPI: Total Clients Affected (Unique Client IDs)
    const affectedClients = useMemo(() => {
        const clientIds = new Set(filteredOrders.map(order => order.clientId));
        return clientIds.size;
    }, [filteredOrders]);

    // Chart Data 1: Rejections by Reason (Pie Chart)
    const reasonChartData = useMemo(() => {
        const reasonMap = {};
        filteredOrders.forEach((order) => {
            const reason = order.rejectionReason || "Unknown Reason";
            reasonMap[reason] = (reasonMap[reason] || 0) + 1;
        });

        return Object.entries(reasonMap)
            .map(([name, count]) => ({ name, value: count }))
            .sort((a, b) => b.value - a.value);
    }, [filteredOrders]);

    const topRejectionReason = reasonChartData[0] || { name: "N/A", value: 0 };


    // Chart Data 2: Monthly Rejection Trend (Area Chart)
    const monthlyRejectionData = useMemo(() => {
        const monthlyMap = {};
        rejectedOrders.forEach((order) => {
            let date;
            if (order.creationDate?.toDate) {
                date = order.creationDate.toDate();
            } else if (
                typeof order.creationDate === "string" ||
                typeof order.creationDate === "number"
            ) {
                date = new Date(order.creationDate);
            }

            if (!date || isNaN(date.getTime()) || date.getFullYear() !== currentYear) return;

            const monthKey = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`; // e.g., 2023-10
            const monthLabel = date.toLocaleString("default", {
                month: "short",
                year: "numeric",
            });

            const orderValue = calculateOrderTotal(order.eanList);

            monthlyMap[monthKey] = {
                month: monthLabel,
                count: (monthlyMap[monthKey]?.count || 0) + 1,
                lostRevenue: (monthlyMap[monthKey]?.lostRevenue || 0) + orderValue,
            };
        });

        // Convert and sort by date key
        return Object.entries(monthlyMap)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([, data]) => data);
    }, [rejectedOrders, currentYear]);


    const worstMonth = useMemo(() => {
        if (!monthlyRejectionData || monthlyRejectionData.length === 0) {
            return { month: "N/A", count: 0, lostRevenue: 0 };
        }
        return monthlyRejectionData.reduce(
            (max, entry) => (entry.count > max.count ? entry : max),
            { month: "N/A", count: 0, lostRevenue: 0 }
        );
    }, [monthlyRejectionData]);


    // --- Render ---

    if (loading) {
        return <div className="dashboard-section">Loading rejection data...</div>;
    }

    return (
        <div className="rejected-orders-dashboard-section">
            <div className="orders-dashboard-header">
                <h2 className="orders-title">❌ Rejected Orders Dashboard</h2>
            </div>

            {/* KPIs - Focusing on Lost Value and Frequency */}
            <div className="kpi-container">
                <div className="orders-kpi-card">
                    <FaTimesCircle size={20} color={REJECTION_COLORS[0]}/>
                    <div>
                        <h5>Total Rejections ({timeRange} filter)</h5>
                        <p>{filteredOrders?.length ?? 0}</p>
                    </div>
                </div>
                <div className="orders-kpi-card">
                    <FaEuroSign size={20} color={REJECTION_COLORS[1]} />
                    <div>
                        <h5>Lost Revenue ({timeRange} filter)</h5>
                        <p>€{totalLostRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <div className="orders-kpi-card">
                    <FaExclamationCircle size={20} color={REJECTION_COLORS[2]}/>
                    <div>
                        <h5>Affected Clients ({timeRange} filter)</h5>
                        <p>{affectedClients}</p>
                    </div>
                </div>
                <div className="orders-kpi-card">
                    <FaChartLine size={20} color={REJECTION_COLORS[3]}/>
                    <div>
                        <h5>Worst Month (YTD)</h5>
                        <p>{worstMonth.month} ({worstMonth.count} rejections)</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-charts-grid">
                {/* Rejections by Reason (Pie Chart) */}
                <div className="small-chart">
                    <h3>🚫 Rejections by Reason</h3>
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
                            ? `${now.toLocaleString("default", { month: "long" })} ${currentYear}`
                            : timeRange === "quarter"
                                ? `Q${currentQuarter + 1} (${currentQuarterLabel} ${currentYear})`
                                : `${currentYear}`}
                    </p>

                    <div className="rejection-reasons-container">
                        {reasonChartData.length === 0 ? (
                            <div className="empty-state">No rejections found for the current period.</div>
                        ) : (
                            <PieChart width={510} height={250}>
                                <Pie
                                    data={reasonChartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine={false}
                                >
                                    {(reasonChartData ?? []).map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={REJECTION_COLORS[index % REJECTION_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} Rejections`, "Count"]} />
                                <Legend
                                    layout="horizontal"
                                    align="center"
                                    verticalAlign="bottom"
                                    wrapperStyle={{ paddingTop: "10px" }}
                                />
                            </PieChart>
                        )}
                    </div>
                    <div className="chart-legend">
                        <strong>Top Reason:</strong> {topRejectionReason.name} ({topRejectionReason.value} cases)
                    </div>
                </div>

                {/* Top Rejected Products (Bar Chart) - Based on SKU */}
                <div className="chart-container">
                    <h3>📉 Top Rejected Products</h3>
                    <p className="chart-subtitle">
                        SKUs most frequently included in rejected orders.
                    </p>

                    {/* Logic to calculate top rejected products */}
                    <RejectedProductsBarChart data={filteredOrders} />
                </div>
            </div>

            {/* Monthly Rejection Trend */}
            <div className="chart-container-monthly-sales">
                <h3>🗓️ Monthly Rejection Trend (Current Year)</h3>
                <div className="sales-container">
                    {monthlyRejectionData.length === 0 ? (
                        <div className="empty-state">No monthly rejection data available for {currentYear}.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={monthlyRejectionData}>
                                <defs>
                                    <linearGradient id="rejectAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FF6347" stopOpacity={0.6} />
                                        <stop offset="100%" stopColor="#FFB6C1" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" />
                                <YAxis
                                    yAxisId="left"
                                    stroke="#FF6347"
                                    tickFormatter={(value) => `${value}`}
                                    label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#fa8072"
                                    tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                                    label={{ value: 'Revenue', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
                                />
                                <Tooltip formatter={(value, name) => {
                                    if (name === 'Lost Revenue') {
                                        return [`€${value.toFixed(2)}`, name];
                                    }
                                    return [value, name];
                                }} />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#FF6347"
                                    fill="url(#rejectAreaGradient)"
                                    name="Rejection Count"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="lostRevenue"
                                    stroke="#fa8072"
                                    fill="none"
                                    name="Lost Revenue"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Legend />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
                {monthlyRejectionData.length > 0 && (
                    <div className="dashboard-summary">
                        <p>
                            🔥 Month with Most Rejections: <strong>{worstMonth.month}</strong> (Lost Revenue: €{worstMonth.lostRevenue.toFixed(2)})
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RejectedOrders;

// --- Sub-Component for Bar Chart ---
const RejectedProductsBarChart = ({ data }) => {
    const productRejectionData = useMemo(() => {
        const productMap = {};

        data.forEach((order) => {
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

        return Object.entries(productMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Show only the top 5
    }, [data]);

    return productRejectionData.length === 0 ? (
        <div className="empty-state">No products found in rejected orders for this period.</div>
    ) : (
        <ResponsiveContainer width="100%" height={230}>
            <BarChart data={productRejectionData}>
                <XAxis
                    dataKey="name"
                    tickFormatter={formatXAxisTick}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={70}
                />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} Units`, "Rejected Count"]} />
                <Bar
                    dataKey="count"
                    fill={REJECTION_COLORS[4]}
                    radius={[10, 10, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};