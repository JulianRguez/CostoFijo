//Columna1.jsx
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
  esGastoExistente,
  subirImagenCloudinary,
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
          maxLength={30}
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
          <option value="Papeleria">Papeleria</option>
          <option value="Celulares y accesorios">Celulares y accesorios</option>
          <option value="Servicios papeleria">Servicios papeleria</option>
          <option value="Hogar">Hogar</option>
          <option value="Vigilancia">Vigilancia</option>
          <option value="Redes y datos">Redes y datos</option>
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
          disabled={esGastoExistente} // ✅ nuevo
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
      {/* BOTÓN CARGAR IMAGEN */}
      <label className="label-inline">
        <span>Imagen</span>

        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          id="inputImagen"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
              const url = await subirImagenCloudinary(file);

              // Guardar URL en img1
              setForm2({ ...form2, img1: url });
            } catch (err) {
              console.error(err);
              setMensajeValidacion({
                texto: "Error subiendo imagen",
                tipo: "error",
              });
            }
          }}
        />

        <button
          type="button"
          className="btn-agregar-compra"
          onClick={() => document.getElementById("inputImagen").click()}
        >
          Cargar
        </button>
      </label>

      {/* Mostrar URL si existe */}
      {form2.img1 && (
        <div
          style={{ fontSize: "0.7rem", textAlign: "left", color: "#22c55e" }}
        >
          Imagen cargada ✔
        </div>
      )}
    </div>
  );
}
