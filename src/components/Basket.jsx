// src/components/Basket.jsx
import React from 'react';
import { Card, Button, ListGroup } from 'react-bootstrap';
import './Basket.css';

function Basket({ basket, onExecute, onClear, onRemove }) {
  if (basket.length === 0) {
    return null; // Don't render anything if the basket is empty
  }

  return (
    <Card className="basket-container shadow">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <Card.Title className="mb-0">Order Basket ({basket.length})</Card.Title>
        <div>
          <Button variant="outline-danger" size="sm" onClick={onClear}>Clear All</Button>
          <Button variant="primary" size="sm" className="ms-2" onClick={onExecute}>Execute Basket</Button>
        </div>
      </Card.Header>
      <ListGroup variant="flush" className="basket-list">
        {basket.map((order, index) => (
          <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
            <div>
              <span className={`fw-bold ${order.side === 'BUY' ? 'text-success' : 'text-danger'}`}>
                {order.side}
              </span>
              <span className="mx-2">{order.lots} Lot(s)</span>
              <span>({order.quantity} Qty)</span>
              <span className="ms-2 text-muted">{order.symId}</span>
            </div>
            <Button variant="link" className="text-danger p-0" onClick={() => onRemove(index)}>
              Remove
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
}

export default Basket;