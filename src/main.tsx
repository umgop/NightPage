import React from "react";
import { createRoot } from "react-dom/client";
import App from "../App";
import "../styles/globals.css";

// Add error logging
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

const root = document.getElementById("root");
if (!root) {
  console.error("Root element not found!");
  throw new Error("Root element not found");
}

console.log("Mounting React app...");

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
