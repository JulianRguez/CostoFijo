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

  // Helpers
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

  // Agregar producto al carrito
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

    // 1) Actualizar stock general y versiones en la lista de productos
    // 1) Actualizar solo las versiones en productos, no el stock general
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

    // 2) Armar clave versión
    const versionName = hadVersions ? selectedName : "Única versión";

    // 3) Actualizar carrito
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

  // Quitar producto del carrito
  const quitarDelCarrito = (id, versionName) => {
    // 1) Buscar el item a eliminar
    const item = carrito.find(
      (i) => i._id === id && (i.versionName || "Única versión") === versionName
    );
    if (!item) return;

    // 2) Actualizar productos (solo si tiene versiones)
    if (versionName !== "Única versión") {
      setProductos((prev) =>
        prev.map((p) => {
          if (p._id !== id) return p;
          const pairs = parsePairs(p.version);
          const newPairs = pairs.map((pair) =>
            pair.name === versionName
              ? { ...pair, qty: pair.qty + item.cantidad } // devolvemos cantidad
              : pair
          );
          return { ...p, version: joinPairs(newPairs) };
        })
      );
    }

    // 3) Quitar del carrito
    setCarrito(
      carrito.filter(
        (i) =>
          !(i._id === id && (i.versionName || "Única versión") === versionName)
      )
    );
  };

  // Calcular total
  const total = carrito.reduce(
    (acc, item) => acc + (item.valorVenta ?? item.precio) * item.cantidad,
    0
  );

  // Filtrar productos
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

  const buildUpdatedVersion = (producto, carrito) => {
    // Parsear pares del producto original
    const parsePairs = (versionStr) => {
      if (!versionStr || versionStr.trim() === "") return [];
      const a = versionStr.split("-");
      const out = [];
      for (let i = 0; i < a.length; i += 2) {
        out.push({ name: a[i], qty: parseInt(a[i + 1] ?? "0", 10) });
      }
      return out;
    };
    const joinPairs = (pairs) =>
      pairs.map((p) => `${p.name}-${p.qty}`).join("-");

    const pairs = parsePairs(producto.version);

    // Restar cantidades vendidas de este producto por cada versionName
    carrito
      .filter(
        (c) => c._id === producto._id && c.versionName !== "Única versión"
      )
      .forEach((item) => {
        const pair = pairs.find((p) => p.name === item.versionName);
        if (pair) {
          pair.qty = Math.max(0, pair.qty - item.cantidad);
        }
      });

    return joinPairs(pairs);
  };

  // Confirmar venta
  // Confirmar venta
  const handleConfirmar = async (extraData) => {
    if (carrito.length === 0) return;

    try {
      // 1) Agrupar ventas por producto (sumar cantidades sin importar la versión)
      const vendidosPorProducto = carrito.reduce((acc, item) => {
        acc[item._id] = (acc[item._id] || 0) + item.cantidad;
        return acc;
      }, {});

      // 2) Payload de ventas (incluye la versión ACTUALIZADA de cada producto)
      const ventasPayload = carrito.map((item) => {
        const prodActual = productos.find((p) => p._id === item._id);
        return {
          idProd: item._id,
          idClient: nombreCliente,
          cantidad: item.cantidad,
          valor: item.valorVenta ?? item.precio,
          factura: `FACT-${Date.now()}`,
          version: prodActual?.version || "", // 👈 versión final (ya decrementada por add/remove)
          ...extraData, // creditoDirecto, fechaPago, etc.
        };
      });

      // 3) Enviar ventas
      await axios.post(`${URLAPI}/api/vent`, ventasPayload);

      // 4) Actualizar productos existentes en BD con stock y VERSION
      const payloadUpdate = Object.entries(vendidosPorProducto).map(
        ([id, cantVendida]) => {
          const prod = productos.find((p) => p._id === id);
          return {
            _id: id,
            stock: (prod?.stock ?? 0) - cantVendida, // stock original - vendidos totales
            version: prod?.version ?? "", // 👈 enviar string de versiones actualizado
          };
        }
      );

      if (payloadUpdate.length > 0) {
        await axios.put(`${URLAPI}/api/prod`, payloadUpdate);
      }

      // 5) Refrescar lista de productos desde la API (para ver los cambios confirmados)
      const res = await axios.get(`${URLAPI}/api/prod`);
      setProductos(res.data);

      // 6) Reset de estados
      setMensaje({ texto: "Registro exitoso", tipo: "exito" });
      setCarrito([]);
      setNombreCliente("Sin Registro");
    } catch (error) {
      console.error("Error al confirmar venta:", error);
      setMensaje({ texto: "Error al realizar el registro", tipo: "error" });
    }
  };

  return (
    <div className="vista-central">
      {/* Buscador */}
      <div className="buscador-con-checkbox">
        <input
          type="text"
          placeholder="Buscar por referencia..."
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
          handleNombreBlur={handleNombreBlur}
          onClose={() => setMostrarModal(false)}
          onConfirmar={(extraData) => handleConfirmar(extraData)}
        />
      )}
    </div>
  );
}
