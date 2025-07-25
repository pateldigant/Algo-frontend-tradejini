// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import OptionChainTable from "../components/OptionChainTable";
import FundsDisplay from "../components/FundsDisplay";
import OpenOrdersTable from "../components/OpenOrdersTable";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { Alert } from "react-bootstrap";

function Dashboard() {
  const [data, setData] = useState(null);
  const [prevData, setPrevData] = useState(null);
  const [intervalSec, setIntervalSec] = useState(3);
  const [positions, setPositions] = useState([]);
  const [funds, setFunds] = useState(null);
  const [openOrders, setOpenOrders] = useState([]);
  const [strikeRange, setStrikeRange] = useState(10);

  // State for single square-off modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);

  // State and logic for multi-select square-off
  const [selectedPositions, setSelectedPositions] = useState(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // State for the "Square Off All" confirmation modal
  const [showLiquidateConfirm, setShowLiquidateConfirm] = useState(false);

  const handleSelectionChange = (symId) => {
    setSelectedPositions(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(symId)) {
        newSelection.delete(symId);
      } else {
        newSelection.add(symId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allOpenPositionIds = positions
        .filter(p => p.netQty !== 0)
        .map(p => p.symId);
      setSelectedPositions(new Set(allOpenPositionIds));
    } else {
      setSelectedPositions(new Set());
    }
  };

  const fetchSnapshot = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/latest");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setData(currentData => {
        setPrevData(currentData);
        return result.nifty;
      });
    } catch (error) {
      console.error("Error fetching snapshot:", error);
      setData(null);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/enriched-positions");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      if (json.s === "ok" && Array.isArray(json.d)) {
        setPositions(json.d);
      }
    } catch (e) {
      console.error("Error fetching positions:", e);
    }
  };
  
  const fetchFunds = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/funds");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      if (json.s === "ok") {
        setFunds(json);
      }
    } catch (e) {
      console.error("Error fetching funds:", e);
    }
  };

  const fetchOpenOrders = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/orderbook");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      if (json.s === "ok" && Array.isArray(json.d)) {
        const pendingStatuses = ["open", "trigger_pending"];
        const filteredOrders = json.d.filter(order => pendingStatuses.includes(order.status?.toLowerCase()));
        setOpenOrders(filteredOrders);
      }
    } catch (e) {
      console.error("Error fetching open orders:", e);
    }
  };

  const handleSquareOff = async () => {
    if (!selectedPosition) return;
    try {
      const response = await fetch("http://localhost:8000/api/squareoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symId: selectedPosition.symId }),
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.msg);
      } else {
        alert(`Error: ${result.detail || "Unknown error"}`);
      }
    } catch (err) {
      alert("Failed to send square-off request.");
    } finally {
      setShowConfirm(false);
      setSelectedPosition(null);
      setTimeout(() => {
        fetchPositions();
        fetchOpenOrders();
      }, 1000);
    }
  };

  const handleBulkSquareOff = async () => {
    if (selectedPositions.size === 0) return;
    try {
      const response = await fetch("http://localhost:8000/api/squareoff-multiple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symIds: Array.from(selectedPositions) }),
      });
      const result = await response.json();
      
      if (response.ok) {
        alert(result.details.join('\\n'));
      } else {
        alert(`Error: ${result.detail || "Unknown error"}`);
      }

    } catch (err) {
      alert("Failed to send bulk square-off request.");
    } finally {
      setShowBulkConfirm(false);
      setSelectedPositions(new Set());
      setTimeout(() => {
        fetchPositions();
        fetchOpenOrders();
      }, 1000);
    }
  };

  const handleLiquidatePortfolio = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/liquidate-portfolio", {
        method: "POST",
      });
      const result = await response.json();
      
      if (response.ok) {
        alert(`Liquidation Result:\\n${result.details}`);
      } else {
        alert(`Error: ${result.detail || "Unknown error"}`);
      }

    } catch (err) {
      alert("Failed to send liquidate portfolio request.");
    } finally {
      setShowLiquidateConfirm(false);
      setTimeout(() => {
        fetchPositions();
        fetchOpenOrders();
      }, 1000);
    }
  };


  useEffect(() => {
    const initialFetch = () => {
      fetchSnapshot();
      fetchPositions();
      fetchFunds();
      fetchOpenOrders();
    };
    initialFetch();
    
    const id1 = setInterval(fetchSnapshot, intervalSec * 1000);
    const id2 = setInterval(fetchPositions, intervalSec * 1000);
    const id3 = setInterval(fetchFunds, intervalSec * 1000 * 2);
    const id4 = setInterval(fetchOpenOrders, intervalSec * 1000);

    return () => {
      clearInterval(id1);
      clearInterval(id2);
      clearInterval(id3);
      clearInterval(id4);
    };
  }, [intervalSec]);

  const getDisplayAvgPrice = (p) => {
    const netQty = p?.netQty ?? 0;
    const isIntraday = (p?.buyQty ?? 0) > 0 || (p?.sellQty ?? 0) > 0;
    
    if (netQty > 0) {
      return isIntraday ? p.buyAvgPrice : p.netAvgPrice;
    }
    if (netQty < 0) {
      return isIntraday ? p.sellAvgPrice : p.netAvgPrice;
    }
    return p.buyAvgPrice;
  };

  const realized = positions.reduce((sum, p) => sum + (p?.realizedPnl ?? 0), 0);
  const unrealized = positions.reduce((sum, p) => sum + (p?.unrealizedPnlLive ?? 0), 0);
  const total = realized + unrealized;
  const openPositions = positions.filter(p => p.netQty !== 0);

  return (
    <>
      <FundsDisplay funds={funds} />
      <Tabs defaultActiveKey="positions" id="main-tabs" className="mb-4">
        <Tab eventKey="options" title="Live Option Chain">
          <div className="row">
            <div className="col-md-6 mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="mb-3 fw-semibold">Polling Interval</Card.Title>
                  <Form.Range min={1} max={10} value={intervalSec} onChange={(e) => setIntervalSec(Number(e.target.value))} />
                  <div className="text-end text-muted small">Interval: {intervalSec}s</div>
                </Card.Body>
              </Card>
            </div>
            <div className="col-md-6 mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="mb-3 fw-semibold">Strike Range (ATM ±)</Card.Title>
                  <Form.Range min={5} max={50} step={5} value={strikeRange} onChange={(e) => setStrikeRange(Number(e.target.value))} />
                  <div className="text-end text-muted small">Range: {strikeRange} strikes</div>
                </Card.Body>
              </Card>
            </div>
          </div>
          <Card className="shadow-sm">
            <Card.Body>
              {data && data.option_chain ? (
                <OptionChainTable 
                  optionChain={data.option_chain} 
                  spotPrice={data.spot_price}
                  atmStrike={data.atm_strike}
                  prevOptionChain={prevData?.option_chain}
                  strikeRange={strikeRange}
                />
              ) : (
                <div className="text-center text-muted p-5">Loading option chain data...</div>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="positions" title="Live Positions">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="fw-semibold text-center mb-3">Current Positions</Card.Title>
              <div className="d-flex justify-content-end mb-3">
                <Button 
                  variant="danger" 
                  disabled={selectedPositions.size === 0}
                  onClick={() => setShowBulkConfirm(true)}
                >
                  Square Off Selected ({selectedPositions.size})
                </Button>
                <Button 
                  variant="outline-danger"
                  disabled={openPositions.length === 0 && openOrders.length === 0}
                  onClick={() => setShowLiquidateConfirm(true)}
                >
                  Square Off All
                </Button>
              </div>
              <div className="row text-center mb-3">
                <div className="col"><strong>Realized PnL:</strong> <span className={realized >= 0 ? "text-success" : "text-danger"}>{realized.toFixed(2)}</span></div>
                <div className="col"><strong>Unrealized PnL:</strong> <span className={unrealized >= 0 ? "text-success" : "text-danger"}>{unrealized.toFixed(2)}</span></div>
                <div className="col"><strong>Total PnL:</strong> <span className={total >= 0 ? "text-success" : "text-danger"}>{total.toFixed(2)}</span></div>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered text-center align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>
                        <Form.Check 
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={openPositions.length > 0 && selectedPositions.size === openPositions.length}
                        />
                      </th>
                      <th>Symbol</th>
                      <th>Qty</th>
                      <th>LTP</th>
                      <th>Avg Price</th>
                      <th>Unrealized PnL</th>
                      <th>Realized PnL</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.length > 0 ? positions.map((p, idx) => (
                      <tr key={idx} className={p.isClosedToday ? "text-muted" : ""}>
                        <td>
                          <Form.Check 
                            type="checkbox"
                            disabled={p.netQty === 0}
                            checked={selectedPositions.has(p.symId)}
                            onChange={() => handleSelectionChange(p.symId)}
                          />
                        </td>
                        <td className="fw-semibold">{p.symId}</td>
                        <td>{p.netQty}</td>
                        <td>{p.ltp ?? "-"}</td>
                        <td>{getDisplayAvgPrice(p)?.toFixed(2) ?? "-"}</td>
                        <td className={p.unrealizedPnlLive >= 0 ? "text-success" : "text-danger"}>
                          {p.ltp != null ? p.unrealizedPnlLive?.toFixed(2) : "-"}
                        </td>
                        <td className={p.realizedPnl >= 0 ? "text-success" : "text-danger"}>{p.realizedPnl?.toFixed(2) ?? "-"}</td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            disabled={p.netQty === 0}
                            onClick={() => {
                              setSelectedPosition(p);
                              setShowConfirm(true);
                            }}
                          >
                            Square Off
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="8" className="text-muted">No open positions.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="open-orders" title={`Open Orders (${openOrders.length})`}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="fw-semibold text-center mb-3">Pending Orders</Card.Title>
              <OpenOrdersTable orders={openOrders} />
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Square Off</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to square off <strong>{selectedPosition?.symId}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleSquareOff}>Yes, Square Off</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showBulkConfirm} onHide={() => setShowBulkConfirm(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Confirm Bulk Square Off</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to square off the following <strong>{selectedPositions.size}</strong> position(s)?</p>
          <ul>
            {Array.from(selectedPositions).map(symId => <li key={symId}>{symId}</li>)}
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleBulkSquareOff}>Yes, Square Off All</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showLiquidateConfirm} onHide={() => setShowLiquidateConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Confirm Portfolio Liquidation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <Alert.Heading>Warning!</Alert.Heading>
            <p>
              This will attempt to cancel **all open orders** and then **square off all open positions** (shorts first, then longs) at market price.
            </p>
            <hr />
            <p className="mb-0">
              This action is irreversible. Are you sure you want to proceed?
            </p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLiquidateConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleLiquidatePortfolio}>Yes, Square Off All</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Dashboard;