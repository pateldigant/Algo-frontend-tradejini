import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const GlobalControls = ({
  orderLots,
  setOrderLots,
  strikeRange,
  setStrikeRange,
  isBasketMode,
  setIsBasketMode
}) => {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-around gap-6">
        <div className="flex items-center gap-3">
          <Label htmlFor="trade-lots" className="font-semibold">Trade Lots</Label>
          <Input
            id="trade-lots"
            type="number"
            min="1"
            value={orderLots}
            onChange={(e) => setOrderLots(Number(e.target.value))}
            className="w-24 h-9"
          />
        </div>
        <div className="flex items-center gap-3 w-64">
          <Label htmlFor="strike-range" className="font-semibold">Strike Range (ATM ±{strikeRange})</Label>
          <Input
            id="strike-range"
            type="range"
            min={5} max={50} step={5}
            value={strikeRange}
            onChange={(e) => setStrikeRange(Number(e.target.value))}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="basket-mode"
            checked={isBasketMode}
            onCheckedChange={setIsBasketMode}
          />
          <Label htmlFor="basket-mode" className="font-semibold">Basket Mode</Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalControls;