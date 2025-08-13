import React, { useState, useEffect, useRef } from "react";
import "./RegistrarCompra.css";

export default function RegistrarCompra({ onCompraRegistrada }) {
  const [form1, setForm1] = useState({
    nombre: "",
    ref: "",
    etiqueta: "",
    stock: "",
    valor: "",
  });

  const [form2, setForm2] = useState({
    descripcion: "",
    img1: "",
    img2: "",
    img3: "",
    img4: "",
  });
  const URLAPI = import.meta.env.VITE_URLAPI;
  const [factura, setFactura] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [registro, setRegistro] = useState("Productos");
  const [fecha, setFecha] = useState(new Date().toISOString().substr(0, 10));
  const [productosAgregados, setProductosAgregados] = useState([]);
  const [mostrarDialogo, setMostrarDialogo] = useState(false);
  const [cliente, setCliente] = useState("Sin Nombre");
  const [productosBD, setProductosBD] = useState([]);
  const [mensajeValidacion, setMensajeValidacion] = useState({
    texto: "",
    tipo: "", // "error" o "exito"
  });
  const refs = {
    ref: useRef(),
    nombre: useRef(),
    etiqueta: useRef(),
    valor: useRef(),
    descripcion: useRef(),
    img1: useRef(),
  };
  useEffect(() => {
    fetch(`${URLAPI}/api/prod`)
      .then((res) => res.json())
      .then((data) => setProductosBD(data))
      .catch((err) => console.error("Error cargando productos:", err));
  }, []);

  const handleRefChange = (e) => {
    const nuevaRef = e.target.value;
    setForm1({ ...form1, ref: nuevaRef });

    const encontrado = productosBD.find((prod) => prod.ref === nuevaRef);

    if (encontrado) {
      setForm1((prev) => ({
        ...prev,
        nombre: encontrado.nombre,
        etiqueta: encontrado.etiqueta,
        valor: encontrado.precio,
      }));
      setForm2({
        descripcion: encontrado.descripcion,
        img1: encontrado.urlFoto1,
        img2: encontrado.urlFoto2 || "",
        img3: encontrado.urlFoto3 || "",
        img4: encontrado.urlFoto4 || "",
      });
    } else {
      setForm1((prev) => ({
        ...prev,
        nombre: "",
        etiqueta: "",
        valor: "",
      }));
      setForm2({
        descripcion: "",
        img1: "",
        img2: "",
        img3: "",
        img4: "",
      });
    }
  };

  const handleFocus = () => {
    if (cliente === "Sin Nombre") setCliente("");
  };

  const handleBlur = () => {
    if (cliente.trim() === "") setCliente("Sin Nombre");
  };

  const isCampoDeshabilitado = (campo) => {
    const coincide = productosBD.some((prod) => prod.ref === form1.ref);
    return coincide && campo !== "stock" && campo !== "ref";
  };

  const agregarProducto = () => {
    const camposObligatorios = [
      { valor: form1.ref, ref: refs.ref },
      { valor: form1.nombre, ref: refs.nombre },
      { valor: form1.etiqueta, ref: refs.etiqueta },
      { valor: form1.valor, ref: refs.valor },
      { valor: form2.descripcion, ref: refs.descripcion },
      { valor: form2.img1, ref: refs.img1 },
    ];

    for (const campo of camposObligatorios) {
      if (!campo.valor || campo.valor.toString().trim() === "") {
        campo.ref.current?.focus();
        setMensajeValidacion({
          texto: "Algún dato no es válido",
          tipo: "error",
        });
        return;
      }
    }

    const yaExiste = productosAgregados.some(
      (prod) => prod.ref.toLowerCase() === form1.ref.toLowerCase()
    );

    if (yaExiste) {
      setForm1((prev) => ({ ...prev, ref: "" }));
      refs.ref.current?.focus();
      setMensajeValidacion({
        texto: "Algún dato no es válido",
        tipo: "error",
      });
      return;
    }

    if (form1.stock <= 0 || form1.valor <= 100) {
      refs.valor.current?.focus();
      setMensajeValidacion({
        texto: "Algún dato no es válido",
        tipo: "error",
      });
      return;
    }

    // ✅ Si pasa todas las validaciones
    setProductosAgregados([...productosAgregados, { ...form1, ...form2 }]);
    setForm1({ nombre: "", ref: "", etiqueta: "", stock: "", valor: "" });
    setForm2({ descripcion: "", img1: "", img2: "", img3: "", img4: "" });
    setMensajeValidacion({ texto: "", tipo: "" }); // Limpia mensaje
  };

  const eliminarProducto = (index) => {
    const nuevos = [...productosAgregados];
    nuevos.splice(index, 1);
    setProductosAgregados(nuevos);
  };
  const aplicarCambios = async () => {
    try {
      // Enviar POST a /api/comp por cada producto
      for (const prod of productosAgregados) {
        const cuerpoComp = {
          factura,
          registro,
          fecha,
          idProd: prod.ref,
          cantidad: parseInt(prod.stock),
          valor: parseInt(prod.valor),
        };

        const resComp = await fetch(`${URLAPI}/api/comp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cuerpoComp),
        });

        if (!resComp.ok) throw new Error("Error guardando en /api/comp");

        // Si registro es productos, verificar si ya existe
        if (registro === "Productos") {
          const existe = productosBD.find((p) => p.ref === prod.ref);

          if (existe) {
            // PUT a /api/prod/:id con stock actualizado
            const nuevoStock = parseInt(existe.stock) + parseInt(prod.stock);
            const resPut = await fetch(
              `http://localhost:3000/api/prod/${existe._id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stock: nuevoStock }),
              }
            );

            if (!resPut.ok)
              throw new Error("Error actualizando producto existente");
          } else {
            // POST nuevo producto
            const nuevoProd = {
              nombre: prod.nombre,
              ref: prod.ref,
              etiqueta: prod.etiqueta,
              stock: parseInt(prod.stock),
              precio: parseInt(prod.valor),
              descripcion: prod.descripcion,
              urlFoto1: prod.img1,
              urlFoto2: prod.img2 || "",
              urlFoto3: prod.img3 || "",
              urlFoto4: prod.img4 || "",
              reversado: 0,
              calificacion: [5, 5, 5],
            };

            const resPost = await fetch(`${URLAPI}/api/prod`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(nuevoProd),
            });

            if (!resPost.ok) throw new Error("Error creando producto nuevo");
          }
        }
      }

      // Si todo salió bien
      setMostrarDialogo(false);
      setMensajeValidacion({
        texto: "Registro exitoso",
        tipo: "exito",
      });
      // Limpiar formularios
      setForm1({ nombre: "", ref: "", etiqueta: "", stock: "", valor: "" });
      setForm2({ descripcion: "", img1: "", img2: "", img3: "", img4: "" });
      setFactura("");
      setProveedor("");
      setRegistro("Productos");
      setFecha(new Date().toISOString().substr(0, 10));
      setProductosAgregados([]);
      // Refrescar productosBD
      const res = await fetch(`${URLAPI}/api/prod`);
      const data = await res.json();
      setProductosBD(data);
      if (typeof onCompraRegistrada === "function") {
        onCompraRegistrada();
      }
    } catch (error) {
      console.error(error);
      setMensajeValidacion({
        texto: "Algún dato no es válido",
        tipo: "error",
      });
    }
  };

  return (
    <div className="carrito-compra">
      <h2 className="titulo-compra">Seleccionados</h2>
      <div
        className="grid-compras"
        style={{ gridTemplateColumns: "18% 18% 41% 18%" }}
      >
        {/* Columna 1 */}
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
            <input
              ref={refs.etiqueta}
              maxLength={20}
              value={form1.etiqueta}
              onChange={(e) => setForm1({ ...form1, etiqueta: e.target.value })}
              disabled={isCampoDeshabilitado("etiqueta")}
            />
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
              onChange={(e) =>
                setForm2({ ...form2, descripcion: e.target.value })
              }
              disabled={isCampoDeshabilitado("descripcion")}
            />
          </label>
          {mensajeValidacion.texto && (
            <div
              style={{
                color:
                  mensajeValidacion.tipo === "error" ? "#ef4444" : "#22c55e",
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

        {/* Columna 2 */}
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

        {/* Columna 3 */}
        <div className="columna">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "20% 20% 20% 20% 20%",
              width: "100%",
              fontWeight: "bold",
              fontSize: "0.85rem",
              color: "#10b981",
              borderBottom: "1px solid #475569",
              paddingBottom: "4px",
              marginBottom: "4px",
            }}
          >
            <span style={{ textAlign: "left" }}>Referencia</span>
            <span style={{ textAlign: "left" }}>Producto</span>
            <span style={{ textAlign: "right" }}>Cant</span>
            <span style={{ textAlign: "right" }}>Valor</span>
            <span style={{ textAlign: "right" }}></span>
          </div>

          {productosAgregados.map((prod, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "20% 20% 20% 20% 20%",
                width: "100%",
                padding: "2px 0",
                fontSize: "0.85rem",
                color: "#f1f5f9",
              }}
            >
              <span style={{ textAlign: "left", fontWeight: "bold" }}>
                {prod.ref}
              </span>
              <span style={{ textAlign: "left" }}>{prod.nombre}</span>
              <span style={{ textAlign: "right" }}>{prod.stock}</span>
              <span style={{ textAlign: "right" }}>
                {prod.valor.toLocaleString()}
              </span>
              <span
                style={{
                  textAlign: "right",
                  color: "#F87171",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onClick={() => eliminarProducto(idx)}
              >
                Eliminar
              </span>
            </div>
          ))}
        </div>

        {/* Columna 4 */}
        <div className="columna">
          <label className="label-inline">
            <span>Factura</span>
            <input
              maxLength={15}
              value={factura}
              onChange={(e) => {
                setFactura(e.target.value);
                if (mensajeValidacion.texto) {
                  setMensajeValidacion({ texto: "", tipo: "" });
                }
              }}
            />
          </label>

          <label className="label-inline">
            <span>Proveedor</span>
            <input
              maxLength={15}
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
            />
          </label>

          <label className="label-inline">
            <span>Registro</span>
            <select
              value={registro}
              onChange={(e) => setRegistro(e.target.value)}
              style={{
                padding: "4px 6px",
                borderRadius: "4px",
                maxWidth: "174px",
                width: "100%",
                height: "28px",
                fontSize: "0.85rem",
              }}
            >
              <option value="Productos">Productos</option>
              <option value="Gastos">Gastos</option>
            </select>
          </label>

          <label className="label-inline">
            <span>Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              onBlur={() => {
                const hoy = new Date().toISOString().substr(0, 10);

                // Si la fecha no es válida o es mayor que hoy → volver a hoy
                if (!fecha || isNaN(Date.parse(fecha)) || fecha > hoy) {
                  setFecha(hoy);
                }
              }}
            />
          </label>

          {/* 🟠 Aquí está la validación nueva */}
          <button
            className="btn-confirmar-compra"
            onClick={() => {
              if (
                factura.trim().length < 3 ||
                proveedor.trim().length < 3 ||
                productosAgregados.length === 0
              ) {
                setMensajeValidacion({
                  texto: "Algún dato no es válido",
                  tipo: "error",
                });
                return;
              }

              setMensajeValidacion({ texto: "", tipo: "" });
              setMostrarDialogo(true);
            }}
          >
            Registrar Compra
          </button>
        </div>
      </div>

      {mostrarDialogo && (
        <div className="modal-compra">
          <div className="contenido-modal-compra modal-estilo">
            <h2 className="titulo-modal">Registro de Factura</h2>

            <div className="info-modal">
              <div>
                <strong>Factura:</strong> {factura || "N/A"}
              </div>
              <div>
                <strong>Proveedor:</strong> {proveedor || "N/A"}
              </div>
              <div>
                <strong>Registro:</strong> {registro}
              </div>
              <div>
                <strong>Fecha:</strong> {fecha}
              </div>
            </div>

            <div className="tabla-productos-modal">
              <div className="encabezado-tabla-modal">
                <span>Referencia</span>
                <span>Producto</span>
                <span style={{ textAlign: "right" }}>Cantidad</span>
                <span style={{ textAlign: "right" }}>Subtotal</span>
              </div>

              {productosAgregados.map((prod, idx) => (
                <div key={idx} className="fila-tabla-modal">
                  <span>{prod.ref}</span>
                  <span>{prod.nombre}</span>
                  <span style={{ textAlign: "right" }}>{prod.stock}</span>
                  <span style={{ textAlign: "right" }}>
                    {(
                      parseInt(prod.stock) * parseInt(prod.valor)
                    ).toLocaleString()}
                  </span>
                </div>
              ))}

              <div className="total-tabla-modal">
                Total:{" "}
                {productosAgregados
                  .reduce(
                    (acc, p) =>
                      acc + parseInt(p.stock || 0) * parseInt(p.valor || 0),
                    0
                  )
                  .toLocaleString()}
              </div>
            </div>

            <div className="acciones-compra">
              <button
                className="btn-cancelar-modal"
                onClick={() => setMostrarDialogo(false)}
              >
                Cancelar
              </button>
              <button className="btn-aplicar-modal" onClick={aplicarCambios}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
