import Dashboard from "./pages/Dashboard";
import { Toaster } from "./components/ui/toaster";
import { ToastProvider } from "./components/ui/toast";
import { TrendingUp } from "lucide-react";

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
          <Dashboard />
        </div>
        <Toaster />
      </main>
    </ToastProvider>
  );
}


export default App;
