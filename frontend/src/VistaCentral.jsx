import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VistaCentral.css";

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

  // Nuevos estados para el modal
  const [creditoDirecto, setCreditoDirecto] = useState(false);
  const [fechaPago, setFechaPago] = useState("");
  const [valorFinanciado, setValorFinanciado] = useState(0);
  const [aplicaGarantia, setAplicaGarantia] = useState(false);
  const [garantiaDias, setGarantiaDias] = useState(0);

  const URLAPI = import.meta.env.VITE_URLAPI;

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
    if (mensaje.texto) {
      setMensaje({ texto: "", tipo: "" });
    }

    const existe = carrito.find((item) => item._id === producto._id);
    if (existe) {
      setCarrito(
        carrito.map((item) =>
          item._id === producto._id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  // Quitar producto del carrito
  const quitarDelCarrito = (id) => {
    setCarrito(carrito.filter((i) => i._id !== id));
  };

  // Calcular total
  const total = carrito.reduce(
    (acc, item) => acc + (item.valorVenta ?? item.precio) * item.cantidad,
    0
  );

  // Filtrar productos
  const productosFiltrados = productos
    .map((p) => {
      const enCarrito = carrito.find((c) => c._id === p._id);
      return {
        ...p,
        stock: p.stock - (enCarrito?.cantidad || 0),
      };
    })
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

  // Confirmar venta
  const handleConfirmar = async () => {
    if (carrito.length === 0) return;

    if (!nombreCliente || nombreCliente.trim() === "") {
      setMensaje({
        texto: "Por favor ingresa el documento de identidad del cliente.",
        tipo: "error",
      });
      return;
    }

    setMostrarModal(false);

    try {
      const ventasPayload = carrito.map((item) => ({
        idProd: item._id,
        idClient: nombreCliente,
        cantidad: item.cantidad,
        valor: item.valorVenta ?? item.precio,
        factura: `FACT-${Date.now()}`,
        creditoDirecto,
        fechaPago: creditoDirecto ? fechaPago : null,
        valorFinanciado: creditoDirecto ? valorFinanciado : 0,
        aplicaGarantia,
        garantiaDias: aplicaGarantia ? garantiaDias : 0,
      }));

      await axios.post(`${URLAPI}/api/vent`, ventasPayload);

      // Refrescar productos
      const res = await axios.get(`${URLAPI}/api/prod`);
      setProductos(res.data);

      setMensaje({ texto: "Registro exitoso", tipo: "exito" });
      setCarrito([]);
      setNombreCliente("Sin Registro");
      setCreditoDirecto(false);
      setFechaPago("");
      setValorFinanciado(0);
      setAplicaGarantia(false);
      setGarantiaDias(0);
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
          {productosFiltrados.map((prod) => (
            <div key={prod._id} className="producto linea">
              <img src={prod.urlFoto1} alt="" className="imagen mini" />
              <span>{prod.nombre}</span>
              <span>Ref: {prod.ref}</span>
              <span>{prod.stock}</span>
              <span>${prod.valorVenta ?? prod.precio}</span>
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
          ))}
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
              <div key={item._id} className="carrito-item linea compacto">
                <img src={item.urlFoto1} alt="" className="imagen mini" />
                <span>{item.nombre}</span>
                <span>x{item.cantidad}</span>
                <span>${item.valorVenta ?? item.precio}</span>
                <span>${(item.valorVenta ?? item.precio) * item.cantidad}</span>
                <button
                  className="eliminar"
                  onClick={() => quitarDelCarrito(item._id)}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
          <div className="carrito-total">Total: ${total}</div>
          <button
            className="btn-confirmar"
            onClick={() => setMostrarModal(true)}
            disabled={carrito.length === 0}
          >
            Confirmar venta
          </button>
        </div>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="modal">
          <div className="modal-contenido">
            <h2>Registro de venta</h2>

            {/* Documento cliente */}
            <div className="campo">
              <label
                style={{
                  fontWeight: "bold",
                  color: "#10b981",
                  fontSize: "16px",
                }}
              >
                Documento de identidad del cliente:
              </label>
              <input
                type="text"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                onFocus={handleNombreFocus}
                onBlur={handleNombreBlur}
              />
            </div>

            {/* Texto aviso */}
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>
              El cliente no está registrado, se guardará con datos por defecto.
            </p>

            <hr style={{ border: "1px solid #334155", margin: "10px 0" }} />

            {/* Crédito directo */}
            <div className="campo">
              <label
                style={{
                  fontWeight: "bold",
                  color: "#10b981",
                  fontSize: "16px",
                }}
              >
                <input
                  type="checkbox"
                  checked={creditoDirecto}
                  onChange={() => setCreditoDirecto(!creditoDirecto)}
                  style={{ marginRight: "8px" }}
                />
                Crédito Directo
              </label>
            </div>

            {/* Fecha de pago */}
            <div className="campo">
              <label>Fecha de pago:</label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                disabled={!creditoDirecto}
              />
            </div>

            {/* Valor financiado */}
            <div className="campo">
              <label>Valor financiado:</label>
              <input
                type="number"
                min="0"
                max={total}
                value={valorFinanciado}
                onChange={(e) => setValorFinanciado(Number(e.target.value))}
                disabled={!creditoDirecto}
              />
            </div>
            <p style={{ fontSize: "14px", color: "#fbbf24" }}>
              Total a pagar ahora: ${total - valorFinanciado}
            </p>

            <hr style={{ border: "1px solid #334155", margin: "10px 0" }} />

            {/* Aplica garantía */}
            <div className="campo">
              <label
                style={{
                  fontWeight: "bold",
                  color: "#10b981",
                  fontSize: "16px",
                }}
              >
                <input
                  type="checkbox"
                  checked={aplicaGarantia}
                  onChange={() => setAplicaGarantia(!aplicaGarantia)}
                  style={{ marginRight: "8px" }}
                />
                Aplica garantía
              </label>
            </div>

            {/* Garantía en días */}
            <div className="campo">
              <label>Garantía en días:</label>
              <input
                type="number"
                min="0"
                value={garantiaDias}
                onChange={(e) => setGarantiaDias(Number(e.target.value))}
                disabled={!aplicaGarantia}
              />
            </div>

            <hr style={{ border: "1px solid #334155", margin: "10px 0" }} />

            {/* Lista de productos */}
            <div className="detalle-productos">
              {carrito.map((item) => (
                <div key={item._id} style={{ fontSize: "16px" }}>
                  {item.nombre} - x{item.cantidad} - $
                  {(item.valorVenta ?? item.precio) * item.cantidad}
                </div>
              ))}
              <strong style={{ fontSize: "16px" }}>
                Total: ${total - valorFinanciado}
              </strong>
            </div>

            <div className="acciones-modal">
              <button onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button onClick={handleConfirmar}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
