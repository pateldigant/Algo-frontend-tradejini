// src/components/OptionChainTable.jsx
import React, { useMemo } from "react";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";

function OptionChainTable({ optionChain, spotPrice, atmStrike, prevOptionChain, strikeRange, onPlaceOrder }) {

  const prevLtpMap = useMemo(() => {
    if (!prevOptionChain) return new Map();
    const map = new Map();
    for (const row of prevOptionChain) {
      map.set(row.strike, { CE_ltp: row.CE?.ltp, PE_ltp: row.PE?.ltp });
    }
    return map;
  }, [prevOptionChain]);

  const getLtpClass = (currentLtp, strike, type) => {
    if (currentLtp === null || currentLtp === undefined) return "";
    const prevLtp = type === "CE" ? prevLtpMap.get(strike)?.CE_ltp : prevLtpMap.get(strike)?.PE_ltp;
    if (prevLtp === null || prevLtp === undefined) return "";
    if (currentLtp > prevLtp) return "text-success";
    if (currentLtp < prevLtp) return "text-danger";
    return "";
  };

  // **NEW**: Filter the option chain based on the selected range
  const filteredChain = useMemo(() => {
    if (!optionChain || !atmStrike) return [];
    const strikeInterval = 50; // Assuming Nifty's 50-point interval
    const lowerBound = atmStrike - (strikeRange * strikeInterval);
    const upperBound = atmStrike + (strikeRange * strikeInterval);
    return optionChain.filter(row => row.strike >= lowerBound && row.strike <= upperBound);
  }, [optionChain, atmStrike, strikeRange]);

  // **NEW**: Component for the Buy/Sell buttons in each cell
  const TradeCell = ({ optionData, side }) => {
    const ltp = optionData?.ltp;
    if (!optionData || !optionData.symId) {
      return <td>-</td>;
    }

    return (
      <td className={getLtpClass(ltp, optionData.strike, side)}>
        <div className="d-flex justify-content-between align-items-center">
          <span>{ltp ?? "-"}</span>
          <div>
            <Button size="sm" variant="outline-primary" className="me-1" onClick={() => onPlaceOrder({ ...optionData, side: 'BUY' })}>B</Button>
            <Button size="sm" variant="outline-danger" onClick={() => onPlaceOrder({ ...optionData, side: 'SELL' })}>S</Button>
          </div>
        </div>
      </td>
    );
  };

  return (
    <div className="table-responsive">
      <div className="d-flex justify-content-around mb-2 fw-semibold fs-5">
        <span className="text-danger">ATM Strike: {atmStrike}</span>
        <span className="text-primary">Spot Price: {spotPrice}</span>
      </div>
      <Table bordered hover responsive className="align-middle text-center">
        <thead className="table-dark">
          <tr>
            <th>Call OI</th>
            <th>Call LTP / Trade</th>
            <th className="table-primary">Strike</th>
            <th>Put LTP / Trade</th>
            <th>Put OI</th>
          </tr>
        </thead>
        <tbody>
          {filteredChain.map((row) => (
            <tr key={row.strike} className={row.strike === atmStrike ? "table-info" : ""}>
              <td>{row.CE?.OI ?? "-"}</td>
              <TradeCell optionData={{ ...row.CE, strike: row.strike }} side="CE" />
              <td className="fw-bold">{row.strike}</td>
              <TradeCell optionData={{ ...row.PE, strike: row.strike }} side="PE" />
              <td>{row.PE?.OI ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default OptionChainTable;