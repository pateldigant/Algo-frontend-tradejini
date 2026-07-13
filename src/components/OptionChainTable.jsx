import React, { useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  watchedSymbols = [],
  onToggleWatch,
}) {
  const prevLtpMap = useMemo(() => {
    if (!prevOptionChain) return new Map();
    const map = new Map();
    for (const row of prevOptionChain) {
      map.set(row.strike, { CE_ltp: row.CE?.ltp, PE_ltp: row.PE?.ltp });
    }
    return map;
  }, [prevOptionChain]);

  const positionMap = useMemo(() => {
    const map = new Map();
    for (const position of positions) {
      if (!position?.symId || !position?.netQty) continue;
      map.set(position.symId, position);
    }
    return map;
  }, [positions]);

  const orderMap = useMemo(() => {
    const map = new Map();
    for (const order of openOrders) {
      if (!order?.symId) continue;
      const existing = map.get(order.symId) || [];
      existing.push(order);
      map.set(order.symId, existing);
    }
    return map;
  }, [openOrders]);

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
    const lowerBound = atmStrike - (strikeRange * strikeInterval);
    const upperBound = atmStrike + (strikeRange * strikeInterval);
    return optionChain.filter((row) => row.strike >= lowerBound && row.strike <= upperBound);
  }, [optionChain, atmStrike, strikeRange, strikeInterval]);

  const deriveMarkers = (optionData) => {
    if (!optionData?.symId) {
      return { hasPosition: false, hasOrder: false, position: null, orders: [] };
    }
    const position = positionMap.get(optionData.symId) || null;
    const orders = orderMap.get(optionData.symId) || [];
    return {
      hasPosition: Boolean(position && position.netQty !== 0),
      hasOrder: orders.length > 0,
      position,
      orders,
    };
  };

  const TradeCell = ({ optionData, side }) => {
    const ltp = optionData?.ltp;
    const prevLtp = prevLtpMap.get(optionData?.strike)?.[`${side}_ltp`];
    const rising = prevLtp !== undefined && prevLtp !== null && ltp > prevLtp;
    const { hasPosition, hasOrder, position } = deriveMarkers(optionData);
    const isWatched = watchedSymbols.includes(optionData?.symId);

    if (!optionData || !optionData.symId) {
      return <TableCell className="text-center text-slate-400">-</TableCell>;
    }

    return (
      <TableCell
        className={`text-center align-middle ${getLtpClass(ltp, optionData.strike, side)} ${
          hasPosition ? "bg-amber-50/80" : hasOrder ? "bg-violet-50/70" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 text-left">
            <div className={`terminal-metric text-sm font-semibold ${rising ? "text-emerald-700" : "text-rose-700"}`}>
              {ltp ?? "-"}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {hasPosition && (
                <Badge variant="outline" className="border-amber-300 bg-amber-100 text-[10px] text-amber-900">
                  Pos {position.netQty > 0 ? "Long" : "Short"}
                </Badge>
              )}
              {hasOrder && (
                <Badge variant="outline" className="border-violet-300 bg-violet-100 text-[10px] text-violet-900">
                  Pending
                </Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button size="sm" variant="outline" className="h-7 rounded-lg border-emerald-200 px-2 text-emerald-700 hover:bg-emerald-50" onClick={() => onPlaceOrder({ ...optionData, side: "BUY" })}>
              B
            </Button>
            <Button size="sm" variant="outline" className="h-7 rounded-lg border-rose-200 px-2 text-rose-700 hover:bg-rose-50" onClick={() => onPlaceOrder({ ...optionData, side: "SELL" })}>
              S
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={`h-7 rounded-lg px-2 ${isWatched ? "border-sky-300 bg-sky-100 text-sky-900 hover:bg-sky-100" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              onClick={() => onToggleWatch?.(optionData.symId)}
            >
              W
            </Button>
          </div>
        </div>
      </TableCell>
    );
  };

  return (
    <>
      <div className="mb-3 rounded-2xl border border-slate-200/80 bg-[linear-gradient(135deg,#ffffff,#f3f7fb)] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div>
              <p className="terminal-section-title">Current ATM</p>
              <p className="terminal-metric mt-1 text-2xl font-semibold text-sky-900">{atmStrike}</p>
            </div>
            <div className="h-10 w-px bg-slate-300" />
            <div>
              <p className="terminal-section-title">{underlying} Spot</p>
              <p className="terminal-metric mt-1 text-2xl font-semibold text-emerald-700">{spotPrice}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-900">{underlying}</Badge>
            <Badge variant="outline" className="border-sky-300 bg-sky-100 text-sky-900">ATM Focus</Badge>
            <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-900">Open Position Strike</Badge>
            <Badge variant="outline" className="border-violet-300 bg-violet-100 text-violet-900">Pending Order Strike</Badge>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Call OI</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Call IV</TableHead>
              <TableHead className="w-[220px] text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Call LTP / Trade</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500 bg-slate-100">Strike</TableHead>
              <TableHead className="w-[220px] text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Put LTP / Trade</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Put IV</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Put OI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChain.map((row) => {
              const ceMarkers = deriveMarkers(row.CE);
              const peMarkers = deriveMarkers(row.PE);
              const rowHasPosition = ceMarkers.hasPosition || peMarkers.hasPosition;
              const rowHasOrder = ceMarkers.hasOrder || peMarkers.hasOrder;

              return (
                <TableRow
                  key={row.strike}
                  className={
                    row.strike === atmStrike
                      ? "bg-blue-100/90 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.22)]"
                      : rowHasPosition
                        ? "bg-amber-50/45"
                        : rowHasOrder
                          ? "bg-violet-50/40"
                          : ""
                  }
                >
                  <TableCell className="text-center terminal-metric text-sm text-slate-700">{row.CE?.OI ?? "-"}</TableCell>
                  <TableCell className="text-center terminal-metric text-sm text-slate-600">{row.CE?.iv ? row.CE.iv.toFixed(2) : "-"}</TableCell>
                  <TradeCell optionData={{ ...row.CE, strike: row.strike }} side="CE" />
                  <TableCell
                    className={`terminal-metric font-bold text-center ${
                      row.strike === atmStrike ? "bg-blue-200/90 text-blue-950" : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{row.strike}</span>
                      {row.strike === atmStrike && <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-blue-700">ATM</span>}
                    </div>
                  </TableCell>
                  <TradeCell optionData={{ ...row.PE, strike: row.strike }} side="PE" />
                  <TableCell className="text-center terminal-metric text-sm text-slate-600">{row.PE?.iv ? row.PE.iv.toFixed(2) : "-"}</TableCell>
                  <TableCell className="text-center terminal-metric text-sm text-slate-700">{row.PE?.OI ?? "-"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default OptionChainTable;
