// src/components/OptionChainTable.jsx
import React, { useMemo } from "react";
import Table from "react-bootstrap/Table";

function OptionChainTable({ optionChain, spotPrice, atmStrike, prevOptionChain, strikeRange }) {

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
            <th>Call LTP</th>
            <th className="table-primary">Strike</th>
            <th>Put LTP</th>
            <th>Put OI</th>
          </tr>
        </thead>
        <tbody>
          {filteredChain.map((row) => (
            <tr key={row.strike} className={row.strike === atmStrike ? "table-info" : ""}>
              <td>{row.CE?.OI ?? "-"}</td>
              <td className={getLtpClass(row.CE?.ltp, row.strike, "CE")}>{row.CE?.ltp ?? "-"}</td>
              <td className="fw-bold">{row.strike}</td>
              <td className={getLtpClass(row.PE?.ltp, row.strike, "PE")}>{row.PE?.ltp ?? "-"}</td>
              <td>{row.PE?.OI ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default OptionChainTable;