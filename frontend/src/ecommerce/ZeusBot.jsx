import React, { useEffect, useState, useRef } from "react";
import "./ZeusBot.css";
import { useRules } from "./useRules";
import { useRules as useRules2 } from "./useRules2";
import { X } from "lucide-react";

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

    setMessages((prev) => [
      ...prev,
      { from: "user", content: label },
      { from: "bot", content: rule.resp() },
    ]);

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
              {m.content}
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
          <div className="zeus-qty-area">
            {rule.quantityInput.items.map((item, i) => (
              <div key={i} className="zeus-qty-row">
                <span>{item.label}</span>

                <input
                  type="number"
                  min="0"
                  max="99"
                  defaultValue="0"
                  onChange={(e) =>
                    rule.quantityInput.onChange(item.id, Number(e.target.value))
                  }
                />
              </div>
            ))}

            <button
              className="zeus-qty-btn"
              onClick={() => goToRule(rule.quantityInput.next, "Continuar")}
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
