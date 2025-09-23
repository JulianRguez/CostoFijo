// Version.jsx
import React, { useState, useEffect } from "react";
import "./Version.css";

export default function Version({
  stockActual,
  versionInicial,
  onConfirmar,
  onCancelar,
}) {
  const [version, setVersion] = useState("");
  const [stock, setStock] = useState("");
  const [versiones, setVersiones] = useState([]);
  const [mensaje, setMensaje] = useState("");

  // ✅ Al abrir modal, si hay versionInicial, cargarla en la lista
  useEffect(() => {
    if (versionInicial) {
      const partes = versionInicial.split("-");
      const cargadas = [];
      for (let i = 0; i < partes.length; i += 2) {
        cargadas.push({
          version: partes[i],
          stock: parseInt(partes[i + 1], 10) || 0,
        });
      }
      setVersiones(cargadas);
    }
  }, [versionInicial]);

  const handleAgregar = () => {
    if (!version.trim() || !stock.trim()) {
      setMensaje("Falta información en los campos.");
      return;
    }
    if (versiones.length >= 12) {
      setMensaje("No se pueden crear más de 12 versiones.");
      return;
    }
    if (isNaN(stock) || stock <= 0) {
      setMensaje("El stock debe ser un número válido.");
      return;
    }

    const nuevaVersion = {
      version,
      stock: parseInt(stock, 10),
    };

    setVersiones([...versiones, nuevaVersion]);
    setVersion("");
    setStock("");
    setMensaje("");
  };

  const handleEliminar = (index) => {
    const nuevas = versiones.filter((_, i) => i !== index);
    setVersiones(nuevas);
    setMensaje("");
  };

  const handleIncrementar = (index) => {
    setVersiones((prev) =>
      prev.map((v, i) => (i === index ? { ...v, stock: v.stock + 1 } : v))
    );
  };

  const handleDecrementar = (index) => {
    setVersiones((prev) =>
      prev.map((v, i) =>
        i === index && v.stock > 1 ? { ...v, stock: v.stock - 1 } : v
      )
    );
  };

  const handleConfirmar = () => {
    // ✅ Si no hay ninguna versión → enviar vacío
    if (versiones.length === 0) {
      onConfirmar("");
      return;
    }

    const total = versiones.reduce((acc, v) => acc + v.stock, 0);
    if (total !== parseInt(stockActual, 10)) {
      setMensaje("La suma de los stocks debe ser igual a la cantidad actual.");
      return;
    }

    const versionString = versiones
      .map((v) => `${v.version}-${v.stock}`)
      .join("-");

    onConfirmar(versionString);
    setVersiones([]);
    setVersion("");
    setStock("");
    setMensaje("");
  };

  const handleCancelar = () => {
    setVersiones([]);
    setVersion("");
    setStock("");
    setMensaje("");
    onCancelar();
  };

  return (
    <div className="version-overlay">
      <div className="version-modal">
        <h2>Crear Versiones</h2>
        <p>Cantidad actual: {stockActual}</p>

        {/* Inputs en fila */}
        <div className="version-inputs">
          <span>Versión:</span>
          <input
            type="text"
            value={version}
            placeholder="Ej: Azul"
            maxLength={30}
            onChange={(e) => {
              setVersion(e.target.value);
              setMensaje("");
            }}
          />
          <span>Stock:</span>
          <input
            className="numSinFlech"
            type="number"
            value={stock}
            placeholder="Ej: 100"
            min="1"
            maxLength={4}
            onChange={(e) => {
              setStock(e.target.value);
              setMensaje("");
            }}
          />
        </div>

        {/* Botón agregar debajo */}
        <button className="btn-agregar" onClick={handleAgregar}>
          Agregar
        </button>

        {/* Lista */}
        <div className="version-lista">
          <div className="version-lista-header">
            <span>Versión</span>
            <span>Stock</span>
            <span>Acciones</span>
          </div>
          {versiones.map((v, i) => (
            <div className="version-item" key={i}>
              <span>{v.version}</span>
              <span>{v.stock}</span>
              <div>
                <button
                  className="btn-mas"
                  title="Aumentar"
                  onClick={() => handleIncrementar(i)}
                >
                  +
                </button>
                <button
                  className="btn-menos"
                  title="Disminuir"
                  onClick={() => handleDecrementar(i)}
                >
                  -
                </button>
                <span
                  className="eliminar"
                  title="Eliminar"
                  onClick={() => handleEliminar(i)}
                >
                  ✖
                </span>
              </div>
            </div>
          ))}
        </div>
        {mensaje && <p className="mensaje-error">{mensaje}</p>}

        {/* Acciones */}
        <div className="acciones">
          <button className="btn-confirmar" onClick={handleConfirmar}>
            Confirmar
          </button>
          <button className="btn-cancelar" onClick={handleCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
