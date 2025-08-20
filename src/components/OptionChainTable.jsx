// src/components/OptionChainTable.jsx
import React, { useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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
    if (currentLtp > prevLtp) return "animate-flash-green";
    if (currentLtp < prevLtp) return "animate-flash-red";
    return "";
  };

  const filteredChain = useMemo(() => {
    if (!optionChain || !atmStrike) return [];
    const strikeInterval = 50;
    const lowerBound = atmStrike - (strikeRange * strikeInterval);
    const upperBound = atmStrike + (strikeRange * strikeInterval);
    return optionChain.filter(row => row.strike >= lowerBound && row.strike <= upperBound);
  }, [optionChain, atmStrike, strikeRange]);

  const TradeCell = ({ optionData, side }) => {
    const ltp = optionData?.ltp;
    if (!optionData || !optionData.symId) {
      return <TableCell className="text-center">-</TableCell>;
    }
    return (
      <TableCell className={`text-center ${getLtpClass(ltp, optionData.strike, side)}`}>
        <div className="flex justify-between items-center">
          <span className={`font-mono ${ltp > prevLtpMap.get(optionData.strike)?.[`${side}_ltp`] ? 'text-green-600' : 'text-red-600'}`}>{ltp ?? "-"}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-7" onClick={() => onPlaceOrder({ ...optionData, side: 'BUY' })}>B</Button>
            <Button size="sm" variant="outline" className="h-7" onClick={() => onPlaceOrder({ ...optionData, side: 'SELL' })}>S</Button>
          </div>
        </div>
      </TableCell>
    );
  };

  return (
    <>
      <div className="flex justify-around mb-2 font-semibold text-lg p-2 bg-slate-100 rounded-md">
        <span>ATM Strike: <span className="text-blue-600">{atmStrike}</span></span>
        <span>Spot Price: <span className="text-blue-600">{spotPrice}</span></span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Call OI</TableHead>
            <TableHead className="w-[180px] text-center">Call LTP / Trade</TableHead>
            <TableHead className="text-center bg-slate-100">Strike</TableHead>
            <TableHead className="w-[180px] text-center">Put LTP / Trade</TableHead>
            <TableHead className="text-center">Put OI</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredChain.map((row) => (
            <TableRow key={row.strike} className={row.strike === atmStrike ? "bg-blue-50" : ""}>
              <TableCell className="text-center">{row.CE?.OI ?? "-"}</TableCell>
              <TradeCell optionData={{ ...row.CE, strike: row.strike }} side="CE" />
              <TableCell className="font-bold text-center bg-slate-100">{row.strike}</TableCell>
              <TradeCell optionData={{ ...row.PE, strike: row.strike }} side="PE" />
              <TableCell className="text-center">{row.PE?.OI ?? "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

export default OptionChainTable;