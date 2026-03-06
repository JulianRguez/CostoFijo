import React, { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import "./NotificacionPendiente.css";
const revertirInventario = (productosVenta, productosApi) => {
  let actualizaciones = [];
  let errorMsg = null;

  const productosProcesados = {};

  for (const pVenta of productosVenta) {
    const pApi = productosApi.find((p) => p._id === pVenta.idProd);

    if (!pApi) {
      errorMsg = `Producto no encontrado: ${pVenta.nomProd}`;
      break;
    }

    // Inicializar acumulador por producto
    if (!productosProcesados[pApi._id]) {
      productosProcesados[pApi._id] = {
        stock: pApi.stock,
        version: pApi.version || "",
      };
    }

    const prod = productosProcesados[pApi._id];

    // 🔼 REVERTIR STOCK GENERAL
    prod.stock += pVenta.cantidad;

    // 🔼 REVERTIR VERSION (si aplica)
    if (pVenta.version && pVenta.version !== "") {
      const [versionNombre] = pVenta.version.split("-");
      const cantRevertir = pVenta.cantidad;

      // Si no hay versiones aún
      if (!prod.version || prod.version === "") {
        prod.version = `${versionNombre}-${cantRevertir}`;
      } else {
        let partes = prod.version.split("-");
        let idx = partes.indexOf(versionNombre);

        if (idx === -1) {
          // 🔧 Crear nueva versión
          partes.push(versionNombre, cantRevertir.toString());
        } else {
          let stockActual = parseInt(partes[idx + 1], 10);
          partes[idx + 1] = (stockActual + cantRevertir).toString();
        }

        prod.version = partes.join("-");
      }
    }
  }

  if (errorMsg) {
    return { actualizaciones: [], errorMsg };
  }

  for (const id in productosProcesados) {
    actualizaciones.push({
      _id: id,
      stock: productosProcesados[id].stock,
      version: productosProcesados[id].version,
    });
  }

  return { actualizaciones, errorMsg: null };
};
const procesarInventario = (productosVenta, productosApi) => {
  let actualizaciones = [];
  let errorMsg = null;

  // 🔧 Mapa local para acumular cambios por producto
  const productosProcesados = {};

  for (const pVenta of productosVenta) {
    const pApi = productosApi.find((p) => p._id === pVenta.idProd);

    if (!pApi) {
      errorMsg = `Producto no encontrado: ${pVenta.nomProd}`;
      break;
    }

    // Inicializamos una sola vez por producto
    if (!productosProcesados[pApi._id]) {
      productosProcesados[pApi._id] = {
        stock: pApi.stock,
        version: pApi.version,
      };
    }

    const prod = productosProcesados[pApi._id];

    // Validación Stock General
    if (pVenta.cantidad > prod.stock) {
      errorMsg = `Stock insuficiente de ${pApi.nombre}. Disponible: ${prod.stock}`;
      break;
    }

    prod.stock -= pVenta.cantidad;

    // Validación de versión
    if (pVenta.version && pVenta.version !== "") {
      const [colorBuscado] = pVenta.version.split("-");
      const cantVenta = pVenta.cantidad; // 🔥 LA CANTIDAD REAL VENDIDA

      let partes = prod.version.split("-");
      let idx = partes.indexOf(colorBuscado);

      if (idx === -1) {
        errorMsg = `La versión "${colorBuscado}" no existe en ${pApi.nombre}`;
        break;
      }

      let stockVersionActual = parseInt(partes[idx + 1], 10);

      if (cantVenta > stockVersionActual) {
        errorMsg = `Stock insuficiente de la versión "${colorBuscado}". Disponible: ${stockVersionActual}`;
        break;
      }

      partes[idx + 1] = (stockVersionActual - cantVenta).toString();
      prod.version = partes.join("-");
    }
  }

  if (errorMsg) {
    return { actualizaciones: [], errorMsg };
  }

  // Convertimos el mapa en array final
  for (const id in productosProcesados) {
    actualizaciones.push({
      _id: id,
      stock: productosProcesados[id].stock,
      version: productosProcesados[id].version,
    });
  }

  return { actualizaciones, errorMsg: null };
};

export default function NotificacionPendiente({ onClose, onAprobado }) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await axios.get("/api/vent/pagoEnImg");
        setVentas((data || []).filter((v) => v.pago[0] !== "Z"));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // 👉 FUNCIÓN ÚNICA PARA CAMBIAR ESTADO (no se pierde ninguna función)
  const cambiarEstado = async (venta, nuevoEstado) => {
    try {
      // NUEVA LÓGICA DE VALIDACIÓN DE STOCK
      const estadoAnterior = venta.pago[0];
      if (nuevoEstado === "E" && estadoAnterior === "A") {
        const idsProductos = venta.productos.map((p) => p.idProd);

        // 1. Consultar datos actuales de los productos
        const { data: productosDeApi } = await axios.post(
          "/api/prod/ids",
          idsProductos,
        );

        // 2. Ejecutar comparaciones
        const { actualizaciones, errorMsg } = procesarInventario(
          venta.productos,
          productosDeApi,
        );

        if (errorMsg) {
          // Guardamos el error en el estado local de la venta para mostrarlo en el título
          setVentas((prev) =>
            prev.map((v) =>
              v._id === venta._id ? { ...v, errorTecnico: errorMsg } : v,
            ),
          );
          return; // Detenemos todo. No se cambia estado ni se actualiza nada.
        }

        // 3. Si todo está bien, actualizamos productos en la DB
        await axios.put("/api/prod", actualizaciones);
      }

      // CONTINUACIÓN DE LÓGICA NORMAL (Actualizar estado de la venta)
      if (nuevoEstado === "X" && venta.pago[0] === "P") {
        await axios.put(`/api/vent/cerrar/${venta._id}`, {
          motivo: "PAGO_RECHAZADO",
        });
        setVentas((prev) => prev.filter((v) => v._id !== venta._id));
      }
      // ✅ CANCELAR VENTA DESDE ESTADO A
      else if (nuevoEstado === "X" && venta.pago[0] === "A") {
        await axios.put(`/api/vent/cerrar/${venta._id}`, {
          motivo: "PAGO_RECHAZADO",
        });
        setVentas((prev) => prev.filter((v) => v._id !== venta._id));
      }

      // ✅ CERRAR VENTA DESDE ESTADO F
      else if (nuevoEstado === "Z" && venta.pago[0] === "F") {
        await axios.put(`/api/vent/cerrar/${venta._id}`);
        setVentas((prev) => prev.filter((v) => v._id !== venta._id));
      } else if (nuevoEstado === "Z" && venta.pago[0] === "X") {
        // 🔁 REVERTIR INVENTARIO
        const idsProductos = venta.productos.map((p) => p.idProd);

        const { data: productosDeApi } = await axios.post(
          "/api/prod/ids",
          idsProductos,
        );

        const { actualizaciones, errorMsg } = revertirInventario(
          venta.productos,
          productosDeApi,
        );

        if (errorMsg) {
          console.error(errorMsg);
          return;
        }

        await axios.put("/api/prod", actualizaciones);

        // 🔒 Cerrar venta
        await axios.put(`/api/vent/cerrar/${venta._id}`);

        setVentas((prev) => prev.filter((v) => v._id !== venta._id));
      } else {
        const nuevaUrl = nuevoEstado + venta.pago.slice(1);
        await axios.put(`/api/vent/${venta._id}`, { pago: nuevaUrl });

        setVentas((prev) =>
          prev.map((v) =>
            v._id === venta._id
              ? { ...v, pago: nuevaUrl, errorTecnico: null }
              : v,
          ),
        );
      }
      onAprobado();
    } catch (e) {
      console.error("Error cambiando estado", e);
    }
  };

  if (loading) return null;

  return (
    <div className="pp-overlay">
      <div className="pp-modal">
        <button className="pp-close" onClick={onClose}>
          <X />
        </button>

        <h2>Tareas pendientes</h2>

        {ventas.length === 0 && (
          <p className="pp-vacio">No hay pagos pendientes</p>
        )}

        {ventas.map((venta) => {
          const estado = venta.pago[0]; // P, A, E, F, X
          const imgUrl = venta.pago.slice(1);

          // CONFIGURACIÓN SEGÚN ESTADO
          let titulo = "";
          let botones = [];

          // PRIORIDAD: Si hay un error técnico de stock, se muestra este mensaje primero
          if (venta.errorTecnico) {
            titulo = venta.errorTecnico;
          } else {
            if (estado === "P") {
              titulo =
                "El cliente cargo la imagen del comprobante, confirme la validez y el ingreso del dinero y haga clic en “Pago aprobado”.";
              botones = [
                { texto: "Pago aprobado", estado: "A" },
                { texto: "Pago rechazado", estado: "X" },
              ];
            }

            if (estado === "A") {
              titulo =
                "El pago fue aprobado, confirme el envío del pedido haciendo clic en “Pedido enviado”.";
              botones = [
                { texto: "Pedido enviado", estado: "E" },
                { texto: "Venta cancelada", estado: "X" },
              ];
            }

            if (estado === "E") {
              titulo =
                "El Pedido fue enviado, confirme la entrega del pedido haciendo clic en “Pedido entregado” ";
              botones = [
                { texto: "Pedido entregado", estado: "F" },
                { texto: "Venta cancelada", estado: "X" },
              ];
            }

            if (estado === "F") {
              titulo =
                "El Pedido fue entregado, puede registrar la devolución si está pendiente de realizar algún cambio o Finalizar la compra si el cliente recibió a entera satisfacción haciendo clic en “Cerrar venta”. ";
              botones = [
                { texto: "Pedido en devolucion", estado: "E" },
                { texto: "Cerrar venta", estado: "Z" },
              ];
            }

            if (estado === "X") {
              titulo =
                "La venta fue cancelada, puede reenviar los productos y retomar la venta haciendo clic en “Pedido reenviado”. ";
              botones = [
                { texto: "Pedido reenviado", estado: "E" },
                { texto: "Cerrar venta", estado: "Z" },
              ];
            }
          }

          return (
            <div key={venta._id} className="pp-card">
              <div className="pp-row">
                {/* Imagen izquierda */}
                <a href={imgUrl} target="_blank" rel="noopener noreferrer">
                  <img src={imgUrl} alt="Comprobante" className="pp-img" />
                </a>

                {/* Contenido derecho */}
                <div className="pp-content">
                  <h3 className="pp-card-title">{titulo}</h3>

                  <div className="pp-info">
                    <p>
                      <b>Factura:</b> {venta.factura} del{" "}
                      {new Date(venta.fecha).toLocaleString()}
                    </p>
                    <p>
                      <b>Otros cobros:</b> ${venta.otrosCobros}
                      {" - "}
                      <b>Descuentos:</b> ${venta.descuentos}
                    </p>
                  </div>

                  <div className="pp-productos">
                    <b>Productos:</b>
                    <ul>
                      {venta.productos.map((p, i) => (
                        <li key={i}>
                          {p.nomProd} {p.version} — ${p.valor}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* BOTONES SEGÚN ESTADO */}
                  <div className="pp-actions">
                    {botones.map((b, i) => (
                      <button
                        key={i}
                        className={`pp-aprobar ${b.estado === "Z" ? "cerrar" : ""}`}
                        onClick={() => cambiarEstado(venta, b.estado)}
                      >
                        {b.texto}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
