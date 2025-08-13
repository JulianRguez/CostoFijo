import React, { useState } from "react";
import VistaCentral from "./VistaCentral";
import VistaCompras from "./VistaCompras";
import "./App.css";
import { BiFontSize } from "react-icons/bi";

export default function App() {
  const [auth, setAuth] = useState(false);
  const [clave, setClave] = useState("");
  const [placeholder, setPlaceholder] = useState("Contraseña");
  const [vistaActiva, setVistaActiva] = useState(null);

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
  };

  const manejarClickMenu = (opcion) => {
    if (!auth) return;
    setVistaActiva(opcion);
  };

  const opcionesFormatos = [
    "Hoja de vida",
    "Hoja de vida FP",
    "Compraventa vehículo",
    "Compraventa inmueble",
    "Declaración juramentada",
    "Poder",
    "Contrato servicios",
    "Contrato arrendamiento",
    "Carta laboral",
  ];

  const opcionesContabilidad = ["Ventas", "Compras", "Bajo stock", "Reporte"];

  return (
    <div className="app-container">
      <aside className={`menu-lateral ${!auth ? "deshabilitado" : ""}`}>
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
                className={`menu-item ${vistaActiva === item ? "activo" : ""}`}
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
                className={`menu-item ${vistaActiva === item ? "activo" : ""}`}
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
      </aside>

      <div className="contenido">
        <header className="barra-superior">
          <div className="logo" style={{ fontSize: "35px" }}>
            costofijo.com
          </div>
          <div className="estado-usuario">
            <div className="notificacion">
              <span className="contador">0</span>
              <span className="icono">🔔</span>
            </div>
            <span>{auth ? "👤 Julián Rodríguez" : "🙈 No autenticado"}</span>
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

        {!auth && (
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

        {auth && vistaActiva === "Vender" && <VistaCentral />}
        {auth && vistaActiva === "Compras" && <VistaCompras />}
        {auth &&
          vistaActiva &&
          vistaActiva !== "Vender" &&
          vistaActiva !== "Compras" && (
            <div className="vista-generica">
              <h2>{vistaActiva}</h2>
            </div>
          )}
      </div>
    </div>
  );
}
