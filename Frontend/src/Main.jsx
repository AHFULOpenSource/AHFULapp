import React from 'react'
import ReactDOM from 'react-dom/client'
import AHFULApp from './AHFULApp.jsx'
import { StoreProvider, store, persistor } from './store.jsx'
import { PersistGate } from 'redux-persist/integration/react'
import { BrowserRouter } from "react-router-dom";
import { Loading } from "./Loading.jsx";
import { signOut } from "firebase/auth";
import { auth } from "./firebase.js";
import {
  configureSessionManager,
  installAuthFetchInterceptor,
} from "./Auth/SessionManager.js";

configureSessionManager({
  store,
  signOutHandler: () => signOut(auth),
  getFreshIdToken: async () => (auth.currentUser ? auth.currentUser.getIdToken(true) : null),
});
installAuthFetchInterceptor();

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
