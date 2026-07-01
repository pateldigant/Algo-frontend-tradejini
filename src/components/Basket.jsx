import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ShoppingCart, Layers3 } from "lucide-react";

function Basket({ basket, onExecute, onClear, onRemove }) {
  if (basket.length === 0) return null;

  const totalLots = basket.reduce((sum, order) => sum + (order.lots || 0), 0);
  const buyCount = basket.filter((order) => order.side === "BUY").length;
  const sellCount = basket.filter((order) => order.side === "SELL").length;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[480px] max-w-[92vw]">
      <Card className="terminal-shell overflow-hidden border-0 shadow-[0_20px_80px_rgba(15,23,42,0.18)]">
        <CardHeader className="border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff,#f3f7fb)] px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="terminal-section-title">Execution Queue</p>
              <CardTitle className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Layers3 className="h-5 w-5 text-sky-700" />
                Order Basket ({basket.length})
              </CardTitle>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
                <div className="terminal-section-title">Lots</div>
                <div className="terminal-metric mt-1 text-lg font-semibold text-slate-900">{totalLots}</div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center shadow-sm">
                <div className="terminal-section-title text-emerald-700/80">Buy</div>
                <div className="terminal-metric mt-1 text-lg font-semibold text-emerald-800">{buyCount}</div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center shadow-sm">
                <div className="terminal-section-title text-rose-700/80">Sell</div>
                <div className="terminal-metric mt-1 text-lg font-semibold text-rose-800">{sellCount}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={onClear}>
              Clear
            </Button>
            <Button size="sm" className="rounded-lg bg-slate-900 hover:bg-slate-800" onClick={onExecute}>
              <ShoppingCart className="mr-2 h-4 w-4" /> Execute Basket
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="max-h-[260px] overflow-y-auto">
            {basket.map((order, index) => (
              <div key={index} className="flex items-center justify-between border-t border-slate-200/80 px-4 py-3">
                <div className="min-w-0 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      order.side === "BUY" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {order.side}
                    </span>
                    <span className="terminal-metric text-slate-800">{order.lots} lot</span>
                  </div>
                  <div className="mt-1 truncate text-slate-500">{order.symId}</div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onRemove(index)}>
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default Basket;
