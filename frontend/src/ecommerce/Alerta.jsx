// src/Alerta.jsx
import React from "react";
import { BellRing } from "lucide-react";
import "./Alerta.css";

export default function Alerta({ visible, titulo, texto, onClose }) {
  if (!visible) return null;

  return (
    <div className="alerta-overlay" onClick={onClose}>
      <div className="alerta-modal" onClick={(e) => e.stopPropagation()}>
        <div className="alerta-header">
          <BellRing size={22} className="alerta-icon" />
          <h3 className="alerta-title">{titulo}</h3>
        </div>

        <p className="alerta-text">{texto}</p>

        <div className="alerta-actions">
          <button className="alerta-btn" onClick={onClose}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
