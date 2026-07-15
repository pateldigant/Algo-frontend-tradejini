import React from "react";
import { Activity, CircleDot, Receipt, Settings2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formatMoney = (value) => new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
}).format(Number(value) || 0);

function Metric({ label, value, tone = "text-slate-900", detail }) {
  return (
    <div className="terminal-header-metric">
      <span>{label}</span>
      <strong className={`terminal-metric ${tone}`}>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

function TerminalHeader({
  funds,
  runtimeStatus,
  tradingMode,
  selectedUnderlying,
  dayCharges,
  positions = [],
}) {
  const availableMargin = Number(funds?.d?.availMargin) || 0;
  const usedMargin = Number(funds?.d?.marginUsed) || 0;
  const totalMargin = availableMargin + usedMargin;
  const charges = Number(dayCharges?.totals?.totalCharges) || 0;
  const realizedPnl = positions.reduce((sum, position) => sum + (Number(position?.realizedPnl) || 0), 0);
  const unrealizedPnl = positions.reduce((sum, position) => sum + (Number(position?.unrealizedPnlLive) || 0), 0);
  const todayPnl = realizedPnl + unrealizedPnl;
  const snapshotAge = Number(runtimeStatus?.snapshot_age_seconds);
  const clockLabel = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const feedLive = Boolean(runtimeStatus?.spot_connected && runtimeStatus?.options_connected);
  const tradeRows = dayCharges?.tradeRows || [];
  const exchangeSummaries = dayCharges?.exchangeSummaries || {};

  return (
    <header className="terminal-header">
      <div className="terminal-brand">
        <div className="terminal-brand-mark"><Activity aria-hidden="true" /></div>
        <div>
          <h1>{selectedUnderlying} Terminal</h1>
          <span>Options trading desk</span>
        </div>
      </div>

      <div className="terminal-spot">
        <span>{selectedUnderlying} spot</span>
        <strong className="terminal-metric">{runtimeStatus?.spot_price ?? "--"}</strong>
        <small className={feedLive ? "text-emerald-600" : "text-amber-600"}>
          {feedLive ? "Live feed" : "Feed pending"}
        </small>
      </div>

      <div className="terminal-header-metrics">
        <Metric label="Available" value={`Rs ${formatMoney(availableMargin)}`} />
        <Metric
          label="Used"
          value={`Rs ${formatMoney(usedMargin)}`}
          detail={totalMargin > 0 ? `${((usedMargin / totalMargin) * 100).toFixed(1)}%` : "0.0%"}
          tone={usedMargin > 0 ? "text-rose-600" : "text-slate-900"}
        />
        <Metric label="Charges" value={`Rs ${formatMoney(charges)}`} tone="text-amber-700" />
        <Metric
          label="P&L today"
          value={`Rs ${formatMoney(todayPnl)}`}
          tone={todayPnl >= 0 ? "text-emerald-600" : "text-rose-600"}
          detail={`R ${formatMoney(realizedPnl)} | U ${formatMoney(unrealizedPnl)}`}
        />
      </div>

      <div className="terminal-header-actions">
        <div className={`terminal-live-status ${feedLive ? "is-live" : ""}`}>
          <CircleDot aria-hidden="true" />
          <span>{feedLive ? "Live" : "Connecting"}</span>
          <small className="terminal-metric">{clockLabel}</small>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="terminal-icon-button" title="Runtime diagnostics">
              <Settings2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="border-slate-200 bg-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Runtime diagnostics</DialogTitle>
              <DialogDescription>Current market feed and execution route status.</DialogDescription>
            </DialogHeader>
            <div className="diagnostic-grid">
              <div><span>Route</span><strong>{tradingMode === "paper" ? "Paper" : "Broker"}</strong></div>
              <div><span>Spot feed</span><strong>{runtimeStatus?.spot_connected ? "Connected" : "Pending"}</strong></div>
              <div><span>Option chain</span><strong>{runtimeStatus?.options_connected ? "Connected" : "Pending"}</strong></div>
              <div><span>Tracked symbols</span><strong>{runtimeStatus?.live_option_symbol_count ?? "--"}</strong></div>
              <div><span>ATM subscription</span><strong>{runtimeStatus?.current_atm_subscription ?? "--"}</strong></div>
              <div><span>Snapshot age</span><strong>{Number.isFinite(snapshotAge) ? `${snapshotAge.toFixed(1)} sec` : "--"}</strong></div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="terminal-icon-button" title="Charges today">
              <Receipt className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto border-slate-200 bg-white sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Charges today</DialogTitle>
              <DialogDescription>Estimated charges from completed option orders.</DialogDescription>
            </DialogHeader>
            <div className="charges-summary">
              <Metric label="Gross P&L" value={`Rs ${formatMoney(dayCharges?.totals?.grossProfit)}`} />
              <Metric label="Charges" value={`Rs ${formatMoney(charges)}`} tone="text-amber-700" />
              <Metric
                label="Net P&L"
                value={`Rs ${formatMoney(dayCharges?.totals?.netPnl)}`}
                tone={(Number(dayCharges?.totals?.netPnl) || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}
              />
            </div>
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full min-w-[620px] text-sm">
                <thead><tr><th>Symbol</th><th>Exchange</th><th>Buy</th><th>Sell</th><th>Qty</th><th>Gross P&L</th></tr></thead>
                <tbody>
                  {tradeRows.length ? tradeRows.map((row, index) => (
                    <tr key={`${row.symId}-${index}`}>
                      <td>{row.symId}</td><td>{row.exchange}</td><td>{formatMoney(row.buyPrice)}</td>
                      <td>{formatMoney(row.sellPrice)}</td><td>{row.qty}</td><td>{formatMoney(row.grossProfit)}</td>
                    </tr>
                  )) : <tr><td colSpan="6" className="py-8 text-center text-slate-500">No completed trades today.</td></tr>}
                </tbody>
              </table>
            </div>
            {Object.values(exchangeSummaries).length > 0 && (
              <div className="charges-breakdown">
                {Object.values(exchangeSummaries).map((summary) => (
                  <div key={summary.exchangeLabel}>
                    <span>{summary.exchangeLabel} options</span>
                    <strong className="terminal-metric">Rs {formatMoney(summary.totalCharges)}</strong>
                    <small>{summary.executedOrders} executed orders</small>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className={`terminal-route ${tradingMode === "paper" ? "is-paper" : ""}`}>
          <ShieldCheck aria-hidden="true" />
          {tradingMode === "paper" ? "Paper" : "Real"}
        </div>
      </div>
    </header>
  );
}

export default TerminalHeader;
