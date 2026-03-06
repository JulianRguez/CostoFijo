import React, { useEffect, useState, useRef } from "react";
import "./ZeusBot.css";
import { useRules } from "./useRules";
import { X } from "lucide-react";

export default function ZeusBot({ inicio, userName, nota, onClose }) {
  const { rules } = useRules(userName, nota);

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

    const rule = rules[inicio];
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

    const rule = rules[next];

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
    const nextRule = rules[nextKey];

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

    const nextRule = rules[nextKey];

    setMessages((prev) => [
      ...prev,
      { from: "user", content: file?.name || "Archivo seleccionado" },
      { from: "bot", content: nextRule.resp() },
    ]);

    setCurrentRule(nextKey);
  };

  const rule = rules[currentRule];

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
      </div>
    </div>
  );
}
