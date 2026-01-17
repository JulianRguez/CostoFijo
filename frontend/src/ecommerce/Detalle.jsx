// Detalle.jsx
import React, { useEffect, useState, useRef } from "react";
import { X, ShoppingCart } from "lucide-react";
import axios from "axios";
import CarroCompra from "./CarroCompra";
import "./Detalle.css";

export default function Detalle({
  productoId,
  onClose,
  usuario,
  autenticado,
  setUsuario,
  mostrarAlertaInicio,
  abrirDetalleDesdeRecomendado,
  setInfoPedido,
  setMostrarCliente,
  setModoCliente,
}) {
  const [producto, setProducto] = useState(null);
  const [todos, setTodos] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [indice, setIndice] = useState(0);
  const [versionSel, setVersionSel] = useState("");
  const [versionesParsed, setVersionesParsed] = useState([]);
  const [similares, setSimilares] = useState([]);
  const initializedFor = useRef(null);
  const [mostrarCarro, setMostrarCarro] = useState(false);

  // 🔒 imagen por defecto desde .env
  const IMG_DEF = import.meta.env.VITE_IMG_DEF;

  // --------------------------------------------
  // Parseo de versiones tipo “blanca-2-negra-1”
  // --------------------------------------------
  function parseVersiones(str) {
    if (!str || typeof str !== "string") return [];
    const parts = str.split("-");
    const result = [];
    for (let i = 0; i < parts.length; i += 2) {
      const nombre = parts[i]?.trim();
      const stock = parseInt(parts[i + 1], 10);
      if (nombre && !isNaN(stock)) result.push({ nombre, stock });
    }
    return result;
  }

  // Cargar producto + todos para recomendados
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`/api/prod`);
        setTodos(data || []);
        const actual = data.find((p) => p._id === productoId);
        setProducto(actual || null);
      } catch (err) {
        console.error("Error cargando productos:", err);
      }
    })();
  }, [productoId]);

  useEffect(() => {
    if (!producto && productoId) {
      axios
        .get(`/api/prod/${productoId}`)
        .then((res) => setProducto(res.data))
        .catch((err) => console.error(err));
    }
  }, [producto, productoId]);

  const extraerUrls = (field) =>
    !field || typeof field !== "string"
      ? []
      : field
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);

  // Cargar imágenes + versiones + recomendados
  useEffect(() => {
    if (!producto) return;

    setImagenes([
      ...extraerUrls(producto.urlFoto1),
      ...extraerUrls(producto.urlFoto2),
    ]);

    // Versiones
    const parsed = parseVersiones(producto.version);
    setVersionesParsed(parsed);
    setVersionSel(parsed.length ? parsed[0].nombre : "");

    // Recomendados
    if (initializedFor.current === producto._id && similares.length) return;

    const nom = producto.nombre || "";
    const base = nom.match(/([A-Za-z]{3})(\d{2})?$/)?.[1]?.toUpperCase() || "";

    let simil = [];

    if (base) {
      simil = todos.filter(
        (p) =>
          p._id !== producto._id &&
          (p.nombre || "").toUpperCase().includes(base)
      );
    }

    if (simil.length < 6) {
      const faltan = 6 - simil.length;
      const extra = todos
        .filter(
          (p) =>
            p._id !== producto._id &&
            p.etiqueta === producto.etiqueta &&
            !simil.some((s) => s._id === p._id)
        )
        .slice(0, faltan);

      simil = [...simil, ...extra];
    }

    setSimilares(simil.slice(0, 6));
    initializedFor.current = producto._id;
  }, [producto, todos]);

  if (!producto) return null;

  // ------------------------------
  // Stock
  // ------------------------------
  const stockGlobal = producto.stock ?? producto.cantidad ?? 0;

  const stockDeVersion = (nombre) => {
    if (!versionesParsed.length) return stockGlobal;
    return versionesParsed.find((x) => x.nombre === nombre)?.stock ?? 0;
  };

  const stockDisponible = versionesParsed.length
    ? stockDeVersion(versionSel)
    : stockGlobal;

  // ------------------------------
  // Precios
  // ------------------------------
  const matchDesc = producto.nombre.match(/(\d{2})$/);
  const desc = matchDesc ? parseInt(matchDesc[1], 10) : 0;
  const tieneDesc = desc > 0;
  const precio = producto.valorVenta || 0;
  const precioFinal = tieneDesc
    ? Math.round(precio * (1 - desc / 100))
    : precio;

  // Calificación
  const cal = Array.isArray(producto.calificacion) ? producto.calificacion : [];
  const prom = cal.length
    ? Math.round((cal.reduce((a, b) => a + b, 0) / cal.length) * 10) / 10
    : 0;

  const stripCodigo = (name = "") =>
    name.replace(/\s*([A-Za-z]{3})(\d{2})?$/i, "").trim();

  function formatPrice(n) {
    if (typeof n !== "number") return n;
    return n.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    });
  }

  // --------------------------------------------
  // AGREGAR AL CARRITO — AHORA CON ALERTA GLOBAL
  // --------------------------------------------
  const handleAddFromDetalle = async () => {
    if (!autenticado) {
      mostrarAlertaInicio(
        "Inicia sesión para continuar",
        "Para agregar productos al carrito, inicia sesión."
      );
      return;
    }

    if (stockDisponible <= 0) {
      mostrarAlertaInicio(
        "Sin unidades",
        "No hay unidades disponibles de esta versión."
      );
      return;
    }

    const carritoActual = usuario.carrito || [];

    const versionCompleta = versionesParsed.length
      ? `${versionSel}-${stockDeVersion(versionSel)}`
      : "";

    const existente = carritoActual.find(
      (item) =>
        item.productoId === producto._id && item.version === versionCompleta
    );

    let nuevoCarrito;

    if (existente) {
      if (existente.cantidad + 1 > stockDisponible) {
        mostrarAlertaInicio(
          "Stock máximo",
          "No puedes agregar más unidades de esta versión."
        );
        return;
      }

      nuevoCarrito = carritoActual.map((x) =>
        x === existente ? { ...x, cantidad: x.cantidad + 1 } : x
      );
    } else {
      nuevoCarrito = [
        ...carritoActual,
        {
          productoId: producto._id,
          cantidad: 1,
          version: versionCompleta,
        },
      ];
    }

    try {
      await axios.put(`/api/clie`, [
        { _id: usuario._id, carrito: nuevoCarrito },
      ]);

      setUsuario?.((u) => ({ ...u, carrito: nuevoCarrito }));

      mostrarAlertaInicio(
        "Producto agregado",
        "El producto fue agregado al carrito correctamente."
      );
    } catch (err) {
      console.error(err);
      mostrarAlertaInicio(
        "Error",
        "Ocurrió un error al agregar el producto al carrito."
      );
    }
  };

  // --------------------------------------------
  // RENDER
  // --------------------------------------------
  return (
    <div className="detalle-overlay" onClick={onClose}>
      <div className="detalle-modal" onClick={(e) => e.stopPropagation()}>
        <button className="detalle-close" onClick={onClose}>
          <X />
        </button>

        <div className="detalle-main">
          <div className="detalle-imagenes">
            {imagenes.length ? (
              <>
                <div
                  className="detalle-img-principal"
                  onClick={() =>
                    setIndice((i) => (i + 1) % (imagenes.length || 1))
                  }
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={imagenes[indice]}
                    alt={producto.nombre}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = IMG_DEF;
                    }}
                  />
                </div>

                <div className="detalle-thumbs">
                  {imagenes.map((u, i) => (
                    <img
                      key={i}
                      src={u}
                      alt="thumb"
                      onClick={() => setIndice(i)}
                      className={i === indice ? "activa" : ""}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = IMG_DEF;
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p>Sin imagen</p>
            )}
          </div>

          <div className="detalle-info">
            <h2>{stripCodigo(producto.nombre)}</h2>

            {tieneDesc && (
              <p className="detalle-descuento">Descuento {desc}%</p>
            )}

            <p className="detalle-precio">
              {tieneDesc && (
                <span className="tachado">{formatPrice(precio)}</span>
              )}
              {formatPrice(precioFinal)}
            </p>

            <p>Stock disponible: {stockDisponible}</p>
            <p>Calificación promedio: {prom} / 5</p>

            <label>Versión:</label>
            {versionesParsed.length ? (
              <select
                value={versionSel}
                onChange={(e) => setVersionSel(e.target.value)}
              >
                {versionesParsed.map((v) => (
                  <option key={v.nombre} value={v.nombre}>
                    {v.nombre} ({v.stock})
                  </option>
                ))}
              </select>
            ) : (
              <select disabled>
                <option>Versión única</option>
              </select>
            )}

            <div className="detalle-botones">
              <button onClick={onClose}>Cerrar</button>

              <button
                className={`btn-naranja ${!autenticado ? "btn-grayed" : ""}`}
                onClick={handleAddFromDetalle}
              >
                Agregar <ShoppingCart size={16} />
                X1
              </button>

              <button
                className="btn-gris"
                onClick={() => {
                  // 1️⃣ Copia del producto original
                  let productoDirecto = { ...producto };

                  // 2️⃣ Si hay versiones, usar la seleccionada (o la primera)
                  if (versionesParsed.length) {
                    const v =
                      versionesParsed.find((x) => x.nombre === versionSel) ||
                      versionesParsed[0];

                    if (v) {
                      // Formato correcto: "verde-3"
                      productoDirecto.version = `${v.nombre}-${v.stock}`;
                    }
                  }

                  console.log(
                    "Producto enviado a compra rápida desde Detalle:",
                    productoDirecto
                  );

                  // 3️⃣ Abrir carro con el producto ya corregido
                  setProducto(productoDirecto);
                  setMostrarCarro(true);
                }}
              >
                Compra rápida
              </button>
            </div>

            <div className="detalle-copy-wrap">
              <button
                className="detalle-copy-btn"
                onClick={() => {
                  const url = `${window.location.origin}/p/${producto._id}`;
                  navigator.clipboard.writeText(url);
                  mostrarAlertaInicio(
                    "Copiado",
                    "Enlace del producto copiado."
                  );
                }}
              >
                Copiar Link del producto
              </button>
            </div>
          </div>
        </div>

        <div className="detalle-recomendados">
          <h3>Productos recomendados</h3>

          <div className="detalle-reco-grid">
            {similares.length ? (
              similares.map((p) => {
                const match = p.nombre.match(/(\d{2})$/);
                const desc = match ? parseInt(match[1], 10) : 0;
                const tieneDesc = desc > 0;
                const precio = p.valorVenta || 0;
                const precioFinal = tieneDesc
                  ? Math.round(precio * (1 - desc / 100))
                  : precio;

                return (
                  <div
                    key={p._id}
                    className="reco-card"
                    onClick={() => abrirDetalleDesdeRecomendado(p._id)}
                  >
                    <img
                      src={p.urlFoto1}
                      alt={stripCodigo(p.nombre)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = IMG_DEF;
                      }}
                    />
                    <p className="reco-nombre">{stripCodigo(p.nombre)}</p>

                    {tieneDesc ? (
                      <p className="reco-precio">
                        <span className="reco-tachado">
                          {formatPrice(precio)}
                        </span>
                        <br />
                        {formatPrice(precioFinal)} -{desc}%
                      </p>
                    ) : (
                      <p>{formatPrice(precio)}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <p>No hay recomendados</p>
            )}
          </div>
        </div>
      </div>

      {mostrarCarro && (
        <CarroCompra
          visible={mostrarCarro}
          onClose={() => setMostrarCarro(false)}
          clienteId={usuario?._id || null}
          productoDirecto={producto}
          setUsuario={setUsuario}
          setInfoPedido={setInfoPedido}
          setMostrarCliente={setMostrarCliente}
          setModoCliente={setModoCliente}
        />
      )}
    </div>
  );
}
