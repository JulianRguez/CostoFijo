import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Stock.css";

export default function Stock() {
  const [productos, setProductos] = useState([]);
  const [etiquetaFiltro, setEtiquetaFiltro] = useState("");
  const [cambios, setCambios] = useState({});
  const [mensaje, setMensaje] = useState(""); // 👈 mensaje de estado
  const [actualizando, setActualizando] = useState(false); // 👈 estado del proceso
  const URLAPI = import.meta.env.VITE_URLAPI;

  // Cargar productos
  useEffect(() => {
    axios
      .get(`${URLAPI}/api/prod`)
      .then((res) => setProductos(res.data))
      .catch((err) => console.error("Error al obtener productos:", err));
  }, []);

  // Parsear versiones en pares [nombre, qty]
  const parseVersions = (versionStr) => {
    if (!versionStr || versionStr.trim() === "") return [];
    const arr = versionStr.split("-");
    const result = [];
    for (let i = 0; i < arr.length; i += 2) {
      result.push({ name: arr[i], qty: parseInt(arr[i + 1] || "0", 10) });
    }
    return result;
  };

  // Filtrar productos por stock bajo
  const productosFiltrados = productos.flatMap((p) => {
    const versiones = parseVersions(p.version);

    // Caso sin versiones -> se filtra por stock <= minStock
    if (versiones.length === 0) {
      if (p.stock <= p.minStock) return [p];
      return [];
    }

    // Caso con versiones -> incluir las versiones con stock 0 o 1
    const bajas = versiones.filter((v) => v.qty <= 1);
    return bajas.map((v) => ({
      ...p,
      nombre: `${p.nombre} (${v.name})`,
      stock: v.qty,
      isVersion: true, // 👈 marcar que es por versión
    }));
  });

  // Aplicar filtro de etiqueta
  const productosFinales = productosFiltrados.filter((p) =>
    etiquetaFiltro ? p.etiqueta === etiquetaFiltro : true
  );

  // Obtener etiquetas únicas para el filtro
  const etiquetas = [...new Set(productos.map((p) => p.etiqueta))];

  // Manejar cambios en checkboxes
  const handleCheckbox = (id, checked) => {
    setMensaje(""); // resetear mensaje si hay cambios
    setCambios((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        reversado: checked ? 0 : 1, // si está check => reversado=0, si no => reversado=1
      },
    }));
  };

  // Manejar cambios en MinStock
  const handleMinStockChange = (id, value) => {
    setMensaje(""); // resetear mensaje si hay cambios
    setCambios((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        minStock: Number(value),
      },
    }));
  };

  // Guardar cambios
  const handleActualizar = () => {
    const payload = Object.entries(cambios).map(([id, cambio]) => ({
      _id: id,
      ...(cambio.reversado !== undefined && { reversado: cambio.reversado }),
      ...(cambio.minStock !== undefined && { minStock: cambio.minStock }),
    }));

    setActualizando(true);
    setMensaje("Actualizando...");

    axios
      .put(`${URLAPI}/api/prod`, payload)
      .then(() => {
        setMensaje("Actualización Exitosa");
        setCambios({});
        // recargar lista
        return axios.get(`${URLAPI}/api/prod`);
      })
      .then((res) => setProductos(res.data))
      .catch(() => {
        setMensaje("Error al actualizar");
      })
      .finally(() => {
        setActualizando(false);
      });
  };

  return (
    <div className="vista-stock">
      <h2>Productos con bajo stock</h2>

      {/* Filtro por etiqueta */}
      <div className="filtro-etiqueta">
        <label>Etiqueta: </label>
        <select
          value={etiquetaFiltro}
          onChange={(e) => setEtiquetaFiltro(e.target.value)}
        >
          <option value="">Todas</option>
          {etiquetas.map((et, i) => (
            <option key={i} value={et}>
              {et}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de productos */}
      <div className="lista-stock">
        <div className="fila header">
          <span>Producto</span>
          <span>Ref</span>
          <span>Etiqueta</span>
          <span>Stock</span>
          <span>MinStock</span>
          <span>Descripción</span>
          <span>Para pedido</span>
        </div>

        {productosFinales.map((p) => (
          <div key={p._id + p.nombre} className="fila">
            <span>{p.nombre}</span>
            <span>{p.ref}</span>
            <span>{p.etiqueta}</span>
            <span>{p.stock}</span>
            <span>
              {p.isVersion ? (
                "--"
              ) : (
                <input
                  type="number"
                  defaultValue={p.minStock}
                  min="0"
                  onChange={(e) => handleMinStockChange(p._id, e.target.value)}
                  className="input-minstock"
                />
              )}
            </span>
            <span>{p.descripcion}</span>
            <span>
              <input
                type="checkbox"
                checked={
                  cambios[p._id] !== undefined
                    ? cambios[p._id].reversado === 0
                    : p.reversado === 0
                }
                onChange={(e) => handleCheckbox(p._id, e.target.checked)}
              />
            </span>
          </div>
        ))}
      </div>

      {/* Mensaje y botón en la misma fila */}
      <div className="acciones-actualizar">
        {mensaje && <div className="msg-actualizacion">{mensaje}</div>}

        <button
          className="btn-actualizar"
          disabled={Object.keys(cambios).length === 0 || actualizando}
          onClick={handleActualizar}
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
