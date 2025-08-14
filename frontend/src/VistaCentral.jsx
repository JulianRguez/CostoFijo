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

    const existe = carrito.find((item) => item._id === producto._id);
    const actualizadoProductos = productos.map((p) =>
      p._id === producto._id ? { ...p, stock: p.stock - 1 } : p
    );
    setProductos(actualizadoProductos);

    if (existe) {
      const actualizado = carrito.map((item) =>
        item._id === producto._id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      );
      setCarrito(actualizado);
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  // Quitar producto del carrito
  const quitarDelCarrito = (id) => {
    const item = carrito.find((i) => i._id === id);
    const actualizadoProductos = productos.map((p) =>
      p._id === id ? { ...p, stock: p.stock + item.cantidad } : p
    );
    setProductos(actualizadoProductos);
    setCarrito(carrito.filter((i) => i._id !== id));
  };

  // Calcular total
  const total = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  // Filtrar productos
  const productosFiltrados = productos
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
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  // tipo: "exito" o "error"

  const handleConfirmar = async () => {
    if (carrito.length === 0) return;

    if (!nombreCliente || nombreCliente.trim() === "") {
      setMensaje({
        texto: "Por favor ingresa el nombre del cliente.",
        tipo: "error",
      });
      return;
    }

    // 1) Cerrar el modal inmediatamente
    setMostrarModal(false);

    try {
      // 2) Preparar ventas
      const ventasPayload = carrito.map((item) => ({
        idProd: item._id,
        idClient: nombreCliente,
        cantidad: item.cantidad,
        valor: item.precio,
        factura: "FACT-000",
      }));

      // 3) Preparar actualización de stock usando el stock ORIGINAL en 'productos'
      const stockPayload = carrito.map((item) => {
        const productoOriginal = productos.find((p) => p._id === item._id);
        return {
          _id: item._id,
          stock: productoOriginal?.stock ?? 0,
        };
      });

      // 4) Enviar ventas
      await axios.post(`${URLAPI}/api/vent`, ventasPayload);

      // 5) Actualizar stock
      await axios.put(`${URLAPI}/api/prod`, stockPayload);

      // 6) Refrescar productos desde el servidor
      const res = await axios.get(`${URLAPI}/api/prod`);
      setProductos(res.data);

      // 7) Mostrar mensaje de éxito y limpiar carrito
      setMensaje({ texto: "Registro exitoso", tipo: "exito" });
      setCarrito([]);
    } catch (error) {
      console.error("Error al confirmar venta:", error);

      // 8) Mostrar mensaje de error y NO limpiar el carrito
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
              <span>${prod.precio}</span>
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
                <span>${item.precio}</span>
                <span>${item.precio * item.cantidad}</span>
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
            <div className="campo">
              <label>Nombre del cliente:</label>
              <input
                type="text"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                onFocus={handleNombreFocus}
                onBlur={handleNombreBlur}
              />
            </div>
            <div className="detalle-productos">
              {carrito.map((item) => (
                <div key={item._id} style={{ fontSize: "16px" }}>
                  {item.nombre} - x{item.cantidad} - $
                  {item.precio * item.cantidad}
                </div>
              ))}
              <strong style={{ fontSize: "16px" }}>Total: ${total}</strong>
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
