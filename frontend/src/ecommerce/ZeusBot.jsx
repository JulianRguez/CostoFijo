// ZeusBot.jsx
import React, { useEffect, useState, useRef } from "react";
import "./ZeusBot.css";
import { rules, setNombreUsuario } from "./rules";
import { X } from "lucide-react";

export default function ZeusBot({ inicio, userName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [currentRule, setCurrentRule] = useState(inicio);
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // actualiza nombre
  useEffect(() => {
    setNombreUsuario(userName);
  }, [userName]);

  // mensaje inicial
  useEffect(() => {
    const rule = rules[inicio];
    setMessages([
      {
        from: "bot",
        type: "text",
        content: rule.resp(),
      },
    ]);
  }, [inicio]);

  const goToRule = (next, label) => {
    const rule = rules[next];

    setMessages((prev) => [
      ...prev,
      { from: "user", type: "option", content: label },
      { from: "bot", type: "text", content: rule.resp() },
    ]);

    setCurrentRule(next);
    setInputValue("");
  };

  const handleInputAction = (rule) => {
    // ejecuta la acción (ej: buscarFra)
    rule.input.action(inputValue);

    // 🔴 CAMBIO CLAVE: soporta string, función o función inline
    const nextKey =
      typeof rule.input.next === "function"
        ? rule.input.next()
        : rule.input.next;

    const nextRule = rules[nextKey];

    setMessages((prev) => [
      ...prev,
      { from: "user", type: "option", content: inputValue },
      { from: "bot", type: "text", content: nextRule.resp() },
    ]);

    setCurrentRule(nextKey);
    setInputValue("");
  };

  const rule = rules[currentRule];

  return (
    <div className="zeus-overlay">
      <div className="zeus-chat">
        <div className="zeus-header">Chat dirigido por Zeus Chat Bot IA</div>

        <button className="zeus-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* ZONA CON SCROLL */}
        <div className="zeus-messages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`zeus-msg ${m.from === "bot" ? "bot" : "user"}`}
            >
              {m.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* OPCIONES */}
        {rule?.options && (
          <div className="zeus-options">
            {rule.options.map((opt, i) => (
              <button key={i} onClick={() => goToRule(opt.next, opt.label)}>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* INPUT */}
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
      </div>
    </div>
  );
}
