//src/admin/App.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import VistaCentral from "./VistaCentral";
import VistaCompras from "./VistaCompras";
import HojaVida from "./HojaVida";
import Pdf from "./Pdf"; // 👈 importa Pdf.jsx
import VistaVentas from "./VistaVentas";
import Stock from "./Stock";
import Info from "./Info";
import Clientes from "./Clientes";
import { Home, Bell, User, UserX, RefreshCw } from "lucide-react";
import NotificacionPendiente from "./NotificacionPendiente";

import "./App.css";

export default function App() {
  const [auth, setAuth] = useState(false);
  const [clave, setClave] = useState("");
  const [placeholder, setPlaceholder] = useState("Contraseña");
  const [vistaActiva, setVistaActiva] = useState(null);
  const [codigoPedido, setCodigoPedido] = useState("");
  const [pagosPendientes, setPagosPendientes] = useState([]);
  const [mostrarPagos, setMostrarPagos] = useState(false);
  const [datosHojaVida, setDatosHojaVida] = useState(null);
  const [mostrarPDF, setMostrarPDF] = useState(false);

  const cargarPagosPendientes = async () => {
    try {
      const { data } = await axios.get("/api/vent/pagoEnImg");
      setPagosPendientes(
        (data || []).filter((v) => v.pago && v.pago[0] !== "Z"),
      );
    } catch (e) {
      console.error("Error cargando pagos pendientes", e);
    }
  };

  useEffect(() => {
    if (!auth) {
      setPagosPendientes([]); // 🔒 reset cuando no hay auth
      return;
    }

    cargarPagosPendientes();
  }, [auth]);

  const manejarAuth = () => {
    if (clave === "109021") {
      setAuth(true);
      setClave("");
      setPlaceholder("Contraseña");
    } else {
      setClave("");
      setPlaceholder("Contraseña incorrecta");
    }
  };

  const cerrarSesion = () => {
    setAuth(false);
    setVistaActiva(null);
    setClave("");
    setPlaceholder("Contraseña");
    setMostrarPDF(false);
    setDatosHojaVida(null);
    setPagosPendientes([]);
  };

  const manejarClickMenu = (opcion) => {
    if (!auth) return;
    setVistaActiva(opcion);
    setMostrarPDF(false); // 👈 al cambiar de menú, siempre vuelves al form
  };

  const manejarCodigoPedido = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 6) {
      setCodigoPedido(val);
      if (val === "101000") {
        setVistaActiva("Pedido Pendiente");
      } else if (vistaActiva === "Pedido Pendiente") {
        setVistaActiva(null);
      }
    }
  };

  const opcionesFormatos = [
    "Hoja de vida",
    "Hoja de vida FP",
    "Compraventa vehículo",
    "Compraventa raíz",
    "Declaración jurada",
    "Poder",
    "Contrato servicios",
    "Contrato arriendo",
    "Carta laboral",
  ];

  const opcionesContabilidad = [
    "Ventas",
    "Compras",
    "Bajo stock",
    "Deudores",
    "Clientes",
    "Proveedores",
    "Estadisticas",
  ];

  return (
    <div className="app-container">
      <aside className="menu-lateral">
        {/* 🔒 Menú bloqueado si no hay auth */}
        <div className={!auth ? "bloque-deshabilitado" : ""}>
          <button
            className={`btn-vender ${
              vistaActiva !== "Vender" ? "btn-contactar" : ""
            }`}
            onClick={() => manejarClickMenu("Vender")}
          >
            Vender
          </button>

          <div className="menu-seccion">
            <h2 className="menu-titulo">Formatos</h2>
            <ul className="menu-lista">
              {opcionesFormatos.map((item) => (
                <li
                  key={item}
                  className={`menu-item ${
                    vistaActiva === item ? "activo" : ""
                  }`}
                  onClick={() => manejarClickMenu(item)}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="menu-seccion">
            <h2 className="menu-titulo">Contabilidad</h2>
            <ul className="menu-lista">
              {opcionesContabilidad.map((item) => (
                <li
                  key={item}
                  className={`menu-item ${
                    vistaActiva === item ? "activo" : ""
                  }`}
                  onClick={() => manejarClickMenu(item)}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <a
            href="https://wa.me/3244003011?text=Hola,%20requiero%20mas%20informaci%C3%B3n.%20%20"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-contactar"
          >
            <span>Contactar</span>
          </a>
        </div>

        {/* ✅ Pedidos siempre activo */}
        <div className="menu-seccion pedidos-seccion">
          <label className="menu-titulo">Pedidos</label>
          <input
            type="text"
            value={codigoPedido}
            onChange={manejarCodigoPedido}
            className="input-pedido"
            placeholder="Código"
          />
        </div>
      </aside>

      <div className="contenido">
        <header className="barra-superior">
          <div className="logo" style={{ fontSize: "35px" }}>
            costofijo.com
          </div>
          <div className="estado-usuario">
            {/* Botón de Inicio */}
            <button
              className="btn-inicio"
              onClick={() => setVistaActiva("Info")}
              title="Volver al inicio"
            >
              <Home size={22} strokeWidth={2} />
            </button>
            <button
              className="btn-inicio2"
              onClick={cargarPagosPendientes}
              disabled={!auth}
              title="Actualizar notificaciones"
            >
              <RefreshCw size={22} strokeWidth={2} />
            </button>

            <div
              className="notificacion"
              onClick={() => {
                if (!auth || pagosPendientes.length === 0) return;
                setMostrarPagos(true);
              }}
              style={{
                cursor:
                  auth && pagosPendientes.length > 0 ? "pointer" : "default",
                opacity: auth ? 1 : 0.5,
              }}
            >
              <span className="contador">
                {auth ? pagosPendientes.length : 0}
              </span>
              <Bell size={22} strokeWidth={2} className="icono" />
            </div>

            <span className="estado-usuario">
              {auth ? (
                <>
                  <span>Julián Rodríguez</span>
                  <User size={18} strokeWidth={2} />{" "}
                </>
              ) : (
                <>
                  <span>No autenticado</span>
                  <UserX size={18} strokeWidth={2} />{" "}
                </>
              )}
            </span>
            {!auth && (
              <input
                type="password"
                placeholder={placeholder}
                className="input-clave"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") manejarAuth();
                }}
              />
            )}
            <button
              onClick={auth ? cerrarSesion : manejarAuth}
              className="btn-vender"
            >
              {auth ? "Salir" : "Ingresar"}
            </button>
          </div>
        </header>

        {!auth && vistaActiva !== "Pedido Pendiente" && (
          <div className="cuadro-info">
            <p>
              El menú y todas las opciones están deshabilitadas, para acceder a
              su información financiera y activar todas las opciones, debe
              ingresar una contraseña válida. Si olvidó su contraseña o desea
              obtener más información sobre el acceso a esta página, debe
              escribir a la línea WhatsApp 3244003011. Recuerde que en nuestra
              página Web puedes, entre otras cosas:
            </p>
            <ul>
              <li>Registrar todos tus productos.</li>
              <li>Registrar tus ventas.</li>
              <li>Registrar tus compras.</li>
              <li>Imprimir facturas de caja.</li>
              <li>
                Obtener recortes periódicos de compras, ventas y utilidades.
              </li>
              <li>Obtener alertas de productos con bajo stock</li>
              <li>Formatos para impresión rápida.</li>
              <li>
                Activación de página web para promocionar y vender tus
                productos.
              </li>
            </ul>
          </div>
        )}
        {auth && !vistaActiva && <Info />}
        {auth && vistaActiva === "Vender" && <VistaCentral />}
        {auth && vistaActiva === "Compras" && <VistaCompras />}
        {auth && vistaActiva === "Ventas" && <VistaVentas />}
        {auth && vistaActiva === "Bajo stock" && <Stock />}
        {auth && vistaActiva === "Clientes" && <Clientes />}
        {auth && vistaActiva === "Info" && <Info />}
        {vistaActiva === "Pedido Pendiente" && (
          <div className="vista-generica">
            <h2>Pedido Pendiente</h2>
          </div>
        )}

        {auth &&
          vistaActiva &&
          vistaActiva !== "Vender" &&
          vistaActiva !== "Compras" &&
          vistaActiva !== "Pedido Pendiente" &&
          vistaActiva !== "Info" &&
          vistaActiva !== "Ventas" &&
          vistaActiva !== "Bajo stock" &&
          vistaActiva !== "Clientes" && (
            <div className="vista-generica">
              {vistaActiva === "Hoja de vida" ? (
                mostrarPDF ? (
                  <Pdf
                    datos={datosHojaVida}
                    onRegresar={() => setMostrarPDF(false)}
                  />
                ) : (
                  <HojaVida
                    initialData={datosHojaVida} // 👈 se pasa la data guardada
                    onGenerarPDF={(datos) => {
                      setDatosHojaVida(datos);
                      setMostrarPDF(true);
                    }}
                  />
                )
              ) : (
                <h2>{vistaActiva}</h2>
              )}
            </div>
          )}
      </div>
      {auth && mostrarPagos && (
        <NotificacionPendiente
          onClose={() => setMostrarPagos(false)}
          onAprobado={cargarPagosPendientes}
        />
      )}
    </div>
  );
}
