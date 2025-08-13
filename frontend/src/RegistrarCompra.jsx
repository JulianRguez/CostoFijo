//RegistrarCompra.jsx
import React, { useState, useEffect, useRef } from "react";
import "./RegistrarCompra.css";

// Importar columnas
import Columna1 from "./Columna1";
import Columna2 from "./Columna2";
import Columna3 from "./Columna3";
import Columna4 from "./Columna4";

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
  const [productosBD, setProductosBD] = useState([]);
  const [mensajeValidacion, setMensajeValidacion] = useState({
    texto: "",
    tipo: "",
  });

  const refs = {
    ref: useRef(),
    nombre: useRef(),
    etiqueta: useRef(),
    valor: useRef(),
    descripcion: useRef(),
    img1: useRef(),
  };

  // Cargar productos
  useEffect(() => {
    fetch(`${URLAPI}/api/prod`)
      .then((res) => res.json())
      .then((data) => setProductosBD(data))
      .catch((err) => console.error("Error cargando productos:", err));
  }, [URLAPI]);

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

    setProductosAgregados([...productosAgregados, { ...form1, ...form2 }]);
    setForm1({ nombre: "", ref: "", etiqueta: "", stock: "", valor: "" });
    setForm2({ descripcion: "", img1: "", img2: "", img3: "", img4: "" });
    setMensajeValidacion({ texto: "", tipo: "" });
  };

  const eliminarProducto = (index) => {
    const nuevos = [...productosAgregados];
    nuevos.splice(index, 1);
    setProductosAgregados(nuevos);
  };

  const aplicarCambios = async () => {
    try {
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

        if (registro === "Productos") {
          const existe = productosBD.find((p) => p.ref === prod.ref);

          if (existe) {
            const nuevoStock = parseInt(existe.stock) + parseInt(prod.stock);
            const resPut = await fetch(`${URLAPI}/api/prod/${existe._id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ stock: nuevoStock }),
            });

            if (!resPut.ok)
              throw new Error("Error actualizando producto existente");
          } else {
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

      setMostrarDialogo(false);
      setMensajeValidacion({ texto: "Registro exitoso", tipo: "exito" });
      setForm1({ nombre: "", ref: "", etiqueta: "", stock: "", valor: "" });
      setForm2({ descripcion: "", img1: "", img2: "", img3: "", img4: "" });
      setFactura("");
      setProveedor("");
      setRegistro("Productos");
      setFecha(new Date().toISOString().substr(0, 10));
      setProductosAgregados([]);

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
        <Columna1
          form1={form1}
          form2={form2}
          mensajeValidacion={mensajeValidacion}
          refs={refs}
          handleRefChange={handleRefChange}
          setForm1={setForm1}
          setForm2={setForm2}
          isCampoDeshabilitado={isCampoDeshabilitado}
          setMensajeValidacion={setMensajeValidacion}
        />

        <Columna2
          form2={form2}
          setForm2={setForm2}
          refs={refs}
          isCampoDeshabilitado={isCampoDeshabilitado}
          agregarProducto={agregarProducto}
        />

        <Columna3
          productosAgregados={productosAgregados}
          eliminarProducto={eliminarProducto}
        />

        <Columna4
          factura={factura}
          setFactura={setFactura}
          proveedor={proveedor}
          setProveedor={setProveedor}
          registro={registro}
          setRegistro={setRegistro}
          fecha={fecha}
          setFecha={setFecha}
          mensajeValidacion={mensajeValidacion}
          setMensajeValidacion={setMensajeValidacion}
          productosAgregados={productosAgregados}
          setMostrarDialogo={setMostrarDialogo}
        />
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
