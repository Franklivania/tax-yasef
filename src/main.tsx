import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Router } from "./router.tsx";
import "./lib/store/useThemeStore";
import { initializeApp } from "./lib/initialize";

initializeApp().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Router />
    </StrictMode>
  );
});
