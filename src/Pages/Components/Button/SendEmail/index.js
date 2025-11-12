import React from "react";
import { Button } from "reactstrap";

const SendEmailButton = ({ product }) => {
  const recipient = "example@email.com";
  const subject = `Purchase Inquiry: ${product.brand} ${product.model}`;
  const body =
    `Hello,\n\n` +
    `I am interested in purchasing the following product:\n\n` +
    `- Brand: ${product.brand}\n` +
    `- Model: ${product.model}\n` +
    `- Price: €${product.unitPrice}\n` +
    `- SKU: ${product.sku}\n` +
    `- EAN: ${product.ean}\n` +
    `- Variant: ${product.productVariant}\n` +
    `- Dimensions: ${product.width}W × ${product.height}H × ${product.depth}D\n` +
    `- Weight: ${product.weight}g\n` +
    `- Quantity Available: ${product.quantity}\n\n` +
    `Please send me more information about availability, shipping, and payment options.\n\n` +
    `Thank you.`;

  // Codifica el asunto y el cuerpo para evitar problemas con caracteres especiales
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  const mailtoLink = `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;

  return (
    <a
      href={mailtoLink}
      className="btn btn-warning btn-wide btn-hover-shine btn-pill"
    >
      Buy Now
    </a>
  );
};

export default SendEmailButton;
