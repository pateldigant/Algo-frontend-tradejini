import React, { useState } from "react";
import { ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatCurrency = (value) => Number.isFinite(value)
  ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)
  : "--";

const formatPrice = (value) => Number.isFinite(value)
  ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value)
  : "--";

function BuyingPower({ label, data, tone }) {
  return (
    <div className={`scalp-power ${tone}`}>
      <div><span>{label}</span><strong className="terminal-metric">@ {formatPrice(data?.ltp)}</strong></div>
      <div><span>Required</span><strong className="terminal-metric">Rs {formatCurrency(data?.requiredMargin)}</strong></div>
      <div><span>Max lots</span><strong className="terminal-metric">{Number.isFinite(data?.maxLots) ? data.maxLots : "--"}</strong></div>
    </div>
  );
}

function StrategyExecutionPanel({ orderLots, onExecute, selectedUnderlying = "NIFTY", scalpBuyingPower = null }) {
  const [strategy, setStrategy] = useState("strangle");
  const [useHedges, setUseHedges] = useState(false);
  const [useStopLoss, setUseStopLoss] = useState(true);
  const [strikeDistance, setStrikeDistance] = useState(3);
  const [hedgeDistance, setHedgeDistance] = useState(5);
  const [slPercent, setSlPercent] = useState(25);
  const [scalpSlPoints, setScalpSlPoints] = useState("");
  const [scalpTpPoints, setScalpTpPoints] = useState("");

  const parseOptionalPoints = (value) => {
    if (value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const handleScalp = (strategyName) => onExecute({
    strategy: strategyName,
    lots: orderLots,
    stop_loss: { enabled: false },
    scalp_sl_points: parseOptionalPoints(scalpSlPoints),
    scalp_tp_points: parseOptionalPoints(scalpTpPoints),
  });

  const handleStrategy = () => onExecute({
    strategy,
    lots: orderLots,
    strike_distance: strikeDistance,
    use_hedges: useHedges,
    hedge_distance: hedgeDistance,
    stop_loss: { enabled: useStopLoss, percent: slPercent },
  });

  return (
    <div className="terminal-execution-rail">
      <div className="execution-rail-heading">
        <div><span>Quick trading</span><strong>{selectedUnderlying}</strong></div>
        <div className="terminal-lot-chip">{orderLots} lot{orderLots === 1 ? "" : "s"}</div>
      </div>

      <Tabs defaultValue="scalp" className="min-h-0 flex-1">
        <TabsList className="terminal-tabs-list grid w-full grid-cols-2">
          <TabsTrigger value="scalp">Scalp</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
        </TabsList>

        <TabsContent value="scalp" className="terminal-rail-content">
          <div className="scalp-entry-grid">
            <Button className="scalp-entry scalp-entry-call" onClick={() => handleScalp("scalp_call")}>
              <TrendingUp aria-hidden="true" />
              <span>ATM Call</span>
              <small>Buy</small>
            </Button>
            <Button className="scalp-entry scalp-entry-put" onClick={() => handleScalp("scalp_put")}>
              <TrendingDown aria-hidden="true" />
              <span>ATM Put</span>
              <small>Buy</small>
            </Button>
          </div>

          <div className="scalp-power-grid">
            <BuyingPower label="ATM Call" data={scalpBuyingPower?.call} tone="is-call" />
            <BuyingPower label="ATM Put" data={scalpBuyingPower?.put} tone="is-put" />
          </div>

          <div className="scalp-risk-grid">
            <div>
              <Label htmlFor="scalp-sl-points">SL points</Label>
              <Input
                id="scalp-sl-points"
                type="number"
                min="0"
                step="0.05"
                placeholder="Optional"
                value={scalpSlPoints}
                onChange={(event) => setScalpSlPoints(event.target.value)}
                className="terminal-metric"
              />
            </div>
            <div>
              <Label htmlFor="scalp-tp-points">TP points</Label>
              <Input
                id="scalp-tp-points"
                type="number"
                min="0"
                step="0.05"
                placeholder="Optional"
                value={scalpTpPoints}
                onChange={(event) => setScalpTpPoints(event.target.value)}
                className="terminal-metric"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="strategies" className="terminal-rail-content">
          <div className="terminal-field">
            <Label htmlFor="strategy-select">Strategy</Label>
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger id="strategy-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="strangle">Short Strangle</SelectItem>
                <SelectItem value="straddle">Short Straddle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {strategy === "strangle" && (
            <div className="strategy-fields">
              <div className="terminal-field">
                <Label htmlFor="strike-distance">Strike distance</Label>
                <Input id="strike-distance" type="number" value={strikeDistance} onChange={(event) => setStrikeDistance(Number(event.target.value))} />
              </div>
              <div className="terminal-check-row">
                <Checkbox id="buy-hedges" checked={useHedges} onCheckedChange={setUseHedges} />
                <Label htmlFor="buy-hedges">Buy hedges</Label>
              </div>
              <div className="terminal-field">
                <Label htmlFor="hedge-distance">Hedge distance</Label>
                <Input id="hedge-distance" type="number" value={hedgeDistance} onChange={(event) => setHedgeDistance(Number(event.target.value))} disabled={!useHedges} />
              </div>
            </div>
          )}

          <div className="strategy-risk">
            <div className="terminal-check-row">
              <ShieldAlert aria-hidden="true" />
              <Checkbox id="place-sl" checked={useStopLoss} onCheckedChange={setUseStopLoss} />
              <Label htmlFor="place-sl">Stop-loss order</Label>
            </div>
            <div className="terminal-field">
              <Label htmlFor="sl-percent">SL percentage</Label>
              <Input id="sl-percent" type="number" value={slPercent} onChange={(event) => setSlPercent(Number(event.target.value))} disabled={!useStopLoss} />
            </div>
          </div>

          <Button className="terminal-execute-button" onClick={handleStrategy}>Execute strategy</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StrategyExecutionPanel;
