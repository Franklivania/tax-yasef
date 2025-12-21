import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Router } from "./router.tsx";
import "./lib/store/useThemeStore";
import { initializeApp } from "./lib/initialize";

// Remove the immediate loading screen once React is ready
function removeLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.style.opacity = "0";
    loadingScreen.style.transition = "opacity 0.3s ease-out";
    setTimeout(() => {
      loadingScreen.remove();
    }, 300);
  }
}

// Initialize app and render
initializeApp()
  .then(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <Router />
      </StrictMode>
    );
    // Remove loading screen after React has mounted
    setTimeout(removeLoadingScreen, 100);
  })
  .catch((error) => {
    console.error("Failed to initialize app:", error);
    removeLoadingScreen();
  });
