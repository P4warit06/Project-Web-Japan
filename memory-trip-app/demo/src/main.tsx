import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { installFakeApi } from "./fake-api";
import "@fontsource/ibm-plex-sans-thai/thai-400.css";
import "@fontsource/ibm-plex-sans-thai/thai-500.css";
import "@fontsource/ibm-plex-sans-thai/thai-600.css";
import "@fontsource/ibm-plex-sans-thai/latin-400.css";
import "@fontsource/ibm-plex-sans-thai/latin-500.css";
import "@fontsource/ibm-plex-sans-thai/latin-600.css";
import "@fontsource/maitree/thai-400.css";
import "@fontsource/maitree/thai-500.css";
import "@fontsource/maitree/thai-600.css";
import "@fontsource/maitree/latin-400.css";
import "@fontsource/maitree/latin-500.css";
import "@fontsource/maitree/latin-600.css";
import "./styles.css";

installFakeApi();

const root = document.getElementById("root");
if (!root) throw new Error("#root is missing from index.html");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
