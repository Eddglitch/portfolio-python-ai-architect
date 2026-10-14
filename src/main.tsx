import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

registerSW();

function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/portfolio-python-ai-architect/sw.js").catch(() => {});
  }
}