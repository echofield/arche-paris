
  import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./viewport.css";
import "./styles/globals.css";

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('ARCHÉ: Offline ready'))
      .catch((err) => console.log('SW registration failed:', err));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
  