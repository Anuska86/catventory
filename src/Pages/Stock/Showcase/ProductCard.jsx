import React, { useState, useMemo } from "react";
import "./style/ProductCard.css";
import { Card, ListGroup, ListGroupItem, Button, Row, Col } from "reactstrap";
import { useNavigate } from "react-router-dom";
import SendEmailButton from "../../Components/Button/SendEmail";

function truncateDescription(text, maxLength = 120) {
  if (!text) return "";
  if (text.length <= maxLength) return text;

  // Avoid cutting words in half
  const truncated = text.substr(0, maxLength).trim();
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.substr(0, lastSpace) + " ...";
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const [showDetails, setShowDetails] = useState(false);

  const totalInventory = () => {
    if (!product || !product.supplierList) {
      return 0;
    }

    let total = 0;

    product.supplierList.forEach((supplier) => {
      const warehouses = supplier.warehouses;

      Object.values(warehouses).forEach((warehouseDetails) => {
        total += warehouseDetails.quantity;
      });
    });

    return total;
  };

  let totalQuantityByProduct = totalInventory();

  return (
    <Card className="card-shadow-primary card-border mb-3 profile-responsive">
      <div className="dropdown-menu-header">
        <div className="dropdown-menu-header-inner bg-alternate">
          <div
            className="menu-header-image opacity-4"
            style={{
              backgroundImage: `url(${product.bgImage || "/default-bg.jpg"})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="menu-header-content btn-pane-right">
            <div className="avatar-icon-wrapper me-3 avatar-icon-xl btn-hover-shine">
              <div className="avatar-icon rounded">
                <img
                  src={product.photoUrl}
                  alt={product.model}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/default-image.jpg";
                  }}
                />
              </div>
            </div>
            <div>
              <h5 className="menu-header-title">
                {product.brand} - {product.model}
              </h5>
            </div>
            <div className="menu-header-btn-pane">
              <SendEmailButton product={product} />
            </div>
          </div>
        </div>
      </div>
      <div className="card-body-flex">
        <ListGroup flush>
          <ListGroupItem className="p-0">
            <div className="widget-content">
              <div className="text-center px-3 py-2">
                <p
                  className="widget-heading mb-0 opacity-6 description-text"
                  title={product.description}
                >
                  {showDetails
                    ? product.description
                    : truncateDescription(product.description, 120)}
                </p>

                <p className="mb-0">
                  <strong>In Stock:</strong> {totalQuantityByProduct}
                </p>
              </div>
            </div>
          </ListGroupItem>
          <div className="details-modify">
            <ListGroupItem className="p-0">
              <div className="grid-menu grid-menu-2col">
                <Row className="g-0">
                  <Col sm="6">
                    <div className="p-1">
                      <Button
                        outline
                        color="focus"
                        className="btn-icon-vertical btn-transition-text btn-transition btn-transition-alt pt-2 pb-2"
                        onClick={() => setShowDetails(!showDetails)}
                      >
                        <i className="lnr-magnifier text-primary opacity-7 btn-icon-wrapper mb-2" />
                        {showDetails ? "Hide Details" : "Details"}
                      </Button>
                    </div>
                  </Col>
                  <Col sm="6">
                    <div className="p-1">
                      <Button
                        outline
                        color="focus"
                        className="btn-icon-vertical btn-transition-text btn-transition btn-transition-alt pt-2 pb-2"
                        onClick={() => navigate(`/stock/edit/${product.id}`)}
                      >
                        <i className="lnr-pencil text-info opacity-7 btn-icon-wrapper mb-2" />
                        Modify
                      </Button>
                    </div>
                  </Col>
                </Row>
              </div>
            </ListGroupItem>
          </div>
          {showDetails && (
            <ListGroupItem className="px-3 py-2 card-details">
              <div className="text-center">
                <p>
                  <strong>SKU:</strong> {product.sku}
                </p>
                <p>
                  <strong>EAN:</strong> {product.ean}
                </p>
                <p>
                  <strong>Variant:</strong> {product.productVariant}
                </p>
                <p>
                  <strong>Dimensions:</strong> {product.width}W ×{" "}
                  {product.height}H × {product.depth}D
                </p>
                <p>
                  <strong>Weight:</strong> {product.weight}g
                </p>
                <p>
                  <strong>Profit Margin:</strong> {product.profitMargin}%
                </p>
                <p>
                  <strong>Min Threshold:</strong> {product.minThreshold}
                </p>
              </div>
            </ListGroupItem>
          )}
        </ListGroup>
      </div>
    </Card>
  );
}
