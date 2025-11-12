// src/index.js
import "./polyfills";
import React from "react";
import { createRoot } from "react-dom/client";

import * as serviceWorker from "./serviceWorker";

import { HashRouter } from "react-router-dom";
import "./assets/base.scss";
import Main from "./Pages/Main";
import configureAppStore from "./config/configureStore";
import { Provider } from "react-redux";

// Importa el AuthProvider
import { AuthProvider } from "./context/AuthContext"; // Asegúrate de que la ruta sea correcta

const store = configureAppStore();
const rootElement = document.getElementById("root");

const renderApp = (Component) => (
  <React.StrictMode>
    {/* Envuelve tu aplicación con el AuthProvider */}
    <AuthProvider>
      <Provider store={store}>
        <HashRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Component />
        </HashRouter>
      </Provider>
    </AuthProvider>
  </React.StrictMode>
);

const root = createRoot(rootElement);
root.render(renderApp(Main));

if (module.hot) {
  module.hot.accept("./Pages/Main", () => {
    const NextApp = require("./Pages/Main").default;
    root.render(renderApp(NextApp));
  });
}
serviceWorker.unregister();
