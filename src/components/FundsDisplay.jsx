import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wallet, TrendingDown, CreditCard, Activity, Radar, ShieldCheck, Clock3, Receipt } from "lucide-react";

function FundsDisplay({ funds, runtimeStatus, tradingMode, selectedUnderlying = "NIFTY", dayCharges = null }) {
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0.00";
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(num);
  };

  const availableMargin = funds?.d?.availMargin ?? 0;
  const usedMargin = funds?.d?.marginUsed ?? 0;
  const totalMargin = availableMargin + usedMargin;
  const utilizationPercent = totalMargin > 0 ? (usedMargin / totalMargin) * 100 : 0;
  const snapshotAge = runtimeStatus?.snapshot_age_seconds;
  const snapshotLabel = Number.isFinite(snapshotAge) ? `${snapshotAge.toFixed(1)}s` : "--";
  const chargesTotals = dayCharges?.totals;
  const estimatedCharges = chargesTotals?.totalCharges ?? 0;
  const estimatedGrossProfit = chargesTotals?.grossProfit ?? 0;
  const estimatedNetPnl = chargesTotals?.netPnl ?? 0;
  const tradeRows = dayCharges?.tradeRows ?? [];
  const exchangeSummaries = dayCharges?.exchangeSummaries ?? {};
  const notes = dayCharges?.notes ?? [];

  const statusPills = [
    {
      label: tradingMode === "paper" ? "Paper Mode" : "Real Mode",
      tone: tradingMode === "paper" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900",
      icon: ShieldCheck,
    },
    {
      label: runtimeStatus?.spot_connected ? "Spot Live" : "Spot Pending",
      tone: runtimeStatus?.spot_connected ? "bg-sky-100 text-sky-800" : "bg-slate-200 text-slate-700",
      icon: Activity,
    },
    {
      label: runtimeStatus?.options_connected ? "Chain Live" : "Chain Pending",
      tone: runtimeStatus?.options_connected ? "bg-indigo-100 text-indigo-800" : "bg-slate-200 text-slate-700",
      icon: Radar,
    },
    {
      label: `Snapshot ${snapshotLabel}`,
      tone: runtimeStatus?.latest_snapshot_available ? "bg-violet-100 text-violet-800" : "bg-rose-100 text-rose-800",
      icon: Clock3,
    },
  ];

  return (
    <Card className="terminal-shell overflow-hidden border-0">
      <CardContent className="p-0">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_25%),linear-gradient(135deg,#f8fbff,#eef4fb)] p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {statusPills.map(({ label, tone, icon: Icon }) => (
                    <div key={label} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${tone}`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full border-slate-300 bg-white/80 text-slate-700 hover:bg-white">
                      Diagnostics
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-slate-200 bg-white sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle className="text-slate-900">Runtime diagnostics</DialogTitle>
                      <DialogDescription>
                        Use this only when you need to inspect feed health, snapshot freshness, or current subscription state.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="mt-2 grid gap-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="terminal-section-title text-slate-500">Tracked Symbols</div>
                          <div className="terminal-metric mt-2 text-2xl font-semibold text-slate-900">
                            {runtimeStatus?.live_option_symbol_count ?? "--"}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="terminal-section-title text-slate-500">ATM Subscription</div>
                          <div className="terminal-metric mt-2 text-2xl font-semibold text-slate-900">
                            {runtimeStatus?.current_atm_subscription ?? "--"}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="terminal-section-title text-slate-500">Current Feed Status</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {statusPills.map(({ label, tone, icon: Icon }) => (
                            <div key={`dialog-${label}`} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${tone}`}>
                              <Icon className="h-3.5 w-3.5" />
                              <span>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div>
                <p className="terminal-section-title">Capital Desk</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{selectedUnderlying} Execution Terminal</h1>
                <p className="mt-1 text-sm text-slate-500">Execution-first layout for fast discretionary {selectedUnderlying} option trading.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm">
                <div className="terminal-section-title">{selectedUnderlying} Spot</div>
                <div className="terminal-metric mt-1 text-2xl font-semibold text-slate-900">
                  {runtimeStatus?.spot_price ?? "--"}
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-600 p-3 text-white shadow-sm">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="terminal-section-title text-emerald-700/80">Available Margin</p>
                  <p className="terminal-metric mt-1 text-2xl font-semibold text-emerald-800">
                    Rs {formatNumber(availableMargin)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/75 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-500 p-3 text-white shadow-sm">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="terminal-section-title text-amber-700/80">Used Margin</p>
                  <p className="terminal-metric mt-1 text-2xl font-semibold text-amber-800">
                    Rs {formatNumber(usedMargin)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-amber-700">{utilizationPercent.toFixed(1)}% utilized</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-sky-200/80 bg-sky-50/75 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-sky-600 p-3 text-white shadow-sm">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="terminal-section-title text-sky-700/80">Total Margin</p>
                  <p className="terminal-metric mt-1 text-2xl font-semibold text-sky-900">
                    Rs {formatNumber(totalMargin)}
                  </p>
                </div>
              </div>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <button className="rounded-2xl border border-violet-200/80 bg-violet-50/75 p-4 text-left shadow-sm transition hover:bg-violet-50">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-violet-600 p-3 text-white shadow-sm">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="terminal-section-title text-violet-700/80">Charges Today</p>
                      <p className="terminal-metric mt-1 text-2xl font-semibold text-violet-900">
                        Rs {formatNumber(estimatedCharges)}
                      </p>
                      <p className="mt-1 text-xs font-medium text-violet-700">
                        Net after est. charges: Rs {formatNumber(estimatedNetPnl)}
                      </p>
                    </div>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto border-slate-200 bg-white sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="text-center text-2xl text-slate-900">Estimated contract note</DialogTitle>
                  <DialogDescription className="text-center">
                    Intraday estimate for today's completed F&O option orders using Zerodha-equivalent charges.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  <div>
                    <p className="text-lg font-semibold text-slate-700">Equity & Currency</p>
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">#</th>
                            <th className="px-4 py-3 text-left font-medium">Exchange</th>
                            <th className="px-4 py-3 text-right font-medium">Buy Price</th>
                            <th className="px-4 py-3 text-right font-medium">Sell Price</th>
                            <th className="px-4 py-3 text-right font-medium">Qty</th>
                            <th className="px-4 py-3 text-right font-medium">Gross profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tradeRows.length > 0 ? (
                            tradeRows.map((row, index) => (
                              <tr key={`${row.symId}-${index}`} className="border-t border-slate-200">
                                <td className="px-4 py-3">{index + 1}</td>
                                <td className="px-4 py-3">{row.exchange}</td>
                                <td className="px-4 py-3 text-right">{formatNumber(row.buyPrice)}</td>
                                <td className="px-4 py-3 text-right">{formatNumber(row.sellPrice)}</td>
                                <td className="px-4 py-3 text-right">{row.qty}</td>
                                <td className="px-4 py-3 text-right">{formatNumber(row.grossProfit)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                No completed option trades found for today.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid gap-4 border-y border-slate-200 py-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-sm text-slate-500">Total gross profit</div>
                      <div className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(estimatedGrossProfit)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-slate-500">Total charges</div>
                      <div className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(estimatedCharges)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-slate-500">Net P&amp;L</div>
                      <div className={`mt-1 text-2xl font-semibold ${estimatedNetPnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {formatNumber(estimatedNetPnl)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xl font-semibold text-slate-800">Charges breakdown</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {Object.entries(exchangeSummaries).map(([exchange, summary]) => (
                        <div key={exchange} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-800">{summary.exchangeLabel} F&amp;O - Options</div>
                            <div className="text-xs text-slate-500">{summary.executedOrders} executed order(s)</div>
                          </div>
                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <div className="text-slate-600">Brokerage</div><div className="text-right text-slate-900">{formatNumber(summary.brokerage)}</div>
                            <div className="text-slate-600">STT</div><div className="text-right text-slate-900">{formatNumber(summary.stt)}</div>
                            <div className="text-slate-600">Exchange txn charge</div><div className="text-right text-slate-900">{formatNumber(summary.exchangeTxn)}</div>
                            <div className="text-slate-600">GST</div><div className="text-right text-slate-900">{formatNumber(summary.gst)}</div>
                            <div className="text-slate-600">SEBI charges</div><div className="text-right text-slate-900">{formatNumber(summary.sebi)}</div>
                            <div className="text-slate-600">Stamp duty</div><div className="text-right text-slate-900">{formatNumber(summary.stampDuty)}</div>
                            <div className="text-slate-600">Turnover</div><div className="text-right text-slate-900">{formatNumber(summary.turnover)}</div>
                            <div className="font-semibold text-slate-800">Total charges</div><div className="text-right font-semibold text-slate-900">{formatNumber(summary.totalCharges)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {notes.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      {notes.map((note) => (
                        <div key={note}>{note}</div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FundsDisplay;
