import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useToast } from "@/components/hooks/use-toast";

import OptionChainTable from "@/components/OptionChainTable";
import TerminalHeader from "@/components/TerminalHeader";
import OpenOrdersTable from "@/components/OpenOrdersTable";
import PositionsTable from "@/components/PositionsTable";
import GlobalControls from "@/components/GlobalControls";
import StrategyExecutionPanel from "@/components/StrategyExecutionPanel";
import Basket from "@/components/Basket";
import ActionModals from "@/components/ActionModals";

const POLLING_INTERVAL_MS = 1000;
const TAKE_PROFIT_STORAGE_KEY = "positionTakeProfitTriggers";
const AUTO_SQUAREOFF_STORAGE_KEY = "squareoffBeforeClose";
const HOTKEY_SETTINGS_STORAGE_KEY = "terminalHotkeySettings";
const DEFAULT_HOTKEY_SETTINGS = { enabled: false, exitAll: "X" };
const SL_SOUND_PATH = "/sounds/SL.wav";
const TP_SOUND_PATH = "/sounds/TP.wav";

const isPendingOrderStatus = (status) => ["open", "trigger_pending"].includes(String(status || "").toLowerCase());
const isCompletedOrderStatus = (status) => {
  const normalized = String(status || "").toLowerCase();
  return ["complete", "completed", "filled", "traded"].includes(normalized);
};
const isStopOrder = (order) => String(order?.type || "").toLowerCase().includes("stop");

function Dashboard() {
  const [data, setData] = useState(null);
  const [prevData, setPrevData] = useState(null);
  const [positions, setPositions] = useState([]);
  const [funds, setFunds] = useState(null);
  const [runtimeStatus, setRuntimeStatus] = useState(null);
  const [dayCharges, setDayCharges] = useState(null);
  const [openOrders, setOpenOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [orderbookMode, setOrderbookMode] = useState(null);
  const [orderbookPayloadId, setOrderbookPayloadId] = useState(0);
  const [takeProfitEvents, setTakeProfitEvents] = useState([]);
  const [takeProfitEventsMode, setTakeProfitEventsMode] = useState(null);
  const [takeProfitEventsPayloadId, setTakeProfitEventsPayloadId] = useState(0);
  const [strikeRange, setStrikeRange] = useState(10);
  const [orderLots, setOrderLots] = useState(1);
  const [positionLots, setPositionLots] = useState(1);
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [selectedPositions, setSelectedPositions] = useState(new Set());
  const [isBasketMode, setIsBasketMode] = useState(false);
  const [isFastMode, setIsFastMode] = useState(false);
  const [isPaperMode, setIsPaperMode] = useState(() => window.localStorage.getItem("paperMode") === "true");
  const [isSquareoffBeforeCloseEnabled, setIsSquareoffBeforeCloseEnabled] = useState(
    () => window.localStorage.getItem(AUTO_SQUAREOFF_STORAGE_KEY) === "true",
  );
  const [selectedUnderlying, setSelectedUnderlying] = useState(() => window.localStorage.getItem("selectedUnderlying") || "NIFTY");
  const [basket, setBasket] = useState([]);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [liveSocketConnected, setLiveSocketConnected] = useState(false);
  const [hotkeySettings, setHotkeySettings] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(HOTKEY_SETTINGS_STORAGE_KEY) || "null");
      const savedExitAll = typeof saved?.exitAll === "string" ? saved.exitAll : DEFAULT_HOTKEY_SETTINGS.exitAll;
      return {
        enabled: Boolean(saved?.enabled),
        exitAll: savedExitAll.slice(0, 1).toUpperCase(),
      };
    } catch {
      return DEFAULT_HOTKEY_SETTINGS;
    }
  });
  const [takeProfitTriggers, setTakeProfitTriggers] = useState(() => {
    try {
      const raw = window.localStorage.getItem(TAKE_PROFIT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const tradingMode = isPaperMode ? "paper" : "real";
  const slAudioRef = useRef(null);
  const tpAudioRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const stopOrderStatusRef = useRef(new Map());
  const orderbookInitializedRef = useRef(false);
  const seenTakeProfitEventIdsRef = useRef(new Set());
  const takeProfitEventsInitializedRef = useRef(false);
  const autoSquareoffInitializedRef = useRef(false);
  const tradingModeRef = useRef(tradingMode);
  const selectedUnderlyingRef = useRef(selectedUnderlying);
  const accountFetchInFlightRef = useRef(false);
  const exitAllHotkeyActionRef = useRef(null);

  const { toast } = useToast();
  tradingModeRef.current = tradingMode;
  selectedUnderlyingRef.current = selectedUnderlying;

  const applyOrderbook = useCallback((orders) => {
    if (tradingMode !== tradingModeRef.current) return;
    setOrderbookMode(tradingMode);
    setOrderbookPayloadId((current) => current + 1);
    if (Array.isArray(orders)) {
      setAllOrders(orders);
      setOpenOrders(orders.filter((o) => isPendingOrderStatus(o.status)));
    } else {
      setAllOrders([]);
      setOpenOrders([]);
    }
  }, [tradingMode]);

  const applyTakeProfitEvents = useCallback((events) => {
    if (tradingMode !== tradingModeRef.current) return;
    setTakeProfitEventsMode(tradingMode);
    setTakeProfitEventsPayloadId((current) => current + 1);
    setTakeProfitEvents(Array.isArray(events) ? events : []);
  }, [tradingMode]);

  const applyAccountState = useCallback((state) => {
    if (!state) return;
    setPositions(Array.isArray(state.positions) ? state.positions : []);
    setFunds({ d: state.funds || {} });
    applyOrderbook(Array.isArray(state.orderbook) ? state.orderbook : []);
    setTakeProfitTriggers(state.takeProfitTriggers || {});
    applyTakeProfitEvents(Array.isArray(state.takeProfitEvents) ? state.takeProfitEvents : []);
    setDayCharges(state.dayCharges?.d || state.dayCharges || null);
    if (state.runtimeStatus) {
      setRuntimeStatus(state.runtimeStatus);
    }
  }, [applyOrderbook, applyTakeProfitEvents]);

  const playSound = useCallback((type) => {
    const audio = type === "tp" ? tpAudioRef.current : slAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.warn(`Unable to play ${type.toUpperCase()} sound:`, error);
    });
  }, []);

  const getUnderlyingFromSymId = (symId) => {
    if (typeof symId !== "string") return null;
    if (symId.includes("_NIFTY_")) return "NIFTY";
    if (symId.includes("_SENSEX_")) return "SENSEX";
    return null;
  };

  const applySnapshotPayload = useCallback((snapshotPayload) => {
    if (!snapshotPayload) return;
    setData((currentData) => {
      setPrevData(currentData);
      return snapshotPayload;
    });
  }, []);

  const handleExecuteStrategy = async (strategyDetails) => {
    try {
      const response = await fetch("http://localhost:8000/api/execute-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...strategyDetails, mode: tradingMode, underlying: selectedUnderlying }),
      });
      const result = await response.json();
      if (response.ok) {
        toast({ title: "Strategy Executed", description: result.msg || "Orders sent successfully." });
      } else {
        toast({ variant: "destructive", title: "Execution Failed", description: result.detail || "An unknown error occurred." });
      }
    } catch {
      toast({ variant: "destructive", title: "API Error", description: "Failed to connect to the backend." });
    }
  };

  const fetchSnapshot = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/latest?underlying=${selectedUnderlying}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      applySnapshotPayload(result);
    } catch (error) {
      console.error("Error fetching snapshot:", error);
      setData(null);
    }
  }, [applySnapshotPayload, selectedUnderlying]);

  const fetchAccountState = useCallback(async () => {
    if (accountFetchInFlightRef.current) return;
    accountFetchInFlightRef.current = true;
    const requestedMode = tradingMode;
    const requestedUnderlying = selectedUnderlying;
    try {
      const response = await fetch(`http://localhost:8000/api/account-state?mode=${tradingMode}&underlying=${selectedUnderlying}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (
        result.s === "ok"
        && requestedMode === tradingModeRef.current
        && requestedUnderlying === selectedUnderlyingRef.current
      ) {
        applyAccountState(result.d);
      }
    } catch (error) {
      console.error("Error fetching account state:", error);
    } finally {
      accountFetchInFlightRef.current = false;
    }
  }, [applyAccountState, selectedUnderlying, tradingMode]);

  const postRequest = async (url, body, successMsg, errorMsg) => {
    let ok = false;
    try {
      const response = await fetch(`http://localhost:8000/api/${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, mode: tradingMode }),
      });
      const result = await response.json();
      ok = response.ok;
      if (ok) {
        toast({ title: "Success", description: result.msg || result.details || successMsg });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.detail || errorMsg });
      }
    } catch {
      toast({ variant: "destructive", title: "Request Failed", description: errorMsg });
    } finally {
      setModalState({ type: null, data: null });
      if (ok) {
        fetchAccountState();
        setTimeout(() => {
          fetchAccountState();
        }, 1200);
      }
    }
    return ok;
  };

  const syncSquareoffBeforeClose = useCallback(async ({ showToast = false, warnOnFailure = false } = {}) => {
    try {
      const response = await fetch("http://localhost:8000/api/squareoff-before-close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: isSquareoffBeforeCloseEnabled, mode: tradingMode }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || "Failed to update auto squareoff.");
      }

      if (showToast) {
        toast({
          title: isSquareoffBeforeCloseEnabled ? "Auto Squareoff Armed" : "Auto Squareoff Disabled",
          description: isSquareoffBeforeCloseEnabled
            ? `Will exit all ${tradingMode} positions at 3:25 PM IST.`
            : "3:25 PM squareoff is off.",
        });
      }
      return true;
    } catch (error) {
      if (showToast || warnOnFailure) {
        toast({
          variant: "destructive",
          title: "Auto Squareoff Sync Failed",
          description: error.message || "Could not update backend squareoff setting.",
        });
      }
      return false;
    }
  }, [isSquareoffBeforeCloseEnabled, toast, tradingMode]);

  useEffect(() => {
    slAudioRef.current = new Audio(SL_SOUND_PATH);
    tpAudioRef.current = new Audio(TP_SOUND_PATH);
    slAudioRef.current.preload = "auto";
    tpAudioRef.current.preload = "auto";

    const unlockAudio = () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;
      for (const audio of [slAudioRef.current, tpAudioRef.current]) {
        if (!audio) continue;
        audio.muted = true;
        audio.play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.muted = false;
          })
          .catch(() => {
            audio.muted = false;
          });
      }
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("paperMode", String(isPaperMode));
    setSelectedPositions(new Set());
  }, [isPaperMode]);

  useEffect(() => {
    stopOrderStatusRef.current = new Map();
    orderbookInitializedRef.current = false;
    seenTakeProfitEventIdsRef.current = new Set();
    takeProfitEventsInitializedRef.current = false;
    setAllOrders([]);
    setOpenOrders([]);
    setTakeProfitEvents([]);
    setOrderbookMode(null);
    setTakeProfitEventsMode(null);
  }, [tradingMode]);

  useEffect(() => {
    window.localStorage.setItem(AUTO_SQUAREOFF_STORAGE_KEY, String(isSquareoffBeforeCloseEnabled));

    syncSquareoffBeforeClose({
      showToast: autoSquareoffInitializedRef.current,
      warnOnFailure: isSquareoffBeforeCloseEnabled,
    }).finally(() => {
      autoSquareoffInitializedRef.current = true;
    });
  }, [isSquareoffBeforeCloseEnabled, syncSquareoffBeforeClose]);

  useEffect(() => {
    if (!isSquareoffBeforeCloseEnabled) return undefined;
    const syncInterval = setInterval(() => {
      syncSquareoffBeforeClose();
    }, 60_000);

    return () => {
      clearInterval(syncInterval);
    };
  }, [isSquareoffBeforeCloseEnabled, syncSquareoffBeforeClose]);

  useEffect(() => {
    window.localStorage.setItem("selectedUnderlying", selectedUnderlying);
    setSelectedPositions(new Set());
  }, [selectedUnderlying]);

  useEffect(() => {
    window.localStorage.setItem(TAKE_PROFIT_STORAGE_KEY, JSON.stringify(takeProfitTriggers));
  }, [takeProfitTriggers]);

  useEffect(() => {
    window.localStorage.setItem(HOTKEY_SETTINGS_STORAGE_KEY, JSON.stringify(hotkeySettings));
  }, [hotkeySettings]);

  useEffect(() => {
    const initialFetch = () => {
      fetchSnapshot();
      fetchAccountState();
    };

    initialFetch();

    const snapshotInterval = !liveSocketConnected ? setInterval(fetchSnapshot, POLLING_INTERVAL_MS) : null;
    const accountStateInterval = setInterval(fetchAccountState, POLLING_INTERVAL_MS);

    return () => {
      if (snapshotInterval) clearInterval(snapshotInterval);
      clearInterval(accountStateInterval);
    };
  }, [fetchAccountState, fetchSnapshot, liveSocketConnected]);

  useEffect(() => {
    if (orderbookMode !== tradingMode || orderbookPayloadId === 0) return;

    if (!orderbookInitializedRef.current) {
      for (const order of allOrders) {
        if (order?.orderId && isStopOrder(order)) {
          stopOrderStatusRef.current.set(order.orderId, String(order.status || "").toLowerCase());
        }
      }
      orderbookInitializedRef.current = true;
      return;
    }

    for (const order of allOrders) {
      const orderId = order?.orderId;
      if (!orderId || !isStopOrder(order)) continue;

      const previousStatus = stopOrderStatusRef.current.get(orderId);
      const currentStatus = String(order.status || "").toLowerCase();
      if (previousStatus && isPendingOrderStatus(previousStatus) && isCompletedOrderStatus(currentStatus)) {
        playSound("sl");
      }
      stopOrderStatusRef.current.set(orderId, currentStatus);
    }
  }, [allOrders, orderbookMode, orderbookPayloadId, playSound, tradingMode]);

  useEffect(() => {
    if (takeProfitEventsMode !== tradingMode || takeProfitEventsPayloadId === 0) return;

    if (!takeProfitEventsInitializedRef.current) {
      for (const event of takeProfitEvents) {
        if (event?.id) {
          seenTakeProfitEventIdsRef.current.add(event.id);
        }
      }
      takeProfitEventsInitializedRef.current = true;
      return;
    }

    for (const event of takeProfitEvents) {
      const eventId = event?.id;
      if (!eventId || seenTakeProfitEventIdsRef.current.has(eventId)) continue;
      seenTakeProfitEventIdsRef.current.add(eventId);
      playSound("tp");
    }
  }, [playSound, takeProfitEvents, takeProfitEventsMode, takeProfitEventsPayloadId, tradingMode]);

  useEffect(() => {
    let cancelled = false;
    let socket = null;

    const connect = () => {
      socket = new WebSocket(`ws://localhost:8000/ws/market?underlying=${selectedUnderlying}`);

      socket.onopen = () => {
        if (!cancelled) {
          setLiveSocketConnected(true);
        }
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "market.bootstrap") {
            if (payload.snapshot) {
              applySnapshotPayload(payload.snapshot);
            }
            if (payload.runtimeStatus) {
              setRuntimeStatus(payload.runtimeStatus);
            }
            return;
          }

          if (payload.type === "market.snapshot" && payload.snapshot) {
            applySnapshotPayload(payload.snapshot);
          }
        } catch (error) {
          console.error("Failed to parse live market payload:", error);
        }
      };

      socket.onclose = () => {
        if (!cancelled) {
          setLiveSocketConnected(false);
        }
      };

      socket.onerror = () => {
        if (!cancelled) {
          setLiveSocketConnected(false);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      setLiveSocketConnected(false);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [applySnapshotPayload, selectedUnderlying]);

  const scalpBuyingPower = useMemo(() => {
    const atmRow = data?.option_chain?.find((row) => row.strike === data?.atm_strike);
    const availableMargin = Number(funds?.d?.availMargin);

    const buildSide = (optionData) => {
      const ltp = Number(optionData?.ltp);
      const lotSize = Number(optionData?.lot);
      if (!Number.isFinite(ltp) || ltp <= 0 || !Number.isFinite(lotSize) || lotSize <= 0) {
        return null;
      }

      const marginPerLot = ltp * lotSize;
      return {
        symId: optionData.symId,
        ltp,
        lotSize,
        marginPerLot,
        requiredMargin: marginPerLot * Math.max(Number(orderLots) || 0, 0),
        maxLots: Number.isFinite(availableMargin) && availableMargin > 0
          ? Math.floor(availableMargin / marginPerLot)
          : 0,
      };
    };

    return {
      availableMargin: Number.isFinite(availableMargin) ? availableMargin : 0,
      call: buildSide(atmRow?.CE),
      put: buildSide(atmRow?.PE),
    };
  }, [data, funds, orderLots]);

  const handleInitiateOrder = (orderData, lots) => {
    const tradeLots = Number(lots) || 1;
    const lotSize = Number(orderData?.lot);
    if (!orderData?.symId || !orderData?.side || !Number.isFinite(lotSize) || lotSize <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Order",
        description: "The selected option contract is missing symbol or lot details.",
      });
      return false;
    }

    const order = { ...orderData, lot: lotSize, lots: tradeLots, quantity: tradeLots * lotSize };

    if (isBasketMode) {
      setBasket((prev) => [...prev, order]);
      toast({ title: "Added to Basket", description: `${order.symId} was added to your order basket.` });
      return true;
    } else if (isFastMode) {
      return handleConfirmOrder(order);
    } else {
      setModalState({ type: "confirmOrder", data: order });
      return true;
    }
  };

  const handleConfirmOrder = (order) => {
    if (!order) return false;
    const { symId, lot, side, lots } = order;
    const qty = Number(lots) * Number(lot);
    if (!symId || !side || !Number.isFinite(qty) || qty <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Order",
        description: "Order quantity could not be calculated from the selected lots.",
      });
      return false;
    }
    return postRequest("place-order", { symId, qty, side }, "Order placed successfully.", "Failed to place order.");
  };

  const handleSquareOff = (position) => {
    if (!position) return;
    setTakeProfitTriggers((current) => {
      const next = { ...current };
      delete next[position.symId];
      return next;
    });
    postRequest("squareoff", { symId: position.symId }, "Position squared off.", "Square-off failed.");
  };

  const handleBulkSquareOff = () => {
    setTakeProfitTriggers((current) => {
      const next = { ...current };
      for (const symId of selectedPositions) {
        delete next[symId];
      }
      return next;
    });
    postRequest("squareoff-multiple", { symIds: Array.from(selectedPositions) }, "Selected positions squared off.", "Bulk square-off failed.");
    setSelectedPositions(new Set());
  };

  const handleLiquidatePortfolio = () => {
    const hasActivePositions = livePositions.some((position) => (position?.netQty ?? 0) !== 0);
    if (!hasActivePositions && openOrders.length === 0) {
      toast({ variant: "destructive", title: "No Positions", description: `No ${selectedUnderlying} positions are available to exit.` });
      return;
    }
    setTakeProfitTriggers((current) => {
      const next = { ...current };
      for (const [symId, trigger] of Object.entries(next)) {
        if (trigger?.mode === tradingMode) {
          delete next[symId];
        }
      }
      return next;
    });
    postRequest(
      "liquidate-portfolio",
      {},
      "Portfolio liquidation initiated.",
      "Liquidation failed.",
    );
  };

  const handleModifyOrder = (newValues) => {
    const payload = {
      order: modalState.data,
      price: parseFloat(newValues.price) || null,
      triggerPrice: parseFloat(newValues.triggerPrice) || null,
    };
    postRequest("modify-order", payload, "Order modified successfully.", "Failed to modify order.");
  };

  const handleCancelOrder = (orderId) => {
    postRequest("cancel-order", { orderId }, "Order cancelled.", "Failed to cancel order.");
  };

  const handlePlacePositionStopLoss = ({ triggerPrice, limitPrice }) => {
    const position = modalState.data;
    const parsedTrigger = parseFloat(triggerPrice);
    if (!position || !Number.isFinite(parsedTrigger) || parsedTrigger <= 0) {
      toast({ variant: "destructive", title: "Invalid Trigger", description: "Enter a valid stop-loss trigger price." });
      return;
    }

    const side = position.netQty > 0 ? "SELL" : "BUY";
    if (position.mode === "paper") {
      postRequest(
        "place-order",
        {
          symId: position.symId,
          qty: Math.abs(position.netQty),
          side,
          type: "stopmarket",
          trigPrice: parsedTrigger,
          product: position.product || "normal",
          validity: "day",
        },
        "Paper stop-loss placed.",
        "Failed to place paper stop-loss.",
      );
      return;
    }

    const parsedLimit = parseFloat(limitPrice);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      toast({ variant: "destructive", title: "Invalid Limit", description: "Enter a valid stop-loss limit price." });
      return;
    }

    postRequest(
      "place-order",
      {
        symId: position.symId,
        qty: Math.abs(position.netQty),
        side,
        type: "stoplimit",
        trigPrice: parsedTrigger,
        limitPrice: parsedLimit,
        product: position.product || "normal",
        validity: "day",
      },
      "Real stop-loss placed.",
      "Failed to place real stop-loss.",
    );
  };

  const handlePlacePositionTakeProfit = async ({ triggerPrice }) => {
    const position = modalState.data;
    const parsedTrigger = parseFloat(triggerPrice);
    const netQty = position?.netQty ?? 0;
    const ltp = Number(position?.ltp);

    if (!position || netQty === 0) {
      toast({ variant: "destructive", title: "No Active Position", description: "Take-profit can only be armed for an active position." });
      return;
    }
    if (!Number.isFinite(parsedTrigger) || parsedTrigger <= 0) {
      toast({ variant: "destructive", title: "Invalid Trigger", description: "Enter a valid take-profit trigger price." });
      return;
    }
    if (Number.isFinite(ltp)) {
      if (netQty > 0 && parsedTrigger <= ltp) {
        toast({ variant: "destructive", title: "Invalid Take-Profit", description: "For a long position, TP must be above current LTP." });
        return;
      }
      if (netQty < 0 && parsedTrigger >= ltp) {
        toast({ variant: "destructive", title: "Invalid Take-Profit", description: "For a short position, TP must be below current LTP." });
        return;
      }
    }

    try {
      const response = await fetch("http://localhost:8000/api/arm-take-profit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symId: position.symId, triggerPrice: parsedTrigger, mode: tradingMode }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || "Failed to arm take-profit.");
      }
      setTakeProfitTriggers(result.d || {});
      setModalState({ type: null, data: null });
      toast({
        title: "Take-Profit Armed",
        description: result.msg || `${position.symId} TP set at ${parsedTrigger.toFixed(2)}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "TP Arm Failed",
        description: error.message || "Failed to arm take-profit.",
      });
    }
  };

  const handleExecuteBasket = () => {
    const formattedOrders = basket.map((order) => ({
      symId: order.symId,
      qty: order.lots * order.lot,
      side: order.side,
      type: order.type || "MARKET",
    }));
    postRequest("place-basket-order", { orders: formattedOrders }, "Basket order executed.", "Basket execution failed.");
    setBasket([]);
  };

  const optionChainLtpMap = useMemo(() => {
    const map = new Map();
    for (const row of data?.option_chain || []) {
      if (row.CE?.symId && Number.isFinite(row.CE?.ltp)) {
        map.set(row.CE.symId, row.CE.ltp);
      }
      if (row.PE?.symId && Number.isFinite(row.PE?.ltp)) {
        map.set(row.PE.symId, row.PE.ltp);
      }
    }
    return map;
  }, [data]);

  const livePositions = useMemo(() => {
    return positions.map((position) => {
      const liveLtp = optionChainLtpMap.get(position.symId);
      if (!Number.isFinite(liveLtp)) {
        return position;
      }

      const netQty = position?.netQty ?? 0;
      const isIntraday = (position?.buyQty ?? 0) > 0 || (position?.sellQty ?? 0) > 0;
      let unrealizedPnlLive = position?.unrealizedPnlLive ?? 0;

      if (netQty > 0) {
        const avgPrice = isIntraday ? (position?.buyAvgPrice ?? 0) : (position?.netAvgPrice ?? 0);
        unrealizedPnlLive = (liveLtp - avgPrice) * netQty;
      } else if (netQty < 0) {
        const avgPrice = isIntraday ? (position?.sellAvgPrice ?? 0) : (position?.netAvgPrice ?? 0);
        unrealizedPnlLive = (avgPrice - liveLtp) * Math.abs(netQty);
      }

      return {
        ...position,
        ltp: liveLtp,
        unrealizedPnlLive,
      };
    });
  }, [positions, optionChainLtpMap]);

  const filteredPositions = useMemo(() => {
    return livePositions.filter((position) => getUnderlyingFromSymId(position.symId) === selectedUnderlying);
  }, [livePositions, selectedUnderlying]);

  const filteredOpenOrders = useMemo(() => {
    return openOrders.filter((order) => getUnderlyingFromSymId(order.symId) === selectedUnderlying);
  }, [openOrders, selectedUnderlying]);

  const displayedPositions = useMemo(() => {
    return showOnlyActive ? livePositions.filter((p) => p.netQty !== 0) : livePositions;
  }, [livePositions, showOnlyActive]);

  exitAllHotkeyActionRef.current = () => {
    const hasActivePositions = livePositions.some((position) => (position?.netQty ?? 0) !== 0);
    if (!hasActivePositions && openOrders.length === 0) {
      toast({ variant: "destructive", title: "No Positions", description: `No ${selectedUnderlying} positions are available to exit.` });
      return;
    }
    if (isFastMode) handleLiquidatePortfolio();
    else setModalState({ type: "confirmLiquidate", data: null });
  };

  useEffect(() => {
    const configuredKey = String(hotkeySettings.exitAll || "").toUpperCase();
    if (!hotkeySettings.enabled || !configuredKey) return undefined;

    const handleHotkey = (event) => {
      const target = event.target;
      const isEditableTarget = target instanceof HTMLElement && (
        target.isContentEditable
        || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
        || Boolean(target.closest('[role="textbox"], [role="combobox"]'))
      );
      const blockingPopupIsOpen = Boolean(document.querySelector(
        '[role="dialog"], [role="alertdialog"], [role="listbox"], [role="menu"]',
      ));

      if (
        event.defaultPrevented
        || event.repeat
        || event.ctrlKey
        || event.metaKey
        || event.altKey
        || isEditableTarget
        || blockingPopupIsOpen
        || String(event.key || "").toUpperCase() !== configuredKey
      ) {
        return;
      }

      event.preventDefault();
      exitAllHotkeyActionRef.current?.();
    };

    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, [hotkeySettings.enabled, hotkeySettings.exitAll]);

  useEffect(() => {
    const flatSymbols = new Set(
      livePositions
        .filter((position) => (position?.netQty ?? 0) === 0)
        .map((position) => position.symId),
    );
    if (flatSymbols.size === 0) return;

    setTakeProfitTriggers((current) => {
      let changed = false;
      const next = { ...current };
      for (const [symId, trigger] of Object.entries(next)) {
        if (trigger?.mode === tradingMode && flatSymbols.has(symId)) {
          delete next[symId];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [livePositions, tradingMode]);

  return (
    <div className="terminal-app-shell">
      <TerminalHeader
        funds={funds}
        runtimeStatus={runtimeStatus}
        spotPrice={data?.spot_price}
        tradingMode={tradingMode}
        selectedUnderlying={selectedUnderlying}
        dayCharges={dayCharges}
        positions={livePositions}
        hotkeySettings={hotkeySettings}
        onHotkeySettingsChange={setHotkeySettings}
      />

      <GlobalControls
        orderLots={orderLots}
        setOrderLots={setOrderLots}
        strikeRange={strikeRange}
        setStrikeRange={setStrikeRange}
        isBasketMode={isBasketMode}
        setIsBasketMode={setIsBasketMode}
        isFastMode={isFastMode}
        setIsFastMode={setIsFastMode}
        isPaperMode={isPaperMode}
        setIsPaperMode={setIsPaperMode}
        isSquareoffBeforeCloseEnabled={isSquareoffBeforeCloseEnabled}
        setIsSquareoffBeforeCloseEnabled={setIsSquareoffBeforeCloseEnabled}
        selectedUnderlying={selectedUnderlying}
        setSelectedUnderlying={setSelectedUnderlying}
      />

      <div className="terminal-workspace">
        <aside className="terminal-left-rail">
          <StrategyExecutionPanel
            orderLots={orderLots}
            selectedUnderlying={selectedUnderlying}
            scalpBuyingPower={scalpBuyingPower}
            onExecute={handleExecuteStrategy}
          />
        </aside>

        <main className="terminal-chain-workspace">
          {data?.option_chain ? (
            <OptionChainTable
              optionChain={data.option_chain}
              spotPrice={data.spot_price}
              atmStrike={data.atm_strike}
              strikeInterval={data.strike_interval}
              underlying={selectedUnderlying}
              prevOptionChain={prevData?.option_chain}
              strikeRange={strikeRange}
              positions={filteredPositions}
              openOrders={filteredOpenOrders}
              onPlaceOrder={(orderData) => handleInitiateOrder(orderData, orderLots)}
            />
          ) : (
            <div className="terminal-loading">Loading {selectedUnderlying} option chain...</div>
          )}
        </main>
      </div>

      <section className="terminal-activity-dock">
        <div className="terminal-activity-grid">
          <PositionsTable
            positions={displayedPositions}
            allPositions={livePositions}
            openOrders={openOrders}
            tradingMode={tradingMode}
            showOnlyActive={showOnlyActive}
            setShowOnlyActive={setShowOnlyActive}
            positionLots={positionLots}
            setPositionLots={setPositionLots}
            selectedPositions={selectedPositions}
            setSelectedPositions={setSelectedPositions}
            onPlaceOrder={handleInitiateOrder}
            onExit={(position) => {
              if (isFastMode) handleSquareOff(position);
              else setModalState({ type: "confirmSquareOff", data: position });
            }}
            onExitSelected={() => setModalState({ type: "confirmBulkSquareOff", data: null })}
            onExitAll={() => {
              if (isFastMode) handleLiquidatePortfolio();
              else setModalState({ type: "confirmLiquidate", data: null });
            }}
            onPlaceStopLoss={(position) => setModalState({ type: "placePositionStopLoss", data: { ...position, mode: tradingMode } })}
            onPlaceTakeProfit={(position) => setModalState({ type: "placePositionTakeProfit", data: { ...position, mode: tradingMode } })}
            takeProfitTriggers={takeProfitTriggers}
          />
          <OpenOrdersTable
            orders={openOrders}
            onModify={(order) => setModalState({ type: "modifyOrder", data: order })}
            onCancel={handleCancelOrder}
          />
        </div>
      </section>

      {isBasketMode && basket.length > 0 && (
        <Basket
          basket={basket}
          onExecute={() => setModalState({ type: "confirmBasket", data: null })}
          onClear={() => setBasket([])}
          onRemove={(index) => setBasket(basket.filter((_, i) => i !== index))}
        />
      )}

      <ActionModals
        modalState={modalState}
        onClose={() => setModalState({ type: null, data: null })}
        actions={{
          handleConfirmOrder: () => handleConfirmOrder(modalState.data),
          handleSquareOff: () => handleSquareOff(modalState.data),
          handleBulkSquareOff,
          handleLiquidatePortfolio,
          handleModifyOrder,
          handleExecuteBasket,
          handlePlacePositionStopLoss,
          handlePlacePositionTakeProfit,
        }}
        basket={basket}
        selectedPositions={selectedPositions}
      />
    </div>
  );
}

export default Dashboard;
