import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/hooks/use-toast";
import { EyeOff, Radio, Siren } from "lucide-react";

const BUFFER_LIMIT = 180;
const ALERT_COOLDOWN_MS = 15000;

const MONITOR_CONFIG = {
  NIFTY: {
    spotMove3s: 4,
    optionMove3s: 5,
    ivMove3s: 0.3,
  },
  SENSEX: {
    spotMove3s: 10,
    optionMove3s: 5,
    ivMove3s: 0.35,
  },
};

const THRESHOLD_STORAGE_KEY = "scalpMonitorThresholds";

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "-";
  return Number(value).toFixed(digits);
}

function formatPercent(value, digits = 2) {
  if (!Number.isFinite(value)) return "-";
  return `${Number(value).toFixed(digits)}%`;
}

function shortContractLabel(optionData) {
  if (!optionData) return "-";
  if (Number.isFinite(optionData.strike) && optionData.optionType) {
    return `${optionData.strike} ${optionData.optionType}`;
  }
  return optionData.symId || "-";
}

function findWindowChange(samples, windowMs, field) {
  if (!samples?.length) return null;
  const latest = samples[samples.length - 1];
  const cutoff = latest.ts - windowMs;
  let baseline = samples[0];
  for (let i = samples.length - 1; i >= 0; i -= 1) {
    if (samples[i].ts <= cutoff) {
      baseline = samples[i];
      break;
    }
  }
  const latestValue = latest[field];
  const baseValue = baseline[field];
  if (!Number.isFinite(latestValue) || !Number.isFinite(baseValue)) return null;
  return latestValue - baseValue;
}

function findWindowPercentChange(samples, windowMs, field) {
  if (!samples?.length) return null;
  const latest = samples[samples.length - 1];
  const cutoff = latest.ts - windowMs;
  let baseline = samples[0];
  for (let i = samples.length - 1; i >= 0; i -= 1) {
    if (samples[i].ts <= cutoff) {
      baseline = samples[i];
      break;
    }
  }
  const latestValue = latest[field];
  const baseValue = baseline[field];
  if (!Number.isFinite(latestValue) || !Number.isFinite(baseValue) || baseValue <= 0) return null;
  return ((latestValue - baseValue) / baseValue) * 100;
}

function getSignal(row, spotMove3s, config) {
  if (!row) return { label: "Watching", tone: "outline", strength: 0 };

  const priceMovePct = row.dPricePct3s ?? 0;
  const ivMove = row.dIv3s ?? 0;
  const confirmedBull = row.optionType === "CE" && priceMovePct >= config.optionMove3s && (spotMove3s ?? 0) >= config.spotMove3s;
  const confirmedBear = row.optionType === "PE" && priceMovePct >= config.optionMove3s && (spotMove3s ?? 0) <= -config.spotMove3s;

  if (confirmedBull || confirmedBear) {
    return {
      label: "Premium Burst",
      tone: confirmedBull ? "green" : "red",
      strength: Math.abs(priceMovePct) + Math.abs(spotMove3s ?? 0) * 0.05 + Math.max(ivMove, 0),
    };
  }

  if ((row.dIv3s ?? 0) >= config.ivMove3s && priceMovePct >= Math.max(config.optionMove3s * 0.4, 1)) {
    return {
      label: "IV Pop",
      tone: "violet",
      strength: (row.dIv3s ?? 0) * 2 + priceMovePct,
    };
  }

  return { label: "Watching", tone: "outline", strength: Math.max(row.dPricePct1s ?? 0, 0) };
}

function signalBadgeClasses(tone) {
  switch (tone) {
    case "green":
      return "border-emerald-300 bg-emerald-100 text-emerald-900";
    case "red":
      return "border-rose-300 bg-rose-100 text-rose-900";
    case "amber":
      return "border-amber-300 bg-amber-100 text-amber-900";
    case "violet":
      return "border-violet-300 bg-violet-100 text-violet-900";
    default:
      return "border-slate-300 bg-slate-100 text-slate-700";
  }
}

function ScalpMonitor({
  underlying = "NIFTY",
  spotPrice = null,
  watchedSymbols = [],
  optionLookup = new Map(),
  optionContracts = [],
  onRemoveSymbol,
  onPlaceOrder,
  onAddSymbol,
  onAddAtmCall,
  onAddAtmPut,
  onAddAtmPair,
}) {
  const [selectedContract, setSelectedContract] = useState("");
  const [thresholds, setThresholds] = useState(() => {
    try {
      const raw = window.localStorage.getItem(THRESHOLD_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        NIFTY: {
          ...MONITOR_CONFIG.NIFTY,
          ...(parsed.NIFTY || {}),
        },
        SENSEX: {
          ...MONITOR_CONFIG.SENSEX,
          ...(parsed.SENSEX || {}),
        },
      };
    } catch {
      return {
        NIFTY: { ...MONITOR_CONFIG.NIFTY },
        SENSEX: { ...MONITOR_CONFIG.SENSEX },
      };
    }
  });
  const optionHistoryRef = useRef(new Map());
  const spotHistoryRef = useRef([]);
  const lastAlertRef = useRef(new Map());
  const config = thresholds[underlying] ?? MONITOR_CONFIG.NIFTY;
  const { toast } = useToast();

  useEffect(() => {
    window.localStorage.setItem(THRESHOLD_STORAGE_KEY, JSON.stringify(thresholds));
  }, [thresholds]);

  useEffect(() => {
    const now = Date.now();
    if (Number.isFinite(spotPrice)) {
      const nextSpotHistory = [...spotHistoryRef.current, { ts: now, price: spotPrice }].slice(-BUFFER_LIMIT);
      spotHistoryRef.current = nextSpotHistory;
    }

    const activeSymbols = new Set(watchedSymbols);
    for (const symId of optionHistoryRef.current.keys()) {
      if (!activeSymbols.has(symId)) {
        optionHistoryRef.current.delete(symId);
      }
    }

    for (const symId of watchedSymbols) {
      const optionData = optionLookup.get(symId);
      if (!optionData || !Number.isFinite(optionData.ltp)) continue;
      const existing = optionHistoryRef.current.get(symId) || [];
      const next = [
        ...existing,
        {
          ts: now,
          ltp: optionData.ltp,
          iv: optionData.iv,
          bidPrice: optionData.bidPrice,
          askPrice: optionData.askPrice,
          OI: optionData.OI,
          vol: optionData.vol,
        },
      ].slice(-BUFFER_LIMIT);
      optionHistoryRef.current.set(symId, next);
    }
  }, [watchedSymbols, optionLookup, spotPrice]);

  const spotMove3s = findWindowChange(spotHistoryRef.current, 3000, "price");

  const rows = useMemo(() => {
    return watchedSymbols
      .map((symId) => {
        const optionData = optionLookup.get(symId);
        if (!optionData) return null;
        const samples = optionHistoryRef.current.get(symId) || [];
        const spreadAbs =
          Number.isFinite(optionData.askPrice) && Number.isFinite(optionData.bidPrice)
            ? optionData.askPrice - optionData.bidPrice
            : null;
        const spreadPct =
          Number.isFinite(spreadAbs) && Number.isFinite(optionData.ltp) && optionData.ltp > 0
            ? (spreadAbs / optionData.ltp) * 100
            : null;

        const row = {
          ...optionData,
          spreadAbs,
          spreadPct,
          dPrice1s: findWindowChange(samples, 1000, "ltp"),
          dPrice3s: findWindowChange(samples, 3000, "ltp"),
          dPrice5s: findWindowChange(samples, 5000, "ltp"),
          dPricePct1s: findWindowPercentChange(samples, 1000, "ltp"),
          dPricePct3s: findWindowPercentChange(samples, 3000, "ltp"),
          dPricePct5s: findWindowPercentChange(samples, 5000, "ltp"),
          dIv3s: findWindowChange(samples, 3000, "iv"),
          dIv5s: findWindowChange(samples, 5000, "iv"),
        };
        const signal = getSignal(row, spotMove3s, config);
        return {
          ...row,
          signalLabel: signal.label,
          signalTone: signal.tone,
          signalStrength: signal.strength,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.signalStrength ?? 0) - (a.signalStrength ?? 0));
  }, [watchedSymbols, optionLookup, spotMove3s, config]);

  useEffect(() => {
    const now = Date.now();
    for (const row of rows) {
      if (!["Premium Burst", "IV Pop"].includes(row.signalLabel)) {
        continue;
      }
      const previous = lastAlertRef.current.get(row.symId);
      const signature = `${row.signalLabel}:${row.signalTone}`;
      const shouldAlert = !previous || previous.signature !== signature || now - previous.at > ALERT_COOLDOWN_MS;
      if (!shouldAlert) {
        continue;
      }

      toast({
        title: row.signalLabel,
        description: `${underlying} ${row.strike} ${row.optionType} | LTP ${formatNumber(row.ltp)} | 3s ${formatPercent(row.dPricePct3s)} | IV 3s ${formatNumber(row.dIv3s)}`,
      });
      lastAlertRef.current.set(row.symId, { signature, at: now });
    }
  }, [rows, toast, underlying]);

  const updateThreshold = (key, value) => {
    const numeric = Number(value);
    setThresholds((current) => ({
      ...current,
      [underlying]: {
        ...(current[underlying] || MONITOR_CONFIG[underlying] || MONITOR_CONFIG.NIFTY),
        [key]: Number.isFinite(numeric) ? numeric : 0,
      },
    }));
  };

  const contractOptions = useMemo(() => {
    return optionContracts
      .map((item) => ({
        value: item.symId,
        label: `${shortContractLabel(item)} | LTP ${formatNumber(item.ltp)}`,
      }));
  }, [optionContracts]);

  const topBullish = rows.find((row) => row.signalTone === "green");
  const topBearish = rows.find((row) => row.signalTone === "red");
  const topIvPop = rows.find((row) => row.signalLabel === "IV Pop");

  return (
    <Card className="terminal-shell border-0">
      <CardHeader className="border-b border-slate-200/80 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-sky-600" />
              <p className="terminal-section-title">Scalp Monitor</p>
            </div>
            <CardTitle className="mt-2 text-xl font-semibold text-slate-900">
              Premium burst watchlist for {underlying}
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Event-driven monitoring for short-horizon option bursts. Toast alerts now fire on new burst/pop signals.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={onAddAtmCall}>
              Add ATM CE
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={onAddAtmPut}>
              Add ATM PE
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={onAddAtmPair}>
              Add ATM Pair
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
              <div className="terminal-section-title text-emerald-700/80">Top Bullish Burst</div>
              <div className="mt-2 text-sm font-semibold text-emerald-900">
                {topBullish ? `${topBullish.strike} ${topBullish.optionType} | +${formatPercent(topBullish.dPricePct3s)}` : "None"}
              </div>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3">
              <div className="terminal-section-title text-rose-700/80">Top Bearish Burst</div>
              <div className="mt-2 text-sm font-semibold text-rose-900">
                {topBearish ? `${topBearish.strike} ${topBearish.optionType} | +${formatPercent(topBearish.dPricePct3s)}` : "None"}
              </div>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50/70 px-4 py-3">
              <div className="terminal-section-title text-violet-700/80">Top IV Pop</div>
              <div className="mt-2 text-sm font-semibold text-violet-900">
                {topIvPop ? `${topIvPop.strike} ${topIvPop.optionType} | +${formatNumber(topIvPop.dIv3s)}` : "None"}
              </div>
            </div>
          </div>

          <div className="flex min-w-[320px] flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="terminal-section-title">Add Any Contract</div>
            <p className="text-xs text-slate-500">
              Showing only contracts within ATM +/- 20 strikes for cleaner monitoring.
            </p>
            <div className="flex gap-2">
              <Select value={selectedContract} onValueChange={setSelectedContract}>
                <SelectTrigger className="h-10 rounded-xl border-slate-300 bg-white shadow-sm">
                  <SelectValue placeholder="Select CE/PE to monitor" />
                </SelectTrigger>
                <SelectContent className="z-[100] max-h-80 border-slate-300 bg-white/100 shadow-[0_20px_45px_rgba(15,23,42,0.18)] backdrop-blur-none">
                  {contractOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="py-2 text-slate-800 focus:bg-sky-50 focus:text-sky-900">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="rounded-xl"
                onClick={() => {
                  if (!selectedContract) return;
                  onAddSymbol(selectedContract);
                  setSelectedContract("");
                }}
                disabled={!selectedContract}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-3">
          <div className="md:col-span-3 flex items-center justify-between gap-3">
            <div className="terminal-section-title text-slate-600">Signal Thresholds</div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                setThresholds((current) => ({
                  ...current,
                  [underlying]: { ...(MONITOR_CONFIG[underlying] || MONITOR_CONFIG.NIFTY) },
                }));
              }}
            >
              Reset to defaults
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="spot-threshold" className="terminal-section-title text-slate-600">Spot Move 3s</Label>
            <Input
              id="spot-threshold"
              type="number"
              step="0.1"
              value={config.spotMove3s}
              onChange={(e) => updateThreshold("spotMove3s", e.target.value)}
              className="terminal-metric h-10 rounded-xl border-slate-300 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="option-threshold" className="terminal-section-title text-slate-600">Option Move 3s (%)</Label>
            <Input
              id="option-threshold"
              type="number"
              step="0.1"
              value={config.optionMove3s}
              onChange={(e) => updateThreshold("optionMove3s", e.target.value)}
              className="terminal-metric h-10 rounded-xl border-slate-300 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iv-threshold" className="terminal-section-title text-slate-600">IV Move 3s</Label>
            <Input
              id="iv-threshold"
              type="number"
              step="0.01"
              value={config.ivMove3s}
              onChange={(e) => updateThreshold("ivMove3s", e.target.value)}
              className="terminal-metric h-10 rounded-xl border-slate-300 bg-white"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Symbol</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">LTP</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">IV</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">1s %</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">3s %</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">5s %</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">IV 3s</TableHead>
              <TableHead className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">Signal</TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-[0.18em] text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.symId}>
                  <TableCell className="font-medium text-slate-800">
                    <div className="max-w-[260px] truncate">{shortContractLabel(row)}</div>
                  </TableCell>
                  <TableCell className="terminal-metric text-center">{formatNumber(row.ltp)}</TableCell>
                  <TableCell className="terminal-metric text-center">{formatNumber(row.iv)}</TableCell>
                  <TableCell className={`terminal-metric text-center ${(row.dPricePct1s ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {formatPercent(row.dPricePct1s)}
                  </TableCell>
                  <TableCell className={`terminal-metric text-center font-semibold ${(row.dPricePct3s ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {formatPercent(row.dPricePct3s)}
                  </TableCell>
                  <TableCell className={`terminal-metric text-center ${(row.dPricePct5s ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {formatPercent(row.dPricePct5s)}
                  </TableCell>
                  <TableCell className={`terminal-metric text-center ${(row.dIv3s ?? 0) >= 0 ? "text-violet-700" : "text-slate-500"}`}>
                    {formatNumber(row.dIv3s)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={signalBadgeClasses(row.signalTone)}>
                      {row.signalLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-emerald-200 px-2 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => onPlaceOrder({ symId: row.symId, lot: row.lot, side: "BUY" }, 1)}
                      >
                        B
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-rose-200 px-2 text-rose-700 hover:bg-rose-50"
                        onClick={() => onPlaceOrder({ symId: row.symId, lot: row.lot, side: "SELL" }, 1)}
                      >
                        S
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg px-2"
                        onClick={() => onRemoveSymbol(row.symId)}
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="9" className="h-24 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Siren className="h-5 w-5 text-slate-400" />
                    <div>No monitored contracts yet.</div>
                    <div className="text-xs text-slate-400">Add ATM shortcuts or pick any OTM/ITM contract from the selector.</div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default ScalpMonitor;
