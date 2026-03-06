import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Inicio from "./ecommerce/Inicio";
import Cam from "./Cam/Cam";
import { GoogleOAuthProvider } from "@react-oauth/google";

const AdminApp = lazy(() => import("./admin/App"));
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/p/:id" element={<Inicio />} />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={null}>
                <AdminApp />
              </Suspense>
            }
          />
          <Route path="/cam/*" element={<Cam />} />
        </Routes>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
