/*
import React, { Fragment } from "react";
import "../../../Orders/style/FormOrder.css";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../../utils/firebase";
import Papa from "papaparse";

export default class DataForm extends React.Component {
  constructor() {
    super();
    this.state = {
      selectedFile: null,
      uploading: false,
      uploadSuccess: false,
      uploadError: null,
    };
  }

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
          const ordersToUpload = results.data.filter((order) =>
            Object.values(order).some((value) => value !== null && value !== "")
          );

          if (ordersToUpload.length === 0) {
            throw new Error("El archivo CSV no contiene datos válidos.");
          }

          const ordersCollectionRef = collection(db, "orders");

          const uploadPromises = ordersToUpload.map((orderData) => {
            const formattedOrderData = {
              clientId: orderData.clientId,
              sku: orderData.sku,
              quantity: parseInt(orderData.quantity),
              ean: orderData.ean,
              description: orderData.description,
            };
            return addDoc(ordersCollectionRef, formattedOrderData);
          });

          await Promise.all(uploadPromises);

          this.setState({
            uploading: false,
            uploadSuccess: true,
            selectedFile: null,
          });
        } catch (error) {
          this.setState({
            uploading: false,
            uploadError: `Error al subir el archivo: ${error.message}`,
          });
        }
      },
    });
  };

  render() {
    const { uploading, uploadSuccess, uploadError } = this.state;

    return (
      <Fragment>
        <div className="centered-container">
          <form className="upload-form" onSubmit={this.handleUpload}>
            <h3 className="form-title">Subir archivo de pedidos</h3>

            <div className="form-center">
              <div className="file-row">
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv"
                  onChange={this.handleFileChange}
                />
                <span className="file-hint">Only csv files admitted</span>
              </div>

              {this.state.selectedFile && (
                <p className="file-name">
                  Selected file: {this.state.selectedFile.name}
                </p>
              )}

              {uploading && (
                <p className="status uploading">Uploading file...</p>
              )}
              {uploadSuccess && (
                <p className="status success">File uploaded </p>
              )}
              {uploadError && <p className="status error">{uploadError}</p>}

              <button
                type="submit"
                className="submit-button"
                disabled={uploading || !this.state.selectedFile}
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </Fragment>
    );
  }
}

*/