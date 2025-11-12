import React, { Fragment, useEffect, useState } from "react";
import "./style/UserTrack.css";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../../utils/firebase";
import { format } from "date-fns";
import DataTable from "react-data-table-component";
import { Row, Col, Card, CardBody } from "reactstrap";
import PageTitle from "../../../Layout/AppMain/PageTitle";

const columns = [
    {
        name: "User",
        selector: (row) => row.user,
        sortable: true,
        reorder: true,
    },
    {
        name: "Action",
        selector: (row) => row.action,
        sortable: true,
        reorder: true,
    },
    {
        name: "Entity",
        selector: (row) => row.entity,
        sortable: true,
        reorder: true,
    },
    {
        name: "Timestamp",
        selector: (row) => row.timestamp,
        cell: (row) => row.timestamp?.seconds ? format(new Date(row.timestamp.seconds * 1000), "PPpp") : "—",
        sortable: true,
        reorder: true,
    },
    {
        name: "Details",
        cell: (row) =>
            typeof row.details === "object"
                ? JSON.stringify(row.details, null, 2)
                : row.details,
        sortable: true,
        reorder: true,
    },
];

const UserTrack = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const q = query(collection(db, "auditTrail"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setRecords(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 🌟 LÓGICA DE FILTRADO APLICADA AQUÍ 🌟
    const filteredRecords = records.filter(row => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        if (!lowerCaseSearch) {
            return true; // Muestra todo si la búsqueda está vacía
        }

        // Combina los campos que deseas buscar en una sola cadena
        const user = row.user || "";
        const action = row.action || "";
        const entity = row.entity || "";
        const details = typeof row.details === "object" ? JSON.stringify(row.details) : (row.details || "");

        const rowData = (user + action + entity + details).toLowerCase();

        return rowData.includes(lowerCaseSearch);
    });

    return (
        <Fragment>
            <PageTitle
                heading="Audit Trail"
                subheading="Track user actions and system events."
                icon="pe-7s-drawer icon-gradient bg-happy-itmeo"
            />
            <Row style={{ maxWidth: "100%" }}>
                <Col lg="12">
                    <Card>
                        <CardBody>
                            <div
                                className="search-bar"
                                style={{ textAlign: "left", marginBottom: "1rem" }}
                            >
                                <div
                                    className="search-wrapper"
                                    style={{
                                        position: "relative",
                                        width: "220px",
                                        display: "inline-block",
                                    }}
                                >
                                    <svg
                                        className="search-icon"
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        fill="currentColor"
                                        viewBox="0 0 16 16"
                                        style={{
                                            position: "absolute",
                                            left: "8px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            zIndex: 2,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z" />
                                    </svg>

                                    <input
                                        type="text"
                                        placeholder="Search by text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="list-product-search-input"
                                        style={{
                                            paddingLeft: "30px",
                                            paddingRight: "30px",
                                            paddingTop: "6px",
                                            paddingBottom: "6px",
                                            width: "100%",
                                            fontSize: "14px",
                                            borderRadius: "6px",
                                            border: "1px solid #ccc",
                                            height: "32px",
                                            boxSizing: "border-box",
                                            backgroundColor: "white",
                                        }}
                                    />

                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            style={{
                                                position: "absolute",
                                                right: "8px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                backgroundColor: "#eee",
                                                border: "none",
                                                borderRadius: "50%",
                                                width: "20px",
                                                height: "20px",
                                                fontSize: "14px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer",
                                                color: "#555",
                                                transition: "background-color 0.3s ease",
                                                zIndex: 3,
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.backgroundColor = "#ccc")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.backgroundColor = "#eee")
                                            }
                                            aria-label="Clear search"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                            {loading ? (
                                <p>Loading...</p>
                            ) : (
                                <DataTable
                                    columns={columns}
                                    // 🚀 Usar los registros filtrados
                                    data={filteredRecords}
                                    pagination
                                    highlightOnHover
                                    pointerOnHover
                                    responsive
                                    noDataComponent="No records to display"
                                />
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Fragment>
    );
};

export default UserTrack;