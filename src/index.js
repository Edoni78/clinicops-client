import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { SignalRProvider } from "./context/SignalRContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <SignalRProvider>
        <App />
      </SignalRProvider>
    </AuthProvider>
  </React.StrictMode>
);
