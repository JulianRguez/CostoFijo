import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import "./Inicio.css";

export default function Buscar({
  data = [],
  onBuscar,
  placeholder = "Buscar por Nombre",
  clearSignal,
  onClear,
}) {
  const [query, setQuery] = useState("");
  // 🔥 Cuando clearSignal cambia → vaciamos el input
  useEffect(() => {
    setQuery("");
  }, [clearSignal]);

  // 🔎 Filtro de búsqueda
  useEffect(() => {
    if (!data.length) return;

    // Si el usuario escribe más de 4 letras → filtrar
    if (query.length > 4) {
      const lower = query.toLowerCase();
      const filtrados = data.filter((p) =>
        p.nombre.toLowerCase().includes(lower),
      );

      onBuscar(filtrados, query);
    } else {
      // Si borra todo o tiene menos de 5 letras → restaurar
      onBuscar(data, query);
    }
  }, [query, data]);

  return (
    <div className="search-wrapper">
      <Search />

      <input
        type="text"
        value={query}
        maxLength={30}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="buscar"
      />

      {/* ❌ BOTÓN LIMPIAR */}
      <button
        className="search-clear-btn"
        onClick={() => {
          setQuery("");
          onBuscar(data, "");
          onClear && onClear(); // ⬅️ dispara limpieza externa
        }}
      >
        ✖
      </button>
    </div>
  );
}
