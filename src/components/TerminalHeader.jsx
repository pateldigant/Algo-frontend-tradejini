import React from "react";
import { Activity, CircleDot, Keyboard, Receipt, Settings2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const formatMoney = (value) => new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
}).format(Number(value) || 0);

const formatSpot = (value) => Number.isFinite(Number(value))
  ? Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })
  : "--";

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
  spotPrice,
  tradingMode,
  selectedUnderlying,
  dayCharges,
  positions = [],
  hotkeySettings = { enabled: false, exitAll: "X" },
  onHotkeySettingsChange,
}) {
  const availableMargin = Number(funds?.d?.availMargin) || 0;
  const usedMargin = Number(funds?.d?.marginUsed) || 0;
  const totalMargin = availableMargin + usedMargin;
  const charges = Number(dayCharges?.totals?.totalCharges) || 0;
  const grossProfit = Number(dayCharges?.totals?.grossProfit) || 0;
  const netPnl = Number(dayCharges?.totals?.netPnl) || 0;
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
  const displayedSpotPrice = Number.isFinite(Number(spotPrice)) ? spotPrice : runtimeStatus?.spot_price;
  const tradeRows = dayCharges?.tradeRows || [];
  const exchangeSummaries = dayCharges?.exchangeSummaries || {};
  const chargeNotes = dayCharges?.notes || [];
  const updateHotkeySettings = (changes) => onHotkeySettingsChange?.({ ...hotkeySettings, ...changes });

  const captureExitAllHotkey = (event) => {
    if (["Backspace", "Delete"].includes(event.key)) {
      event.preventDefault();
      updateHotkeySettings({ exitAll: "" });
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
    event.preventDefault();
    updateHotkeySettings({ exitAll: event.key.toUpperCase() });
  };

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
        <strong className="terminal-metric">{formatSpot(displayedSpotPrice)}</strong>
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
          <DialogContent className="runtime-diagnostics-dialog border-slate-200 bg-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Runtime diagnostics</DialogTitle>
              <DialogDescription>Current market feed and execution route status.</DialogDescription>
            </DialogHeader>
            <div className="diagnostic-grid">
              <div><span>Route</span><strong className="is-route">{tradingMode === "paper" ? "Paper" : "Broker"}</strong></div>
              <div><span>Spot feed</span><strong className={runtimeStatus?.spot_connected ? "is-positive" : "is-warning"}>{runtimeStatus?.spot_connected ? "Connected" : "Pending"}</strong></div>
              <div><span>Option chain</span><strong className={runtimeStatus?.options_connected ? "is-positive" : "is-warning"}>{runtimeStatus?.options_connected ? "Connected" : "Pending"}</strong></div>
              <div><span>Tracked symbols</span><strong>{runtimeStatus?.live_option_symbol_count ?? "--"}</strong></div>
              <div><span>ATM subscription</span><strong>{runtimeStatus?.current_atm_subscription ?? "--"}</strong></div>
              <div><span>Snapshot age</span><strong className={Number.isFinite(snapshotAge) && snapshotAge <= 3 ? "is-positive" : "is-warning"}>{Number.isFinite(snapshotAge) ? `${snapshotAge.toFixed(1)} sec` : "--"}</strong></div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`terminal-icon-button hotkey-icon-button ${hotkeySettings.enabled ? "is-active" : ""}`}
              title="Hotkeys"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="hotkeys-dialog border-slate-200 bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Hotkeys</DialogTitle>
              <DialogDescription className="sr-only">Configure keyboard commands for the trading terminal.</DialogDescription>
            </DialogHeader>
            <div className="hotkeys-settings">
              <div className="hotkeys-master-row">
                <div className="hotkey-setting-label"><Keyboard aria-hidden="true" /><Label htmlFor="hotkeys-enabled">Hotkeys</Label></div>
                <Switch
                  id="hotkeys-enabled"
                  checked={hotkeySettings.enabled}
                  onCheckedChange={(enabled) => updateHotkeySettings({ enabled })}
                />
              </div>
              <div className="hotkey-binding-row">
                <Label htmlFor="exit-all-hotkey">Exit all positions</Label>
                <Input
                  id="exit-all-hotkey"
                  className="terminal-metric"
                  value={hotkeySettings.exitAll}
                  maxLength={1}
                  onKeyDown={captureExitAllHotkey}
                  onChange={(event) => updateHotkeySettings({ exitAll: event.target.value.slice(-1).toUpperCase() })}
                  aria-label="Exit all positions hotkey"
                />
              </div>
            </div>
            <DialogFooter className="hotkeys-footer">
              <span className={`hotkey-state ${hotkeySettings.enabled ? "is-active" : ""}`}>
                {hotkeySettings.enabled ? "Enabled" : "Disabled"}
              </span>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="terminal-icon-button" title="Charges today">
              <Receipt className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="charges-dialog max-h-[88vh] overflow-y-auto border-slate-200 bg-white sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>Charges today</DialogTitle>
              <DialogDescription>Estimated charges from completed option orders.</DialogDescription>
            </DialogHeader>
            <div className="charges-summary">
              <Metric
                label="Gross P&L"
                value={`Rs ${formatMoney(grossProfit)}`}
                tone={grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"}
              />
              <Metric label="Charges" value={`Rs ${formatMoney(charges)}`} tone="text-amber-700" />
              <Metric
                label="Net P&L"
                value={`Rs ${formatMoney(netPnl)}`}
                tone={netPnl >= 0 ? "text-emerald-600" : "text-rose-600"}
              />
            </div>
            <div className="charges-trades overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full min-w-[680px] text-sm">
                <thead><tr><th>Symbol</th><th>Exchange</th><th>Buy</th><th>Sell</th><th>Qty</th><th>Gross P&L</th></tr></thead>
                <tbody>
                  {tradeRows.length ? tradeRows.map((row, index) => (
                    <tr key={`${row.symId}-${index}`}>
                      <td>{row.symId}</td><td>{row.exchange}</td><td>{formatMoney(row.buyPrice)}</td>
                      <td>{formatMoney(row.sellPrice)}</td><td>{row.qty}</td>
                      <td className={(Number(row.grossProfit) || 0) >= 0 ? "is-positive" : "is-negative"}>{formatMoney(row.grossProfit)}</td>
                    </tr>
                  )) : <tr><td colSpan="6" className="py-8 text-center text-slate-500">No completed trades today.</td></tr>}
                </tbody>
              </table>
            </div>
            {Object.values(exchangeSummaries).length > 0 && (
              <section className="charges-details">
                <div className="charges-section-heading">
                  <strong>Charges breakdown</strong>
                  <span>By exchange</span>
                </div>
                <div className="charges-breakdown">
                  {Object.entries(exchangeSummaries).map(([exchange, summary]) => (
                    <article className="charge-breakdown-card" key={exchange}>
                      <header className="charge-breakdown-head">
                        <div><strong>{summary.exchangeLabel} options</strong><span>{exchange}</span></div>
                        <small>{summary.executedOrders} executed order{summary.executedOrders === 1 ? "" : "s"}</small>
                      </header>
                      <dl className="charge-breakdown-grid">
                        <div><dt>Brokerage</dt><dd>Rs {formatMoney(summary.brokerage)}</dd></div>
                        <div><dt>STT</dt><dd>Rs {formatMoney(summary.stt)}</dd></div>
                        <div><dt>Exchange txn charge</dt><dd>Rs {formatMoney(summary.exchangeTxn)}</dd></div>
                        <div><dt>GST</dt><dd>Rs {formatMoney(summary.gst)}</dd></div>
                        <div><dt>SEBI charges</dt><dd>Rs {formatMoney(summary.sebi)}</dd></div>
                        <div><dt>Stamp duty</dt><dd>Rs {formatMoney(summary.stampDuty)}</dd></div>
                        <div><dt>Buy turnover</dt><dd>Rs {formatMoney(summary.buyTurnover)}</dd></div>
                        <div><dt>Sell turnover</dt><dd>Rs {formatMoney(summary.sellTurnover)}</dd></div>
                        <div><dt>Total turnover</dt><dd>Rs {formatMoney(summary.turnover)}</dd></div>
                        <div className="is-total"><dt>Total charges</dt><dd>Rs {formatMoney(summary.totalCharges)}</dd></div>
                      </dl>
                    </article>
                  ))}
                </div>
              </section>
            )}
            {chargeNotes.length > 0 && (
              <div className="charges-notes">
                {chargeNotes.map((note) => <p key={note}>{note}</p>)}
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
