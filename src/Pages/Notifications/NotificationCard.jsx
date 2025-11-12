import React from "react";
import "./NotificationCard.css";
import {
  Card,
  CardBody,
  CardTitle,
  CardText,
  Button,
  Collapse,
  Badge,
} from "reactstrap";

const NotificationCard = ({ data }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const toggleDetails = () => setShowDetails(!showDetails);
  const importanceClass = (data.importance || "low").toLowerCase();

  return (
    <Card className="notification-card">
      <CardBody>
        <CardTitle tag="h5" className="text-start">
          {data.title ? data.title : `Notification: ${data.description} `}
        </CardTitle>
        <CardTitle tag="h5" className="text-start">
          Importance:{" "}
          <Badge className={`importance-badge ${importanceClass}`} pill>
            {data.importance.toUpperCase()}
          </Badge>
          | Date: {new Date(data.date.seconds * 1000).toLocaleString()}
        </CardTitle>
        <div className="d-flex justify-content-center">
          <Button
            className="button-details"
            color="info"
            onClick={toggleDetails}
          >
            {showDetails ? "Hide Details" : "View Details"}
          </Button>
        </div>

        <Collapse isOpen={showDetails}>
          <CardText className="mt-1">
            <strong>Information:</strong>{" "}
            {data.information || "No additional info"}
          </CardText>
        </Collapse>
      </CardBody>
    </Card>
  );
};

export default NotificationCard;
