import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // Any component in the App tree can access the authentication state and data
  <AuthProvider>
    <App />
  </AuthProvider>
);