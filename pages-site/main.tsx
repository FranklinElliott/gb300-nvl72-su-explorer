import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../src/styles.css";
import { SpaApp } from "./SpaApp";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <SpaApp />
  </StrictMode>,
);
