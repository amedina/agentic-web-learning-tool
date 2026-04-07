/**
 * External dependencies
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
/**
 * Internal dependencies
 */
import "./index.css";
import SidePanel from "./sidePanel";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SidePanel />
  </StrictMode>,
);
