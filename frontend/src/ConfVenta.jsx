//confVenta.jsx
import React, { useState, useEffect, useRef } from "react";
import "./ConfVenta.css";

const URLAPI = import.meta.env.VITE_URLAPI;

export default function ConfVenta({
  carrito,
  total,
  nombreCliente,
  setNombreCliente,
  handleNombreFocus,
  onClose,
  onConfirmar,
}) {
  const [creditoDirecto, setCreditoDirecto] = useState(false);
  const [fechaPago, setFechaPago] = useState("");
  const [valorFinanciado, setValorFinanciado] = useState("0");
  const [clienteValido, setClienteValido] = useState(false);
  const [clienteData, setClienteData] = useState(null);
  const [mensajeCliente, setMensajeCliente] = useState(
    "Para crédito y garantía el cliente debe estar registrado; ingrese el documento de identidad."
  );

  // Estado de garantía por producto
  const [garantias, setGarantias] = useState({});
  const debounceRef = useRef(null);

  // 👉 Función para obtener mañana
  const getTomorrow = () => {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 1);
    return hoy.toISOString().split("T")[0];
  };

  useEffect(() => {
    setFechaPago(getTomorrow());
  }, []);

  // 👉 Validar cliente contra API
  const validarClienteAPI = async (doc) => {
    try {
      const res = await fetch(`${URLAPI}/api/clie/${doc}`);
      if (!res.ok) {
        setClienteValido(false);
        setClienteData(null);
        setMensajeCliente(
          "Para crédito y garantía el cliente debe estar registrado; ingrese el documento de identidad."
        );
        setCreditoDirecto(false);
        setGarantias({});
        return;
      }

      const cliente = await res.json();
      setClienteValido(true);
      setClienteData(cliente);
      setMensajeCliente(cliente.nombre);
    } catch (err) {
      console.error("Error validando cliente:", err);
      setClienteValido(false);
      setClienteData(null);
      setMensajeCliente("Error consultando clientes, intente nuevamente.");
      setCreditoDirecto(false);
      setGarantias({});
    }
  };

  // 👉 Manejar cambios con debounce
  const handleDocumentoChange = (value) => {
    setNombreCliente(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length >= 5) {
      debounceRef.current = setTimeout(() => {
        validarClienteAPI(value);
      }, 500);
    } else {
      setClienteValido(false);
      setMensajeCliente(
        "Para crédito y garantía el cliente debe estar registrado; ingrese el documento de identidad."
      );
      setCreditoDirecto(false);
      setGarantias({});
    }
  };

  // 👉 Cambiar garantía de un producto
  const toggleGarantia = (id) => {
    setGarantias((prev) => ({
      ...prev,
      [id]: { checked: !prev[id]?.checked, dias: prev[id]?.dias || "" },
    }));
  };

  const setDiasGarantia = (id, dias) => {
    const numDias = parseInt(dias, 10) || 0; // convertir a número o 0
    if (String(numDias).length > 3) return; // max 3 dígitos
    setGarantias((prev) => ({
      ...prev,
      [id]: { ...prev[id], dias: numDias },
    }));
  };
  // 👉 Total final restando valor financiado
  const totalFinal = total - (creditoDirecto ? Number(valorFinanciado) : 0);

  // 👉 Confirmar venta
  const confirmar = () => {
    onConfirmar({
      creditoDirecto,
      fechaPago,
      valorFinanciado: Number(valorFinanciado),
      garantias, // ahora enviamos las garantías por producto
      totalFinal,
      clienteValido, // 👈 enviar flag
      cliente: clienteData, // 👈 enviar objeto cliente
    });

    // Reset
    setCreditoDirecto(false);
    setValorFinanciado("0");
    setGarantias({});
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
            onChange={(e) => handleDocumentoChange(e.target.value)}
            onFocus={handleNombreFocus}
            className="confventa-input"
          />
        </div>

        <p className="confventa-aviso">{mensajeCliente}</p>

        <hr className="confventa-separador" />

        {/* Crédito directo */}
        <div className="confventa-campo">
          <label className="confventa-label check">
            <input
              type="checkbox"
              checked={creditoDirecto}
              onChange={() => setCreditoDirecto(!creditoDirecto)}
              disabled={!clienteValido}
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

        {/* Lista de productos con garantías */}
        <div className="confventa-detalle">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: "10px",
              fontWeight: "bold",
              marginBottom: "15px",
              color: "#059669",
            }}
          >
            <div>Artículo</div>
            <div>Cantidad</div>
            <div>Valor</div>
            <div>Garantía (Dias)</div>
          </div>

          {carrito.map((item) => (
            <div
              key={item._id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "10px",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <div>{item.nombre}</div>
              <div>x{item.cantidad}</div>
              <div>${(item.valorVenta ?? item.precio) * item.cantidad}</div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <input
                  type="checkbox"
                  checked={garantias[item._id]?.checked || false}
                  onChange={() => toggleGarantia(item._id)}
                  disabled={!clienteValido}
                />
                <input
                  type="number"
                  value={garantias[item._id]?.dias || ""}
                  onChange={(e) => setDiasGarantia(item._id, e.target.value)}
                  maxLength={3}
                  disabled={!garantias[item._id]?.checked}
                  className="confventa-input blanco"
                  style={{ width: "60px", height: "7px" }}
                />
              </div>
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
