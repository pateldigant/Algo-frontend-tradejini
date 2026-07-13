import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Sparkles, ShieldAlert } from "lucide-react";

const StrategyExecutionPanel = ({ orderLots, onExecute, selectedUnderlying = "NIFTY", scalpBuyingPower = null }) => {
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

  const formatCurrency = (value) => {
    if (!Number.isFinite(value)) return "--";
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPrice = (value) => {
    if (!Number.isFinite(value)) return "--";
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleExecute = (strategyName) => {
    onExecute({
      strategy: strategyName,
      lots: orderLots,
      strike_distance: strikeDistance,
      use_hedges: useHedges,
      hedge_distance: hedgeDistance,
      stop_loss: {
        enabled: useStopLoss,
        percent: slPercent,
      },
    });
  };

  const handleSimpleExecute = (strategyName) => {
    onExecute({
      strategy: strategyName,
      lots: orderLots,
      stop_loss: { enabled: false },
      scalp_sl_points: parseOptionalPoints(scalpSlPoints),
      scalp_tp_points: parseOptionalPoints(scalpTpPoints),
    });
  };

  const renderScalpBuyingPower = (label, data, tone) => (
    <div className={`rounded-xl border bg-white px-3 py-2.5 shadow-sm ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">{label}</div>
        <div className="terminal-metric text-xs text-slate-500">@ {formatPrice(data?.ltp)}</div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <div className="terminal-section-title text-current/60">Required</div>
          <div className="terminal-metric mt-1 text-sm font-semibold">Rs {formatCurrency(data?.requiredMargin)}</div>
        </div>
        <div className="text-right">
          <div className="terminal-section-title text-current/60">Max Lots</div>
          <div className="terminal-metric mt-1 text-sm font-semibold">{Number.isFinite(data?.maxLots) ? data.maxLots : "--"}</div>
        </div>
      </div>
    </div>
  );

  const renderStrategyParams = () => {
    switch (strategy) {
      case "strangle":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="strike-distance">Strike Distance</Label>
              <Input id="strike-distance" type="number" value={strikeDistance} onChange={(e) => setStrikeDistance(Number(e.target.value))} />
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox id="buy-hedges" checked={useHedges} onCheckedChange={setUseHedges} />
              <Label htmlFor="buy-hedges">Buy Hedges</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hedge-distance" className={!useHedges ? "text-muted-foreground" : ""}>Hedge Distance</Label>
              <Input id="hedge-distance" type="number" value={hedgeDistance} onChange={(e) => setHedgeDistance(Number(e.target.value))} disabled={!useHedges} />
            </div>
          </>
        );
      case "straddle":
        return <p className="text-sm text-muted-foreground">Sell the ATM call and put together.</p>;
      default:
        return null;
    }
  };

  return (
    <Card className="terminal-shell border-0">
      <CardHeader className="border-b border-slate-200/80 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="terminal-section-title">Execution Rail</p>
            <CardTitle className="mt-2 text-xl font-semibold text-slate-900">{selectedUnderlying} quick scalp and spread controls</CardTitle>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Lots {orderLots}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <Tabs defaultValue="scalp">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
            <TabsTrigger value="scalp" className="rounded-lg">Quick Scalp</TabsTrigger>
            <TabsTrigger value="strats" className="rounded-lg">Spreads & Strats</TabsTrigger>
          </TabsList>

          <TabsContent value="scalp" className="space-y-4 pt-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-slate-700">
                <Sparkles className="h-4 w-4" />
                <p className="text-sm font-semibold">Fast directional entries</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-14 rounded-xl border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50" onClick={() => handleSimpleExecute("scalp_call")}>
                  Scalp ATM Call
                </Button>
                <Button variant="outline" className="h-14 rounded-xl border-rose-200 bg-white text-rose-700 hover:bg-rose-50" onClick={() => handleSimpleExecute("scalp_put")}>
                  Scalp ATM Put
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {renderScalpBuyingPower("ATM Call", scalpBuyingPower?.call, "border-emerald-200 text-emerald-900")}
                {renderScalpBuyingPower("ATM Put", scalpBuyingPower?.put, "border-rose-200 text-rose-900")}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="scalp-sl-points">SL Points</Label>
                  <Input
                    id="scalp-sl-points"
                    type="number"
                    min="0"
                    step="0.05"
                    value={scalpSlPoints}
                    onChange={(e) => setScalpSlPoints(e.target.value)}
                    className="h-10 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scalp-tp-points">TP Points</Label>
                  <Input
                    id="scalp-tp-points"
                    type="number"
                    min="0"
                    step="0.05"
                    value={scalpTpPoints}
                    onChange={(e) => setScalpTpPoints(e.target.value)}
                    className="h-10 rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="strats" className="space-y-4 pt-5">
            <div className="space-y-2">
              <Label htmlFor="strategy-select">Strategy</Label>
              <Select onValueChange={setStrategy} defaultValue="strangle">
                <SelectTrigger id="strategy-select" className="rounded-xl">
                  <SelectValue placeholder="Select a strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strangle">Short Strangle</SelectItem>
                  <SelectItem value="straddle">Short Straddle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">Parameters</p>
              {renderStrategyParams()}
            </div>

            <Separator />

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-amber-800">
                <ShieldAlert className="h-4 w-4" />
                <p className="text-sm font-semibold">Risk Management</p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="place-sl" checked={useStopLoss} onCheckedChange={setUseStopLoss} />
                <Label htmlFor="place-sl">Place Stop-Loss Order</Label>
              </div>
              <div className="mt-3 space-y-2">
                <Label htmlFor="sl-percent" className={!useStopLoss ? "text-muted-foreground" : ""}>SL Percentage (%)</Label>
                <Input id="sl-percent" type="number" value={slPercent} onChange={(e) => setSlPercent(Number(e.target.value))} disabled={!useStopLoss} />
              </div>
            </div>

            <Button className="h-12 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800" onClick={() => handleExecute(strategy)}>
              Execute Strategy
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StrategyExecutionPanel;
