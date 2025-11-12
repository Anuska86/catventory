import React, { Fragment } from "react";
import "./style/AddOrder.css";

import OrderForm from "./Form/FormOrders";
import PricingForm from "./Form/FormPricing";

import { LogAudit } from "../Utils/UsersTrack/AuditLogger";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";

export default class AddOrder extends React.Component {
  constructor() {
    super();
    this.state = {
      selectedFile: null,
      uploading: false,
      uploadSuccess: false,
      uploadError: null,
      activeTab: "csv",
    };
  }

  handleTabSwitch = (tab) => {
    this.setState({ activeTab: tab });
  };

  handleFileChange = (event) => {
    this.setState({
      selectedFile: event.target.files[0],
      uploadSuccess: false,
      uploadError: null,
    });
  };

  handleUpload = (event) => {
    event.preventDefault();
    const { selectedFile } = this.state;

    if (!selectedFile) {
      alert("Por favor, selecciona un archivo CSV.");
      return;
    }

    this.setState({ uploading: true });

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rawOrders = results.data.filter((order) =>
            Object.values(order).some((value) => value !== null && value !== "")
          );

          if (rawOrders.length === 0) {
            throw new Error("The CSV file doesn't contain valid data.");
          }

          const groupedOrders = rawOrders.reduce((acc, currentItem) => {
            const poNumber = currentItem.poNumber;
            const clientName = currentItem.clientName;
            const clientId = currentItem.clientId; // Added to get clientId from CSV
            const currency = currentItem.currency || "€"; // Added to get currency from CSV
            const key = `${poNumber}_${clientName}`;

            if (!acc[key]) {
              acc[key] = {
                poNumber: poNumber,
                clientName: clientName,
                clientId: clientId, // Add to the grouped object
                currency: currency, // Add to the grouped object
                eanList: {},
              };
            }

            acc[key].eanList[currentItem.ean] = {
              sku: currentItem.sku,
              quantity: parseInt(currentItem.quantity, 10),
              description: currentItem.description,
              isBlocked: false,
              unitPrice: parseFloat(currentItem.unitPrice) || 0,
              selectedWarehouse: "",
            };

            return acc;
          }, {});

          const ordersCollectionRef = collection(db, "orders");
          const batch = writeBatch(db);

          const poNumbers = Object.keys(groupedOrders);

          const uploadPromises = Object.values(groupedOrders).map(
            async (orderData) => {
              const scp = uuidv4().slice(0, 10);
              const newOrderRef = doc(ordersCollectionRef);

              const formattedOrderData = {
                clientId: orderData.clientId,
                poNumber: orderData.poNumber,
                clientName: orderData.clientName,
                creationDate: new Date(),
                status: "order",
                scp: scp,
                currency: orderData.currency,
                eanList: orderData.eanList,
              };

              const existingOrderQuery = query(
                ordersCollectionRef,
                where("poNumber", "==", formattedOrderData.poNumber)
              );
              const existingOrderSnapshot = await getDocs(existingOrderQuery);

              if (!existingOrderSnapshot.empty) {
                console.warn(
                  `Order with PO Number ${formattedOrderData.poNumber} already exists. Skipping.`
                );
                return;
              } else {
                batch.set(newOrderRef, formattedOrderData);
              }
            }
          );

          await Promise.all(uploadPromises);
          await batch.commit();

          LogAudit({
            user: "Ana",
            action: "Create Order",
            entity: `POs: ${poNumbers.join(", ")}`,
            details: `Uploaded ${poNumbers.length} orders via CSV`,
          });

          this.setState({
            uploading: false,
            uploadSuccess: true,
            selectedFile: null,
          });
        } catch (error) {
          this.setState({
            uploading: false,
            uploadError: `Error uploading the file: ${error.message}`,
          });
        }
      },
    });
  };

  render() {
    const { uploading, uploadSuccess, uploadError, activeTab, selectedFile } =
      this.state;

    return (
      <Fragment>
        <div className="centered-container">
          <div>
            <h1 className="new-order-page-title">Add New Order</h1>

            <div className="tab-switcher">
              <button
                className={activeTab === "csv" ? "active-tab" : ""}
                onClick={() => this.handleTabSwitch("csv")}
              >
                Upload CSV
              </button>
              <button
                className={activeTab === "manual" ? "active-tab" : ""}
                onClick={() => this.handleTabSwitch("manual")}
              >
                Add Order
              </button>
              {/*
              <button
                className={activeTab === "pricing" ? "active-tab" : ""}
                onClick={() => this.handleTabSwitch("pricing")}
              >
                Add Quote
              </button>
              */}
            </div>

            <div
              className={`form-wrapper ${
                activeTab === "manual" ? "manual-mode" : "csv-mode"
              }`}
            >
              {activeTab === "csv" ? (
                <form className="upload-form" onSubmit={this.handleUpload}>
                  <div className="form-header">
                    <h3 className="upload-title">Upload the order file</h3>
                    <span className="file-hint">Only csv files admitted</span>
                  </div>
                  <div className="form-center">
                    <div className="file-row">
                      <input
                        type="file"
                        id="csvFile"
                        accept=".csv"
                        onChange={this.handleFileChange}
                      />
                    </div>

                    {selectedFile && (
                      <p className="file-name">
                        Selected file: {selectedFile.name}
                      </p>
                    )}

                    {uploading && (
                      <p className="status uploading">Uploading file...</p>
                    )}
                    {uploadSuccess && (
                      <p className="status success">File uploaded</p>
                    )}
                    {uploadError && (
                      <p className="status error">{uploadError}</p>
                    )}

                    <button
                      type="submit"
                      className="submit-button"
                      disabled={uploading || !selectedFile}
                    >
                      Submit
                    </button>
                  </div>
                </form>
              ) : ( activeTab === "manual" ? 
                <OrderForm />:<PricingForm />
              )}
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}
