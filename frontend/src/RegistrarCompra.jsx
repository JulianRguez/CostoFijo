// RegistrarCompra.jsx
import React, { useState, useEffect, useRef } from "react";
import "./RegistrarCompra.css";

import Columna1 from "./Columna1";
import Columna2 from "./Columna2";
import Columna3 from "./Columna3";
import Columna4 from "./Columna4";

const URLIMGASTO = import.meta.env.VITE_IMGGASTO;

export default function RegistrarCompra({ onCompraRegistrada }) {
  const [form1, setForm1] = useState({
    nombre: "",
    ref: "",
    etiqueta: "Papeleria",
    stock: "",
    valor: "",
    valorVenta: "",
    minStock: "",
  });

  const [form2, setForm2] = useState({
    descripcion: "",
    img1: "",
    img2: "",
    img3: "",
    version: "",
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
        valorVenta: encontrado.valorVenta || "",
        minStock: encontrado.minStock || "",
      }));
      setForm2({
        descripcion: encontrado.descripcion,
        img1: encontrado.urlFoto1,
        img2: encontrado.urlFoto2 || "",
        img3: encontrado.urlFoto3 || "",
        version: encontrado.version || "",
      });
    } else {
      setForm1((prev) => ({
        ...prev,
        nombre: "",
        etiqueta: "Papeleria",
        valor: "",
        valorVenta: "",
        minStock: "",
      }));
      setForm2({
        descripcion: "",
        img1: "",
        img2: "",
        img3: "",
        version: "",
      });
    }
  };

  const isCampoDeshabilitado = (campo) => {
    const coincide = productosBD.some((prod) => prod.ref === form1.ref);
    return (
      coincide && campo !== "stock" && campo !== "ref" && campo !== "version"
    );
  };

  // =========================
  //        AGREGAR
  // =========================
  const agregarProducto = () => {
    const camposObligatorios = [
      { valor: form1.ref, ref: refs.ref },
      { valor: form1.nombre, ref: refs.nombre },
      { valor: form1.etiqueta, ref: refs.etiqueta },
      { valor: form1.valor, ref: refs.valor },
      { valor: form1.valorVenta, ref: null },
      { valor: form1.minStock, ref: null },
      { valor: form2.descripcion, ref: refs.descripcion },
      { valor: form2.img1, ref: refs.img1 },
    ];

    for (const campo of camposObligatorios) {
      if (!campo.valor || campo.valor.toString().trim() === "") {
        campo.ref?.current?.focus();
        setMensajeValidacion({
          texto: "Algún dato no es válido",
          tipo: "error",
        });
        return;
      }
    }

    const yaExisteEnLista = productosAgregados.some(
      (prod) => prod.ref.toLowerCase() === (form1.ref || "").toLowerCase()
    );
    if (yaExisteEnLista) {
      setForm1((prev) => ({ ...prev, ref: "" }));
      refs.ref.current?.focus();
      setMensajeValidacion({
        texto: "Algún dato no es válido",
        tipo: "error",
      });
      return;
    }

    // --- Datos del producto en BD ---
    const encontrado = productosBD.find((p) => p.ref === form1.ref);
    const stockIngresado = parseInt(form1.stock || 0, 10) || 0;
    const stockEnBD = parseInt(encontrado?.stock || 0, 10) || 0;
    const versionBD = encontrado?.version || "";
    const versionForm = form2.version ?? "";

    const permitirSoloVersion =
      !!encontrado &&
      stockIngresado === 0 &&
      stockEnBD > 0 &&
      versionForm !== versionBD;

    // --- Validación de versiones ---
    if (encontrado) {
      if (versionForm && versionForm.trim() !== "") {
        let sumaVersion = 0;
        const partes = versionForm.split("-");
        for (let i = 1; i < partes.length; i += 2) {
          sumaVersion += parseInt(partes[i] || 0, 10) || 0;
        }
        if (stockIngresado + stockEnBD !== sumaVersion) {
          setMensajeValidacion({
            texto: `El campo "Versión" no es válido`,
            tipo: "error",
          });
          return;
        }
      }
    }

    // --- Validaciones numéricas ---
    const stockValidoOExcepcion = permitirSoloVersion || stockIngresado > 0;
    const otrosNumerosValidos =
      parseInt(form1.valor || 0, 10) > 100 &&
      parseInt(form1.valorVenta || 0, 10) > 100 &&
      parseInt(form1.minStock || 0, 10) >= 0;

    if (!stockValidoOExcepcion || !otrosNumerosValidos) {
      setMensajeValidacion({
        texto: "Algún dato no es válido",
        tipo: "error",
      });
      return;
    }

    setProductosAgregados([
      ...productosAgregados,
      { ...form1, ...form2, stock: form1.stock === "" ? "0" : form1.stock },
    ]);

    setForm1({
      nombre: "",
      ref: "",
      etiqueta: "Papeleria",
      stock: "",
      valor: "",
      valorVenta: "",
      minStock: "",
    });
    setForm2({ descripcion: "", img1: "", img2: "", img3: "", version: "" });
    setMensajeValidacion({ texto: "", tipo: "" });
  };

  const eliminarProducto = (index) => {
    const nuevos = [...productosAgregados];
    nuevos.splice(index, 1);
    setProductosAgregados(nuevos);
  };
  const aplicarCambios = async () => {
    try {
      const productosFinales = productosAgregados.map((prod) => {
        if (registro === "Gastos") {
          return {
            ...prod,
            etiqueta: "Gasto",
            stock: "1",
            valorVenta: "0",
            minStock: "0",
            img1: URLIMGASTO,
          };
        }
        return prod;
      });

      const compArray = productosFinales
        .map((prod) => {
          const existente = productosBD.find((p) => p.ref === prod.ref);
          const stockIngresado = parseInt(prod.stock || 0, 10) || 0;
          const stockEnBD = parseInt(existente?.stock || 0, 10) || 0;

          // 🚨 Caso especial: solo versión → no registrar en comp
          const esSoloVersion =
            existente && stockIngresado === 0 && stockEnBD > 0;

          if (esSoloVersion) return null;

          return {
            factura,
            proveedor,
            idProv: proveedor.trim(),
            registro,
            fecha,
            idProd: prod.ref,
            cantidad: stockIngresado, // ✅ siempre solo el del input
            valor: parseInt(prod.valor || 0, 10) || 0,
          };
        })
        .filter(Boolean);

      const productosActualizar = [];
      const productosCrear = [];

      productosFinales.forEach((prod) => {
        const existente = productosBD.find((p) => p.ref === prod.ref);

        if (existente) {
          const stockEnBD = parseInt(existente.stock || 0, 10) || 0;
          const stockIngresado = parseInt(prod.stock || 0, 10) || 0;

          const nuevoStock =
            stockIngresado === 0 && stockEnBD > 0
              ? stockEnBD // ✅ mantener stock de BD
              : stockEnBD + stockIngresado;

          productosActualizar.push({
            _id: existente._id,
            stock: nuevoStock,
            version: prod.version, // respeta vacío o cambios
          });
        } else {
          productosCrear.push({
            nombre: prod.nombre,
            ref: prod.ref,
            etiqueta: prod.etiqueta,
            stock: parseInt(prod.stock || 0, 10) || 0,
            precio: parseInt(prod.valor || 0, 10) || 0,
            valorVenta: parseInt(prod.valorVenta || 0, 10) || 0,
            minStock: parseInt(prod.minStock || 0, 10) || 0,
            descripcion: prod.descripcion,
            urlFoto1: prod.img1,
            urlFoto2: prod.img2 || "",
            urlFoto3: prod.img3 || "",
            version: prod.version || "",
            reversado: 0,
            calificacion: [5, 5, 5],
          });
        }
      });

      if (compArray.length > 0) {
        const resComp = await fetch(`${URLAPI}/api/comp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(compArray),
        });
        if (!resComp.ok) throw new Error("Error guardando en /api/comp");
      }

      if (productosActualizar.length > 0) {
        const resPut = await fetch(`${URLAPI}/api/prod`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productosActualizar),
        });
        if (!resPut.ok)
          throw new Error("Error actualizando productos existentes");
      }

      if (productosCrear.length > 0) {
        const resPost = await fetch(`${URLAPI}/api/prod`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productosCrear),
        });
        if (!resPost.ok) throw new Error("Error creando productos nuevos");
      }

      setMostrarDialogo(false);
      setMensajeValidacion({ texto: "Registro exitoso", tipo: "exito" });
      setForm1({
        nombre: "",
        ref: "",
        etiqueta: "Papeleria",
        stock: "",
        valor: "",
        valorVenta: "",
        minStock: "",
      });
      setForm2({ descripcion: "", img1: "", img2: "", img3: "", version: "" });
      setFactura("");
      setProveedor("");
      setRegistro("Productos");
      setFecha(new Date().toISOString().substr(0, 10));
      setProductosAgregados([]);

      const resProd = await fetch(`${URLAPI}/api/prod`);
      const dataProd = await resProd.json();
      setProductosBD(dataProd);

      if (typeof onCompraRegistrada === "function") {
        onCompraRegistrada();
      }
    } catch (error) {
      console.error(error);
      setMensajeValidacion({
        texto: error.message || "No pudo ser guardado",
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
          form1={form1}
          setForm1={setForm1}
          form2={form2}
          setForm2={setForm2}
          refs={refs}
          isCampoDeshabilitado={isCampoDeshabilitado}
          agregarProducto={agregarProducto}
          productosBD={productosBD}
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

              {productosAgregados.map((prod, idx) => {
                const cant = parseInt(prod.stock || 0, 10) || 0;
                const val = parseInt(prod.valor || 0, 10) || 0;
                return (
                  <div key={idx} className="fila-tabla-modal">
                    <span>{prod.ref}</span>
                    <span>{prod.nombre}</span>
                    <span style={{ textAlign: "right" }}>{cant}</span>
                    <span style={{ textAlign: "right" }}>
                      {(cant * val).toLocaleString()}
                    </span>
                  </div>
                );
              })}

              <div className="total-tabla-modal">
                Total:{" "}
                {productosAgregados
                  .reduce(
                    (acc, p) =>
                      acc +
                      (parseInt(p.stock || 0, 10) || 0) *
                        (parseInt(p.valor || 0, 10) || 0),
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
