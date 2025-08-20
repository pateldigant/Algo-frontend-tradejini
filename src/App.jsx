import Dashboard from "./pages/Dashboard";
import { Toaster } from "./components/ui/toaster";
import { ToastProvider } from "./components/ui/toast";

function App() {
  return (
    <ToastProvider>
      <main className="bg-slate-50 min-h-screen">
        {/* The change is in the line below */}
        <div className="p-4 sm:px-6 lg:px-8">
          <header className="text-center py-6">
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
              NIFTY Live Option Chain
            </h1>
            <p className="text-muted-foreground mt-2">
              A modern dashboard for real-time analysis and trading.
            </p>
          </header>
          <Dashboard />
        </div>
        <Toaster />
      </main>
    </ToastProvider>
  );
}

export default App;