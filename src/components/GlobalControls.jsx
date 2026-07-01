import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Zap, Hash, Target, FileText, ChartCandlestick } from "lucide-react";

const modeCards = [
  {
    key: "basket",
    label: "Basket Mode",
    icon: ShoppingCart,
    activeClasses: "border-sky-300 bg-sky-50 text-sky-800",
    inactiveClasses: "border-slate-200 bg-white text-slate-600",
  },
  {
    key: "paper",
    label: "Paper Mode",
    icon: FileText,
    activeClasses: "border-emerald-300 bg-emerald-50 text-emerald-800",
    inactiveClasses: "border-slate-200 bg-white text-slate-600",
  },
  {
    key: "fast",
    label: "Fast Mode",
    icon: Zap,
    activeClasses: "border-amber-300 bg-amber-50 text-amber-800",
    inactiveClasses: "border-slate-200 bg-white text-slate-600",
  },
];

const GlobalControls = ({
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
  selectedUnderlying,
  setSelectedUnderlying,
}) => {
  return (
    <Card className="terminal-shell border-0">
      <CardContent className="p-5">
        <div className="grid gap-5 xl:grid-cols-[1.1fr_auto_1fr] xl:items-center">
          <div className="grid gap-4 md:grid-cols-[220px_200px_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-slate-700">
                <ChartCandlestick className="h-4 w-4" />
                <p className="terminal-section-title">Underlying</p>
              </div>
              <Select value={selectedUnderlying} onValueChange={setSelectedUnderlying}>
                <SelectTrigger className="terminal-metric h-11 rounded-xl border-slate-300 font-semibold focus:ring-sky-500">
                  <SelectValue placeholder="Select underlying" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NIFTY">NIFTY</SelectItem>
                  <SelectItem value="SENSEX">SENSEX</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-slate-700">
                <Hash className="h-4 w-4" />
                <p className="terminal-section-title">Trade Lots</p>
              </div>
              <Input
                id="trade-lots"
                type="number"
                min="1"
                value={orderLots}
                onChange={(e) => setOrderLots(Number(e.target.value))}
                className="terminal-metric h-11 border-slate-300 text-center text-lg font-semibold focus-visible:ring-sky-500"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-slate-700">
                <Target className="h-4 w-4" />
                <p className="terminal-section-title">Visible Chain Window</p>
              </div>
              <div className="flex items-center gap-4">
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
                <div className="terminal-metric min-w-[82px] rounded-full bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                  ATM ±{strikeRange}
                </div>
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden h-16 bg-slate-300 xl:block" />

          <div className="grid gap-3 md:grid-cols-3">
            {modeCards.map((card) => {
              const isActive =
                (card.key === "basket" && isBasketMode) ||
                (card.key === "paper" && isPaperMode) ||
                (card.key === "fast" && isFastMode);
              const Icon = card.icon;
              const checked =
                card.key === "basket" ? isBasketMode : card.key === "paper" ? isPaperMode : isFastMode;
              const onCheckedChange =
                card.key === "basket" ? setIsBasketMode : card.key === "paper" ? setIsPaperMode : setIsFastMode;

              return (
                <div
                  key={card.key}
                  className={`rounded-2xl border px-4 py-3 shadow-sm transition-all ${isActive ? card.activeClasses : card.inactiveClasses}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2 ${isActive ? "bg-white/70" : "bg-slate-100"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <Label htmlFor={`${card.key}-mode`} className="text-sm font-semibold cursor-pointer">
                          {card.label}
                        </Label>
                        <p className="mt-1 text-xs text-slate-500">
                          {card.key === "basket" && "Queue multiple orders before execution"}
                          {card.key === "paper" && "Route orders into the virtual book"}
                          {card.key === "fast" && "Bypass confirmation for quick execution"}
                        </p>
                      </div>
                    </div>
                    <Switch id={`${card.key}-mode`} checked={checked} onCheckedChange={onCheckedChange} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalControls;
