// Columna3.jsx
import React from "react";

export default function Columna3({ productosAgregados, eliminarProducto }) {
  const layout = {
    display: "grid",
    gridTemplateColumns: "16% 40% 10% 14% 10%", // da más aire al nombre
    columnGap: "8px",
    width: "100%",
    alignItems: "center",
  };

  const th = {
    ...layout,
    fontWeight: "bold",
    fontSize: "0.85rem",
    color: "#10b981",
    borderBottom: "1px solid #475569",
    paddingBottom: "4px",
    marginBottom: "4px",
  };

  const tr = {
    ...layout,
    padding: "1px 0",
    fontSize: "0.85rem",
    color: "#f1f5f9",
  };

  const cellLeft = { textAlign: "left" };
  const cellRight = { textAlign: "right" };

  // Para que los textos largos no rompan la grilla
  const truncate = {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const formatNumber = (n) =>
    new Intl.NumberFormat("es-CO").format(Number(n) || 0);

  return (
    <div className="columna">
      <div style={th}>
        <span style={{ ...cellLeft, ...truncate }}>Referencia</span>
        <span style={{ ...cellLeft, ...truncate }}>Producto</span>
        <span style={cellRight}>Cant</span>
        <span style={cellRight}>Valor</span>
        <span />
      </div>

      {productosAgregados.map((prod, idx) => (
        <div key={idx} style={tr}>
          <span style={{ ...cellLeft, fontWeight: "bold", ...truncate }}>
            {prod.ref}
          </span>
          <span style={{ ...cellLeft, ...truncate }}>{prod.nombre}</span>
          <span style={cellRight}>{prod.stock}</span>
          <span style={cellRight}>{formatNumber(prod.valor)}</span>
          <span
            style={{
              textAlign: "right",
              color: "#F87171",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={() => eliminarProducto(idx)}
            title="Eliminar"
          >
            Eliminar
          </span>
        </div>
      ))}
    </div>
  );
}
