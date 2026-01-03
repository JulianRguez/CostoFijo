// AutGoogle.jsx
import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import "./AutGoogle.css";

export default function AutGoogle({ setAutenticado, setUsuario }) {
  // ✅ Manejar inicio de sesión con Google
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const nombre = decoded.name || "";
      const correo = decoded.email;

      if (!correo) {
        console.error("No se obtuvo el correo de la cuenta de Google.");
        return;
      }

      // 🔹 Verificar si el cliente ya existe
      try {
        const { data } = await axios.get(`/api/clie/${correo}`);

        // ✅ Cliente encontrado: iniciar sesión directamente
        setUsuario(data);
        setAutenticado(true);
      } catch (error) {
        // 🔸 Si el cliente no existe, crearlo automáticamente
        if (
          error.response &&
          (error.response.status === 404 ||
            (error.response.data &&
              error.response.data.mensaje === "Cliente no encontrado"))
        ) {
          try {
            const payload = [{ nombre, mail: correo }];
            const { data } = await axios.post(`/api/clie`, payload);

            if (data && (Array.isArray(data) || typeof data === "object")) {
              const userData = data.clients?.[0] || data;
              setUsuario(userData);
              setAutenticado(true);
            }
          } catch (createError) {
            console.error("Error al crear cliente desde Google:", createError);
          }
        } else {
          console.error("Error al buscar cliente por correo:", error);
        }
      }
    } catch (decodeError) {
      console.error("Error al decodificar el token de Google:", decodeError);
    }
  };

  const handleGoogleError = () => {
    console.error("Error al iniciar sesión con Google");
  };

  return (
    <div className="autgoogle-container">
      <p className="autgoogle-text">Inicia sesión con Google</p>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        type="standard"
        shape="pill"
        text="signin_with"
        theme="outline"
      />
    </div>
  );
}
