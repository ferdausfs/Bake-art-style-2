import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations?.().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
