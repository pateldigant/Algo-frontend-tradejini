
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, TrendingUp, Activity, Play, Square, Box, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = "http://localhost:8000"; // Adjust if needed

const StrategyView = () => {
   const [state, setState] = useState(null);
   const [loading, setLoading] = useState(true);

   const fetchStatus = async () => {
      try {
         const res = await fetch(`${API_BASE}/api/strategy/status`);
         const data = await res.json();
         setState(data);
         setLoading(false);
      } catch (e) {
         console.error("Failed to fetch strategy status", e);
      }
   };

   useEffect(() => {
      const interval = setInterval(fetchStatus, 1000); // 1s poll
      return () => clearInterval(interval);
   }, []);

   if (loading || !state) return <div className="p-4 text-center">Loading Strategy Engine...</div>;

   // Derive Steps Status for 6-step Enhanced ICT Pipeline
   const hasSweep = !!state.last_sweep;
   const hasDisplacement = !!state.active_displacement;
   const hasOrderBlock = !!state.active_order_block;
   const hasCELevel = !!state.active_ce_level;
   const hasMarketStructure = state.market_structure !== 'NEUTRAL';
   const hasSignal = !!state.trade_signal;
   const hasPendingOrder = !!state.pending_order;
   const activeSetupType = state.active_setup?.type || null;
   const preferredType =
      state.market_structure === 'BULLISH'
         ? 'LONG'
         : state.market_structure === 'BEARISH'
            ? 'SHORT'
            : null;
   const setupAlignment =
      activeSetupType && preferredType
         ? activeSetupType === preferredType
            ? 'ALIGNED'
            : 'COUNTER_TREND'
         : null;

   // Pipeline Step Color Logic
   const getStepColor = (isActive, isComplete) => {
      if (isComplete) return "bg-green-100 border-green-500 text-green-700";
      if (isActive) return "bg-blue-100 border-blue-500 text-blue-700 animate-pulse";
      return "bg-slate-50 border-slate-200 text-slate-400";
   };

   return (
      <div className="space-y-6">

         {/* Header / Control */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <h2 className="text-2xl font-bold text-slate-800">Enhanced ICT Order Block Strategy (Live)</h2>
               <Badge variant={state.status === "RUNNING" ? "default" : "destructive"} className="text-sm">
                  {state.status}
               </Badge>
            </div>
            <div className="text-xl font-mono font-bold text-blue-600">
               NIFTY: {state.current_price?.toFixed(2)}
            </div>
         </div>

         {/* Data Status */}
         <div className="flex gap-4 text-sm text-slate-600">
            <div>1m Candles: <span className="font-mono font-bold">{state.candles_1m_count || 0}</span></div>
            <div>5m Candles: <span className="font-mono font-bold">{state.candles_5m_count || 0}</span></div>
            <div>HTF Trend: <span className={`font-bold ${state.market_structure === 'BULLISH' ? 'text-green-600' : state.market_structure === 'BEARISH' ? 'text-red-600' : 'text-slate-400'}`}>
               {state.market_structure}
            </span></div>
         </div>

         {/* 6-Step Enhanced ICT Algorithm Pipeline */}
         <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">

            {/* Step 1: Liquidity Sweep */}
            <Card className={`border-2 ${getStepColor(true, hasSweep)}`}>
               <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-1">
                     <Activity className="w-3 h-3" /> Step 1: Sweep
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  {hasSweep ? (
                     <div>
                        <div className="font-bold text-sm">{state.last_sweep.type} SWEEP</div>
                        <div className="text-xs font-mono mt-1">Level: {state.last_sweep.price?.toFixed(2)}</div>

                        {state.last_sweep.quality && (
                           <div className="text-xs mt-1">
                              <span className={`font-bold ${state.last_sweep.quality === 'HIGH' ? 'text-green-600' : 'text-amber-600'}`}>
                                 {state.last_sweep.quality}
                              </span>
                              {state.last_sweep.touches && ` (${state.last_sweep.touches} touches)`}
                           </div>
                        )}

                        <div className="text-xs mt-2 text-slate-600">
                           Expected: <span className="font-semibold">{state.last_sweep.direction_expected}</span>
                        </div>
                     </div>
                  ) : (
                     <div className="italic text-xs">Scanning swings...</div>
                  )}
               </CardContent>
            </Card>

            {/* Step 2: Displacement */}
            <Card className={`border-2 ${getStepColor(hasSweep, hasDisplacement)}`}>
               <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-1">
                     <TrendingUp className="w-3 h-3" /> Step 2: Displacement
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  {hasDisplacement ? (
                     <div>
                        <div className="font-bold text-sm">{state.active_displacement.type}</div>
                        <div className="text-xs mt-1">
                           Move: <span className="font-mono font-bold">{state.active_displacement.move_pct?.toFixed(3)}%</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                           Body: {state.active_displacement.body_size?.toFixed(1)} pts
                        </div>
                        <div className="text-xs text-green-600 font-semibold mt-2">✓ Confirmed</div>
                     </div>
                  ) : hasSweep ? (
                     <div>
                        <div className="text-xs text-blue-600 animate-pulse">
                           Waiting for reversal...
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                           Need 0.08% move
                        </div>
                     </div>
                  ) : (
                     <div className="italic text-xs">Pending sweep</div>
                  )}
               </CardContent>
            </Card>

            {/* Step 3: Order Block */}
            <Card className={`border-2 ${getStepColor(hasDisplacement, hasOrderBlock)}`}>
               <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-1">
                     <Box className="w-3 h-3" /> Step 3: Order Block
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  {hasOrderBlock ? (
                     <div>
                        <div className="font-bold text-sm">{state.active_order_block.type.replace('_', ' ')}</div>
                        <div className="text-xs font-mono mt-1">
                           High: {state.active_order_block.high?.toFixed(2)}
                        </div>
                        <div className="text-xs font-mono">
                           Low: {state.active_order_block.low?.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                           Range: {state.active_order_block.range?.toFixed(1)} pts
                        </div>
                        <div className="text-xs text-green-600 font-semibold mt-2">✓ Identified</div>
                     </div>
                  ) : hasDisplacement ? (
                     <div className="text-xs text-blue-600 animate-pulse">
                        Searching last opposite candle...
                     </div>
                  ) : (
                     <div className="italic text-xs">Awaiting displacement</div>
                  )}
               </CardContent>
            </Card>

            {/* Step 4: CE Level (Entry Zone) */}
            <Card className={`border-2 ${getStepColor(hasOrderBlock, hasCELevel)}`}>
               <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-1">
                     <Target className="w-3 h-3" /> Step 4: CE Level
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  {hasCELevel ? (
                     <div>
                        <div className="font-bold text-sm">Entry Zone</div>
                        <div className="text-xs font-mono mt-1 bg-blue-50 p-1 rounded border border-blue-200">
                           CE: {state.active_ce_level.ce_level?.toFixed(2)}
                        </div>
                        <div className="text-xs font-mono mt-1">
                           Top: {state.active_ce_level.ce_top?.toFixed(2)}
                        </div>
                        <div className="text-xs font-mono">
                           Bot: {state.active_ce_level.ce_bottom?.toFixed(2)}
                        </div>
                        {hasSignal ? (
                           <div className="text-xs mt-2 text-blue-600 font-bold">
                              ORDER FILLED
                           </div>
                        ) : hasPendingOrder ? (
                           <div className="text-xs mt-2 text-amber-600 font-bold">
                              LIMIT PLACED
                           </div>
                        ) : (
                           <div className="text-xs mt-2 text-amber-600 animate-pulse">
                              Waiting retest...
                           </div>
                        )}
                     </div>
                  ) : hasOrderBlock ? (
                     <div className="text-xs text-blue-600 animate-pulse">
                        Calculating 50% OB...
                     </div>
                  ) : (
                     <div className="italic text-xs">Awaiting OB</div>
                  )}
               </CardContent>
            </Card>

            {/* Step 5: Market Structure */}
            <Card className={`border-2 ${getStepColor(true, hasMarketStructure)}`}>
               <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-1">
                     <BarChart3 className="w-3 h-3" /> Step 5: HTF Trend
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div>
                     <div className={`font-bold text-sm ${state.market_structure === 'BULLISH' ? 'text-green-600' : state.market_structure === 'BEARISH' ? 'text-red-600' : 'text-slate-400'}`}>
                        {state.market_structure}
                     </div>
                     <div className="text-xs text-slate-600 mt-2">
                        {state.market_structure === 'BULLISH' ? 'Higher Highs' : state.market_structure === 'BEARISH' ? 'Lower Lows' : 'No clear trend'}
                     </div>
                     {hasMarketStructure && (
                        <div className="text-xs mt-2 space-y-1">
                           <div className="text-slate-500">
                              Trade {state.market_structure === 'BULLISH' ? 'LONG' : 'SHORT'} preferred
                           </div>
                           {activeSetupType && setupAlignment === 'COUNTER_TREND' && (
                              <div className="font-semibold text-amber-600">
                                 Active setup: {activeSetupType} (counter-trend)
                              </div>
                           )}
                           {activeSetupType && setupAlignment === 'ALIGNED' && (
                              <div className="font-semibold text-green-600">
                                 Active setup: {activeSetupType} (trend-aligned)
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>

            {/* Step 6: Entry Signal */}
            <Card className={`border-2 ${getStepColor(hasCELevel || hasPendingOrder, state.trade_signal?.status === 'OPEN')}`}>
               <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-1">
                     <CheckCircle className="w-3 h-3" /> Step 6: Signal
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  {state.trade_signal ? (
                     <div className="animate-in fade-in zoom-in duration-300">
                        <div className={`font-bold text-sm ${state.trade_signal.type === 'LONG' ? 'text-green-600' : 'text-red-600'}`}>
                           {state.trade_signal.type}
                        </div>
                        <div className="text-xs text-slate-500 mb-1">{state.trade_signal.time}</div>
                        <div className="space-y-1 text-xs font-mono">
                           <div>EP: {state.trade_signal.entry?.toFixed(1)}</div>
                           <div>SL: {state.trade_signal.sl?.toFixed(1)}</div>
                           <div className="text-blue-600 font-bold">TP: {state.trade_signal.tp?.toFixed(1)}</div>
                        </div>
                        <div className={`text-xs mt-2 font-bold ${state.trade_signal.status === 'OPEN' ? 'text-blue-600' : state.trade_signal.status === 'WIN' ? 'text-green-600' : 'text-red-600'}`}>
                           {state.trade_signal.status}
                        </div>
                     </div>
                  ) : state.pending_order ? (
                     <div className="animate-in fade-in zoom-in duration-300">
                        <div className={`font-bold text-sm ${state.pending_order.type === 'LONG' ? 'text-green-600' : 'text-red-600'}`}>
                           {state.pending_order.type} LIMIT
                        </div>
                        <div className="text-xs text-slate-500 mb-1">
                           {new Date(state.pending_order.created_at).toLocaleTimeString()}
                        </div>
                        <div className="space-y-1 text-xs font-mono">
                           <div>EP: {state.pending_order.entry?.toFixed(1)}</div>
                           <div>SL: {state.pending_order.sl?.toFixed(1)}</div>
                           <div className="text-blue-600 font-bold">TP: {state.pending_order.tp?.toFixed(1)}</div>
                        </div>
                        <div className="text-xs mt-2 font-bold text-amber-600">
                           PENDING
                        </div>
                     </div>
                  ) : (
                     <div className="italic text-xs">No active or pending signal</div>
                  )}
               </CardContent>
            </Card>

         </div>

         {state.pending_order && (
            <Card className="border-2 border-amber-300 bg-amber-50">
               <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                     <AlertCircle className="w-4 h-4" />
                     Pending Order Details
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                     <div>
                        <div className="text-xs text-slate-600">Setup ID</div>
                        <div className="font-mono text-xs break-all">{state.pending_order.setup_id}</div>
                     </div>
                     <div>
                        <div className="text-xs text-slate-600">Order Type</div>
                        <div className={`font-bold ${state.pending_order.type === 'LONG' ? 'text-green-600' : 'text-red-600'}`}>
                           {state.pending_order.type} LIMIT
                        </div>
                     </div>
                     <div>
                        <div className="text-xs text-slate-600">Placed At</div>
                        <div className="font-mono text-xs">
                           {new Date(state.pending_order.created_at).toLocaleTimeString()}
                        </div>
                     </div>
                     <div>
                        <div className="text-xs text-slate-600">Expires At</div>
                        <div className="font-mono text-xs">
                           {new Date(state.pending_order.expires_at).toLocaleTimeString()}
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
         )}

         {/* Active Setup Details (if present) */}
         {state.active_setup && (
            <Card className="border-2 border-blue-300 bg-blue-50">
               <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                     <AlertCircle className="w-4 h-4" />
                     Active Setup Details
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                     <div>
                        <div className="text-xs text-slate-600">Setup Type</div>
                        <div className="font-bold">{state.active_setup.type}</div>
                     </div>
                     {state.active_setup.sweep && (
                        <div>
                           <div className="text-xs text-slate-600">Sweep Quality</div>
                           <div className={`font-bold ${state.active_setup.sweep.quality === 'HIGH' ? 'text-green-600' : 'text-amber-600'}`}>
                              {state.active_setup.sweep.quality}
                           </div>
                        </div>
                     )}
                     {state.active_ce_level && (
                        <>
                           <div>
                              <div className="text-xs text-slate-600">Entry Price</div>
                              <div className="font-mono font-bold">{state.active_ce_level.entry_price?.toFixed(2)}</div>
                           </div>
                           <div>
                              <div className="text-xs text-slate-600">Risk:Reward</div>
                              <div className="font-bold">
                                 {(() => {
                                    const entry = state.active_ce_level.entry_price;
                                    const sl = state.active_ce_level.stop_loss;
                                    const tp = state.active_ce_level.take_profit;

                                    if (entry && sl && tp) {
                                       const risk = Math.abs(entry - sl);
                                       const reward = Math.abs(tp - entry);
                                       const ratio = risk > 0 ? (reward / risk).toFixed(1) : '?';
                                       return `1:${ratio}`;
                                    }
                                    return '1:?';
                                 })()}
                              </div>
                           </div>
                        </>
                     )}
                  </div>
               </CardContent>
            </Card>
         )}

         {/* Virtual Trade Log */}
         <Card>
            <CardHeader>
               <CardTitle>Virtual Trade Log</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-500">
                     <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                           <th className="px-6 py-3">Time</th>
                           <th className="px-6 py-3">Type</th>
                           <th className="px-6 py-3">Entry</th>
                           <th className="px-6 py-3">Exit</th>
                           <th className="px-6 py-3">SL</th>
                           <th className="px-6 py-3">TP</th>
                           <th className="px-6 py-3">Status</th>
                           <th className="px-6 py-3">P&L</th>
                        </tr>
                     </thead>
                     <tbody>
                        {state.virtual_trades && state.virtual_trades.length > 0 ? (
                           state.virtual_trades.slice().reverse().map((trade, i) => (
                              <tr key={i} className="bg-white border-b hover:bg-slate-50">
                                 <td className="px-6 py-4 font-mono text-xs">{trade.time}</td>
                                 <td className={`px-6 py-4 font-bold ${trade.type === 'LONG' ? 'text-green-600' : 'text-red-600'}`}>
                                    {trade.type}
                                 </td>
                                 <td className="px-6 py-4 font-mono">{trade.entry?.toFixed(1)}</td>
                                 <td className="px-6 py-4 font-mono">{trade.exit_price ? trade.exit_price.toFixed(1) : '-'}</td>
                                 <td className="px-6 py-4 font-mono">{trade.sl?.toFixed(1)}</td>
                                 <td className="px-6 py-4 font-mono">{trade.tp?.toFixed(1)}</td>
                                 <td className="px-6 py-4">
                                    <Badge
                                       variant={trade.status === 'WIN' ? 'default' : trade.status === 'LOSS' ? 'destructive' : 'outline'}
                                       className="text-xs"
                                    >
                                       {trade.status}
                                    </Badge>
                                 </td>
                                 <td className={`px-6 py-4 font-mono font-bold ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {trade.pnl ? `₹${trade.pnl.toFixed(0)}` : '-'}
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan="8" className="px-6 py-4 text-center text-slate-400">No trades generated yet today.</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </CardContent>
         </Card>

      </div>
   );
};

export default StrategyView;
