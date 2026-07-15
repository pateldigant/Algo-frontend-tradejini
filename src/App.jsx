import Dashboard from "./pages/Dashboard";
import { Toaster } from "./components/ui/toaster";
import { ToastProvider } from "./components/ui/toast";

function App() {
  return (
    <ToastProvider>
      <main className="terminal-page">
        <Dashboard />
        <Toaster />
      </main>
    </ToastProvider>
  );
}


export default App;
