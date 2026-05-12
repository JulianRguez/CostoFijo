import React, { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import "./NotificacionPendiente.css";

const API_KEY = import.meta.env.VITE_API_KEY;
const SIN_COMPROBANTE =
  "https://res.cloudinary.com/ddjdox6b0/image/upload/v1778519744/Sin_comprobante_w9ra5l.png";

const HEADERS = { "x-api-key": API_KEY };

// Construye el array para /api/prod/stock
const buildStockPayload = (productos, accion) =>
  productos.map((p) => ({
    _id: p.idProd,
    accion,
    newStock: p.cantidad,
    version: p.version || "",
  }));

// Llama a /api/prod/stock con un array de productos
const actualizarStock = (productos, accion) =>
  axios.put("/api/prod/stock", buildStockPayload(productos, accion), {
    headers: HEADERS,
  });

// Llama a /api/vent/estado
const cambiarEstadoApi = (_id, nuevoEstado) =>
  axios.put("/api/vent/estado", { _id, nuevoEstado }, { headers: HEADERS });

// Llama a /api/vent/imagen
const eliminarImagenApi = (_id, url) =>
  axios.delete("/api/vent/imagen", { data: { _id, url }, headers: HEADERS });

// Mapa de estados: título y botones
const CONFIG_ESTADOS = {
  "Pago en verificación": {
    titulo:
      'El cliente cargó la imagen del comprobante, confirme la validez y el ingreso del dinero y haga clic en "Pago aprobado".',
    botones: [
      {
        texto: "Pago aprobado",
        nuevoEstado: "Pago Aprobado",
        clase: "primario",
      },
      {
        texto: "Pago rechazado",
        nuevoEstado: "Pendiente por pagar",
        clase: "secundario",
      },
    ],
  },
  "Pago Aprobado": {
    titulo:
      'El pago fue aprobado, confirme el envío del pedido haciendo clic en "Pedido enviado".',
    botones: [
      {
        texto: "Pedido enviado",
        nuevoEstado: "Pedido Enviado",
        clase: "primario",
      },
      {
        texto: "Compra cancelada",
        nuevoEstado: "Compra cancelada",
        clase: "secundario",
      },
    ],
  },
  "Compra cancelada": {
    titulo:
      'La venta fue cancelada, puede reenviar los productos y retomar la venta haciendo clic en "Pedido reenviado".',
    botones: [
      {
        texto: "Pedido reenviado",
        nuevoEstado: "Pedido Enviado",
        clase: "primario",
      },
      {
        texto: "Cerrar venta",
        nuevoEstado: "Compra Anulada",
        clase: "secundario",
      },
    ],
  },
  "Pedido Enviado": {
    titulo:
      'El pedido fue enviado, confirme la entrega haciendo clic en "Pedido entregado".',
    botones: [
      {
        texto: "Pedido entregado",
        nuevoEstado: "Pedido Entregado",
        clase: "primario",
      },
      {
        texto: "Compra cancelada",
        nuevoEstado: "Compra cancelada",
        clase: "secundario",
      },
    ],
  },
  "Pedido Entregado": {
    titulo:
      'El pedido fue entregado. Puede registrar una devolución o finalizar la compra haciendo clic en "Cerrar venta".',
    botones: [
      {
        texto: "En devolución",
        nuevoEstado: "Pago Aprobado",
        clase: "secundario",
      },
      {
        texto: "Cerrar venta",
        nuevoEstado: "Pagado y entregado",
        clase: "primario",
      },
    ],
  },
  "Pendiente de envío": {
    titulo:
      'El cliente seleccionó contra entrega, confirme la validez y envíe el pedido haciendo clic en "Pedido enviado".',
    botones: [
      {
        texto: "Pedido enviado",
        nuevoEstado: "Pagar al recibir",
        clase: "primario",
      },
      {
        texto: "Compra rechazada",
        nuevoEstado: "Compra Anulada",
        clase: "secundario",
      },
    ],
  },
  "Pagar al recibir": {
    titulo:
      'La compra fue enviada a contra entrega. Si el cliente recibió y pagó, haga clic en "Pedido entregado".',
    botones: [
      {
        texto: "Pedido entregado",
        nuevoEstado: "Pedido Entregado",
        clase: "primario",
      },
      {
        texto: "Compra cancelada",
        nuevoEstado: "Compra Anulada",
        clase: "secundario",
      },
    ],
  },
  "Esperando crédito": {
    titulo:
      'El cliente seleccionó pago por Sistecredito o ADDI. Si el crédito fue aprobado, envíe el producto y haga clic en "Pedido enviado".',
    botones: [
      {
        texto: "Pedido enviado",
        nuevoEstado: "Pedido Enviado",
        clase: "primario",
      },
      {
        texto: "Compra rechazada",
        nuevoEstado: "Compra Anulada",
        clase: "secundario",
      },
    ],
  },
};

// Estados finales: se ocultan de la lista al llegar aquí
const ESTADOS_FINALES = new Set([
  "Pendiente por pagar",
  "Pagado y entregado",
  "Compra Anulada",
  "Pagado en efectivo",
]);

export default function NotificacionPendiente({ onClose, onAprobado }) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState({}); // _id -> true mientras espera

  useEffect(() => {
    axios
      .get("/api/vent/pagoEnImg", { headers: HEADERS })
      .then(({ data }) => setVentas(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const setError = (_id, msg) =>
    setVentas((prev) =>
      prev.map((v) => (v._id === _id ? { ...v, errorTecnico: msg } : v)),
    );

  const remover = (_id) =>
    setVentas((prev) => prev.filter((v) => v._id !== _id));

  const actualizarLocal = (_id, nuevoEstado) =>
    setVentas((prev) =>
      prev.map((v) =>
        v._id === _id ? { ...v, pago: nuevoEstado, errorTecnico: null } : v,
      ),
    );

  const manejarAccion = async (venta, nuevoEstado) => {
    const { _id, productos, imgPago, pago: estadoActual } = venta;

    setProcesando((p) => ({ ...p, [_id]: true }));
    try {
      // ── Pago rechazado → Pendiente por pagar ──────────────────────────
      if (nuevoEstado === "Pendiente por pagar") {
        if (imgPago) await eliminarImagenApi(_id, imgPago);
        await cambiarEstadoApi(_id, nuevoEstado);
        remover(_id);

        // ── Pago aprobado → Pago Aprobado (resta productos) ───────────────
      } else if (
        nuevoEstado === "Pago Aprobado" &&
        estadoActual === "Pago en verificación"
      ) {
        await actualizarStock(productos, 0);
        await cambiarEstadoApi(_id, nuevoEstado);
        actualizarLocal(_id, nuevoEstado);

        // ── Cerrar venta desde Pedido Entregado (elimina imagen) ──────────
      } else if (nuevoEstado === "Pagado y entregado") {
        if (imgPago) await eliminarImagenApi(_id, imgPago);
        await cambiarEstadoApi(_id, nuevoEstado);
        remover(_id);

        // ── Cerrar venta desde Compra cancelada (suma productos + elimina imagen) ──
      } else if (
        nuevoEstado === "Compra Anulada" &&
        estadoActual === "Compra cancelada"
      ) {
        await actualizarStock(productos, 1);
        if (imgPago) await eliminarImagenApi(_id, imgPago);
        await cambiarEstadoApi(_id, nuevoEstado);
        remover(_id);

        // ── Esperando crédito → Pedido Enviado (resta productos) ──────────
      } else if (
        nuevoEstado === "Pedido Enviado" &&
        estadoActual === "Esperando crédito"
      ) {
        await actualizarStock(productos, 0);
        await cambiarEstadoApi(_id, nuevoEstado);
        actualizarLocal(_id, nuevoEstado);

        // ── Cerrar venta desde Pendiente de envío o Esperando crédito ─────
      } else if (nuevoEstado === "Compra Anulada") {
        await cambiarEstadoApi(_id, nuevoEstado);
        remover(_id);

        // ── Pagar al recibir → Pedido Entregado (resta productos) ─────────
      } else if (
        nuevoEstado === "Pedido Entregado" &&
        estadoActual === "Pagar al recibir"
      ) {
        await actualizarStock(productos, 0);
        await cambiarEstadoApi(_id, nuevoEstado);
        actualizarLocal(_id, nuevoEstado);

        // ── Cualquier otro cambio de estado simple ─────────────────────────
      } else {
        await cambiarEstadoApi(_id, nuevoEstado);
        if (ESTADOS_FINALES.has(nuevoEstado)) {
          remover(_id);
        } else {
          actualizarLocal(_id, nuevoEstado);
        }
      }

      onAprobado();
    } catch (e) {
      console.error("Error en acción:", e);
      setError(_id, "Ocurrió un error. Intente de nuevo.");
    } finally {
      setProcesando((p) => ({ ...p, [_id]: false }));
    }
  };

  if (loading) return null;

  return (
    <div className="pp-overlay">
      <div className="pp-modal">
        <button className="pp-close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2>Tareas pendientes</h2>

        {ventas.length === 0 && (
          <p className="pp-vacio">No hay tareas pendientes</p>
        )}

        {ventas.map((venta) => {
          const config = CONFIG_ESTADOS[venta.pago];
          if (!config) return null; // estado desconocido, no mostrar

          const imgUrl = venta.imgPago || SIN_COMPROBANTE;
          const enProceso = !!procesando[venta._id];

          return (
            <div key={venta._id} className="pp-card">
              <div className="pp-row">
                <a
                  className="pp-img-link"
                  href={imgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={imgUrl} alt="Comprobante" className="pp-img" />
                </a>

                <div className="pp-content">
                  <h3
                    className={`pp-card-title${venta.errorTecnico ? " error" : ""}`}
                  >
                    {venta.errorTecnico || config.titulo}
                  </h3>

                  <div className="pp-info">
                    <p>
                      <b>Factura:</b> {venta.factura} —{" "}
                      {new Date(venta.fecha).toLocaleString()}
                    </p>
                    <p>
                      <b>Otros cobros:</b> ${venta.otrosCobros} —{" "}
                      <b>Descuentos:</b> ${venta.descuentos}
                    </p>
                  </div>

                  <div className="pp-productos">
                    <b>Productos:</b>
                    <ul>
                      {venta.productos.map((p, i) => (
                        <li key={i}>
                          {p.nomProd} {p.version ? `(${p.version})` : ""} ×
                          {p.cantidad} — ${p.valor}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pp-actions">
                    {config.botones.map((b, i) => (
                      <button
                        key={i}
                        className={`pp-btn ${b.clase}`}
                        disabled={enProceso}
                        onClick={() => manejarAccion(venta, b.nuevoEstado)}
                      >
                        {enProceso ? "..." : b.texto}
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
