import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// The panel now accepts orderLots as a prop
const StrategyExecutionPanel = ({ orderLots, onExecute }) => {
  const [strategy, setStrategy] = useState('strangle');
  const [useHedges, setUseHedges] = useState(false);
  const [useStopLoss, setUseStopLoss] = useState(true);
  
  // State for parameters
  const [strikeDistance, setStrikeDistance] = useState(3);
  const [hedgeDistance, setHedgeDistance] = useState(5);
  const [slPercent, setSlPercent] = useState(25);

  const handleExecute = (strategyName) => {
    const payload = {
      strategy: strategyName,
      lots: orderLots,
      strike_distance: strikeDistance,
      use_hedges: useHedges,
      hedge_distance: hedgeDistance,
      stop_loss: {
        enabled: useStopLoss,
        percent: slPercent,
      }
    };
    // Call the handler passed from the parent
    onExecute(payload);
  };
  
  const handleSimpleExecute = (strategyName) => {
     const payload = {
      strategy: strategyName,
      lots: orderLots,
      stop_loss: { enabled: false } // No SL for simple scalp/buy by default
    };
    onExecute(payload);
  }

  // ... (renderStrategyParams function remains mostly the same, but now uses state)
  const renderStrategyParams = () => {
    switch (strategy) {
      case 'strangle':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="strike-distance">Strike Distance (from ATM)</Label>
              <Input id="strike-distance" type="number" value={strikeDistance} onChange={(e) => setStrikeDistance(Number(e.target.value))} />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="buy-hedges" checked={useHedges} onCheckedChange={setUseHedges} />
              <Label htmlFor="buy-hedges">Buy Hedges</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hedge-distance" className={!useHedges ? 'text-muted-foreground' : ''}>Hedge Distance (from Short)</Label>
              <Input id="hedge-distance" type="number" value={hedgeDistance} onChange={(e) => setHedgeDistance(Number(e.target.value))} disabled={!useHedges} />
            </div>
          </>
        );
      case 'straddle':
        return <p className="text-sm text-muted-foreground">This strategy sells the ATM Call and Put.</p>;
      default:
        return null;
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Execution</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scalp">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scalp">Quick Scalp</TabsTrigger>
            <TabsTrigger value="strats">Spreads & Strats</TabsTrigger>
          </TabsList>

          <TabsContent value="scalp" className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-12" onClick={() => handleSimpleExecute('scalp_call')}>Scalp ATM Call</Button>
              <Button variant="outline" className="h-12" onClick={() => handleSimpleExecute('scalp_put')}>Scalp ATM Put</Button>
            </div>
          </TabsContent>

          <TabsContent value="strats" className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strategy-select">Select Strategy</Label>
              <Select onValueChange={setStrategy} defaultValue="strangle">
                <SelectTrigger id="strategy-select">
                  <SelectValue placeholder="Select a strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strangle">Short Strangle</SelectItem>
                  <SelectItem value="straddle">Short Straddle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            <div className="space-y-2">
                <h4 className="text-sm font-semibold">Parameters</h4>
                {renderStrategyParams()}
            </div>
            
            <Separator />
            <div className="space-y-4">
                <h4 className="text-sm font-semibold">Risk Management</h4>
                <div className="flex items-center space-x-2">
                    <Checkbox id="place-sl" checked={useStopLoss} onCheckedChange={setUseStopLoss} />
                    <Label htmlFor="place-sl">Place Stop-Loss Order</Label>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sl-percent" className={!useStopLoss ? 'text-muted-foreground' : ''}>SL Percentage (%)</Label>
                    <Input id="sl-percent" type="number" value={slPercent} onChange={(e) => setSlPercent(Number(e.target.value))} disabled={!useStopLoss} />
                </div>
            </div>
            
            <Button className="w-full" onClick={() => handleExecute(strategy)}>Execute Strategy</Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StrategyExecutionPanel;