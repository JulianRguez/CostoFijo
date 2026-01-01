// src/Menu.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  SlidersHorizontal,
  ShoppingBag,
  TicketPercent,
  Tag,
  Heart,
  FileText,
  LogIn,
  UserCheck,
  UserX,
} from "lucide-react";
import AutGoogle from "./AutGoogle";
import AutWpp from "./AutWpp";
import "./Inicio.css";
import "./Menu.css";

const URLAPI = import.meta.env.VITE_URLAPI;

export default function MenuLateral({
  isMobile = false,
  onOrdenar,
  autenticado,
  setAutenticado,
  opcionOrden,
  usuario,
  setUsuario,
  onMostrarFavoritos,
}) {
  const [abierto, setAbierto] = useState(null);
  const [orden, setOrden] = useState(opcionOrden || "Aleatorio");
  const [loginVisible, setLoginVisible] = useState(false);
  const [dato, setDato] = useState("");
  const [clave, setClave] = useState("");
  const [mensaje, setMensaje] = useState("Ingrese datos de autenticación");
  const [googleVisible, setGoogleVisible] = useState(false);
  const [whatsappVisible, setWhatsappVisible] = useState(false);

  useEffect(() => {
    if (opcionOrden && opcionOrden !== orden) {
      setOrden(opcionOrden);
    }
  }, [opcionOrden]);

  const toggleSeccion = (nombre) => {
    if (abierto === nombre) {
      setAbierto(null);
    } else {
      setAbierto(nombre);
    }

    // 🔁 Reiniciar formularios al cambiar sección
    setLoginVisible(false);
    setGoogleVisible(false);
    setWhatsappVisible(false);
    setDato("");
    setClave("");
    setMensaje("Ingrese datos de autenticación");
  };

  const aplicarOrden = () => {
    if (onOrdenar) onOrdenar(orden);
  };

  // 🔐 Manejar autenticación
  // ✅ Login completo con carga de favoritos
  const manejarLogin = async () => {
    try {
      if (!dato || !clave) {
        setMensaje("Ingrese usuario y clave");
        return;
      }

      const { data } = await axios.get(`${URLAPI}/api/clie/${dato}`);

      if (!data) {
        setMensaje("Datos no válidos");
        return;
      }

      // Si la clave coincide, login correcto
      if (data.clave === clave) {
        setAutenticado(true);
        setLoginVisible(false);
        setUsuario(data); // 🔹 Guarda el cliente completo con favoritos
        setMensaje("Autenticado correctamente");
        setDato("");
        setClave("");
      } else {
        setMensaje("Clave incorrecta");
      }
    } catch (error) {
      console.error("❌ Error en login:", error);

      if (error.response && error.response.status === 404) {
        setMensaje("Usuario no encontrado");
      } else {
        setMensaje("Error al conectar con el servidor");
      }
    }
  };

  // 🔓 Cerrar sesión
  const cerrarSesion = () => {
    setAutenticado(false);
    setUsuario(null);
    setMensaje("Ingrese datos de autenticación");
    setAbierto(null);
  };

  // 🧠 Texto de usuario
  const obtenerTextoUsuario = () => {
    if (!usuario) return "Sesión no iniciada";
    if (usuario.nombre && usuario.nombre.trim() !== "") return usuario.nombre;
    if (usuario.mail && usuario.mail.trim() !== "") return usuario.mail;
    return usuario.tel || "Usuario desconocido";
  };

  return (
    <div className={`menu-container ${isMobile ? "menu-mobile" : ""}`}>
      {isMobile && (
        <button
          onClick={() => {
            const overlay = document.querySelector(".modal-overlay");
            if (overlay) overlay.click(); // cierra el modal
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            fontSize: 22,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#919191ff",
          }}
        >
          ✖
        </button>
      )}

      {/* 🔸 ESTADO DE SESIÓN */}
      <div
        className="menu-header flex items-center gap-2"
        style={{ marginBottom: "8px" }}
      >
        {autenticado ? (
          <UserCheck size={20} color="green" />
        ) : (
          <UserX size={20} color="orange" />
        )}
        <span style={{ fontWeight: 500, cursor: "pointer" }}>
          {obtenerTextoUsuario()}
        </span>
      </div>

      {/* 🔹 SECCIÓN AUTENTICAR */}
      <div className="menu-section">
        <button
          className={`menu-title ${abierto === "autenticar" ? "active" : ""}`}
          onClick={() => {
            if (autenticado) cerrarSesion();
            else toggleSeccion("autenticar");
          }}
        >
          <LogIn className="menu-icon" />
          {autenticado ? "Cerrar sesión" : "Autenticar"}
        </button>

        {/* OPCIONES DE AUTENTICACIÓN */}
        {!autenticado &&
          abierto === "autenticar" &&
          !loginVisible &&
          !whatsappVisible && (
            <div className="menu-content">
              {!googleVisible ? (
                <>
                  <button
                    className="menu-apply-btn"
                    onClick={() => setLoginVisible(true)}
                  >
                    Ingresar con contraseña
                  </button>

                  <button
                    className="menu-apply-btn"
                    onClick={() => {
                      setWhatsappVisible(true);
                      setLoginVisible(false);
                      setGoogleVisible(false);
                    }}
                  >
                    Registrar por WhatsApp
                  </button>

                  <button
                    className="menu-apply-btn"
                    onClick={() => setGoogleVisible(true)}
                  >
                    Registrar con Google
                  </button>
                </>
              ) : (
                <>
                  <AutGoogle
                    setAutenticado={setAutenticado}
                    setUsuario={setUsuario}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      id="menu-apply2"
                      onClick={() => {
                        setGoogleVisible(false);
                        setMensaje("Ingrese datos de autenticación");
                      }}
                      style={{ width: "100%" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        {/* FORMULARIO LOGIN */}
        {!autenticado && abierto === "autenticar" && loginVisible && (
          <div className="menu-content">
            <p
              style={{
                color:
                  mensaje === "Datos no válidos"
                    ? "var(--orange)"
                    : "var(--muted-text)",
                fontSize: 13,
                marginTop: 6,
                margin: 0,
              }}
            >
              {mensaje}
            </p>
            <input
              type="text"
              placeholder="Correo o celular"
              value={dato}
              onChange={(e) => setDato(e.target.value)}
              className="menu-input"
            />
            <input
              type="password"
              placeholder="Clave"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="menu-input"
            />
            <button id="menu-apply" onClick={manejarLogin}>
              Confirmar
            </button>
            <button
              id="menu-apply2"
              onClick={() => {
                setLoginVisible(false);
                setDato("");
                setClave("");
                setMensaje("Ingrese datos de autenticación");
              }}
            >
              Cancelar
            </button>
          </div>
        )}

        {/* 🔹 REGISTRO POR WHATSAPP */}
        {!autenticado && abierto === "autenticar" && whatsappVisible && (
          <div className="menu-content">
            <AutWpp
              setAutenticado={setAutenticado}
              setUsuario={setUsuario}
              onCancelar={() => {
                setWhatsappVisible(false);
                setMensaje("Ingrese datos de autenticación");
              }}
            />
          </div>
        )}
      </div>

      {/* ORDENAR */}
      {/* ORDENAR */}
      <div className="menu-section">
        <button
          className={`menu-title ${abierto === "ordenar" ? "active" : ""}`}
          onClick={() => toggleSeccion("ordenar")}
        >
          <SlidersHorizontal className="menu-icon" />
          Ordenar
        </button>

        {abierto === "ordenar" && (
          <div className="menu-content">
            <label>
              <input
                type="radio"
                name="orden"
                value="Aleatorio"
                checked={orden === "Aleatorio"}
                onChange={(e) => {
                  setOrden(e.target.value);
                  onOrdenar && onOrdenar(e.target.value);

                  // 🔹 Si estamos en móvil, cerrar el menú (modal)
                  if (isMobile) {
                    const closeBtn = document.querySelector(".modal-overlay");
                    if (closeBtn) closeBtn.click();
                  }
                }}
              />
              Aleatorio
            </label>
            <label>
              <input
                type="radio"
                name="orden"
                value="Menor Precio"
                checked={orden === "Menor Precio"}
                onChange={(e) => {
                  setOrden(e.target.value);
                  onOrdenar && onOrdenar(e.target.value);

                  // 🔹 Si estamos en móvil, cerrar el menú (modal)
                  if (isMobile) {
                    const closeBtn = document.querySelector(".modal-overlay");
                    if (closeBtn) closeBtn.click();
                  }
                }}
              />
              Menor Precio
            </label>
            <label>
              <input
                type="radio"
                name="orden"
                value="Mayor Precio"
                checked={orden === "Mayor Precio"}
                onChange={(e) => {
                  setOrden(e.target.value);
                  onOrdenar && onOrdenar(e.target.value);

                  // 🔹 Si estamos en móvil, cerrar el menú (modal)
                  if (isMobile) {
                    const closeBtn = document.querySelector(".modal-overlay");
                    if (closeBtn) closeBtn.click();
                  }
                }}
              />
              Mayor Precio
            </label>
            <label>
              <input
                type="radio"
                name="orden"
                value="Mejor Calificación"
                checked={orden === "Mejor Calificación"}
                onChange={(e) => {
                  setOrden(e.target.value);
                  onOrdenar && onOrdenar(e.target.value);

                  // 🔹 Si estamos en móvil, cerrar el menú (modal)
                  if (isMobile) {
                    const closeBtn = document.querySelector(".modal-overlay");
                    if (closeBtn) closeBtn.click();
                  }
                }}
              />
              Mejor Calificación
            </label>
          </div>
        )}
      </div>

      {/* COMPRAS */}
      <div className="menu-section">
        <button
          className={`menu-title ${abierto === "compras" ? "active" : ""}`}
          onClick={() => toggleSeccion("compras")}
          disabled={!autenticado}
        >
          <ShoppingBag className="menu-icon" />
          Compras
        </button>
        {abierto === "compras" && autenticado && (
          <div className="menu-content">
            <p>Historial de compras</p>
          </div>
        )}
      </div>

      {/* CUPONES */}
      <div className="menu-section">
        <button
          className={`menu-title ${abierto === "cupones" ? "active" : ""}`}
          onClick={() => toggleSeccion("cupones")}
        >
          <TicketPercent className="menu-icon" />
          Cupones
        </button>
        {abierto === "cupones" && (
          <div className="menu-content">
            {autenticado ? (
              <p>Acumula compras para recibir cupones</p>
            ) : (
              <p>
                Regístrate con dirección y cédula e ingresa el cupón{" "}
                <strong>NUEVO540</strong> al realizar el pago y obtén un
                descuento del 10% en tu primera compra superior a $50.000.
              </p>
            )}
          </div>
        )}
      </div>

      {/* PROMOCIONES */}
      <div className="menu-section">
        <button
          className={`menu-title ${abierto === "promociones" ? "active" : ""}`}
          onClick={() => toggleSeccion("promociones")}
        >
          <Tag className="menu-icon" />
          Promociones
        </button>
        {abierto === "promociones" && (
          <div className="menu-content">
            {autenticado ? (
              <p>
                Revisa nuestros productos con <strong>10%, 20% y 30%</strong> de
                descuento solo por este mes.
              </p>
            ) : (
              <p>Regístrate y accede a los descuentos de este mes.</p>
            )}
          </div>
        )}
      </div>

      {/* FAVORITOS */}
      <div className="menu-section">
        <button
          className={`menu-title ${abierto === "favoritos" ? "active" : ""}`}
          onClick={() => {
            toggleSeccion("favoritos");

            if (autenticado) {
              if (!usuario?.favoritos?.length) {
                // ⚠️ No tiene favoritos → mostrar alerta
                window.dispararAlerta(
                  "Favoritos vacíos",
                  "No tienes productos en favoritos."
                );
                return;
              }

              onMostrarFavoritos && onMostrarFavoritos();
            }

            // 🔥 CERRAR EL MENÚ EN MÓVIL
            if (isMobile) {
              const overlay = document.querySelector(".modal-overlay");
              if (overlay) overlay.click();
            }

            // 🔥 CERRAR EL MENÚ EN ESCRITORIO
            if (!isMobile) {
              document.body.classList.remove("show-left-sidebar");

              // fuerza cierre del sidebar desde aquí
              const sidebar = document.querySelector(".left-sidebar");
              if (sidebar) {
                sidebar.classList.remove("open");
              }
            }
          }}
          disabled={!autenticado}
        >
          <Heart className="menu-icon" />
          Favoritos
        </button>

        {abierto === "favoritos" && autenticado && (
          <div className="menu-content">
            <p>Mis Favoritos</p>
          </div>
        )}
      </div>

      {/* FACTURACIÓN */}
      <div className="menu-section">
        <button
          className={`menu-title ${abierto === "facturacion" ? "active" : ""}`}
          onClick={() => toggleSeccion("facturacion")}
        >
          <FileText className="menu-icon" />
          Facturación
        </button>
        {abierto === "facturacion" && (
          <div className="menu-content">
            <p>
              Facturación emitida por: <br />
            </p>
            <p>
              <strong>Julián Rodríguez Carvajal</strong>
              <br />
              NIT 1039623878-6
            </p>
            <p>
              <strong>Sebastián Patiño Gutiérrez</strong>
              <br />
              NIT 1022094271-3
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
