import React, { useState, useEffect, useRef } from "react";
import "./ConfVenta.css";

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
  const [loading, setLoading] = useState(false);
  const [garantias, setGarantias] = useState({});
  const debounceRef = useRef(null);

  const getTomorrow = () => {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 1);
    return hoy.toISOString().split("T")[0];
  };

  useEffect(() => {
    setFechaPago(getTomorrow());
  }, []);

  // ✅ Validar cliente con nueva ruta y excluir inactivos
  const validarClienteAPI = async (doc) => {
    try {
      const res = await fetch(`/api/clie/cc/${doc}`);
      if (!res.ok) {
        setClienteValido(false);
        setClienteData(null);
        setMensajeCliente("Cliente no encontrado o inactivo.");
        setCreditoDirecto(false);
        setGarantias({});
        return;
      }

      const cliente = await res.json();

      if (cliente.doc?.startsWith("X")) {
        setClienteValido(false);
        setClienteData(null);
        setMensajeCliente(
          "El cliente está inactivo y no puede registrar crédito."
        );
        setCreditoDirecto(false);
        setGarantias({});
        return;
      }

      setClienteValido(true);
      setClienteData(cliente);
      setMensajeCliente(cliente.nombre);
    } catch (err) {
      console.error("Error validando cliente:", err);
      setClienteValido(false);
      setClienteData(null);
      setMensajeCliente("Error consultando cliente, intente nuevamente.");
      setCreditoDirecto(false);
      setGarantias({});
    }
  };

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

  const toggleGarantia = (clave) => {
    setGarantias((prev) => {
      const actual = prev[clave] || { checked: false, dias: 0 };
      return {
        ...prev,
        [clave]: { ...actual, checked: !actual.checked },
      };
    });
  };

  const setDiasGarantia = (clave, dias) => {
    const numDias = parseInt(dias, 10) || 0;
    if (String(numDias).length > 3) return;
    setGarantias((prev) => {
      const actual = prev[clave] || { checked: false, dias: 0 };
      return {
        ...prev,
        [clave]: { ...actual, dias: numDias },
      };
    });
  };

  const totalFinal = total - (creditoDirecto ? Number(valorFinanciado) : 0);

  const confirmar = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onConfirmar({
        creditoDirecto,
        fechaPago,
        valorFinanciado: Number(valorFinanciado),
        garantias,
        totalFinal,
        clienteValido,
        cliente: clienteData,
      });
    } finally {
      setLoading(false);
      setCreditoDirecto(false);
      setValorFinanciado("0");
      setGarantias({});
      onClose();
    }
  };

  return (
    <div className="confventa-modal">
      <div className="confventa-contenido">
        <h2 className="confventa-titulo">Registro de venta</h2>

        {/* Documento cliente */}
        <div className="confventa-campo">
          <label className="confventa-label">Documento de identidad:</label>
          <input
            type="text"
            value={nombreCliente}
            onChange={(e) => handleDocumentoChange(e.target.value)}
            onFocus={handleNombreFocus}
            className="confventa-input"
            disabled={loading}
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
              disabled={!clienteValido || loading}
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
            disabled={!creditoDirecto || loading}
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
            disabled={!creditoDirecto || loading}
            className="confventa-input blanco"
          />
        </div>

        <p className="confventa-totalparcial">
          Total a pagar ahora: ${totalFinal}
        </p>

        <hr className="confventa-separador" />

        {/* Productos con garantías */}
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
            <div>Garantía (Días)</div>
          </div>

          {carrito.map((item) => {
            const clave = `${item._id}-${item.versionName || "Única versión"}`;
            return (
              <div
                key={clave}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  gap: "10px",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <div>
                  {item.nombre} ({item.versionName})
                </div>
                <div>x{item.cantidad}</div>
                <div>${(item.valorVenta ?? item.precio) * item.cantidad}</div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <input
                    type="checkbox"
                    checked={garantias[clave]?.checked || false}
                    onChange={() => toggleGarantia(clave)}
                    disabled={!clienteValido || loading}
                  />
                  <input
                    type="number"
                    value={garantias[clave]?.dias || ""}
                    onChange={(e) => setDiasGarantia(clave, e.target.value)}
                    maxLength={3}
                    disabled={!garantias[clave]?.checked || loading}
                    className="confventa-input blanco"
                    style={{ width: "60px" }}
                  />
                </div>
              </div>
            );
          })}

          <strong>Total: ${totalFinal}</strong>
        </div>

        <div className="confventa-acciones">
          {loading && <span className="confventa-msg">Registrando...</span>}
          <button onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button onClick={confirmar} disabled={loading}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
