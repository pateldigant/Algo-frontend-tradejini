import Dashboard from "./pages/Dashboard";
import StrategyView from "./pages/StrategyView";
import { Toaster } from "./components/ui/toaster";
import { ToastProvider } from "./components/ui/toast";
import { TrendingUp, Activity, LayoutDashboard, BrainCircuit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function App() {
  return (
    <ToastProvider>
      <main className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 min-h-screen">
        <div className="p-4 sm:px-6 lg:px-8">
          <header className="text-center py-6 mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-slate-800 bg-clip-text text-transparent tracking-tight">
                NIFTY Terminal
              </h1>
            </div>
          </header>

          <Tabs defaultValue="dashboard" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                <TabsTrigger value="dashboard" className="flex gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Live Data
                </TabsTrigger>
                <TabsTrigger value="strategy" className="flex gap-2">
                  <BrainCircuit className="w-4 h-4" /> Strategy
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dashboard">
              <Dashboard />
            </TabsContent>

            <TabsContent value="strategy">
              <StrategyView />
            </TabsContent>
          </Tabs>

        </div>
        <Toaster />
      </main>
    </ToastProvider>
  );
}


export default App;