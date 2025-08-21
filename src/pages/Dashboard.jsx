import React, { useEffect, useState, useMemo } from "react";
import { useToast } from "@/components/hooks/use-toast";

// Import UI Primitives
import { Card, CardContent } from "@/components/ui/card";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

// Import Custom Components
import OptionChainTable from "@/components/OptionChainTable";
import FundsDisplay from "@/components/FundsDisplay";
import OpenOrdersTable from "@/components/OpenOrdersTable";
import PositionsTable from "@/components/PositionsTable";
import GlobalControls from "@/components/GlobalControls";
import StrategyExecutionPanel from "@/components/StrategyExecutionPanel";
import Basket from "@/components/Basket";
import ActionModals from "@/components/ActionModals";

const POLLING_INTERVAL_MS = 1000;

function Dashboard() {
  const [data, setData] = useState(null);
  const [prevData, setPrevData] = useState(null);
  const [positions, setPositions] = useState([]);
  const [funds, setFunds] = useState(null);
  const [openOrders, setOpenOrders] = useState([]);
  const [strikeRange, setStrikeRange] = useState(10);
  const [orderLots, setOrderLots] = useState(1);
  const [positionLots, setPositionLots] = useState(1);
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [selectedPositions, setSelectedPositions] = useState(new Set());
  const [isBasketMode, setIsBasketMode] = useState(false);
  const [isFastMode, setIsFastMode] = useState(false); 
  const [basket, setBasket] = useState([]);
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  const { toast } = useToast();

  const handleExecuteStrategy = async (strategyDetails) => {
    try {
      const response = await fetch("http://localhost:8000/api/execute-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(strategyDetails),
      });
      const result = await response.json();
      if (response.ok) {
        toast({ title: "Strategy Executed", description: result.msg || "Orders sent successfully." });
      } else {
        toast({ variant: "destructive", title: "Execution Failed", description: result.detail || "An unknown error occurred." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "API Error", description: "Failed to connect to the backend." });
    }
  };

  const fetchData = async (url, setter) => {
    try {
      const response = await fetch(`http://localhost:8000/api/${url}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.s === "ok") {
        setter(result.d);
      }
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
    }
  };
  const fetchSnapshot = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/latest");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setData(currentData => {
        setPrevData(currentData);
        return result.nifty;
      });
    } catch (error) {
      console.error("Error fetching snapshot:", error);
      setData(null);
    }
  };
  const postRequest = async (url, body, successMsg, errorMsg) => {
    try {
        const response = await fetch(`http://localhost:8000/api/${url}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const result = await response.json();
        if (response.ok) {
            toast({ title: "Success", description: result.msg || result.details || successMsg });
        } else {
            toast({ variant: "destructive", title: "Error", description: result.detail || errorMsg });
        }
    } catch (err) {
        toast({ variant: "destructive", title: "Request Failed", description: errorMsg });
    } finally {
        setModalState({ type: null, data: null });
        setTimeout(() => {
            fetchData("enriched-positions", setPositions);
            fetchData("orderbook", setOpenOrders);
        }, 500);
    }
  };
  useEffect(() => {
    const initialFetch = () => {
      fetchSnapshot();
      fetchData("enriched-positions", setPositions);
      fetchData("funds", (d) => setFunds({d}));
      fetchData("orderbook", setOpenOrders);
    };
    initialFetch();
    const id1 = setInterval(fetchSnapshot, POLLING_INTERVAL_MS);
    const id2 = setInterval(() => fetchData("enriched-positions", setPositions), POLLING_INTERVAL_MS);
    const id3 = setInterval(() => fetchData("funds", (d) => setFunds({d})), POLLING_INTERVAL_MS * 2);
    const id4 = setInterval(() => fetchData("orderbook", (d) => {
      if(Array.isArray(d)) {
        const pending = d.filter(o => ["open", "trigger_pending"].includes(o.status?.toLowerCase()));
        setOpenOrders(pending);
      }
    }), POLLING_INTERVAL_MS);
    return () => {
      clearInterval(id1);
      clearInterval(id2);
      clearInterval(id3);
      clearInterval(id4);
    };
  }, []);
  const handleInitiateOrder = (orderData, lots) => {
    const tradeLots = lots || 1;
    const order = { ...orderData, lots: tradeLots, quantity: tradeLots * orderData.lot };
    
    if (isBasketMode) {
      setBasket(prev => [...prev, order]);
      toast({ title: "Added to Basket", description: `${order.symId} was added to your order basket.` });
    } else if (isFastMode) {
      // If Fast Mode is on, execute immediately
      handleConfirmOrder(order);
    } else {
      // Otherwise, show confirmation modal
      setModalState({ type: 'confirmOrder', data: order });
    }
  };
  
  // Modified to accept an argument instead of relying on state
  const handleConfirmOrder = (order) => {
    if (!order) return;
    const { symId, lot, side, lots } = order;
    postRequest("place-order", { symId, qty: lots * lot, side }, "Order placed successfully.", "Failed to place order.");
  };

  // Modified to accept an argument
  const handleSquareOff = (position) => {
    if (!position) return;
    postRequest("squareoff", { symId: position.symId }, "Position squared off.", "Square-off failed.");
  };

  const handleBulkSquareOff = () => {
    postRequest("squareoff-multiple", { symIds: Array.from(selectedPositions) }, "Selected positions squared off.", "Bulk square-off failed.");
    setSelectedPositions(new Set());
  };
  const handleLiquidatePortfolio = () => {
    postRequest("liquidate-portfolio", {}, "Portfolio liquidation initiated.", "Liquidation failed.");
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
  const handleExecuteBasket = () => {
      postRequest("place-basket-order", { orders: basket }, "Basket order executed.", "Basket execution failed.");
      setBasket([]);
  };
  const displayedPositions = useMemo(() => {
    return showOnlyActive ? positions.filter(p => p.netQty !== 0) : positions;
  }, [positions, showOnlyActive]);


  return (
    <div className="space-y-6">
      <FundsDisplay funds={funds} />

      <GlobalControls
        orderLots={orderLots}
        setOrderLots={setOrderLots}
        strikeRange={strikeRange}
        setStrikeRange={setStrikeRange}
        isBasketMode={isBasketMode}
        setIsBasketMode={setIsBasketMode}
        isFastMode={isFastMode}       
        setIsFastMode={setIsFastMode} 
      />
      
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[800px] rounded-lg border"
      >
        <ResizablePanel defaultSize={58}>
          <div className="flex h-full flex-col gap-6 p-4">
            <PositionsTable
              positions={displayedPositions}
              allPositions={positions}
              showOnlyActive={showOnlyActive}
              setShowOnlyActive={setShowOnlyActive}
              positionLots={positionLots}
              setPositionLots={setPositionLots}
              selectedPositions={selectedPositions}
              setSelectedPositions={setSelectedPositions}
              onPlaceOrder={handleInitiateOrder}
              onExit={(position) => {
                if (isFastMode) {
                  handleSquareOff(position); // Execute directly in Fast Mode
                } else {
                  setModalState({ type: 'confirmSquareOff', data: position });
                }
              }}
              onExitSelected={() => setModalState({ type: 'confirmBulkSquareOff', data: null })}
              onExitAll={() => setModalState({ type: 'confirmLiquidate', data: null })}
            />
            <OpenOrdersTable
              orders={openOrders}
              onModify={(order) => setModalState({ type: 'modifyOrder', data: order })}
              onCancel={handleCancelOrder}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={42}>
          <div className="flex h-full flex-col gap-6 p-4">
            <StrategyExecutionPanel 
              orderLots={orderLots}
              onExecute={handleExecuteStrategy} 
            />
            
            <Card className="flex-1">
              <CardContent className="p-2 h-full">
                {data && data.option_chain ? (
                  <OptionChainTable 
                    optionChain={data.option_chain} 
                    spotPrice={data.spot_price}
                    atmStrike={data.atm_strike}
                    prevOptionChain={prevData?.option_chain}
                    strikeRange={strikeRange}
                    onPlaceOrder={(orderData) => handleInitiateOrder(orderData, orderLots)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground p-10">Loading option chain data...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {isBasketMode && basket.length > 0 && (
        <Basket 
          basket={basket} 
          onExecute={() => setModalState({ type: 'confirmBasket', data: null })} 
          onClear={() => setBasket([])}
          onRemove={(index) => setBasket(basket.filter((_, i) => i !== index))}
        />
      )}

      <ActionModals
        modalState={modalState}
        onClose={() => setModalState({ type: null, data: null })}
        actions={{
          // Pass the modified handlers to the modal
          handleConfirmOrder: () => handleConfirmOrder(modalState.data),
          handleSquareOff: () => handleSquareOff(modalState.data),
          handleBulkSquareOff,
          handleLiquidatePortfolio,
          handleModifyOrder,
          handleExecuteBasket,
        }}
        basket={basket}
        selectedPositions={selectedPositions}
      />
    </div>
  );
}

export default Dashboard;