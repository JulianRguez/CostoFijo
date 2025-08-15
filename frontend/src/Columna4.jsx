//Columna4.jsx
import React from "react";

export default function Columna4({
  factura,
  setFactura,
  proveedor,
  setProveedor,
  registro,
  setRegistro,
  fecha,
  setFecha,
  mensajeValidacion,
  setMensajeValidacion,
  productosAgregados,
  setMostrarDialogo,
}) {
  return (
    <div className="columna">
      <label className="label-inline">
        <span>Factura</span>
        <input
          maxLength={25}
          value={factura}
          onChange={(e) => {
            setFactura(e.target.value);
            if (mensajeValidacion.texto) {
              setMensajeValidacion({ texto: "", tipo: "" });
            }
          }}
        />
      </label>

      <label className="label-inline">
        <span>Proveedor</span>
        <input
          maxLength={25}
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
        />
      </label>

      <label className="label-inline">
        <span>Registro</span>
        <select
          value={registro}
          onChange={(e) => setRegistro(e.target.value)}
          className="lst"
        >
          <option value="Productos">Productos</option>
          <option value="Gastos">Gastos</option>
        </select>
      </label>

      <label className="label-inline">
        <span>Fecha</span>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </label>

      <button
        className="btn-confirmar-compra"
        onClick={() => {
          if (
            factura.trim().length < 3 ||
            proveedor.trim().length < 3 ||
            productosAgregados.length === 0
          ) {
            setMensajeValidacion({
              texto: "Algún dato no es válido",
              tipo: "error",
            });
            return;
          }
          setMensajeValidacion({ texto: "", tipo: "" });
          setMostrarDialogo(true);
        }}
      >
        Registrar Compra
      </button>
    </div>
  );
}
