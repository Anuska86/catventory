import React, { useState, useEffect, Fragment } from "react";
import "./style/Currencies.css";

import {
  CSSTransition,
  TransitionGroup,
} from "../../../utils/TransitionWrapper";

import {
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  Button,
  Modal,
  ModalBody,
} from "reactstrap";

import PageTitle from "../../../Layout/AppMain/PageTitle";
import DataTable from "react-data-table-component";

import { db } from "../../../utils/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Replace with your actual API key
const API_KEY = process.env.REACT_APP_CURRENCY_API_KEY;
const API_URL = `https://api.freecurrencyapi.com/v1/latest?apikey=${API_KEY}&base_currency=EUR&currencies=USD,GBP,CAD,CNY`;

// Column definition for the DataTable
const columns = [
  {
    name: "Currency",
    selector: (row) => row.currency,
    sortable: true,
    reorder: true,
  },
  {
    name: "Rate",
    selector: (row) => row.rate,
    sortable: true,
    reorder: true,
    format: (row) => row.rate.toFixed(4),
  },
];

const saveCurrenciesToFirebase = async (rates) => {
  const ref = doc(db, "currencies", "latest");
  await setDoc(ref, {
    timestamp: new Date().toISOString(),
    rates,
  });
};

const Currencies = () => {
  const [exchangeRates, setExchangeRates] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchAndStoreRates = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data && data.data) {
        const rates = data.data;
        const timestamp = new Date().toISOString();
        setExchangeRates(rates);
        setLastUpdated(timestamp);
        await saveCurrenciesToFirebase(rates);
        setStatusMessage({
          type: "success",
          text: "✅ Exchange rates successfully updated!",
        });
      } else {
        console.warn("Unexpected API response:", data);
        setExchangeRates({});
        setStatusMessage({
          type: "warning",
          text: "⚠️ Failed to load exchange rates.",
        });
      }
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      setExchangeRates({});
      setStatusMessage({
        type: "error",
        text: "❌ Error updating exchange rates.",
      });
    }
  };

  const fetchExchangeRates = async () => {
    setLoading(true);
    await fetchAndStoreRates();
    setLoading(false);
  };

  useEffect(() => {
    const checkAndFetchRates = async () => {
      const ref = doc(db, "currencies", "latest");
      try {
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const lastTimestamp = new Date(data.timestamp);
          const now = new Date();
          const hoursDiff = (now - lastTimestamp) / (1000 * 60 * 60);

          // Check if rates are older than 12 hours
          if (hoursDiff >= 12) {
            console.log("More than 12 hours passed. Fetching new rates...");
            await fetchAndStoreRates();
          } else {
            console.log("Using cached rates from Firebase.");
            setExchangeRates(data.rates);
            setLastUpdated(data.timestamp);
          }
        } else {
          console.log("No data found in Firebase. Fetching new rates...");
          await fetchAndStoreRates();
        }
      } catch (error) {
        console.error("Error checking timestamp:", error);
        await fetchAndStoreRates();
      }
    };

    checkAndFetchRates();
  }, []);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const nextUpdate = lastUpdated
    ? new Date(new Date(lastUpdated).getTime() + 12 * 60 * 60 * 1000)
    : null;

  // Transform the rates object into an array for DataTable
  const data = Object.entries(exchangeRates).map(([currency, rate]) => ({
    currency,
    rate,
  }));

  return (
    <Fragment>
      <PageTitle
        heading="Currencies Exchange Rates"
        subheading="Manage your currencies."
        icon="pe-7s-drawer icon-gradient bg-happy-itmeo"
      />

      <TransitionGroup>
        <CSSTransition
          component="div"
          classNames="TabsAnimation"
          appear={true}
          timeout={1500}
          enter={false}
          exit={false}
        >
          <div className="center-content">
            <Row style={{ maxWidth: "100%" }}>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <div className="d-flex justify-content-center mb-3">
                      <CardTitle tag="h5">Exchange Rates (EUR)</CardTitle>
                    </div>

                    {statusMessage && (
                      <div
                        className={`status-message ${statusMessage.type} mb-4`}
                      >
                        {statusMessage.text}
                      </div>
                    )}

                    {data.length === 0 ? (
                      <p>No exchange data available.</p>
                    ) : (
                      <div>
                        <DataTable
                          columns={columns}
                          data={data}
                          pagination={false}
                          highlightOnHover
                          pointerOnHover
                          responsive
                        />
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <div>
                            {lastUpdated && (
                              <p className="text-muted mb-0">
                                Last updated:{" "}
                                {new Date(lastUpdated).toLocaleString()}
                              </p>
                            )}
                            {nextUpdate && (
                              <p className="text-muted mb-0">
                                Next update available after:{" "}
                                {nextUpdate.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <Button
                            color="info"
                            onClick={fetchExchangeRates}
                            disabled={loading}
                          >
                            🔄 {loading ? "Refreshing..." : "Refresh Rates"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        </CSSTransition>
      </TransitionGroup>
    </Fragment>
  );
};

export default Currencies;