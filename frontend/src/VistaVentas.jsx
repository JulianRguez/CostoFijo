import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VistaVentas.css";

export default function VistaVentas() {
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroDia, setFiltroDia] = useState("");

  const URLAPI = import.meta.env.VITE_URLAPI;

  // Cargar ventas y productos
  useEffect(() => {
    axios
      .get(`${URLAPI}/api/vent`)
      .then((res) => setVentas(res.data))
      .catch((err) => console.error("Error al obtener ventas:", err));

    axios
      .get(`${URLAPI}/api/prod`)
      .then((res) => setProductos(res.data))
      .catch((err) => console.error("Error al obtener productos:", err));
  }, []);

  // Buscar nombre del producto por idProd
  const obtenerNombreProducto = (id) => {
    const prod = productos.find((p) => p._id === id);
    return prod ? prod.nombre : id;
  };

  // Calcular días restantes de garantía
  const calcularGarantiaRestante = (fechaVenta, diasGarantia) => {
    if (!diasGarantia || diasGarantia === 0) return "Sin garantía";
    const fechaVentaDate = new Date(fechaVenta);
    const fechaExpira = new Date(fechaVentaDate);
    fechaExpira.setDate(fechaExpira.getDate() + diasGarantia);

    const hoy = new Date();
    const diff = Math.ceil((fechaExpira - hoy) / (1000 * 60 * 60 * 24));

    return diff > 0 ? `${diff} días restantes` : "Garantía vencida";
  };

  // Filtrar ventas por fecha (año, mes, día)
  const ventasFiltradas = ventas.filter((venta) => {
    if (venta.devuelto) return false;

    const fechaVenta = new Date(venta.fecha);
    const anio = fechaVenta.getFullYear();
    const mes = fechaVenta.getMonth() + 1;
    const dia = fechaVenta.getDate();

    if (filtroAnio && anio !== Number(filtroAnio)) return false;
    if (filtroMes && Number(filtroMes) !== mes) return false;
    if (filtroDia && Number(filtroDia) !== dia) return false;

    return true;
  });
  const totalMostrado = ventasFiltradas.reduce(
    (acc, v) => acc + v.cantidad * v.valor,
    0
  );

  // Nombres de meses en español
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const construirResumen = () => {
    if (!filtroAnio) return "";

    let partes = [];

    if (filtroDia) {
      partes.push(`del día ${filtroDia}`);
    }
    if (filtroMes) {
      const mesTexto = meses[Number(filtroMes) - 1];
      partes.push(`del mes de ${mesTexto}`);
    }
    partes.push(`del año ${filtroAnio}`);

    return `El valor de las ventas ${partes.join(
      " "
    )} fueron: $${totalMostrado.toLocaleString()}`;
  };

  return (
    <div className="vista-ventas">
      <h2>Ventas</h2>

      {/* Filtros */}
      <div className="filtros-ventas">
        <input
          type="number"
          value={filtroAnio}
          onChange={(e) => setFiltroAnio(e.target.value)}
          placeholder="Año"
        />
        <input
          type="number"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          placeholder="Mes"
          min="1"
          max="12"
        />
        <input
          type="number"
          value={filtroDia}
          onChange={(e) => setFiltroDia(e.target.value)}
          placeholder="Día"
          min="1"
          max="31"
        />
        <span className="resumen-ventas">{construirResumen()}</span>
      </div>

      {/* Lista de ventas */}
      <div className="lista-ventas">
        {ventasFiltradas.length === 0 ? (
          <p>No hay ventas para los filtros seleccionados.</p>
        ) : (
          ventasFiltradas.map((venta) => (
            <div key={venta._id} className="item-venta fila">
              <span className="producto">
                {obtenerNombreProducto(venta.idProd)}
              </span>
              <span>Cantidad: {venta.cantidad}</span>
              <span>Valor: ${venta.valor}</span>
              <span>
                Garantía:{" "}
                {calcularGarantiaRestante(venta.fecha, venta.garantia)}
              </span>
              <span>
                Fecha: {new Date(venta.fecha).toISOString().split("T")[0]}
              </span>
              <span className="etiqueta">{venta.etiqueta}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
