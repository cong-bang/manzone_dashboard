import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./utils/sockjsPolyfill"; // Import polyfill early to ensure it's available throughout the app
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
