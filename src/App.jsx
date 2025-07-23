// App.jsx
import React from "react";
import Dashboard from "./pages/Dashboard";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

function App() {
  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container">
        <h1 className="text-center text-primary mb-4 display-5 fw-bold border-bottom pb-3">
          NIFTY Live Option Chain Dashboard
        </h1>
        <Dashboard />
      </div>
    </div>
  );
}

export default App;