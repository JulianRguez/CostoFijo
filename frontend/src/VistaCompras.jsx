import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VistaCompras.css";
import RegistrarCompra from "./RegistrarCompra";

export default function VistaCompras() {
  const [items, setItems] = useState([]);
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [verGastos, setVerGastos] = useState(
    localStorage.getItem("verGastos") === "true"
  );
  const [agruparFacturas, setAgruparFacturas] = useState(false);
  const URLAPI = import.meta.env.VITE_URLAPI;
  const cargarCompras = () => {
    axios
      .get(`${URLAPI}/api/comp`)
      .then((res) => setItems(res.data))
      .catch((err) => console.error("Error al obtener compras:", err));
  };

  useEffect(() => {
    cargarCompras();
    axios
      .get(`${URLAPI}/api/prod`)
      .then((res) => setProductos(res.data))
      .catch((err) => console.error("Error al obtener productos:", err));
  }, []);

  useEffect(() => {
    localStorage.setItem("verGastos", verGastos);
  }, [verGastos]);

  const obtenerNombreProducto = (ref) => {
    const prod = productos.find((p) => p.ref === ref);
    return prod ? prod.nombre : ref;
  };

  const filtrados = items
    .filter((p) => p.idProd?.toLowerCase().includes(filtro.toLowerCase()))
    .filter((p) => (!verGastos ? p.registro !== "Gastos" : true));

  const agrupados = Object.values(
    filtrados.reduce((acc, curr) => {
      if (!acc[curr.factura]) {
        acc[curr.factura] = {
          ...curr,
          cantidad: 0,
          valor: 0,
          fecha: curr.fecha,
          factura: curr.factura,
          registro: curr.registro,
          devueltos: [],
        };
      }
      if (!curr.devuelto) {
        acc[curr.factura].cantidad += curr.cantidad;
        acc[curr.factura].valor += curr.valor;
      }
      acc[curr.factura].devueltos.push(curr.devuelto);
      return acc;
    }, {})
  );

  const getRegistroStyle = (tipo) => {
    if (tipo === "Productos") return { color: "#10b981", fontWeight: "bold" };
    if (tipo === "Gastos") return { color: "#facc15", fontWeight: "bold" };
    return {};
  };

  const mostrarDevuelto = (item) => {
    if (agruparFacturas) {
      return item.devueltos?.every((d) => d === true);
    }
    return item.devuelto === true;
  };

  return (
    <div className="vista-compra">
      <div className="buscador-check-compra">
        <input
          type="text"
          placeholder="Buscar referencia..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="buscador-compra"
        />
        <label className="ver-agotados-check">
          <input
            type="checkbox"
            checked={verGastos}
            onChange={() => setVerGastos(!verGastos)}
          />
          Ver gastos
        </label>
        <label className="ver-agotados-check">
          <input
            type="checkbox"
            checked={agruparFacturas}
            onChange={() => setAgruparFacturas(!agruparFacturas)}
          />
          Agrupar por facturas
        </label>
      </div>

      <div className="contenedor-lista-compra">
        <div className="productos-compra">
          {(agruparFacturas ? agrupados : filtrados).map((item, index) => (
            <div key={index} className="item-compra fila">
              <div className="info-compra horiz">
                <span style={getRegistroStyle(item.registro)}>
                  {item.registro}
                </span>
                <span>
                  {agruparFacturas
                    ? `Factura   ${item.factura}`
                    : obtenerNombreProducto(item.idProd)}
                </span>
                <span>x{item.cantidad}</span>
                <span>${item.valor}</span>
                <span>
                  {(() => {
                    if (!item.fecha) return "N/A"; // Si viene null o undefined
                    const fechaObj =
                      item.fecha instanceof Date
                        ? item.fecha
                        : new Date(item.fecha); // Si es string, lo convertimos a Date
                    return fechaObj.toISOString().split("T")[0];
                  })()}
                  {mostrarDevuelto(item) && (
                    <span
                      style={{
                        color: "#f87171",
                        fontWeight: "bold",
                        marginLeft: "6px",
                      }}
                    >
                      Devuelto
                    </span>
                  )}
                </span>
                <button className="btn-accion">Devolución</button>
              </div>
            </div>
          ))}
        </div>

        {/* 👉 Pasamos el callback para recargar compras */}
        <RegistrarCompra onCompraRegistrada={cargarCompras} />

        <div>Registrar compras</div>
      </div>
    </div>
  );
}
