import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import "@/styles/base.css";
import "@/styles/shell.css";
import "@/styles/editor.css";
import "@/styles/boards.css";
import "@/styles/overlays.css";
import "@/styles/responsive.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
