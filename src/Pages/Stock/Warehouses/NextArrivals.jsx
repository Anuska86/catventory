import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";

// --- CUSTOM THEME COLORS ---
// Colores basados en el diseño de Quantum Mads (paneles, menús y gráficos)
const COLORS = {
  PrimaryDark: "#002540", // Base azul oscuro (similar al panel de Investment Optimization)
  AccentMagenta: "#E91E63", // Magenta brillante (usado en títulos de paneles)
  BackgroundLight: "#F5F5F5", // Fondo claro
  GridGreen: "#4CAF50", // Verde de las barras de progreso o líneas de energía verde
  GridBlue: "#2196F3", // Azul para datos
  Border: "#ddd",
};

// --- TABLE COLUMN DEFINITION ---
const nextArrivalsColumns = [
  {
    name: "Product Name / Description",
    selector: (row) => row.name,
    sortable: true,
    wrap: true,
  },
  { name: "EAN", selector: (row) => row.ean, sortable: true },
  {
    name: "Arrival Date",
    selector: (row) => row.arrivalDate,
    sortable: true,
    width: "120px",
  },
  {
    name: "Arrival Qty",
    selector: (row) => row.units,
    sortable: true,
    width: "120px",
  },
  {
    name: "Supplier Price (€)",
    selector: (row) => row.unitPrice,
    sortable: true,
    width: "150px",
  },
];

const NextArrivals = () => {
  // 1. Get the location object and extract state
  const location = useLocation();
  const selectedWarehouseName = location.state?.selectedWarehouseName;
      const allArrivalsData = [
      {
        id: 1,
        name: "Electric Drill Kit X200",
        ean: "7340129917860",
        arrivalDate: "2025-11-15",
        warehouse: "France Hub W6",
        units: 500,
        unitPrice: 22.52,
      },
      {
        id: 2,
        name: "Safety Goggles Pro",
        ean: "8899321004567",
        arrivalDate: "2025-11-20",
        warehouse: "France Hub W6",
        units: 120,
        unitPrice: 5.75,
      },
      {
        id: 3,
        name: "Heavy Duty Wrench Set",
        ean: "9001122334455",
        arrivalDate: "2025-11-18",
        warehouse: "Spain Hub W1",
        units: 300,
        unitPrice: 35.9,
      },
      {
        id: 4,
        name: "Precision Calipers",
        ean: "1122334455667",
        arrivalDate: "2025-11-16",
        warehouse: "France Hub W6",
        units: 750,
        unitPrice: 15.1,
      },
      // Add data for other warehouses if needed for testing filtering
      {
        id: 5,
        name: "Solar Panel Mounts",
        ean: "2233445566778",
        arrivalDate: "2025-11-25",
        warehouse: "Poland Hub W7",
        units: 900,
        unitPrice: 150.0,
      },
    ];

  if (!selectedWarehouseName) {
    return (
      <div
        style={{
          color: COLORS.PrimaryDark,
          padding: "20px",
          backgroundColor: COLORS.BackgroundLight,
        }}
      >
        ⚠️ **Error**: Could not load warehouse name. Please check navigation
        state.
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 4. Rendering the HTML Table with Custom Styles
  // ----------------------------------------------------------------------

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2
        style={{
          color: COLORS.PrimaryDark,
          borderBottom: `2px solid ${COLORS.PrimaryDark}`,
          paddingBottom: "10px",
        }}
      >
        Next Arrivals for: **{selectedWarehouseName}**
      </h2>

      {allArrivalsData.length === 0 ? (
        <p>No upcoming articles registered for this warehouse.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              {nextArrivalsColumns.map((col) => (
                <th
                  key={col.name}
                  style={{ ...tableHeaderStyle, width: col.width }}
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allArrivalsData.map((item, index) => (
              <tr
                key={item.id}
                style={index % 2 === 0 ? tableRowEvenStyle : tableRowOddStyle}
              >
                {nextArrivalsColumns.map((col) => (
                  <td key={col.name} style={tableCellStyle}>
                    {col.selector(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// --- STYLING (Based on Quantum Mads Theme) ---

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "15px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Soft shadow for a modern look
};

const tableHeaderStyle = {
  padding: "12px 10px",
  textAlign: "left",
  backgroundColor: COLORS.PrimaryDark, // Dark header color
  color: "white", // White text for contrast
  border: "none",
  borderBottom: `2px solid ${COLORS.PrimaryDark}`, // Accent line below header
};

const tableCellStyle = {
  padding: "10px",
  borderRight: `1px solid ${COLORS.Border}`, // Vertical borders
  borderLeft: `1px solid ${COLORS.Border}`,
  borderBottom: `1px solid ${COLORS.Border}`,
  textAlign: "left",
  // Ensure the last cell doesn't have a right border, and the first doesn't have a left border
};

const tableRowEvenStyle = { backgroundColor: "white" };
const tableRowOddStyle = { backgroundColor: COLORS.BackgroundLight }; // Subtle striping for readability

export default NextArrivals;
