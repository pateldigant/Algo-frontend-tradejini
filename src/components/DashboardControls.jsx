// src/components/DashboardControls.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const DashboardControls = ({
  strikeRange, setStrikeRange,
  orderLots, setOrderLots,
  isBasketMode, setIsBasketMode
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="strike-range">Strike Range (ATM ±{strikeRange})</Label>
            <Input
              id="strike-range"
              type="range"
              min={5} max={50} step={5}
              value={strikeRange}
              onChange={(e) => setStrikeRange(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trade-lots">Trade Lots</Label>
            <Input
              id="trade-lots"
              type="number"
              min="1"
              value={orderLots}
              onChange={(e) => setOrderLots(Number(e.target.value))}
            />
          </div>
        </div>
        <Separator />
        <div className="flex items-center space-x-2">
          <Switch
            id="basket-mode"
            checked={isBasketMode}
            onCheckedChange={setIsBasketMode}
          />
          <Label htmlFor="basket-mode">Basket Mode</Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardControls;