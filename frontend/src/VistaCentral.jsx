import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VistaCentral.css";
import ConfVenta from "./ConfVenta";

export default function VistaCentral() {
  const [productos, setProductos] = useState([]);
  const [filtrar, setFiltrar] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [verAgotados, setVerAgotados] = useState(
    localStorage.getItem("verAgotados") === "true"
  );
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nombreCliente, setNombreCliente] = useState("Sin Registro");
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [selecciones, setSelecciones] = useState({});

  const URLAPI = import.meta.env.VITE_URLAPI;

  // Helpers para versiones
  const parsePairs = (versionStr) => {
    if (!versionStr || versionStr.trim() === "") return [];
    const a = versionStr.split("-");
    const out = [];
    for (let i = 0; i < a.length; i += 2) {
      out.push({ name: a[i], qty: parseInt(a[i + 1] ?? "0", 10) });
    }
    return out;
  };
  const joinPairs = (pairs) => pairs.map((p) => `${p.name}-${p.qty}`).join("-");

  // Cargar productos
  useEffect(() => {
    axios
      .get(`${URLAPI}/api/prod`)
      .then((res) => setProductos(res.data))
      .catch((err) => console.error("Error al obtener productos:", err));
  }, []);

  // Guardar preferencia de ver agotados
  useEffect(() => {
    localStorage.setItem("verAgotados", verAgotados);
  }, [verAgotados]);

  // Agregar producto al carrito (manteniendo tu lógica actual) :contentReference[oaicite:3]{index=3}
  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) return;
    if (mensaje.texto) setMensaje({ texto: "", tipo: "" });

    const hadVersions = !!(producto.version && producto.version.trim() !== "");
    const pairs = parsePairs(producto.version);
    const selectedName = hadVersions
      ? selecciones[producto._id] ?? pairs.find((p) => p.qty > 0)?.name
      : null;

    if (hadVersions && !selectedName) return;

    if (hadVersions) {
      const sel = pairs.find((p) => p.name === selectedName);
      if (!sel || sel.qty <= 0) return;
    }

    // Actualizar solo las versiones en productos, no el stock general
    if (hadVersions) {
      setProductos((prev) =>
        prev.map((p) => {
          if (p._id !== producto._id) return p;
          const newPairs = pairs.map((pair) =>
            pair.name === selectedName ? { ...pair, qty: pair.qty - 1 } : pair
          );
          return { ...p, version: joinPairs(newPairs) };
        })
      );
    }

    // Clave versión
    const versionName = hadVersions ? selectedName : "Única versión";

    // Actualizar carrito
    const existe = carrito.find(
      (item) =>
        item._id === producto._id &&
        (item.versionName || "Única versión") === versionName
    );

    if (existe) {
      setCarrito(
        carrito.map((item) =>
          item._id === producto._id &&
          (item.versionName || "Única versión") === versionName
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1, versionName }]);
    }
  };

  // Quitar producto del carrito (sin cambios de lógica principal) :contentReference[oaicite:4]{index=4}
  const quitarDelCarrito = (id, versionName) => {
    const item = carrito.find(
      (i) => i._id === id && (i.versionName || "Única versión") === versionName
    );
    if (!item) return;

    if (versionName !== "Única versión") {
      setProductos((prev) =>
        prev.map((p) => {
          if (p._id !== id) return p;
          const pairs = parsePairs(p.version);
          const newPairs = pairs.map((pair) =>
            pair.name === versionName
              ? { ...pair, qty: pair.qty + item.cantidad }
              : pair
          );
          return { ...p, version: joinPairs(newPairs) };
        })
      );
    }

    setCarrito(
      carrito.filter(
        (i) =>
          !(i._id === id && (i.versionName || "Única versión") === versionName)
      )
    );
  };

  // Total
  const total = carrito.reduce(
    (acc, item) => acc + (item.valorVenta ?? item.precio) * item.cantidad,
    0
  );

  // Filtrado de productos (mantengo tu pipeline) :contentReference[oaicite:5]{index=5}
  const productosFiltrados = productos
    .map((p) => {
      const totalEnCarrito = carrito
        .filter((c) => c._id === p._id)
        .reduce((acc, c) => acc + c.cantidad, 0);
      return {
        ...p,
        stock: p.stock - totalEnCarrito,
      };
    })
    .filter((p) => p.etiqueta !== "Gasto")
    .filter((p) => p.ref?.toLowerCase().includes(filtrar.toLowerCase()))
    .filter((p) => verAgotados || p.stock > 0);

  const handleNombreFocus = () => {
    if (nombreCliente === "Sin Registro") {
      setNombreCliente("");
    }
  };
  const handleNombreBlur = () => {
    if (nombreCliente.trim() === "") {
      setNombreCliente("Sin Registro");
    }
  };

  // ✅ Confirmar venta: devuelve true/false y hace POST /api/cred si corresponde
  const handleConfirmar = async (extraData) => {
    if (carrito.length === 0) return false;

    let exito = false;

    try {
      // 1) Agrupar cantidades por producto
      const vendidosPorProducto = carrito.reduce((acc, item) => {
        acc[item._id] = (acc[item._id] || 0) + item.cantidad;
        return acc;
      }, {});

      // 2) Payload de ventas (incluye versión actual del estado) :contentReference[oaicite:6]{index=6}
      const ventasPayload = carrito.map((item) => {
        const prodActual = productos.find((p) => p._id === item._id);
        const clave = `${item._id}-${item.versionName || "Única versión"}`;
        const garantiaInfo = extraData?.garantias?.[clave];
        const garantia =
          garantiaInfo?.checked && Number(garantiaInfo?.dias) > 0
            ? Number(garantiaInfo.dias)
            : 0;

        return {
          idProd: item._id,
          idClient: nombreCliente, // aquí va el documento/identificador mostrado
          cantidad: item.cantidad,
          valor: item.valorVenta ?? item.precio,
          factura: `FACT-${Date.now()}`,
          version: prodActual?.version || "",
          garantia,
        };
      });

      // 3) Crear ventas
      await axios.post(`${URLAPI}/api/vent`, ventasPayload);

      // 4) Actualizar productos en BD (stock - vendidos, versión ya viene del estado) :contentReference[oaicite:7]{index=7}
      const payloadUpdate = Object.entries(vendidosPorProducto).map(
        ([id, cantVendida]) => {
          const prod = productos.find((p) => p._id === id);
          return {
            _id: id,
            stock: (prod?.stock ?? 0) - cantVendida,
            version: prod?.version ?? "",
          };
        }
      );
      if (payloadUpdate.length > 0) {
        await axios.put(`${URLAPI}/api/prod`, payloadUpdate);
      }

      // 5) Si hay crédito directo > 0, registrar crédito y (opcional) movimiento del cliente
      const monto = Number(extraData?.valorFinanciado) || 0;
      const tieneCredito =
        Boolean(extraData?.clienteValido) &&
        Boolean(extraData?.creditoDirecto) &&
        monto > 0;

      if (tieneCredito) {
        // 5.1 POST /api/cred (lo que solicitaste)
        const payloadCredito = {
          idClient: extraData?.cliente?._id, // _id del cliente encontrado
          monto,
          plazo: 1,
          interes: 0,
        };
        await axios.post(`${URLAPI}/api/cred`, payloadCredito);

        // 5.2 (Opcional) Actualizar "porpagar" del cliente si la fecha es válida ISO
        const isISODate = /^\d{4}-\d{2}-\d{2}$/;
        if (isISODate.test(extraData?.fechaPago || "")) {
          try {
            const cli = extraData.cliente;
            const existentes = Array.isArray(cli.porpagar) ? cli.porpagar : [];

            const productosIds = [...new Set(carrito.map((i) => i._id))].join(
              "-"
            );
            const hoyISO = new Date().toISOString().slice(0, 10);

            const nuevoMovimiento = {
              producto: productosIds,
              diaCredito: hoyISO,
              proxPago: extraData.fechaPago,
              valor: Number(extraData.valorFinanciado),
              abonos: [],
            };

            const payloadCliente = [
              {
                _id: cli._id,
                porpagar: [...existentes, nuevoMovimiento],
              },
            ];

            await axios.put(`${URLAPI}/api/clie`, payloadCliente);
          } catch (eCli) {
            console.error("Error actualizando cliente (porpagar):", eCli);
          }
        }
      }

      // 6) Refrescar productos y estados de UI
      const res = await axios.get(`${URLAPI}/api/prod`);
      setProductos(res.data);

      setMensaje({ texto: "Registro exitoso", tipo: "exito" });
      setCarrito([]);
      setNombreCliente("Sin Registro");

      exito = true;
    } catch (error) {
      console.error("Error al confirmar venta:", error);
      setMensaje({ texto: "Error al realizar el registro", tipo: "error" });
      exito = false;
    }

    // devolvemos el resultado para que ConfVenta cierre cuando termine
    return exito;
  };

  return (
    <div className="vista-central">
      {/* Buscador */}
      <div className="buscador-con-checkbox">
        <input
          type="text"
          placeholder="Buscar por referencia."
          value={filtrar}
          onChange={(e) => setFiltrar(e.target.value)}
          className="buscador"
        />
        <label className="checkbox-ver-agotados">
          <input
            type="checkbox"
            checked={verAgotados}
            onChange={() => setVerAgotados(!verAgotados)}
          />
          Ver productos agotados
        </label>
      </div>

      <div className="contenedor-vertical">
        {/* Lista de productos */}
        <div className="contenedor-productos">
          {productosFiltrados.map((prod) => {
            const pairs = parsePairs(prod.version);
            const currentSel =
              selecciones[prod._id] ??
              pairs.find((p) => p.qty > 0)?.name ??
              "unica";

            return (
              <div key={prod._id} className="producto linea">
                <img src={prod.urlFoto1} alt="" className="imagen mini" />
                <span>{prod.nombre}</span>
                <span>Ref: {prod.ref}</span>
                <span>{prod.stock}</span>
                <span>${prod.valorVenta ?? prod.precio}</span>

                {/* Lista de versiones */}
                {pairs.length > 0 ? (
                  <select
                    className="version-select"
                    value={currentSel}
                    onChange={(e) =>
                      setSelecciones({
                        ...selecciones,
                        [prod._id]: e.target.value,
                      })
                    }
                  >
                    {pairs.map(({ name, qty }, i) => (
                      <option key={i} value={name} disabled={qty <= 0}>
                        {name} ({qty})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select className="version-select" value="unica" disabled>
                    <option value="unica">Única versión</option>
                  </select>
                )}

                <span>R: {prod.reversado}</span>
                <span>{prod.etiqueta}</span>
                <span>⭐ {prod.calificacion?.length || 0}</span>
                <button
                  onClick={() => agregarAlCarrito(prod)}
                  className="btn-facturar"
                  disabled={prod.stock <= 0}
                >
                  Facturar
                </button>
              </div>
            );
          })}
        </div>

        {/* Carrito */}
        <div className="contenedor-carrito">
          <div className="carrito-header">
            <h2 className="carrito-titulo">Productos seleccionados</h2>
            {mensaje.texto && (
              <span
                className={`msg-estado ${
                  mensaje.tipo === "exito" ? "ok" : "err"
                }`}
              >
                {mensaje.texto}
              </span>
            )}
          </div>

          <div className="carrito-scroll">
            {carrito.map((item) => (
              <div
                key={`${item._id}-${item.versionName}`}
                className="carrito-item linea compacto"
              >
                <img src={item.urlFoto1} alt="" className="imagen mini" />
                <span>
                  {item.nombre} ({item.versionName} x{item.cantidad})
                </span>
                <span>x{item.cantidad}</span>
                <span>${item.valorVenta ?? item.precio}</span>
                <span>${(item.valorVenta ?? item.precio) * item.cantidad}</span>
                <button
                  className="eliminar"
                  onClick={() =>
                    quitarDelCarrito(
                      item._id,
                      item.versionName || "Única versión"
                    )
                  }
                >
                  ❌
                </button>
              </div>
            ))}
          </div>

          <div className="carrito-total">Total: ${total}</div>
          <button
            className="btn-confirmar"
            id="btnConfirmar"
            onClick={() => setMostrarModal(true)}
            disabled={carrito.length === 0}
          >
            Confirmar venta
          </button>
        </div>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <ConfVenta
          carrito={carrito}
          total={total}
          nombreCliente={nombreCliente}
          setNombreCliente={setNombreCliente}
          handleNombreFocus={handleNombreFocus}
          onClose={() => setMostrarModal(false)}
          onConfirmar={(extraData) => handleConfirmar(extraData)}
        />
      )}
    </div>
  );
}
