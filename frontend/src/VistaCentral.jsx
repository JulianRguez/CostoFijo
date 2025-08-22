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
    .filter((p) => p.etiqueta !== "Gasto") // 👈 excluir gastos
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
  const handleConfirmar = async (extraData) => {
    if (carrito.length === 0) return;

    try {
      // 👉 1. Registrar la venta
      const ventasPayload = carrito.map((item) => ({
        idProd: item._id,
        idClient: nombreCliente,
        cantidad: item.cantidad,
        valor: item.valorVenta ?? item.precio,
        factura: `FACT-${Date.now()}`,
        ...extraData, // incluye creditoDirecto, fechaPago, valorFinanciado, etc.
      }));

      await axios.post(`${URLAPI}/api/vent`, ventasPayload);

      // 👉 2. Separar productos nuevos y existentes
      const nuevosProductos = carrito.filter((item) => !item._id);
      const productosExistentes = carrito.filter((item) => item._id);

      // 👉 3. Crear nuevos productos (si hay)
      if (nuevosProductos.length > 0) {
        await axios.post(`${URLAPI}/api/prod`, nuevosProductos);
      }

      // 👉 4. Actualizar stock de existentes (si hay)
      if (productosExistentes.length > 0) {
        const payloadUpdate = productosExistentes.map((item) => ({
          _id: item._id,
          stock: item.stock - item.cantidad,
        }));
        await axios.put(`${URLAPI}/api/prod`, payloadUpdate);
      }

      // 👉 5. Refrescar lista de productos
      const res = await axios.get(`${URLAPI}/api/prod`);
      setProductos(res.data);

      // 👉 6. Reset de estados
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
              <div
                key={item._id || item.ref}
                className="carrito-item linea compacto"
              >
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
