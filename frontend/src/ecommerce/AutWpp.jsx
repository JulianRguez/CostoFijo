// AutWpp.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
const API_KEY = import.meta.env.VITE_API_KEY;
import "./AutWpp.css";

export default function AutWpp({ setAutenticado, setUsuario, onCancelar }) {
  const WPP_LINK = import.meta.env.VITE_WPP_LINK;

  const [codigo, setCodigo] = useState("");
  const [codigoValido, setCodigoValido] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [clave, setClave] = useState("");
  const [mensaje, setMensaje] = useState("Solicite o ingrese un código");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [numeroExiste, setNumeroExiste] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [timer, setTimer] = useState(null);

  // ✅ Validar código (4 dígitos, múltiplo de 81)
  useEffect(() => {
    if (codigo.length === 0) {
      setMensaje("Solicite o ingrese un código");
      setTipoMensaje("info");
      setCodigoValido(false);
    } else if (codigo.length < 4) {
      setMensaje("Ingrese clave de 4 dígitos.");
      setTipoMensaje("error");
      setCodigoValido(false);
    } else if (codigo.length === 4) {
      const num = parseInt(codigo);
      if (!isNaN(num) && num % 81 === 0) {
        setCodigoValido(true);
        setMensaje("Código válido.");
        setTipoMensaje("success");
      } else {
        setCodigoValido(false);
        setMensaje("Código incorrecto.");
        setTipoMensaje("error");
      }
    } else {
      setCodigoValido(false);
      setMensaje("Código incorrecto.");
      setTipoMensaje("error");
    }
  }, [codigo]);

  // ✅ Validar número automáticamente al dejar de escribir
  useEffect(() => {
    if (telefono.length === 10) {
      setMensaje("Revisando número...");
      setTipoMensaje("warning");
      if (timer) clearTimeout(timer);

      const newTimer = setTimeout(async () => {
        try {
          const res = await axios.get(`/api/clie/${telefono}`, {
            headers: { "x-api-key": API_KEY },
          });

          if (res.data && res.data.tel === telefono) {
            setNumeroExiste(true);
            setMensaje("Número registrado, Ingrese con usuario y contraseña.");
            setTipoMensaje("error");
          } else {
            setMensaje("Respuesta inesperada del servidor.");
            setTipoMensaje("warning");
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            if (
              error.response.data &&
              error.response.data.mensaje === "Cliente no encontrado"
            ) {
              setNumeroExiste(false);
              setMensaje("Número válido.");
              setTipoMensaje("success");
            } else {
              setMensaje("Error al validar número.");
              setTipoMensaje("error");
            }
          } else {
            setMensaje("Error al validar número.");
            setTipoMensaje("error");
          }
        }
      }, 1000);

      setTimer(newTimer);
    } else if (telefono.length > 0 && telefono.length !== 10) {
      setMensaje("Ingrese número de 10 dígitos.");
      setTipoMensaje("error");
    }
  }, [telefono]);

  // ✅ Abrir WhatsApp
  const handleIniciarRegistro = () => {
    const mensaje = encodeURIComponent("Solicito código de registro...");
    window.open(`${WPP_LINK}?text=${mensaje}`, "_blank");
  };

  // ✅ Registrar nuevo cliente
  const handleRegistrar = async () => {
    const numeroLimpio = telefono.trim();
    // 🚫 Evitar registrar un número que ya existe
    if (numeroExiste) {
      setMensaje("Número registrado, Ingrese con usuario y contraseña.");
      setTipoMensaje("error");
      return;
    }
    // 🔸 Verificar límite de registros en LocalStorage
    const LIMITE = 10; //Limite por navegador-------------------------------------------------------------------------------ok
    const key = "wpp_registros";
    let registros = parseInt(localStorage.getItem(key) || "0");

    if (registros >= LIMITE) {
      setMensaje("Ya se registró 2 veces, Ingrese con usuario y contraseña.");
      setTipoMensaje("error");
      return;
    }
    // ⚠️ Validar campos localmente con mensajes específicos
    const numeroInvalido =
      numeroLimpio.length !== 10 || !/^\d+$/.test(numeroLimpio);
    const claveInvalida = !/^\d{4}$/.test(clave);

    // 🔹 Detectar números repetidos en cualquier posición
    const tieneRepetidos = new Set(clave).size < 4; // si hay menos de 4 únicos → tiene repetidos

    // 🔹 Detectar secuencias ascendentes o descendentes exactas
    const digitos = clave.split("").map(Number);
    let esSecuenciaAsc = true;
    let esSecuenciaDesc = true;
    for (let i = 1; i < digitos.length; i++) {
      if (digitos[i] !== digitos[i - 1] + 1) esSecuenciaAsc = false;
      if (digitos[i] !== digitos[i - 1] - 1) esSecuenciaDesc = false;
    }
    const tieneSecuencia = esSecuenciaAsc || esSecuenciaDesc;

    if (numeroInvalido && (claveInvalida || tieneRepetidos || tieneSecuencia)) {
      setMensaje("Número y clave no válidos.");
      setTipoMensaje("error");
      return;
    } else if (numeroInvalido) {
      setMensaje("Ingrese número de 10 dígitos.");
      setTipoMensaje("error");
      return;
    } else if (claveInvalida) {
      setMensaje("Ingrese clave de 4 dígitos.");
      setTipoMensaje("error");
      return;
    } else if (tieneRepetidos) {
      setMensaje("La clave no debe contener números iguales.");
      setTipoMensaje("error");
      return;
    } else if (tieneSecuencia) {
      setMensaje("La clave no debe contener números en secuencia.");
      setTipoMensaje("error");
      return;
    }

    setRegistrando(true);
    setMensaje("Registrando...");
    setTipoMensaje("warning");

    try {
      const payload = [{ tel: numeroLimpio, clave: clave.toString() }];
      const { data } = await axios.post(`/api/clie`, payload, {
        headers: { "x-api-key": API_KEY },
      });

      if (data && (Array.isArray(data) || typeof data === "object")) {
        // 🔸 Incrementar contador local al registrarse con éxito
        registros = Math.min(registros + 1, LIMITE);
        localStorage.setItem(key, registros.toString());

        setMensaje("Registro exitoso.");
        setTipoMensaje("success");

        const userData = data.clients?.[0] || data;
        setUsuario(userData);
        setAutenticado(true);

        setCodigo("");
        setTelefono("");
        setClave("");
      } else {
        setMensaje("Registro completado sin confirmación.");
        setTipoMensaje("warning");
      }
    } catch (error) {
      console.error("Error al registrar:", error);
      setMensaje("Error al registrar usuario.");
      setTipoMensaje("error");
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div>
      {mensaje && (
        <p className={`autwpp-msg autwpp-msg-${tipoMensaje}`}>{mensaje}</p>
      )}

      <button id="menu-apply3" onClick={handleIniciarRegistro}>
        Solicitar código
      </button>

      <div className="autwpp-field">
        <label>Ingresar Código:</label>
        <input
          type="text"
          maxLength="4"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
          className="autwpp-input"
        />
      </div>

      {codigoValido && (
        <>
          <div className="autwpp-field">
            <label>Número de celular:</label>
            <input
              type="text"
              maxLength="10"
              value={telefono.startsWith("+57 ") ? telefono.slice(4) : telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
              className="autwpp-input"
            />
          </div>

          <div className="autwpp-field">
            <label>Nueva clave:</label>
            <input
              type="password"
              maxLength="4"
              value={clave}
              onChange={(e) => setClave(e.target.value.replace(/\D/g, ""))}
              className="autwpp-input"
            />
          </div>

          <button id="menu-apply" onClick={handleRegistrar}>
            Registrar
          </button>
          <button id="menu-apply2" onClick={onCancelar}>
            Cancelar
          </button>
        </>
      )}
    </div>
  );
}
