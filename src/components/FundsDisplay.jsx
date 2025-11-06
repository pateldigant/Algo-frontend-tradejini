// src/components/FundsDisplay.jsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingDown, CreditCard } from "lucide-react";

function FundsDisplay({ funds }) {
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0.00";
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(num);
  };

  const availableMargin = funds?.d?.availMargin ?? 0;
  const usedMargin = funds?.d?.marginUsed ?? 0;
  const totalMargin = availableMargin + usedMargin;
  const utilizationPercent = totalMargin > 0 ? (usedMargin / totalMargin) * 100 : 0;

  return (
    <Card className="shadow-md border-slate-200 bg-gradient-to-br from-white to-slate-50">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200 shadow-sm">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg shadow-md">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Available Margin</p>
              <p className="text-2xl font-bold text-green-700">
                ₹{formatNumber(availableMargin)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border-2 border-orange-200 shadow-sm">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-lg shadow-md">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">Used Margin</p>
              <p className="text-2xl font-bold text-orange-700">
                ₹{formatNumber(usedMargin)}
              </p>
              <p className="text-xs text-orange-600 font-medium mt-1">
                {utilizationPercent.toFixed(1)}% utilized
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200 shadow-sm">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg shadow-md">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total Margin</p>
              <p className="text-2xl font-bold text-blue-700">
                ₹{formatNumber(totalMargin)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FundsDisplay;