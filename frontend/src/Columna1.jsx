import React from "react";

export default function Columna1({
  form1,
  form2,
  mensajeValidacion,
  refs,
  handleRefChange,
  setForm1,
  setForm2,
  isCampoDeshabilitado,
  setMensajeValidacion,
}) {
  return (
    <div className="columna">
      <label className="label-inline">
        <span>Referencia</span>
        <input
          ref={refs.ref}
          maxLength={20}
          value={form1.ref}
          onChange={(e) => {
            handleRefChange(e);
            if (mensajeValidacion.texto) {
              setMensajeValidacion({ texto: "", tipo: "" });
            }
          }}
        />
      </label>

      <label className="label-inline">
        <span>Nombre</span>
        <input
          ref={refs.nombre}
          maxLength={20}
          value={form1.nombre}
          onChange={(e) => setForm1({ ...form1, nombre: e.target.value })}
          disabled={isCampoDeshabilitado("nombre")}
        />
      </label>

      <label className="label-inline">
        <span>Etiqueta</span>
        <select
          ref={refs.etiqueta}
          value={form1.etiqueta}
          onChange={(e) => setForm1({ ...form1, etiqueta: e.target.value })}
          disabled={isCampoDeshabilitado("etiqueta")}
          className="lst"
        >
          <option value="Accesorios">Accesorios</option>
          <option value="Papeleria">Papeleria</option>
          <option value="Celulares">Celulares</option>
          <option value="Hogar">Hogar</option>
          <option value="Servicios">Servicios</option>
          <option value="Gasto">Gasto</option>
        </select>
      </label>

      <label className="label-inline">
        <span>Stock</span>
        <input
          type="number"
          value={form1.stock}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            setForm1({ ...form1, stock: val });
          }}
          onFocus={(e) => e.target.select()}
        />
      </label>

      <label className="label-inline">
        <span>Valor</span>
        <input
          ref={refs.valor}
          type="number"
          value={form1.valor}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            setForm1({ ...form1, valor: val });
          }}
          onFocus={(e) => e.target.select()}
          disabled={isCampoDeshabilitado("valor")}
        />
      </label>

      <label className="label-inline">
        <span>Descripción</span>
        <input
          ref={refs.descripcion}
          type="text"
          maxLength={50}
          value={form2.descripcion}
          onChange={(e) => setForm2({ ...form2, descripcion: e.target.value })}
          disabled={isCampoDeshabilitado("descripcion")}
        />
      </label>

      {mensajeValidacion.texto && (
        <div
          style={{
            color: mensajeValidacion.tipo === "error" ? "#ef4444" : "#22c55e",
            fontSize: "1rem",
            fontWeight: "bold",
            marginTop: "22px",
            marginBottom: "6px",
            width: "100%",
            textAlign: "left",
          }}
        >
          {mensajeValidacion.texto}
        </div>
      )}
    </div>
  );
}
