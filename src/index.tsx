import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ExcalidrawApp from "./excalidraw-app";

import "./excalidraw-app/pwa";
import "./excalidraw-app/sentry";
window.__EXCALIDRAW_SHA__ = process.env.REACT_APP_GIT_SHA;
const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);

const appHeight = () => {
  const doc = document.documentElement;
  doc.style.setProperty("--app-height", `${window.innerHeight}px`);
};
window.addEventListener("resize", appHeight);

appHeight();

root.render(
  <StrictMode>
    <ExcalidrawApp />
  </StrictMode>,
);
