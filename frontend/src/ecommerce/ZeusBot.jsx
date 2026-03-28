import React, { useEffect, useState, useRef } from "react";
import "./ZeusBot.css";
import { useRules } from "./useRules";
import { useRules as useRules2 } from "./useRules2";
import { X } from "lucide-react";
function QtyInput({ quantityInput, goToRule }) {
  const [vals, setVals] = React.useState(() =>
    Object.fromEntries(quantityInput.items.map((item) => [item.id, ""])),
  );

  const max = quantityInput.max ?? 99;
  const ya = quantityInput.yaAgregadas ?? 0;
  const disponibles = max - ya;

  const sumaActual = Object.values(vals).reduce(
    (t, c) => t + (parseInt(c) || 0),
    0,
  );

  const puedeAgregar = sumaActual > 0 && sumaActual < disponibles;
  const puedeContinuar = sumaActual > 0;

  function handleChange(id, rawStr) {
    // permite vacío
    if (rawStr === "") {
      setVals((v) => ({ ...v, [id]: "" }));
      quantityInput.onChange(id, 0);
      return;
    }

    // elimina cualquier caracter no numérico (incluye letras, signos, espacios)
    const soloDigitos = rawStr.replace(/\D/g, "");
    if (soloDigitos === "") {
      setVals((v) => ({ ...v, [id]: "" }));
      quantityInput.onChange(id, 0);
      return;
    }

    const num = parseInt(soloDigitos, 10);

    const sumaOtros = Object.entries(vals)
      .filter(([k]) => k !== id)
      .reduce((t, [, c]) => t + (parseInt(c) || 0), 0);

    const maxPermitido = disponibles - sumaOtros;

    // siempre actualiza, pero recorta al máximo permitido
    const final = Math.min(num, maxPermitido);
    setVals((v) => ({ ...v, [id]: String(final) }));
    quantityInput.onChange(id, final);
  }

  function handleBlur(id) {
    if (vals[id] === "" || vals[id] === undefined) {
      setVals((v) => ({ ...v, [id]: "" }));
      quantityInput.onChange(id, 0);
    }
  }

  return (
    <div className="zeus-qty-area">
      <div style={{ fontSize: "12px", color: "#888", textAlign: "center" }}>
        Puede seleccionar hasta <b>{disponibles}</b> cámara
        {disponibles !== 1 ? "s" : ""} en este ciclo. Seleccionadas:{" "}
        <b>{sumaActual}</b>
      </div>

      {quantityInput.items.map((item, i) => (
        <div key={i} className="zeus-qty-row">
          <span>{item.label}</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={vals[item.id]}
            onChange={(e) => handleChange(item.id, e.target.value)}
            onBlur={() => handleBlur(item.id)}
          />
        </div>
      ))}

      <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
        {puedeAgregar && (
          <button
            className="zeus-qty-btn"
            style={{
              background: "#e5e5e5",
              color: "#333",
              border: "1px solid #9e9e9e",
            }}
            onClick={() => {
              if (quantityInput.onAgregar) quantityInput.onAgregar();
              goToRule(quantityInput.nextOtra, "Agregar otra referencia");
            }}
          >
            Agregar otra referencia
          </button>
        )}
        <button
          className="zeus-qty-btn"
          disabled={!puedeContinuar}
          style={{
            opacity: puedeContinuar ? 1 : 0.4,
            cursor: puedeContinuar ? "pointer" : "not-allowed",
          }}
          onClick={() => {
            if (puedeContinuar) goToRule(quantityInput.next, "Continuar");
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
export default function ZeusBot({ inicio, userName, nota, onClose }) {
  const { rules } = useRules(userName, nota);
  const { rules: rulesCam } = useRules2(userName, nota);
  const allRules = { ...rules, ...rulesCam };

  const [messages, setMessages] = useState([]);
  const [currentRule, setCurrentRule] = useState(inicio);
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // mensaje inicial
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;

    const rule = allRules[inicio];
    if (!rule) return;

    setMessages([
      {
        from: "bot",
        type: "text",
        content: rule.resp(),
      },
    ]);

    initRef.current = true;
  }, [inicio, rules]);

  const goToRule = (next, label, action) => {
    if (action) action();

    const rule = allRules[next];

    if (rule.onEnter) rule.onEnter();

    const nuevoMensajeBot = {
      from: "bot",
      content: rule.resp(),
      getArticulos: rule.getArticulos ?? null,
    };

    if (rule.sinHistorial) {
      // solo muestra el mensaje actual, sin historial
      setMessages([nuevoMensajeBot]);
    } else {
      setMessages((prev) => [
        ...prev,
        { from: "user", content: label },
        nuevoMensajeBot,
      ]);
    }

    setCurrentRule(next);
    setInputValue("");
  };

  const handleInputAction = async (rule) => {
    const nextKey = await rule.input.action(inputValue);
    const nextRule = allRules[nextKey];

    setMessages((prev) => [
      ...prev,
      { from: "user", content: inputValue },
      { from: "bot", content: nextRule.resp() },
    ]);

    setCurrentRule(nextKey);
    setInputValue("");
  };

  const handleFileInput = (rule, file) => {
    rule.fileInput.action(file);

    const nextKey =
      typeof rule.fileInput.next === "function"
        ? rule.fileInput.next()
        : rule.fileInput.next;

    const nextRule = allRules[nextKey];

    setMessages((prev) => [
      ...prev,
      { from: "user", content: file?.name || "Archivo seleccionado" },
      { from: "bot", content: nextRule.resp() },
    ]);

    setCurrentRule(nextKey);
  };

  const rule = allRules[currentRule];

  return (
    <div className="zeus-overlay">
      <div className="zeus-chat">
        <div className="zeus-header">
          <span className="zeus-header1">ZEUZ </span>
          <span className="zeus-header2"> Bot IA Chat dirigido</span>
        </div>

        <button className="zeus-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="zeus-messages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`zeus-msg ${m.from === "bot" ? "bot" : "user"}`}
            >
              {m.content === "__RESUMEN__" && m.getArticulos
                ? (() => {
                    const arts = m.getArticulos();
                    const total = arts.reduce(
                      (t, a) => t + a.precio * a.cantidad,
                      0,
                    );
                    return (
                      <div>
                        <strong>Cotización</strong>
                        {arts.map((a, i) => (
                          <p key={i}>
                            {a.nombre} x{a.cantidad} = $
                            {(a.precio * a.cantidad).toLocaleString()}
                          </p>
                        ))}
                        <hr />
                        <b>Total ${total.toLocaleString()}</b>
                      </div>
                    );
                  })()
                : m.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {rule?.options && (
          <div className="zeus-options">
            {rule.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => goToRule(opt.next, opt.label, opt.action)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {rule?.input && (
          <div className="zeus-input-area">
            <input
              placeholder={rule.input.placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button onClick={() => handleInputAction(rule)}>
              {rule.input.buttonLabel}
            </button>
          </div>
        )}
        {rule?.fileInput && (
          <div className="zeus-input-area">
            <label className="zeus-file-label">
              {rule.fileInput.label}
              <input
                type="file"
                accept={rule.fileInput.accept}
                onChange={(e) => handleFileInput(rule, e.target.files[0])}
              />
            </label>
          </div>
        )}
        {rule?.quantityInput && (
          <QtyInput quantityInput={rule.quantityInput} goToRule={goToRule} />
        )}
      </div>
    </div>
  );
}
