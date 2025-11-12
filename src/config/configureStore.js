import { configureStore } from "@reduxjs/toolkit";
import reducers from "../reducers";

let storeInstance = null;

export default function configureAppStore() {
  storeInstance = configureStore({
    reducer: reducers,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        },
      }),
    devTools: process.env.NODE_ENV !== "production",
  });

  return storeInstance;
}

export const getStore = () => storeInstance;
