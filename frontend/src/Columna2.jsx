import React, { useState, useEffect } from "react";
import Version from "./Version";

export default function Columna2({
  form1,
  setForm1,
  form2,
  setForm2,
  refs,
  isCampoDeshabilitado,
  agregarProducto,
}) {
  const [mostrarVersion, setMostrarVersion] = useState(false);

  // 🔹 Si cambia el stock, limpiar versión
  useEffect(() => {
    setForm2((prev) => ({ ...prev, version: "" }));
  }, [form1.stock, setForm2]);

  return (
    <div className="columna">
      {/* Campo Valor Venta */}
      <label className="label-inline">
        <span className="label-url">Valor venta</span>
        <input
          type="number"
          value={form1.valorVenta}
          onChange={(e) =>
            setForm1({
              ...form1,
              valorVenta: e.target.value.replace(/\D/g, ""),
            })
          }
          onFocus={(e) => e.target.select()}
        />
      </label>

      {/* Campo Stock mínimo */}
      <label className="label-inline">
        <span className="label-url">Stock min</span>
        <input
          type="number"
          value={form1.minStock}
          onChange={(e) =>
            setForm1({
              ...form1,
              minStock: e.target.value.replace(/\D/g, ""),
            })
          }
          onFocus={(e) => e.target.select()}
        />
      </label>

      {/* Imagen 1 */}
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

      {/* Imagen 2 */}
      <label className="label-inline">
        <span className="label-url">URL Img2</span>
        <input
          maxLength={250}
          value={form2.img2}
          onChange={(e) => setForm2({ ...form2, img2: e.target.value })}
          disabled={isCampoDeshabilitado("img2")}
        />
      </label>

      {/* Imagen 3 */}
      <label className="label-inline">
        <span className="label-url">URL Img3</span>
        <input
          maxLength={250}
          value={form2.img3}
          onChange={(e) => setForm2({ ...form2, img3: e.target.value })}
          disabled={isCampoDeshabilitado("img3")}
        />
      </label>

      {/* Campo Versión */}
      <label className="label-inline">
        <span className="label-url">Versión</span>
        <input
          maxLength={250}
          value={form2.version}
          readOnly
          onClick={() => {
            if (parseInt(form1.stock, 10) > 0) {
              setMostrarVersion(true);
            }
          }}
          placeholder="Click para definir versiones"
          disabled={isCampoDeshabilitado("version")}
        />
      </label>

      {/* Botón Agregar */}
      <button className="btn-agregar-compra" onClick={agregarProducto}>
        Agregar
      </button>

      {/* Modal de versiones */}
      {mostrarVersion && (
        <Version
          stockActual={form1.stock}
          onConfirmar={(versionString) => {
            setForm2({ ...form2, version: versionString });
            setMostrarVersion(false);
          }}
          onCancelar={() => setMostrarVersion(false)}
        />
      )}
    </div>
  );
}
