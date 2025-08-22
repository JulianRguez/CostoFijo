import React, { useState, useEffect } from "react";
import "./ConfVenta.css";

export default function ConfVenta({
  carrito,
  total,
  nombreCliente,
  setNombreCliente,
  handleNombreFocus,
  handleNombreBlur,
  onClose,
  onConfirmar,
}) {
  const [creditoDirecto, setCreditoDirecto] = useState(false);
  const [fechaPago, setFechaPago] = useState("");
  const [valorFinanciado, setValorFinanciado] = useState("0");
  const [aplicaGarantia, setAplicaGarantia] = useState(false);
  const [garantiaDias, setGarantiaDias] = useState("0");

  // 👉 Función para obtener mañana
  const getTomorrow = () => {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 1);
    return hoy.toISOString().split("T")[0];
  };

  // 👉 Inicia siempre en mañana
  useEffect(() => {
    setFechaPago(getTomorrow());
  }, []);

  // 👉 Total final restando valor financiado
  const totalFinal = total - (creditoDirecto ? Number(valorFinanciado) : 0);

  // 👉 Validar fecha
  const validarFecha = () => {
    if (!fechaPago || isNaN(new Date(fechaPago).getTime())) {
      setFechaPago(getTomorrow());
    }
  };

  // 👉 Validar cliente
  const validarCliente = () => {
    if (!nombreCliente || nombreCliente.trim().length < 5) {
      setNombreCliente("Sin Registro");
    }
  };

  // 👉 Confirmar venta
  const confirmar = () => {
    validarFecha();
    validarCliente();

    onConfirmar({
      creditoDirecto,
      fechaPago,
      valorFinanciado: Number(valorFinanciado),
      aplicaGarantia,
      garantiaDias: Number(garantiaDias),
      totalFinal,
    });

    // Reset (menos la fechaPago que se queda en mañana)
    setCreditoDirecto(false);
    setValorFinanciado("0");
    setAplicaGarantia(false);
    setGarantiaDias("0");

    // 👉 cerrar ventana (igual que cancelar)
    onClose();
  };

  return (
    <div className="confventa-modal">
      <div className="confventa-contenido">
        <h2 className="confventa-titulo">Registro de venta</h2>

        {/* Documento cliente */}
        <div className="confventa-campo">
          <label className="confventa-label">
            Documento de identidad del cliente:
          </label>
          <input
            type="text"
            value={nombreCliente}
            onChange={(e) => setNombreCliente(e.target.value)}
            onFocus={handleNombreFocus}
            onBlur={validarCliente}
            className="confventa-input"
          />
        </div>

        <p className="confventa-aviso">
          El cliente no está registrado, se guardará con datos por defecto.
        </p>

        <hr className="confventa-separador" />

        {/* Crédito directo */}
        <div className="confventa-campo">
          <label className="confventa-label check">
            <input
              type="checkbox"
              checked={creditoDirecto}
              onChange={() => setCreditoDirecto(!creditoDirecto)}
            />
            Crédito Directo
          </label>
        </div>

        {/* Fecha de pago */}
        <div className="confventa-campo">
          <label>Fecha de pago:</label>
          <input
            type="date"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
            onBlur={validarFecha}
            disabled={!creditoDirecto}
            className="confventa-input blanco"
            min={getTomorrow()}
          />
        </div>

        {/* Valor financiado */}
        <div className="confventa-campo">
          <label>Valor financiado:</label>
          <input
            type="number"
            min="0"
            max={total}
            value={valorFinanciado}
            onFocus={() =>
              valorFinanciado === "0" ? setValorFinanciado("") : null
            }
            onBlur={() =>
              setValorFinanciado(valorFinanciado === "" ? "0" : valorFinanciado)
            }
            onChange={(e) => setValorFinanciado(e.target.value)}
            disabled={!creditoDirecto}
            className="confventa-input blanco"
          />
        </div>
        <p className="confventa-totalparcial">
          Total a pagar ahora: ${totalFinal}
        </p>

        <hr className="confventa-separador" />

        {/* Aplica garantía */}
        <div className="confventa-campo">
          <label className="confventa-label check">
            <input
              type="checkbox"
              checked={aplicaGarantia}
              onChange={() => setAplicaGarantia(!aplicaGarantia)}
            />
            Aplica garantía
          </label>
        </div>

        {/* Garantía en días */}
        <div className="confventa-campo">
          <label>Garantía en días:</label>
          <input
            type="number"
            min="0"
            value={garantiaDias}
            onFocus={() => (garantiaDias === "0" ? setGarantiaDias("") : null)}
            onBlur={() =>
              setGarantiaDias(garantiaDias === "" ? "0" : garantiaDias)
            }
            onChange={(e) => setGarantiaDias(e.target.value)}
            disabled={!aplicaGarantia}
            className="confventa-input blanco"
          />
        </div>

        <hr className="confventa-separador" />

        {/* Lista de productos */}
        <div className="confventa-detalle">
          {carrito.map((item) => (
            <div key={item._id}>
              {item.nombre} - x{item.cantidad} - $
              {(item.valorVenta ?? item.precio) * item.cantidad}
            </div>
          ))}
          <strong>Total: ${totalFinal}</strong>
        </div>

        <div className="confventa-acciones">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={confirmar}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}
