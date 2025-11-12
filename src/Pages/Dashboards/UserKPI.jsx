import React, { useEffect, useState } from "react";
import "./style/UserKPI.css";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { format } from "date-fns";
import { motion } from "framer-motion";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const UserKPI = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "auditTrail"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecords(data);
    });

    return () => unsubscribe();
  }, []);

  // 🔍 Filter for key actions
  const keyActions = [
    "Create Order",
    "Block Product",
    "Edit Order",
    "Download Invoice PDF",
    "Add Billing",
    "Edit Product",
  ];

  const keyActionCounts = keyActions.map((action) => ({
    action,
    count: records.filter((r) => r.action === action).length,
  }));

  // 🧮 Count actions per user
  const userActivity = records.reduce((acc, r) => {
    acc[r.user] = (acc[r.user] || 0) + 1;
    return acc;
  }, {});

  // 🔝 Sort by activity
  const sortedUsers = Object.entries(userActivity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5

  // KPI Calculations
  const totalActions = records.length;
  const uniqueUsers = new Set(records.map((r) => r.user)).size;
  const latest = records[0];
  const latestAction = latest?.action || "—";
  const latestUser = latest?.user || "—";
  const latestTime = latest?.timestamp
    ? format(new Date(latest.timestamp.seconds * 1000), "PPpp")
    : "—";

  // Group by date and action
  const chartData = records.reduce((acc, r) => {
    const date = format(new Date(r.timestamp.seconds * 1000), "MMM d");
    let entry = acc.find((d) => d.date === date);

    if (!entry) {
      entry = { date };
      // Initialize all key actions to 0
      keyActions.forEach((action) => {
        entry[action] = 0;
      });
      acc.push(entry);
    }

    if (keyActions.includes(r.action)) {
      entry[r.action] += 1;
    }

    return acc;
  }, []);

  const actionMeta = {
    "Create Order": {
      icon: "📝",
      color: "#8A2BE2",
      description: "User created a new order in the system.",
    },
    "Block Product": {
      icon: "🚫",
      color: "#FF8C00",
      description: "User blocked a product from being sold.",
    },
    "Edit Order": {
      icon: "✏️",
      color: "#00BFFF",
      description: "User modified an existing order.",
    },
    "Download Invoice PDF": {
      icon: "📄",
      color: "#32CD32",
      description: "User downloaded the invoice as a PDF.",
    },
    "Add Billing": {
      icon: "💳",
      color: "#FF69B4",
      description: "User added billing information.",
    },
    "Edit Product": {
      icon: "🛠️",
      color: "#20B2AA",
      description: "User updated product details.",
    },
  };

  const userColors = ["#8A2BE2", "#FF8C00", "#00BFFF", "#32CD32", "#FF69B4"];

  return (
    <div className="orders-dashboard-section">
      <div className="KPIs-dashboard-header">
        <h2 className="main-title">👥 User Activity KPIs</h2>
      </div>
      <div className="kpi-container">
        <div className="orders-kpi-card">Total Actions: {totalActions}</div>
        <div className="orders-kpi-card">Unique Users: {uniqueUsers}</div>
        <div className="orders-kpi-card">Latest Action: {latestAction}</div>
        <div className="orders-kpi-card">By: {latestUser}</div>
        <div className="orders-kpi-card">At: {latestTime}</div>
      </div>

      {/* 📈 Chart Section */}
      <div className="chart-container">
        <h3 className="section-title">📈 Daily Activity</h3>
        {chartData.length === 0 ? (
          <div className="empty-state">No activity data available yet.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={[...chartData].reverse()}>
                <defs>
                  <linearGradient
                    id="createOrderGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8A2BE2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="blockProductGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FF8C00" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="editOrderGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#00BFFF" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00BFFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="downloadInvoiceGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#32CD32" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#32CD32" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="addBillingGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#FF69B4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FF69B4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="editProductGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#20B2AA" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#20B2AA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
                <Area
                  type="monotone"
                  dataKey="Create Order"
                  name="Create Order"
                  stroke="#8A2BE2"
                  fill="url(#createOrderGradient)"
                  isAnimationActive={true}
                />
                <Area
                  type="monotone"
                  dataKey="Block Product"
                  name="Block Product"
                  stroke="#FF8C00"
                  fill="url(#blockProductGradient)"
                  isAnimationActive={true}
                />
                <Area
                  type="monotone"
                  dataKey="Edit Order"
                  name="Edit Order"
                  stroke="#00BFFF"
                  fill="url(#editOrderGradient)"
                  isAnimationActive={true}
                />
                <Area
                  type="monotone"
                  dataKey="Download Invoice PDF"
                  name="Download Invoice PDF"
                  stroke="#32CD32"
                  fill="url(#downloadInvoiceGradient)"
                  isAnimationActive={true}
                />
                <Area
                  type="monotone"
                  dataKey="Add Billing"
                  name="Add Billing"
                  stroke="#FF69B4"
                  fill="url(#addBillingGradient)"
                  isAnimationActive={true}
                />
                <Area
                  type="monotone"
                  dataKey="Edit Product"
                  name="Edit Product"
                  stroke="#20B2AA"
                  fill="url(#editProductGradient)"
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              Shows the number of user actions per day
            </div>
          </>
        )}
      </div>

      {/* KEY ACTIONS*/}
      <div className="kpi-sections-wrapper">
        <div className="KPI-actions">
          <h3 className="section-title">🚨 Key Actions</h3>
          <div className="key-actions-grid">
            {keyActionCounts.map(({ action, count }) => {
              const meta = actionMeta[action] || {};
              return (
                <div
                  className="key-action-card"
                  key={action}
                  style={{
                    borderColor: meta.color,
                    background: `${meta.color}20`,
                  }}
                  title={meta.description}
                >
                  <div style={{ fontSize: "1.5rem" }}>{meta.icon}</div>
                  <h4>{action}</h4>
                  <p>{count} actions</p>
                </div>
              );
            })}
          </div>
        </div>

        <motion.div
          className="list-users"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="section-title">🏆 Principal Users</h3>
          <ol>
            {sortedUsers.map(([user, count], index) => (
              <motion.li
                key={user}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  borderLeft: `6px solid ${userColors[index]}`,
                  background: `${userColors[index]}10`,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  className="avatar-circle"
                  style={{
                    backgroundColor: userColors[index],
                    color: "white",
                    boxShadow: "0 0 4px rgba(0,0,0,0.2)",
                  }}
                >
                  {user.charAt(0).toUpperCase()}
                </span>
                <strong style={{ marginLeft: "0.5rem" }}>{user}</strong> —{" "}
                {count} actions
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </div>
    </div>
  );
};

export default UserKPI;
