/**
 * Main entry point for the TAS Chain application
 * Critical browser compatibility fixes are loaded first
 */

// Cross-browser compatibility fixes must be first imports
import "./lib/polyfills"; // Basic polyfills
import "./lib/cross-browser-fix"; // Comprehensive cross-browser fixes

// Standard imports
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Log application startup
console.log("[TASCHAIN] Application starting...");

createRoot(document.getElementById("root")!).render(<App />);
