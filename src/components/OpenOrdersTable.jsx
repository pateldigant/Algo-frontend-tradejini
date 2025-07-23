// src/components/OpenOrdersTable.jsx
import React from "react";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";

function OpenOrdersTable({ orders }) {
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return <Badge bg="primary">OPEN</Badge>;
      case "trigger_pending":
        return <Badge bg="warning" text="dark">TRIGGER PENDING</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="table-responsive">
      <Table bordered hover responsive className="align-middle text-center">
        <thead className="table-light">
          <tr>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Side</th>
            <th>Type</th>
            <th>Price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map((order, idx) => (
              <tr key={idx}>
                <td className="fw-semibold">{order.symId}</td>
                <td>{order.qty}</td>
                <td>
                  <span className={order.side?.toLowerCase() === 'buy' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                    {order.side?.toUpperCase()}
                  </span>
                </td>
                <td>{order.type?.toUpperCase()}</td>
                <td>{order.limitPrice > 0 ? order.limitPrice.toFixed(2) : "-"}</td>
                <td>{getStatusBadge(order.status)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-muted p-4">
                No open orders.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default OpenOrdersTable;