import React, { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-IN", { month: "short" });

const formatDisplaySymbol = (symId) => {
  if (typeof symId !== "string") return "-";
  const parts = symId.split("_");
  const optionType = parts.at(-1);
  const strike = parts.at(-2);
  const expiry = parts.at(-3);
  const index = parts[1];
  if (!index || !expiry || !strike || !["CE", "PE"].includes(optionType)) return symId;
  const expiryDate = new Date(`${expiry}T00:00:00`);
  const displayExpiry = Number.isNaN(expiryDate.getTime())
    ? expiry
    : `${expiryDate.getDate()} ${MONTH_FORMATTER.format(expiryDate)}`;
  return `${index} ${displayExpiry} ${strike} ${optionType}`;
};

const formatNumber = (value) => Number.isFinite(Number(value)) ? Number(value).toFixed(2) : "-";

function PositionsTable({
  positions,
  allPositions,
  showOnlyActive,
  setShowOnlyActive,
  positionLots,
  setPositionLots,
  selectedPositions,
  setSelectedPositions,
  onPlaceOrder,
  onExit,
  onExitSelected,
  onExitAll,
  onPlaceStopLoss,
  onPlaceTakeProfit,
  takeProfitTriggers = {},
  openOrders = [],
  tradingMode = "real",
}) {
  const handleSelectionChange = (symId) => setSelectedPositions((current) => {
    const next = new Set(current);
    if (next.has(symId)) next.delete(symId); else next.add(symId);
    return next;
  });

  const handleSelectAll = (checked) => setSelectedPositions(checked
    ? new Set(positions.map((position) => position.symId))
    : new Set());

  const orderMap = useMemo(() => {
    const map = new Map();
    for (const order of openOrders) {
      if (!order?.symId) continue;
      map.set(order.symId, [...(map.get(order.symId) || []), order]);
    }
    return map;
  }, [openOrders]);

  const getDisplayAvgPrice = (position) => {
    const isIntraday = (position?.buyQty ?? 0) > 0 || (position?.sellQty ?? 0) > 0;
    if (position?.netQty > 0) return isIntraday ? position.buyAvgPrice : position.netAvgPrice;
    if (position?.netQty < 0) return isIntraday ? position.sellAvgPrice : position.netAvgPrice;
    return position?.buyAvgPrice;
  };

  const totalRealized = allPositions.reduce((sum, position) => sum + (Number(position?.realizedPnl) || 0), 0);
  const totalUnrealized = allPositions.reduce((sum, position) => sum + (Number(position?.unrealizedPnlLive) || 0), 0);
  const grandTotal = totalRealized + totalUnrealized;
  const activeExposure = allPositions.filter((position) => (position?.netQty ?? 0) !== 0).length;
  const selectedPnl = allPositions
    .filter((position) => selectedPositions.has(position.symId))
    .reduce((sum, position) => sum + (Number(position?.unrealizedPnlLive) || 0), 0);

  return (
    <section className="activity-panel positions-panel">
      <div className="activity-toolbar">
        <div className="activity-title">
          <strong>Live positions</strong><span>{activeExposure}</span>
          <small className={`terminal-metric ${grandTotal >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            P&L {grandTotal.toFixed(2)}
          </small>
        </div>
        <div className="activity-actions">
          {selectedPositions.size > 0 && (
            <span className={`selected-pnl terminal-metric ${selectedPnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              Selected {selectedPnl.toFixed(2)}
            </span>
          )}
          <div className="active-filter">
            <Switch id="active-positions" checked={showOnlyActive} onCheckedChange={setShowOnlyActive} />
            <Label htmlFor="active-positions">Active</Label>
          </div>
          <div className="position-lots">
            <Label htmlFor="pos-lots">Lots</Label>
            <Input id="pos-lots" type="number" min="1" value={positionLots} onChange={(event) => setPositionLots(Math.max(1, Number(event.target.value) || 1))} />
          </div>
          <Button variant="outline" size="sm" disabled={!selectedPositions.size} onClick={onExitSelected}>Exit selected</Button>
          <Button variant="destructive" size="sm" disabled={!positions.length} onClick={onExitAll}>Exit all</Button>
        </div>
      </div>

      <div className="activity-table-scroll">
        <Table className="positions-table min-w-[900px] table-fixed">
          <TableHeader><TableRow>
            <TableHead className="w-[36px]"><Checkbox onCheckedChange={handleSelectAll} checked={positions.length > 0 && selectedPositions.size === positions.length} /></TableHead>
            <TableHead className="w-[180px]">Symbol</TableHead><TableHead className="w-[64px]">Side</TableHead>
            <TableHead className="w-[52px]">Lots</TableHead><TableHead className="w-[58px]">Qty</TableHead>
            <TableHead className="w-[72px]">Avg</TableHead><TableHead className="w-[70px]">LTP</TableHead>
            <TableHead className="w-[82px]">P&L</TableHead><TableHead className="w-[115px]">Protection</TableHead>
            <TableHead className="w-[220px] text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {positions.length ? positions.map((position) => {
              const pnlValue = position.netQty === 0 ? position.realizedPnl : position.unrealizedPnlLive;
              const isLong = (position.netQty ?? 0) > 0;
              const stopOrders = (orderMap.get(position.symId) || []).filter((order) => String(order.type || "").toLowerCase().includes("stop"));
              const takeProfit = takeProfitTriggers[position.symId];
              const takeProfitPrice = Number(takeProfit?.triggerPrice);
              const hasTakeProfit = Number.isFinite(takeProfitPrice) && takeProfit?.mode === tradingMode;
              return (
                <TableRow key={position.symId} className={selectedPositions.has(position.symId) ? "selected-row" : ""}>
                  <TableCell><Checkbox checked={selectedPositions.has(position.symId)} onCheckedChange={() => handleSelectionChange(position.symId)} /></TableCell>
                  <TableCell className="font-medium"><div className="truncate" title={position.symId}>{formatDisplaySymbol(position.symId)}</div></TableCell>
                  <TableCell><Badge variant="outline" className={position.netQty === 0 ? "flat-badge" : isLong ? "long-badge" : "short-badge"}>{position.netQty === 0 ? "Flat" : isLong ? "Long" : "Short"}</Badge></TableCell>
                  <TableCell className="terminal-metric">{position.lot ? Math.abs(position.netQty / position.lot) : "-"}</TableCell>
                  <TableCell className="terminal-metric">{position.netQty}</TableCell>
                  <TableCell className="terminal-metric">{formatNumber(getDisplayAvgPrice(position))}</TableCell>
                  <TableCell className="terminal-metric">{formatNumber(position.ltp)}</TableCell>
                  <TableCell className={`terminal-metric font-semibold ${Number(pnlValue) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatNumber(pnlValue)}</TableCell>
                  <TableCell>
                    <div className="protection-tags">
                      {stopOrders.length > 0 && <Badge variant="outline" className="sl-badge">SL</Badge>}
                      {hasTakeProfit && <Badge variant="outline" className="tp-badge">TP {takeProfitPrice.toFixed(2)}</Badge>}
                      {!stopOrders.length && !hasTakeProfit && position.netQty !== 0 && <span className="text-amber-600">None</span>}
                      {position.netQty === 0 && <span>-</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right"><div className="position-row-actions">
                    <Button size="sm" variant="outline" className="row-buy" onClick={() => onPlaceOrder({ symId: position.symId, lot: position.lot, side: "BUY" }, positionLots)}>B</Button>
                    <Button size="sm" variant="outline" className="row-sell" onClick={() => onPlaceOrder({ symId: position.symId, lot: position.lot, side: "SELL" }, positionLots)}>S</Button>
                    {position.netQty !== 0 && <Button size="sm" variant="outline" onClick={() => onPlaceStopLoss(position)}>SL</Button>}
                    {position.netQty !== 0 && <Button size="sm" variant="outline" onClick={() => onPlaceTakeProfit(position)}>TP</Button>}
                    <Button size="sm" variant="secondary" onClick={() => onExit(position)}>Exit</Button>
                  </div></TableCell>
                </TableRow>
              );
            }) : <TableRow><TableCell colSpan="10" className="h-20 text-center text-slate-500">No positions to display.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <footer className="activity-summary">
        <span>Realized <strong className="terminal-metric">{totalRealized.toFixed(2)}</strong></span>
        <span>Unrealized <strong className="terminal-metric">{totalUnrealized.toFixed(2)}</strong></span>
        <span>Total <strong className={`terminal-metric ${grandTotal >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{grandTotal.toFixed(2)}</strong></span>
      </footer>
    </section>
  );
}

export default PositionsTable;
