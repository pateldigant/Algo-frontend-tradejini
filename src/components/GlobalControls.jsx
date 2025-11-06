import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Zap, Hash, Target } from "lucide-react";

const GlobalControls = ({
  orderLots,
  setOrderLots,
  strikeRange,
  setStrikeRange,
  isBasketMode,
  setIsBasketMode,
  isFastMode,
  setIsFastMode
}) => {
  return (
    <Card className="shadow-md border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-8">
          {/* Left Section - Trading Parameters */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
              <Hash className="h-5 w-5 text-slate-600" />
              <div className="flex flex-col gap-1">
                <Label htmlFor="trade-lots" className="text-xs text-slate-600 font-medium">Trade Lots</Label>
                <Input
                  id="trade-lots"
                  type="number"
                  min="1"
                  value={orderLots}
                  onChange={(e) => setOrderLots(Number(e.target.value))}
                  className="w-20 h-8 text-center font-semibold border-slate-300 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 min-w-[320px]">
              <Target className="h-5 w-5 text-slate-600" />
              <div className="flex flex-col gap-1 flex-1">
                <Label htmlFor="strike-range" className="text-xs text-slate-600 font-medium">
                  Strike Range: ATM ±{strikeRange}
                </Label>
                <Input
                  id="strike-range"
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={strikeRange}
                  onChange={(e) => setStrikeRange(Number(e.target.value))}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="h-14 bg-slate-300" />

          {/* Right Section - Mode Toggles */}
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
              isBasketMode
                ? 'bg-blue-50 border-blue-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <ShoppingCart className={`h-5 w-5 transition-colors ${
                isBasketMode ? 'text-blue-600' : 'text-slate-500'
              }`} />
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="basket-mode"
                  className={`text-xs font-medium cursor-pointer transition-colors ${
                    isBasketMode ? 'text-blue-700' : 'text-slate-600'
                  }`}
                >
                  Basket Mode
                </Label>
                <Switch
                  id="basket-mode"
                  checked={isBasketMode}
                  onCheckedChange={setIsBasketMode}
                />
              </div>
            </div>

            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
              isFastMode
                ? 'bg-orange-50 border-orange-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <Zap className={`h-5 w-5 transition-colors ${
                isFastMode ? 'text-orange-600' : 'text-slate-500'
              }`} />
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="fast-mode"
                  className={`text-xs font-medium cursor-pointer transition-colors ${
                    isFastMode ? 'text-orange-700' : 'text-slate-600'
                  }`}
                >
                  Fast Mode
                </Label>
                <Switch
                  id="fast-mode"
                  checked={isFastMode}
                  onCheckedChange={setIsFastMode}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalControls;