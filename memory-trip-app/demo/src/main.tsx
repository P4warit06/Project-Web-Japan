import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { installFakeApi } from "./fake-api";
import "@fontsource/noto-sans-thai-looped/thai-400.css";
import "@fontsource/noto-sans-thai-looped/thai-500.css";
import "@fontsource/noto-sans-thai-looped/thai-600.css";
import "@fontsource/noto-sans-thai-looped/latin-400.css";
import "@fontsource/noto-sans-thai-looped/latin-500.css";
import "@fontsource/noto-sans-thai-looped/latin-600.css";
import "@fontsource/taviraj/thai-400.css";
import "@fontsource/taviraj/thai-500.css";
import "@fontsource/taviraj/thai-600.css";
import "@fontsource/taviraj/latin-400.css";
import "@fontsource/taviraj/latin-500.css";
import "@fontsource/taviraj/latin-600.css";
import "@fontsource/dseg7-classic/latin-400.css";
import "./styles.css";

installFakeApi();

const root = document.getElementById("root");
if (!root) throw new Error("#root is missing from index.html");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
