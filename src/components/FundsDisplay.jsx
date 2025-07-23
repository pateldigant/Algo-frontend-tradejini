// src/components/FundsDisplay.jsx
import React from "react";
import Card from "react-bootstrap/Card";

function FundsDisplay({ funds }) {
  // Helper to format numbers with commas
  const formatNumber = (num) => {
    if (num === null || num === undefined) {
      return "Loading...";
    }
    return new Intl.NumberFormat('en-IN', { 
      maximumFractionDigits: 2, 
      minimumFractionDigits: 2 
    }).format(num);
  };

  // **FIX**: Use the correct keys from the API response
  const availableMargin = funds?.d?.availMargin ?? 0;
  const usedMargin = funds?.d?.marginUsed ?? 0;
  const totalMargin = availableMargin + usedMargin;

  return (
    <Card className="shadow-sm mb-4">
      <Card.Body>
        <Card.Title className="text-center fw-bold mb-3 text-primary">
          Margin Overview
        </Card.Title>
        <div className="row text-center">
          <div className="col-md-4">
            <h6 className="text-muted">Available Margin</h6>
            <p className="fs-5 fw-semibold text-success">
              ₹{formatNumber(availableMargin)}
            </p>
          </div>
          <div className="col-md-4">
            <h6 className="text-muted">Used Margin</h6>
            <p className="fs-5 fw-semibold text-danger">
              ₹{formatNumber(usedMargin)}
            </p>
          </div>
          <div className="col-md-4">
            <h6 className="text-muted">Total Margin</h6>
            <p className="fs-5 fw-semibold">
              ₹{formatNumber(totalMargin)}
            </p>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

export default FundsDisplay;