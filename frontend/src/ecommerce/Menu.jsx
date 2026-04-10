// src/Menu.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
const API_KEY = import.meta.env.VITE_API_KEY;
import {
  SlidersHorizontal,
  ShoppingBag,
  TicketPercent,
  MapPin,
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

export default function MenuLateral({
  isMobile = false,
  isOpen,
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
  const [compras, setCompras] = useState([]);
  const [cargandoCompras, setCargandoCompras] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setAbierto(null);
      setLoginVisible(false);
      setGoogleVisible(false);
      setWhatsappVisible(false);
      setDato("");
      setClave("");
      setMensaje("Ingrese datos de autenticación");
    }
  }, [isOpen]);

  useEffect(() => {
    if (abierto === "compras" && autenticado && usuario?.doc) {
      cargarCompras();
    }
  }, [abierto, autenticado]);
  useEffect(() => {
    if (opcionOrden && opcionOrden !== orden) {
      setOrden(opcionOrden);
    }
  }, [opcionOrden]);
  const cargarCompras = async () => {
    try {
      setCargandoCompras(true);
      const { data } = await axios.get(`/api/vent?idClient=${usuario.doc}`, {
        headers: { "x-api-key": API_KEY },
      });

      setCompras(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Error cargando compras", error);
      setCompras([]);
    } finally {
      setCargandoCompras(false);
    }
  };
  const calcularTotalFactura = (factura) => {
    const totalProductos = factura.productos.reduce(
      (acc, prod) => acc + prod.cantidad * prod.valor,
      0,
    );

    return (
      totalProductos + (factura.otrosCobros || 0) - (factura.descuentos || 0)
    );
  };

  const obtenerEstadoFactura = (pago) => {
    if (!pago) return "Estado desconocido";

    // estados directos
    if (pago === "pendiente") return "Pendiente por pagar";
    if (pago === "anulado") return "Compra Anulada";
    if (pago === "aBanco") return "Compra Finalizada";

    // estados por prefijo + url Cloudinary
    if (typeof pago === "string" && pago.startsWith("P")) {
      return "Pago en verificación";
    }
    if (pago.startsWith("A")) {
      return "Pago Aprobado";
    }
    if (pago.startsWith("E")) {
      return "Pedido Enviado";
    }
    if (pago.startsWith("F")) {
      return "Pedido Entregado";
    }
    if (pago.startsWith("X")) {
      return "Compra Anulada";
    }

    return "Estado desconocido";
  };
  const obtenerClaseEstado = (estado) => {
    if (
      estado === "Pendiente por pagar" ||
      estado === "Compra Finalizada" ||
      estado === "Pago en verificación"
    ) {
      return "estado-amarillo";
    }

    if (
      estado === "Compra Anulada" ||
      estado === "Compra rechazada" ||
      estado === "Estado desconocido"
    ) {
      return "estado-rojo";
    }

    if (
      estado === "Pago Aprobado" ||
      estado === "Pedido Enviado" ||
      estado === "Pedido Entregado"
    ) {
      return "estado-verde";
    }

    return "";
  };

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

  const manejarLogin = async () => {
    try {
      if (!dato || !clave) {
        setMensaje("Ingrese usuario y clave");
        return;
      }

      const { data } = await axios.get(`/api/clie/${dato}`, {
        headers: { "x-api-key": API_KEY },
      });

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

      {/*SECCIÓN AUTENTICAR */}
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
              maxLength={10}
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

        {/*  REGISTRO POR WHATSAPP */}
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
          <div className="menu-content compras-scroll">
            {cargandoCompras ? (
              <p>Cargando compras...</p>
            ) : compras.length === 0 ? (
              <p>No tienes compras registradas</p>
            ) : (
              compras.map((factura) => (
                <div key={factura._id} className="compra-card">
                  <div className="compra-linea">
                    <span
                      className={obtenerClaseEstado(
                        obtenerEstadoFactura(factura.pago),
                      )}
                    >
                      {obtenerEstadoFactura(factura.pago)}
                    </span>
                  </div>
                  <div className="compra-linea">
                    <strong>Factura:</strong> {factura.factura}
                  </div>

                  <div className="compra-linea">
                    <strong>Fecha:</strong>{" "}
                    {new Date(factura.fecha).toLocaleDateString()}
                  </div>

                  <div className="compra-linea">
                    <strong>Valor:</strong> $
                    {calcularTotalFactura(factura).toLocaleString()}
                  </div>
                </div>
              ))
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
                  "No tienes productos en favoritos.",
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

      {/* CUPONES */}
      <div className="menu-section">
        <button
          className={`menu-title ${abierto === "cupones" ? "active" : ""}`}
          onClick={() => toggleSeccion("cupones")}
        >
          <TicketPercent className="menu-icon" />
          Cupones y Promociones
        </button>
        {abierto === "cupones" && (
          <div className="menu-content">
            {autenticado ? (
              Array.isArray(usuario?.cupon) && usuario.cupon.length > 0 ? (
                <p>
                  <strong>Cupones disponibles:</strong>{" "}
                  {usuario.cupon.join(", ")}
                </p>
              ) : (
                <p>Acumula compras para recibir cupones</p>
              )
            ) : (
              <p>
                Regístrate con dirección y cédula e ingresa el cupón{" "}
                <strong>CUPON33</strong> al realizar el pago y obtén un
                descuento del 10% en tu primera compra superior a $50.000.
              </p>
            )}
          </div>
        )}
      </div>

      {/* UBICACION*/}
      <div className="menu-section">
        <button
          className={`menu-title ${abierto === "promociones" ? "active" : ""}`}
          onClick={() => toggleSeccion("promociones")}
        >
          <MapPin className="menu-icon" />
          Local comercial
        </button>
        {abierto === "promociones" && (
          <div className="menu-content">
            <h3 className="menu-local-titulo"> Visítanos </h3>{" "}
            <p className="menu-local-subtitulo">
              {" "}
              Cl. 20 #5-192, Barrio Llano, Santa Fé de Antioquia, Antioquia{" "}
            </p>{" "}
            <a
              href="https://www.google.com/maps/place/6%C2%B033'53.2%22N+75%C2%B049'15.9%22W/@6.564787,-75.8198055,551m/data=!3m1!1e3!4m4!3m3!8m2!3d6.564787!4d-75.821093?entry=ttu&g_ep=EgoyMDI2MDIwNC4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="menu-local-link"
            >
              {" "}
              Ver ubicación{" "}
            </a>
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
