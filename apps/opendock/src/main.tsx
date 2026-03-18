import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";

import "@/styles/base.css";
import "@/styles/layout.css";
import "@/styles/shell.css";
import "@/styles/auth.css";
import "@/styles/boards.css";
import "@/styles/tickets.css";
import "@/styles/notes.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
