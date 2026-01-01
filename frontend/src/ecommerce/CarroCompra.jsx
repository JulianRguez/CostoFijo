//src/CarroCompra.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { X } from "lucide-react";
import "./CarroCompra.css";

const URLAPI = import.meta.env.VITE_URLAPI;
const zonasPorMunicipio = {
  "Santa Fe Ant": [
    "San Antonio",
    "Llano",
    "Guillermo Gav",
    "Nuevo Santa fe",
    "Miraflores Guaimaral",
    "Variante",
    "Buga",
    "La Pola",
    "Centro Historico",
    "Coloradas",
    "Jesus",
    "Santa Lucia",
    "La barranca",
    "La Chinca",
    "El paso",
    "Rural",
  ],
  Olaya: ["Quebrada seca", "Sucre", "Olaya", "Llanadas", "Rural"],
  Sopetran: [
    "Urbana",
    "Rural",
    "San Nicolas",
    "Cordoba",
    "4 esquinas",
    "Rodeo",
  ],
  Liborina: ["Urbana", "Rural"],
};

export default function CarroCompra({
  visible,
  onClose,
  clienteId,
  productoDirecto,
  setUsuario,
  setMostrarCliente,
  setModoCliente,
  setInfoPedido,
}) {
  const [cliente, setCliente] = useState(null);
  const [productos, setProductos] = useState([]);
  const [departamento, setDepartamento] = useState("Antioquia");
  const [municipio, setMunicipio] = useState("Santa Fe Ant");
  const [zona, setZona] = useState("Llano");
  const [direccion, setDireccion] = useState("");
  const [envio, setEnvio] = useState(0);
  const [cupon, setCupon] = useState("");
  const [cuponValor, setCuponValor] = useState(0);
  const [metodoPago, setMetodoPago] = useState(() => "Transferencia");
  const [costoTrans, setCostoTrans] = useState(0);

  // Único mensaje informativo unificado
  const [infoGlobal, setInfoGlobal] = useState({
    text: "Confirme direccion, Cupones y pago",
    color: "#333",
  });

  const mounted = useRef(false);
  useEffect(() => {
    // ejecutar lógica del pago por defecto
    onChangeMetodoPago("Transferencia");
  }, []);
  useEffect(() => {
    if (!visible) return;
    if (productoDirecto) {
      setProductos([productoDirecto]);
      return;
    }
    if (clienteId) {
      // Cargar cliente y luego mapear cada item del carrito a su producto completo
      axios
        .get(`${URLAPI}/api/clie/id/${clienteId}`)
        .then(async (res) => {
          setCliente(res.data);

          const carrito = Array.isArray(res.data.carrito)
            ? res.data.carrito
            : [];

          if (carrito.length === 0) {
            setProductos([]); // carrito vacío
            return;
          }

          try {
            // Para cada item del carrito solicitamos el producto completo al endpoint /api/prod/:id
            const productosCompletos = await Promise.all(
              carrito.map(async (item) => {
                try {
                  const { data: prod } = await axios.get(
                    `${URLAPI}/api/prod/${item.productoId}`
                  );
                  // combinar: devolver todos los campos del producto + cantidad y version del carrito
                  return {
                    ...prod,
                    cantidad: item.cantidad || 1,
                    version: item.version || "",
                  };
                } catch (err) {
                  // Si falla la carga del producto, devolvemos un fallback con el productoId
                  console.error(
                    "Error cargando producto:",
                    item.productoId,
                    err
                  );
                  return {
                    productoId: item.productoId,
                    cantidad: item.cantidad || 1,
                    version: item.version || "",
                  };
                }
              })
            );

            setProductos(productosCompletos);
          } catch (err) {
            console.error("Error procesando carrito:", err);
            setProductos([]);
          }
        })
        .catch((err) => {
          console.error("Error cargando cliente/carrito:", err);
          setProductos([]);
        });
    }
  }, [visible, clienteId, productoDirecto]);

  if (!visible) return null;

  const subtotal = productos.reduce(
    (acc, p) => acc + (p.valorVenta || 0) * (p.cantidad || 1),
    0
  );

  const descuento = productos.reduce((acc, p) => {
    const match = (p.nombre || "").match(/([A-Za-z]{3})(\d{2})?$/);
    const porcentaje = match && match[2] ? parseInt(match[2], 10) : 0;
    const subtotalProd = (p.valorVenta || 0) * (p.cantidad || 1);
    return acc + (subtotalProd * porcentaje) / 100;
  }, 0);

  useEffect(() => {
    if (["PSE", "ADDI", "SistiCrédito"].includes(metodoPago)) {
      const val = Math.round(subtotal * 0.09);
      setCostoTrans(val);
    } else {
      setCostoTrans(0);
    }
  }, [metodoPago, subtotal]);

  const esRural = (mun, zon) => {
    return (
      (mun === "Santa Fe Ant" && zon === "Rural") ||
      (mun === "Olaya" && ["Llanadas", "Rural"].includes(zon)) ||
      (mun === "Sopetran" && zon === "Rural") ||
      (mun === "Liborina" && zon === "Rural")
    );
  };

  const actualizarInfoDireccion = (
    newDept,
    newMun,
    newZona,
    newDir,
    triggerBySelect = false
  ) => {
    const dir = (newDir ?? direccion).trim();
    const dirLen = dir.length;

    if (triggerBySelect && dirLen < 8) {
      setEnvio(0);
      setInfoGlobal({ text: "Ingrese la Direccion", color: "#f97316" });
      return;
    }

    if (!triggerBySelect && dirLen > 0 && dirLen < 8) {
      setEnvio(0);
      setInfoGlobal({ text: "Dirección no Valida", color: "#f97316" });
      return;
    }

    if (dirLen === 0) {
      setEnvio(0);
      setInfoGlobal({
        text: "Confirme direccion, Cupones y pago",
        color: "#333",
      });
      return;
    }

    if (dirLen >= 8) {
      const rural = esRural(newMun ?? municipio, newZona ?? zona);
      const costo = rural ? 30000 : 0;
      setEnvio(costo);
      if (costo === 0)
        setInfoGlobal({ text: "No tiene costo de envio", color: "green" });
      else
        setInfoGlobal({
          text: `Costos de Envío: $${costo.toLocaleString()}`,
          color: "green",
        });
    }
  };

  const onChangeDepartamento = (val) => {
    setDepartamento(val);
    actualizarInfoDireccion(val, municipio, zona, direccion, true);
  };

  const onChangeMunicipio = (val) => {
    const zonas = zonasPorMunicipio[val] || [];
    const primeraZona = zonas[0] || "";
    setMunicipio(val);
    setZona(primeraZona);
    actualizarInfoDireccion(departamento, val, primeraZona, direccion, true);
  };

  const onChangeZona = (val) => {
    setZona(val);
    actualizarInfoDireccion(departamento, municipio, val, direccion, true);
  };

  const onChangeDireccion = (val) => {
    const truncated = val.slice(0, 30);
    setDireccion(truncated);
    actualizarInfoDireccion(departamento, municipio, zona, truncated, false);
  };

  // Validar cupón automáticamente
  useEffect(() => {
    if (cupon.length === 0) {
      setCuponValor(0);
      return;
    }
    if (cupon.length === 6) {
      let mountedLocal = true;
      (async () => {
        try {
          const { data } = await axios.get(`${URLAPI}/api/sist/${cupon}`);

          if (!mountedLocal) return;
          if (!data) {
            setCuponValor(0);
            setInfoGlobal({ text: "Cupón No Valido", color: "#f97316" });
            return;
          }
          const nombreValor = parseInt(data.nombre, 10) || 0;
          const descuentoValor = parseInt(data.dato, 10) || 0;
          if (nombreValor <= subtotal) {
            setCuponValor(descuentoValor);
            setInfoGlobal({
              text: `Cupón aplicado por $${descuentoValor.toLocaleString()}.`,
              color: "green",
            });
          } else {
            setCuponValor(0);
            setInfoGlobal({
              text: "No aplica para el valor comprado",
              color: "#f97316",
            });
          }
        } catch {
          setCuponValor(0);
          setInfoGlobal({ text: "Cupón No Valido", color: "#f97316" });
        }
      })();
      return () => {
        mountedLocal = false;
      };
    }
  }, [cupon, subtotal]);

  const onChangeMetodoPago = (val) => {
    setMetodoPago(val);
    if (!val) return;

    if (val === "Contra Entrega" || val === "Recoger en Almacén") {
      setInfoGlobal({ text: "Pagos en efectivo sin recargo", color: "green" });
    } else if (val === "Transferencia") {
      setInfoGlobal({
        text: "Pagos por transferencia sin recargo",
        color: "green",
      });
    } else if (["PSE", "ADDI", "SistiCrédito"].includes(val)) {
      const adicional = Math.round(subtotal * 0.09);
      setInfoGlobal({
        text: `Con ${val} paga $${adicional.toLocaleString()} adicional`,
        color: "green",
      });
    }
  };

  const totalPagar = subtotal + envio + costoTrans - descuento - cuponValor;

  const etiquetaCostoPago = () => {
    if (metodoPago === "Contra Entrega" || metodoPago === "Recoger en Almacén")
      return { label: "Costo pago Efectivo", value: 0 };
    if (metodoPago === "Transferencia")
      return { label: "Costo pago Transferencia", value: 0 };
    if (["PSE", "ADDI", "SistiCrédito"].includes(metodoPago))
      return { label: `Costo pago ${metodoPago}`, value: costoTrans };
    return { label: "Costo transaccional", value: costoTrans };
  };

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
    }
  }, []);
  // Construye la etiqueta del producto según reglas solicitadas
  function construirEtiquetaProducto(p) {
    let nombre = p.nombre || "";

    // Quita 3 letras + opcional 2 dígitos del final
    // Ej: "Lapicero rojo LPC05" → "Lapicero rojo"
    // Ej: "Lapicero azul LPC" → "Lapicero azul"
    nombre = nombre.replace(/\s*[A-Za-z]{3}\d{0,2}$/, "").trim();

    // Manejo de versión
    let versionLimpia = "";
    if (p.version && p.version.includes("-")) {
      versionLimpia = p.version.split("-")[0];
    }

    const versionTexto = versionLimpia ? ` (${versionLimpia})` : "";

    return `${nombre}${versionTexto}`;
  }

  function direccionEsValida(texto) {
    if (!texto) return false;

    const t = texto.trim();

    // Mínimo 2 palabras con letras
    const palabrasConLetras = t
      .split(/\s+/)
      .filter((p) => /[a-zA-ZñÑáéíóúÁÉÍÓÚ]/.test(p));

    if (palabrasConLetras.length < 2) return false;

    // Detecta textos basura repetidos: "xxxxxx", "asdfasdf", "sdfgwerg"
    if (/^(.)\1{3,}$/.test(t)) return false; // mismo caracter repetido
    if (/^[a-z]{5,}$/i.test(t) && !t.includes(" ")) return false; // una sola "palabra larga" sin sentido

    // Evitar únicamente números
    if (/^\d+$/.test(t)) return false;

    return true;
  }

  // ======================================
  // ELIMINAR ITEM DEL CARRITO + FAVORITOS
  // ======================================
  const eliminarItem = async (index, productoId) => {
    try {
      // 1. Quitar del frontend
      const nuevosProductos = productos.filter((_, i) => i !== index);
      setProductos(nuevosProductos);

      // 2. Eliminar del carrito en API
      if (clienteId && cliente) {
        const nuevoCarrito = (cliente.carrito || []).filter(
          (item) => item.productoId !== productoId
        );

        await axios.put(`${URLAPI}/api/clie`, [
          { _id: clienteId, carrito: nuevoCarrito },
        ]);

        setCliente((prev) => ({ ...prev, carrito: nuevoCarrito }));

        // ⭐ Actualizar Inicio.jsx
        setUsuario((prev) => ({
          ...prev,
          carrito: nuevoCarrito,
        }));
      }

      // 3. Quitar de favoritos
      if (cliente?.favoritos?.length) {
        const nuevosFavs = cliente.favoritos.filter((f) => f !== productoId);

        await axios.put(`${URLAPI}/api/clie`, [
          { _id: cliente._id, favoritos: nuevosFavs },
        ]);

        setCliente((prev) => ({ ...prev, favoritos: nuevosFavs }));

        // ⭐ Actualizar Inicio.jsx
        setUsuario((prev) => ({
          ...prev,
          favoritos: nuevosFavs,
        }));
      }
    } catch (err) {
      console.error("Error al eliminar producto:", err);
    }
  };
  function obtenerStockVersion(p) {
    if (!p.version || typeof p.version !== "string") {
      return p.stock || 0;
    }

    // version viene así: "Rayados-7"
    const partes = p.version.split("-");
    if (partes.length < 2) return p.stock || 0;

    const stockVersion = parseInt(partes[1], 10);

    return isNaN(stockVersion) ? p.stock || 0 : stockVersion;
  }

  const aumentarCantidad = (index) => {
    setProductos((prev) => {
      const copia = [...prev];
      const p = { ...copia[index] };

      const maxStock = obtenerStockVersion(p);
      const nuevaCantidad = (p.cantidad || 1) + 1;

      if (nuevaCantidad <= maxStock) {
        p.cantidad = nuevaCantidad;
        copia[index] = p;
      } else {
        setInfoGlobal({
          text: `Llegaste al máximo disponible (${maxStock} unidades)`,
          color: "#f97316",
        });
      }

      return copia;
    });
  };

  const disminuirCantidad = (index) => {
    setProductos((prev) => {
      const copia = [...prev];
      const p = { ...copia[index] };

      const nuevaCantidad = (p.cantidad || 1) - 1;

      if (nuevaCantidad >= 1) {
        p.cantidad = nuevaCantidad;
        copia[index] = p;
      }

      // ⭐ RESTABLECER EL MENSAJE BASE
      setInfoGlobal({
        text: "Confirme direccion, Cupones y pago",
        color: "#333",
      });

      return copia;
    });
  };

  return (
    <div className="carro-overlay" onClick={onClose}>
      <div className="carro-modal" onClick={(e) => e.stopPropagation()}>
        <button className="carro-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Fijo */}
        <div className="carro-header-fijo">
          <h2 className="carro-title">Compra Rápida</h2>
          <div className="carro-lista">
            {productos.length === 0 ? (
              <p className="carro-vacio">No hay productos en el carrito</p>
            ) : (
              productos.map((p, i) => (
                <div key={i} className="carro-item">
                  {/* ❌ Botón para eliminar solo si viene del cliente (no compra rápida) */}
                  {!productoDirecto && (
                    <button
                      className="carro-delete"
                      onClick={() => eliminarItem(i, p._id || p.productoId)}
                    >
                      X
                    </button>
                  )}
                  <div className="carro-item-info">
                    <b>{construirEtiquetaProducto(p)}</b>

                    <div className="carro-cantidad-controls">
                      <button
                        className="btn-cant"
                        onClick={() => disminuirCantidad(i)}
                      >
                        -
                      </button>

                      <span className="cant-num">{p.cantidad || 1}</span>

                      <button
                        className="btn-cant"
                        onClick={() => aumentarCantidad(i)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mensaje informativo único */}
        <div className="carro-info-fixed" aria-live="polite">
          <span style={{ color: infoGlobal.color }}>{infoGlobal.text}</span>
        </div>

        {/* Scroll principal */}
        <div className="carro-scroll">
          {/* ============================== */}
          {/*         DIRECCIÓN DE ENVÍO     */}
          {/* ============================== */}
          <div className="carro-grupo">
            <h3 className="carro-subtitle small-title">Dirección de envío</h3>

            {/* Departamento + Municipio */}
            <div className="dos-col">
              <div className="campo-linea mini-gap">
                <label className="small-label">Departamento</label>
                <select
                  value={departamento}
                  onChange={(e) => onChangeDepartamento(e.target.value)}
                >
                  <option>Antioquia</option>
                </select>
              </div>

              <div className="campo-linea mini-gap">
                <label className="small-label">Municipio</label>
                <select
                  value={municipio}
                  onChange={(e) => onChangeMunicipio(e.target.value)}
                >
                  {Object.keys(zonasPorMunicipio).map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Zona + Dirección */}
            <div className="dos-col">
              <div className="campo-linea mini-gap">
                <label className="small-label">Zona</label>
                <select
                  value={zona}
                  onChange={(e) => onChangeZona(e.target.value)}
                >
                  {(zonasPorMunicipio[municipio] || []).map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              </div>

              <div className="campo-linea mini-gap">
                <label className="small-label">Dirección</label>
                <input
                  type="text"
                  placeholder="Ej: Calle 10 #15-45"
                  value={direccion}
                  onChange={(e) => onChangeDireccion(e.target.value)}
                  maxLength={30}
                />
              </div>
            </div>
          </div>

          {/* ============================== */}
          {/*              OTROS             */}
          {/* ============================== */}
          <div className="carro-grupo">
            <div className="dos-col">
              {/* Cupón */}
              <div className="campo-linea mini-gap">
                <label className="small-label">Cupón</label>
                <input
                  type="text"
                  placeholder="Ingrese su cupón"
                  maxLength={6}
                  value={cupon}
                  onChange={(e) => setCupon(e.target.value.toUpperCase())}
                />
              </div>

              {/* Pago */}
              <div className="campo-linea mini-gap">
                <label className="small-label">Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => onChangeMetodoPago(e.target.value)}
                >
                  <option value="Transferencia">Transferencia</option>
                  <option value="Contra Entrega">Contra Entrega</option>
                  <option value="Recoger en Almacén">Recoger en Almacén</option>
                  <option value="SistiCrédito">SistiCrédito</option>
                  <option value="PSE" disabled>
                    PSE (Pronto)
                  </option>
                  <option value="ADDI" disabled>
                    ADDI (Pronto)
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* ============================== */}
          {/*             TOTALES            */}
          {/* ============================== */}
          <div className="carro-totales">
            <p>
              Total compra: <b>${subtotal.toLocaleString()}</b>
            </p>
            <p>
              Costo de envío: <b>${envio.toLocaleString()}</b>
            </p>
            <p>
              Descuento: <b>-${descuento.toLocaleString()}</b>
            </p>
            <p>
              Cupón: <b>-${cuponValor.toLocaleString()}</b>
            </p>
            <p>
              {etiquetaCostoPago().label}:{" "}
              <b>${etiquetaCostoPago().value.toLocaleString()}</b>
            </p>
            <p className="carro-total">
              Valor a pagar: <b>${totalPagar.toLocaleString()}</b>
            </p>

            <button
              className="btn-pago-final"
              onClick={() => {
                if (productos.length === 0) {
                  setInfoGlobal({
                    text: "Eliminó todos los productos. No hay nada para pedir.",
                    color: "#f97316",
                  });
                  return;
                }
                // ✅ VALIDACIÓN CORRECTA AQUÍ
                if (!direccion || direccion.trim().length < 8) {
                  setInfoGlobal({
                    text: "Dirección no válida",
                    color: "#f97316",
                  });
                  return; // 🚫 DETIENE AVANCE
                }

                const productosTexto = productos.map((p) => `${p.nombre}`);
                const direccionCompleta = `${departamento}, ${municipio}, ${zona}, ${direccion}`;

                const resumen = {
                  productos: productosTexto,
                  direccion: direccionCompleta,
                  pago: metodoPago,
                  subtotal,
                  envio,
                  descuento,
                  cupon: cuponValor,
                  costoTrans,
                  total: totalPagar,
                };

                setInfoPedido(resumen);
                setModoCliente("venta");
                setMostrarCliente(true);
                onClose();
              }}
            >
              Realizar pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
