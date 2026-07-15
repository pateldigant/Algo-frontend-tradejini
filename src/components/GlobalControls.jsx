import React from "react";
import { AlarmClock, FileText, Hash, Layers3, ShoppingCart, Target, Zap } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const modeControls = [
  { key: "basket", label: "Basket", icon: ShoppingCart },
  { key: "paper", label: "Paper", icon: FileText },
  { key: "fast", label: "Fast mode", icon: Zap },
  { key: "autoSquareoff", label: "Auto squareoff", icon: AlarmClock },
];

function GlobalControls({
  orderLots,
  setOrderLots,
  strikeRange,
  setStrikeRange,
  isBasketMode,
  setIsBasketMode,
  isFastMode,
  setIsFastMode,
  isPaperMode,
  setIsPaperMode,
  isSquareoffBeforeCloseEnabled,
  setIsSquareoffBeforeCloseEnabled,
  selectedUnderlying,
  setSelectedUnderlying,
}) {
  const values = {
    basket: isBasketMode,
    paper: isPaperMode,
    fast: isFastMode,
    autoSquareoff: isSquareoffBeforeCloseEnabled,
  };
  const setters = {
    basket: setIsBasketMode,
    paper: setIsPaperMode,
    fast: setIsFastMode,
    autoSquareoff: setIsSquareoffBeforeCloseEnabled,
  };

  return (
    <section className="terminal-controlbar" aria-label="Trade controls">
      <div className="terminal-control-group">
        <Layers3 className="h-4 w-4 text-sky-600" aria-hidden="true" />
        <Label htmlFor="underlying">Underlying</Label>
        <Select value={selectedUnderlying} onValueChange={setSelectedUnderlying}>
          <SelectTrigger id="underlying" className="terminal-select terminal-metric">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NIFTY">NIFTY</SelectItem>
            <SelectItem value="SENSEX">SENSEX</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="terminal-control-group">
        <Hash className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <Label htmlFor="trade-lots">Lots</Label>
        <Input
          id="trade-lots"
          type="number"
          min="1"
          value={orderLots}
          onChange={(event) => setOrderLots(Math.max(1, Number(event.target.value) || 1))}
          className="terminal-number-input terminal-metric"
        />
      </div>

      <div className="terminal-control-group">
        <Target className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <Label htmlFor="chain-window">Chain</Label>
        <Select value={String(strikeRange)} onValueChange={(value) => setStrikeRange(Number(value))}>
          <SelectTrigger id="chain-window" className="terminal-select terminal-metric">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 15, 20, 30, 50].map((range) => (
              <SelectItem key={range} value={String(range)}>ATM +/- {range}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="terminal-mode-controls">
        {modeControls.map(({ key, label, icon: Icon }) => (
          <div key={key} className={`terminal-mode-control ${values[key] ? "is-active" : ""}`}>
            {React.createElement(Icon, { "aria-hidden": true })}
            <Label htmlFor={`${key}-mode`}>{label}</Label>
            <Switch id={`${key}-mode`} checked={values[key]} onCheckedChange={setters[key]} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default GlobalControls;
