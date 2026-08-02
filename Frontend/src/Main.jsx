import React from 'react'
import ReactDOM from 'react-dom/client'
import AHFULApp from './AHFULApp.jsx'
import { StoreProvider, persistor } from './store.jsx'
import { PersistGate } from 'redux-persist/integration/react'
import { BrowserRouter } from "react-router-dom";
import { Loading } from "./Loading.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StoreProvider>
      <PersistGate loading={<Loading />} persistor={persistor}>
          <BrowserRouter>
            <AHFULApp/>
          </BrowserRouter>
      </PersistGate>
    </StoreProvider>
  </React.StrictMode>,
);
