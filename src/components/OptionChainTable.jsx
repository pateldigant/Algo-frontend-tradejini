import React, { memo, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formatLots = (position) => {
  const qty = Math.abs(Number(position?.netQty));
  const lotSize = Number(position?.lot);
  if (!Number.isFinite(qty) || !Number.isFinite(lotSize) || lotSize <= 0) return null;
  const lots = qty / lotSize;
  return Number.isInteger(lots) ? String(lots) : lots.toFixed(2).replace(/\.?0+$/, "");
};

const formatValue = (value, digits = 2) => Number.isFinite(Number(value))
  ? Number(value).toLocaleString("en-IN", { maximumFractionDigits: digits })
  : "-";

function OptionChainTable({
  optionChain,
  spotPrice,
  atmStrike,
  prevOptionChain,
  strikeRange,
  strikeInterval = 50,
  underlying = "NIFTY",
  onPlaceOrder,
  positions = [],
  openOrders = [],
}) {
  const scrollRef = useRef(null);
  const placingOrderKeysRef = useRef(new Set());
  const [placingOrderKeys, setPlacingOrderKeys] = useState(() => new Set());

  const prevLtpMap = useMemo(() => {
    const map = new Map();
    for (const row of prevOptionChain || []) {
      map.set(row.strike, { CE_ltp: row.CE?.ltp, PE_ltp: row.PE?.ltp });
    }
    return map;
  }, [prevOptionChain]);

  const positionMap = useMemo(() => {
    const map = new Map();
    for (const position of positions) {
      if (position?.symId && position?.netQty) map.set(position.symId, position);
    }
    return map;
  }, [positions]);

  const orderMap = useMemo(() => {
    const map = new Map();
    for (const order of openOrders) {
      if (!order?.symId) continue;
      map.set(order.symId, [...(map.get(order.symId) || []), order]);
    }
    return map;
  }, [openOrders]);

  const filteredChain = useMemo(() => {
    if (!optionChain || !atmStrike) return [];
    const lowerBound = atmStrike - strikeRange * strikeInterval;
    const upperBound = atmStrike + strikeRange * strikeInterval;
    return optionChain.filter((row) => row.strike >= lowerBound && row.strike <= upperBound);
  }, [optionChain, atmStrike, strikeRange, strikeInterval]);

  useEffect(() => {
    const viewport = scrollRef.current;
    const atmRow = viewport?.querySelector('[data-atm-row="true"]');
    if (!viewport || !atmRow) return;
    const headerHeight = viewport.querySelector("thead")?.offsetHeight || 0;
    const rowHeight = atmRow.clientHeight || 1;
    const visibleBodyHeight = Math.max(0, viewport.clientHeight - headerHeight);
    const rowsAboveAtm = Math.max(0, Math.floor((visibleBodyHeight / rowHeight - 1) / 2));
    const top = atmRow.offsetTop - headerHeight - rowsAboveAtm * rowHeight - 5;
    viewport.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  }, [atmStrike, filteredChain.length, underlying]);

  const markersFor = (optionData) => {
    const position = positionMap.get(optionData?.symId) || null;
    const orders = orderMap.get(optionData?.symId) || [];
    return { position, hasPosition: Boolean(position?.netQty), hasOrder: orders.length > 0 };
  };

  const getLtpDirection = (optionData, side) => {
    const previous = Number(prevLtpMap.get(optionData?.strike)?.[`${side}_ltp`]);
    const current = Number(optionData?.ltp);
    if (!Number.isFinite(previous) || !Number.isFinite(current) || current === previous) return "is-neutral";
    return current > previous ? "is-up" : "is-down";
  };

  const handleTradeClick = async (optionData, tradeSide) => {
    const orderKey = `${optionData.symId}:${tradeSide}`;
    if (placingOrderKeysRef.current.has(orderKey)) return;
    placingOrderKeysRef.current.add(orderKey);
    setPlacingOrderKeys((current) => new Set(current).add(orderKey));
    try {
      await onPlaceOrder({ ...optionData, side: tradeSide });
    } finally {
      placingOrderKeysRef.current.delete(orderKey);
      setPlacingOrderKeys((current) => {
        const next = new Set(current);
        next.delete(orderKey);
        return next;
      });
    }
  };

  const TradeCell = ({ optionData, side }) => {
    if (!optionData?.symId) return <TableCell className="trade-cell text-slate-400">-</TableCell>;
    const { position, hasPosition, hasOrder } = markersFor(optionData);
    const lots = formatLots(position);
    const isBuying = placingOrderKeys.has(`${optionData.symId}:BUY`);
    const isSelling = placingOrderKeys.has(`${optionData.symId}:SELL`);

    return (
      <TableCell className={`trade-cell ${hasPosition ? "has-position" : hasOrder ? "has-order" : ""}`}>
        <div className="trade-cell-layout">
          <Button
            size="sm"
            variant="outline"
            className="chain-buy-button"
            disabled={isBuying}
            onClick={() => handleTradeClick(optionData, "BUY")}
            title={`Buy ${optionData.symId}`}
          >{isBuying ? "..." : "BUY"}</Button>
          <div className="trade-ltp-stack">
            <strong className={`terminal-metric ltp-price ${getLtpDirection(optionData, side)}`}>{formatValue(optionData.ltp)}</strong>
            <div className="trade-cell-markers">
              {hasPosition && (
                <Badge variant="outline" className="position-marker">
                  {position.netQty > 0 ? "Long" : "Short"} {lots ? `${lots}L` : ""}
                </Badge>
              )}
              {hasOrder && <Badge variant="outline" className="order-marker">Pending</Badge>}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="chain-sell-button"
            disabled={isSelling}
            onClick={() => handleTradeClick(optionData, "SELL")}
            title={`Sell ${optionData.symId}`}
          >{isSelling ? "..." : "SELL"}</Button>
        </div>
      </TableCell>
    );
  };

  return (
    <section className="option-chain-panel">
      <div className="option-chain-toolbar">
        <div>
          <span>Option chain</span>
          <strong>{underlying}</strong>
        </div>
        <div className="option-chain-quote">
          <span>Spot</span><strong className="terminal-metric">{formatValue(spotPrice)}</strong>
        </div>
        <div className="option-chain-quote is-atm">
          <span>ATM</span><strong className="terminal-metric">{formatValue(atmStrike, 0)}</strong>
        </div>
        <div className="option-chain-legend">
          <span><i className="position-dot" />Position</span>
          <span><i className="order-dot" />Pending</span>
        </div>
      </div>

      <div className="option-chain-groups" aria-hidden="true">
        <span>Calls (CE)</span><span>Strike</span><span>Puts (PE)</span>
      </div>

      <div ref={scrollRef} className="option-chain-scroll">
        <Table className="option-chain-table">
          <TableHeader>
            <TableRow>
              <TableHead>OI</TableHead><TableHead>IV</TableHead><TableHead>LTP / Trade</TableHead>
              <TableHead className="strike-head">Strike</TableHead>
              <TableHead>LTP / Trade</TableHead><TableHead>IV</TableHead><TableHead>OI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChain.map((row) => {
              const ceMarkers = markersFor(row.CE);
              const peMarkers = markersFor(row.PE);
              const hasPosition = ceMarkers.hasPosition || peMarkers.hasPosition;
              const hasOrder = ceMarkers.hasOrder || peMarkers.hasOrder;
              const isAtm = row.strike === atmStrike;
              return (
                <TableRow
                  key={row.strike}
                  data-atm-row={isAtm ? "true" : undefined}
                  className={`${isAtm ? "atm-row" : ""} ${hasPosition ? "position-row" : hasOrder ? "order-row" : ""}`}
                >
                  <TableCell className="terminal-metric data-cell">{formatValue(row.CE?.OI, 0)}</TableCell>
                  <TableCell className="terminal-metric data-cell">{formatValue(row.CE?.iv)}</TableCell>
                  <TradeCell optionData={{ ...row.CE, strike: row.strike }} side="CE" />
                  <TableCell className="strike-cell">
                    <strong className="terminal-metric">{formatValue(row.strike, 0)}</strong>
                    {isAtm && <span>ATM</span>}
                  </TableCell>
                  <TradeCell optionData={{ ...row.PE, strike: row.strike }} side="PE" />
                  <TableCell className="terminal-metric data-cell">{formatValue(row.PE?.iv)}</TableCell>
                  <TableCell className="terminal-metric data-cell">{formatValue(row.PE?.OI, 0)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default memo(OptionChainTable);
