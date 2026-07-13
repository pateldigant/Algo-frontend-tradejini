import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-IN", { month: "long" });

function formatDisplaySymbol(symId) {
  if (typeof symId !== "string") return "-";
  const parts = symId.split("_");
  const optionType = parts[parts.length - 1];
  const strike = parts[parts.length - 2];
  const expiry = parts[parts.length - 3];
  const index = parts[1];

  if (!index || !expiry || !strike || !["CE", "PE"].includes(optionType)) {
    return symId;
  }

  const expiryDate = new Date(`${expiry}T00:00:00`);
  const displayExpiry = Number.isNaN(expiryDate.getTime())
    ? expiry
    : `${expiryDate.getDate()} ${MONTH_FORMATTER.format(expiryDate)}`;
  return `${index} ${displayExpiry} ${strike} ${optionType}`;
}

const PositionsTable = ({
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
}) => {
  const handleSelectionChange = (symId) => {
    setSelectedPositions((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(symId)) newSelection.delete(symId);
      else newSelection.add(symId);
      return newSelection;
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) setSelectedPositions(new Set(positions.map((p) => p.symId)));
    else setSelectedPositions(new Set());
  };

  const getDisplayAvgPrice = (p) => {
    const netQty = p?.netQty ?? 0;
    const isIntraday = (p?.buyQty ?? 0) > 0 || (p?.sellQty ?? 0) > 0;
    if (netQty > 0) return isIntraday ? p.buyAvgPrice : p.netAvgPrice;
    if (netQty < 0) return isIntraday ? p.sellAvgPrice : p.netAvgPrice;
    return p.buyAvgPrice;
  };

  const totalRealized = allPositions.reduce((sum, p) => sum + (p?.realizedPnl ?? 0), 0);
  const totalUnrealized = allPositions.reduce((sum, p) => sum + (p?.unrealizedPnlLive ?? 0), 0);
  const grandTotal = totalRealized + totalUnrealized;
  const activeExposure = allPositions.filter((p) => (p?.netQty ?? 0) !== 0).length;
  const selectedPnl = React.useMemo(
    () =>
      allPositions
        .filter((p) => selectedPositions.has(p.symId))
        .reduce((sum, p) => sum + (p?.unrealizedPnlLive ?? 0), 0),
    [selectedPositions, allPositions],
  );

  const orderMap = React.useMemo(() => {
    const map = new Map();
    for (const order of openOrders) {
      if (!order?.symId) continue;
      const bucket = map.get(order.symId) || [];
      bucket.push(order);
      map.set(order.symId, bucket);
    }
    return map;
  }, [openOrders]);

  const summaryCards = [
    {
      label: "Active Legs",
      value: activeExposure,
      tone: "border-sky-200 bg-sky-50 text-sky-900",
    },
    {
      label: "Selected PnL",
      value: selectedPositions.size > 0 ? selectedPnl.toFixed(2) : "--",
      tone: selectedPnl >= 0 ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900",
    },
    {
      label: tradingMode === "paper" ? "Paper Route" : "Real Route",
      value: tradingMode === "paper" ? "Virtual" : "Broker",
      tone: tradingMode === "paper" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900",
    },
  ];

  return (
    <Card className="terminal-shell border-0">
      <CardHeader className="border-b border-slate-200/80 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="terminal-section-title">Exposure Console</p>
            <CardTitle className="mt-2 text-xl font-semibold text-slate-900">Live Positions</CardTitle>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {summaryCards.map((card) => (
              <div key={card.label} className={`rounded-2xl border px-4 py-3 shadow-sm ${card.tone}`}>
                <div className="terminal-section-title text-current/70">{card.label}</div>
                <div className="terminal-metric mt-2 text-xl font-semibold">{card.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className={`inline-flex items-center gap-3 rounded-xl border px-3 py-2 transition-all ${
            showOnlyActive ? "border-sky-200 bg-sky-50" : "border-slate-200 bg-slate-50"
          }`}>
            <Switch id="active-positions" checked={showOnlyActive} onCheckedChange={setShowOnlyActive} />
            <Label
              htmlFor="active-positions"
              className={`cursor-pointer text-sm font-medium ${showOnlyActive ? "text-sky-700" : "text-slate-600"}`}
            >
              Show only active
            </Label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Label htmlFor="pos-lots" className="text-sm font-medium text-slate-600">Lots</Label>
              <Input
                id="pos-lots"
                type="number"
                value={positionLots}
                onChange={(e) => setPositionLots(Number(e.target.value))}
                min="1"
                className="terminal-metric h-9 w-20 text-center font-semibold border-slate-300 focus-visible:ring-sky-500"
              />
            </div>

            <Button variant="destructive" size="sm" className="rounded-lg" disabled={selectedPositions.size === 0} onClick={onExitSelected}>
              Exit Selected ({selectedPositions.size})
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg" disabled={positions.length === 0} onClick={onExitAll}>
              Exit All
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[440px] overflow-y-auto">
          <Table className="min-w-[860px] table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-[36px]">
                  <Checkbox onCheckedChange={handleSelectAll} checked={positions.length > 0 && selectedPositions.size === positions.length} />
                </TableHead>
                <TableHead className="w-[190px] text-[11px] uppercase tracking-[0.18em] text-slate-500">Symbol</TableHead>
                <TableHead className="w-[74px] text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Bias</TableHead>
                <TableHead className="w-[56px] text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Lots</TableHead>
                <TableHead className="w-[62px] text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Qty</TableHead>
                <TableHead className="w-[78px] text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Avg</TableHead>
                <TableHead className="w-[70px] text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">LTP</TableHead>
                <TableHead className="w-[82px] text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">PnL</TableHead>
                <TableHead className="w-[112px] text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Protection</TableHead>
                <TableHead className="w-[200px] text-right text-[11px] uppercase tracking-[0.18em] text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.length > 0 ? (
                positions.map((p) => {
                  const pnlValue = p.netQty === 0 ? p.realizedPnl : p.unrealizedPnlLive;
                  const isLong = (p.netQty ?? 0) > 0;
                  const symbolOrders = orderMap.get(p.symId) || [];
                  const stopOrders = symbolOrders.filter((order) => String(order.type || "").toLowerCase().includes("stop"));
                  const takeProfit = takeProfitTriggers[p.symId];
                  const takeProfitPrice = Number(takeProfit?.triggerPrice);
                  const hasTakeProfit = Number.isFinite(takeProfitPrice) && takeProfit?.mode === tradingMode;
                  const displaySymbol = formatDisplaySymbol(p.symId);

                  return (
                    <TableRow key={p.symId} className={selectedPositions.has(p.symId) ? "bg-sky-50/40" : ""}>
                      <TableCell>
                        <Checkbox checked={selectedPositions.has(p.symId)} onCheckedChange={() => handleSelectionChange(p.symId)} />
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">
                        <div className="truncate" title={p.symId}>{displaySymbol}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        {p.netQty === 0 ? (
                          <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700">Flat</Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={isLong ? "border-emerald-300 bg-emerald-100 text-emerald-900" : "border-rose-300 bg-rose-100 text-rose-900"}
                          >
                            {isLong ? "Long" : "Short"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="terminal-metric text-center">{p.lot ? p.netQty / p.lot : "-"}</TableCell>
                      <TableCell className="terminal-metric text-center">{p.netQty}</TableCell>
                      <TableCell className="terminal-metric text-center">{getDisplayAvgPrice(p)?.toFixed(2) ?? "-"}</TableCell>
                      <TableCell className="terminal-metric text-center">{p.ltp ?? "-"}</TableCell>
                      <TableCell className={`terminal-metric text-center font-semibold ${pnlValue >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {pnlValue?.toFixed(2) ?? "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {stopOrders.length > 0 && (
                            <Badge variant="outline" className="border-violet-300 bg-violet-100 text-violet-900">
                              SL Pending
                            </Badge>
                          )}
                          {hasTakeProfit && (
                            <Badge variant="outline" className="border-sky-300 bg-sky-100 text-sky-900">
                              TP {takeProfitPrice.toFixed(2)}
                            </Badge>
                          )}
                          {stopOrders.length === 0 && !hasTakeProfit && p.netQty !== 0 && (
                            <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-900">
                              Unhedged
                            </Badge>
                          )}
                          {p.netQty === 0 && stopOrders.length === 0 && !hasTakeProfit && (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 whitespace-nowrap">
                          <Button size="sm" variant="outline" className="h-8 w-8 rounded-lg border-emerald-200 p-0 text-emerald-700 hover:bg-emerald-50" onClick={() => onPlaceOrder({ symId: p.symId, lot: p.lot, side: "BUY" }, positionLots)}>B</Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 rounded-lg border-rose-200 p-0 text-rose-700 hover:bg-rose-50" onClick={() => onPlaceOrder({ symId: p.symId, lot: p.lot, side: "SELL" }, positionLots)}>S</Button>
                          {p.netQty !== 0 && (
                            <>
                              <Button size="sm" variant="outline" className="h-8 w-9 rounded-lg border-violet-200 p-0 text-violet-700 hover:bg-violet-50" onClick={() => onPlaceStopLoss(p)}>
                                SL
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-9 rounded-lg border-sky-200 p-0 text-sky-700 hover:bg-sky-50"
                                onClick={() => onPlaceTakeProfit(p)}
                              >
                                TP
                              </Button>
                            </>
                          )}
                          <Button variant="secondary" size="sm" className="h-8 rounded-lg px-2.5" onClick={() => onExit(p)}>
                            Exit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan="10" className="h-24 text-center text-slate-500">No positions to display.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <CardFooter className="grid gap-3 border-t border-slate-200/80 bg-slate-50/70 px-6 py-4 text-sm font-medium md:grid-cols-3">
        <div>
          Total Realized:{" "}
          <span className={`terminal-metric ${totalRealized >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {totalRealized.toFixed(2)}
          </span>
        </div>
        <div>
          Total Unrealized:{" "}
          <span className={`terminal-metric ${totalUnrealized >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {totalUnrealized.toFixed(2)}
          </span>
        </div>
        <div>
          Grand Total:{" "}
          <span className={`terminal-metric ${grandTotal >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {grandTotal.toFixed(2)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PositionsTable;
