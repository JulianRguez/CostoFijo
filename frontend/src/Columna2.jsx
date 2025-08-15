//Columna2.jsx
import React from "react";

export default function Columna2({
  form2,
  setForm2,
  refs,
  isCampoDeshabilitado,
  agregarProducto,
}) {
  return (
    <div className="columna">
      <label className="label-inline">
        <span className="label-url">URL Img1</span>
        <input
          ref={refs.img1}
          maxLength={250}
          value={form2.img1}
          onChange={(e) => setForm2({ ...form2, img1: e.target.value })}
          disabled={isCampoDeshabilitado("img1")}
        />
      </label>
      <label className="label-inline">
        <span className="label-url">URL Img2</span>
        <input
          maxLength={250}
          value={form2.img2}
          onChange={(e) => setForm2({ ...form2, img2: e.target.value })}
          disabled={isCampoDeshabilitado("img2")}
        />
      </label>
      <label className="label-inline">
        <span className="label-url">URL Img3</span>
        <input
          maxLength={250}
          value={form2.img3}
          onChange={(e) => setForm2({ ...form2, img3: e.target.value })}
          disabled={isCampoDeshabilitado("img3")}
        />
      </label>
      <label className="label-inline">
        <span className="label-url">URL Img4</span>
        <input
          maxLength={250}
          value={form2.img4}
          onChange={(e) => setForm2({ ...form2, img4: e.target.value })}
          disabled={isCampoDeshabilitado("img4")}
        />
      </label>
      <button className="btn-agregar-compra" onClick={agregarProducto}>
        Agregar
      </button>
    </div>
  );
}
