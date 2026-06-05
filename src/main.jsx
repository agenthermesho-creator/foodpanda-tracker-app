import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import Framework7 from "framework7/lite-bundle";
import Framework7React from "framework7-react";

// Framework7 core styles + iOS theme + icons
import "framework7/css/bundle";

// App styles
import "./index.css";

// Register Framework7 React plugin
Framework7.use(Framework7React);

import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
