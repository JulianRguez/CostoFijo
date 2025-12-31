import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Stock.css";

export default function Stock() {
  const [productos, setProductos] = useState([]);
  const [etiquetaFiltro, setEtiquetaFiltro] = useState("");
  const [cambios, setCambios] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [actualizando, setActualizando] = useState(false);
  const URLAPI = import.meta.env.VITE_URLAPI;

  // 🔹 Cargar productos
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const { data } = await axios.get(`${URLAPI}/api/prod`);
      setProductos(data);
    } catch (err) {
      console.error("Error al obtener productos:", err);
    }
  };

  // 🔹 Parsear versiones "Rojo-8-Azul-1" -> [{ name, qty }]
  const parseVersions = (versionStr) => {
    if (!versionStr?.trim()) return [];
    const arr = versionStr.split("-");
    return arr.reduce((acc, val, i) => {
      if (i % 2 === 0)
        acc.push({ name: val, qty: parseInt(arr[i + 1] || "0", 10) });
      return acc;
    }, []);
  };

  // 🔹 Regla de stock bajo:
  // Si no tiene versiones: stock < minStock
  // Si tiene versiones: incluir versiones con qty < minStock
  const productosFiltrados = productos.flatMap((p) => {
    const versiones = parseVersions(p.version);

    if (versiones.length === 0) {
      return p.stock < p.minStock ? [p] : [];
    }

    return versiones
      .filter((v) => v.qty < p.minStock)
      .map((v) => ({
        ...p,
        nombre: `${p.nombre} (${v.name})`,
        stock: v.qty,
        isVersion: true,
      }));
  });

  // 🔹 Filtro por etiqueta
  const productosFinales = productosFiltrados.filter(
    (p) => !etiquetaFiltro || p.etiqueta === etiquetaFiltro
  );

  const etiquetas = [...new Set(productos.map((p) => p.etiqueta))];

  // 🔹 Manejadores de cambios
  const handleCheckbox = (id, checked) => {
    setMensaje("");
    setCambios((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), reversado: checked ? 0 : 1 },
    }));
  };

  const handleMinStockChange = (id, value) => {
    setMensaje("");
    setCambios((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), minStock: Number(value) },
    }));
  };

  // 🔹 Actualizar cambios
  const handleActualizar = async () => {
    const payload = Object.entries(cambios).map(([id, cambio]) => ({
      _id: id,
      ...(cambio.reversado !== undefined && { reversado: cambio.reversado }),
      ...(cambio.minStock !== undefined && { minStock: cambio.minStock }),
    }));

    setActualizando(true);
    setMensaje("Actualizando...");

    try {
      await axios.put(`${URLAPI}/api/prod`, payload);
      setMensaje("Actualización Exitosa");
      setCambios({});
      await cargarProductos();
    } catch {
      setMensaje("Error al actualizar");
    } finally {
      setActualizando(false);
    }
  };

  return (
    <div className="vista-stock">
      <h2>Productos con bajo stock</h2>

      {/* 🔸 Filtro por etiqueta */}
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

      {/* 🔸 Tabla */}
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

        {productosFinales.length > 0 ? (
          productosFinales.map((p) => (
            <div key={`${p._id}-${p.nombre}`} className="fila">
              <span>{p.nombre}</span>
              <span>{p.ref}</span>
              <span>{p.etiqueta}</span>
              <span>{p.stock}</span>
              <span>
                <input
                  type="number"
                  defaultValue={p.minStock}
                  min="0"
                  onChange={(e) => handleMinStockChange(p._id, e.target.value)}
                  className="input-minstock"
                />
              </span>
              <span>{p.descripcion}</span>
              <span>
                <input
                  type="checkbox"
                  checked={
                    cambios[p._id]
                      ? cambios[p._id].reversado === 0
                      : p.reversado === 0
                  }
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setMensaje("");
                    setCambios((prev) => ({
                      ...prev,
                      [p._id]: {
                        ...(prev[p._id] || {}),
                        reversado: checked ? 0 : 1,
                      },
                    }));
                  }}
                />
              </span>
            </div>
          ))
        ) : (
          <div className="fila">No hay productos con bajo stock</div>
        )}
      </div>

      {/* 🔸 Botón y mensaje */}
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
