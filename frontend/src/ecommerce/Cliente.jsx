// Cliente.jsx
import React, { useState, useEffect } from "react";
import "./Cliente.css";
import axios from "axios";
const API_KEY = import.meta.env.VITE_API_KEY;
import { X } from "lucide-react";
import ZeusBot from "./ZeusBot";

export default function Cliente({
  onClose,
  clienteId,
  modo,
  setUsuario,
  infoPedido,
}) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [mostrarZeus, setMostrarZeus] = useState(false);
  const [tnombre, setTnombre] = useState("");
  const [tTel, setTtel] = useState("");
  const [nota, setNota] = useState("");
  const [guardarDatos, setGuardarDatos] = useState(false);
  const [form, setForm] = useState({
    doc: "",
    nombre: "",
    dire: "",
    tel: "",
    mail: "",
    clave: "",
  });
  const [docBloqueado, setDocBloqueado] = useState(false);
  const [existeClave, setExisteClave] = useState(false);
  const [claveEditada, setClaveEditada] = useState(false);

  // Cargar datos del cliente por ID
  useEffect(() => {
    if (!clienteId) {
      // NO autenticado → limpiar formulario y permitir llenarlo
      setForm({
        doc: "",
        nombre: "",
        dire: modo === "venta" && infoPedido ? infoPedido.direccion : "",
        tel: "",
        mail: "",
        clave: "",
      });
      setDocBloqueado(false); // permitir que escriba todo
      setLoading(false);
      return;
    }

    // Si SÍ tiene clienteId → cargar datos de la API
    const cargar = async () => {
      try {
        const { data } = await axios.get(`/api/clie/id/${clienteId}`, {
          headers: { "x-api-key": API_KEY },
        });
        setForm({
          doc: data.doc || "",
          nombre: data.nombre || "",
          dire:
            modo === "venta" && infoPedido
              ? infoPedido.direccion
              : data.dire || "",
          tel: data.tel || "",
          mail: data.mail || "",
          clave: data.clave ? "0000" : "",
        });
        setExisteClave(!!data.clave);
        setClaveEditada(false);

        setDocBloqueado(!!data.doc);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [clienteId, modo, infoPedido]);

  useEffect(() => {
    if (!clienteId) {
      // ❌ No autenticado → siempre guardar
      setGuardarDatos(true);
    } else {
      // ✅ Autenticado → inicia chuleado pero editable
      setGuardarDatos(true);
    }
  }, [clienteId]);

  const textoCheckbox = clienteId
    ? "Actualizar datos personales"
    : "Guardar datos personales";

  const validarTelefonoDisponible = async (tel) => {
    try {
      const { data } = await axios.get(`/api/clie/${tel}`, {
        headers: { "x-api-key": API_KEY },
      });
      if (data && data._id && data._id !== clienteId) return false;
      return true;
    } catch {
      return true;
    }
  };
  const validarCcDisponible = async (doc) => {
    try {
      const { data } = await axios.get(`/api/clie/cc/${doc}`, {
        headers: { "x-api-key": API_KEY },
      });
      if (data && data._id && data._id !== clienteId) return false;
      return true;
    } catch {
      return true;
    }
  };

  const validarMailDisponible = async (mail) => {
    try {
      const { data } = await axios.get(`/api/clie/${mail}`, {
        headers: { "x-api-key": API_KEY },
      });
      if (data && data._id && data._id !== clienteId) return false;
      return true;
    } catch {
      return true;
    }
  };
  const generarFactura = () => {
    const now = new Date();
    const ss = String(now.getSeconds()).padStart(2, "0"); // 2
    const ml = String(now.getMilliseconds()).padStart(3, "0"); //3
    const rnd = String(Math.floor(Math.random() * 1000)).padStart(3, "0"); // 3

    return `${ss}${ml}${rnd}`; // 2 + 3 + 3 = 8
  };

  // inicio de actualizar -----------------------------------------------------------------
  const actualizar = async () => {
    // ------------------------------------------------
    // VALIDACIÓN GLOBAL DE CLAVE
    // ------------------------------------------------

    // Caso 1: Cliente NO tiene clave
    if (!existeClave) {
      if (!form.clave) return setErrorMsg("Debe crear una clave de 4 dígitos");

      if (form.clave.length !== 4 || isNaN(form.clave))
        return setErrorMsg("La clave debe ser de 4 dígitos numéricos");
    }

    // Caso 2: Cliente SÍ tiene clave
    if (existeClave) {
      // Solo validar si la está cambiando
      if (claveEditada) {
        if (form.clave.length !== 4 || isNaN(form.clave))
          return setErrorMsg("La clave debe ser de 4 dígitos numéricos");
      }
    }

    setErrorMsg("");
    const { doc, nombre, dire, tel, mail, clave } = form;
    setTnombre(nombre);
    setTtel(tel);
    // VALIDACIONES MODO VENTA
    if (modo === "venta") {
      if (!doc || doc.length < 5 || isNaN(doc))
        return setErrorMsg("Documento inválido");
      if (!nombre || nombre.trim().length < 4)
        return setErrorMsg("Nombre inválido");
      if (!dire || dire.length < 8) return setErrorMsg("Dirección inválida");
      if (!tel || tel.length !== 10 || isNaN(tel))
        return setErrorMsg("Teléfono inválido");
      if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail))
        return setErrorMsg("Correo inválido");
      if (clave && (clave.length !== 4 || isNaN(clave)))
        return setErrorMsg("Clave inválida");
    }
    // validar cc  existe y no es del autenticado
    const dispCc = await validarCcDisponible(doc);
    if (!dispCc)
      return setErrorMsg("El documento de identidad ya está registrado");
    // validar teléfono existe y no es del autenticado
    const dispTel = await validarTelefonoDisponible(tel);
    if (!dispTel) return setErrorMsg("El teléfono ya está registrado");
    // validar correo  existe y no es del autenticado
    const dispMail = await validarMailDisponible(mail);
    if (!dispMail) return setErrorMsg("El correo ya está registrado");
    // Usar unfo para la compra

    if (modo === "venta" && infoPedido) {
      const productosPayload = infoPedido.productos.map((p) => ({
        idProd: p._id,
        nomProd: p.nombre,
        cantidad: p.cantidad || 1,
        valor: p.valorVenta,
        etiqueta: p.etiqueta,
        version: p.version || "",
      }));

      const payloadVenta = {
        idClient: doc,
        factura: generarFactura(),
        pago: "pendiente",
        otrosCobros:
          Number(infoPedido.costoTrans || 0) + Number(infoPedido.envio || 0),
        descuentos:
          Number(infoPedido.descuento || 0) + Number(infoPedido.cupon || 0),
        productos: productosPayload,
      };
      setNota(payloadVenta.factura);

      try {
        await axios.post("/api/vent", payloadVenta, {
          headers: { "x-api-key": API_KEY },
        });
      } catch (err) {
        console.error("Error creando la venta:", err);
        return setErrorMsg("No se pudo registrar la venta");
      }

      setMostrarZeus(true); // ✅ ABRE ZEUSBOT
    }

    //SI EL CLINTE NO ESTA AUTENTICADO NO SE ACTUALIZA LA INFO EN LA API
    // 👉 SOLO si el checkbox está marcado
    if (!guardarDatos) return;
    try {
      // 🟢 ACTUALIZAR
      if (clienteId) {
        const payload = [
          {
            _id: clienteId,
            doc,
            nombre,
            dire,
            tel,
            mail,
            ...(claveEditada ? { clave } : {}),
          },
        ];

        await axios.put("/api/clie", payload, {
          headers: { "x-api-key": API_KEY },
        });

        const { data: actualizado } = await axios.get(
          `/api/clie/id/${clienteId}`,
          {
            headers: { "x-api-key": API_KEY },
          },
        );

        setUsuario(actualizado);
        setErrorMsg("Datos actualizados correctamente");
      }

      // 🟢 CREAR
      if (!clienteId) {
        const payload = [
          {
            doc,
            nombre,
            dire,
            tel,
            mail,
            clave,
          },
        ];

        await axios.post("/api/clie", payload, {
          headers: { "x-api-key": API_KEY },
        });
        setErrorMsg("Datos guardados correctamente");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Error al guardar la información");
    }
  };
  // Fin de actualizar --------------------------------------------------------------

  if (loading) return null;

  return (
    <div className="cliente-overlay">
      <div className="cliente-modal">
        <button className="close-btn" onClick={onClose}>
          <X />
        </button>

        <h2 className="cliente-title">
          {modo === "venta" ? "Datos para el pedido" : "Datos del Cliente"}
        </h2>

        <div className="cliente-form">
          <div className="fila">
            <label>Documento</label>
            <input
              type="text"
              maxLength={15}
              disabled={docBloqueado}
              value={form.doc}
              onChange={(e) =>
                setForm({ ...form, doc: e.target.value.replace(/[^0-9]/g, "") })
              }
            />
          </div>

          <div className="fila">
            <label>Nombre</label>
            <input
              type="text"
              maxLength={25}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

          <div className="fila">
            <label>Dirección</label>
            <p className="direccion-info">{form.dire}</p>
          </div>

          <div className="fila">
            <label>Teléfono</label>
            <input
              type="text"
              maxLength={10}
              value={form.tel}
              onChange={(e) =>
                setForm({ ...form, tel: e.target.value.replace(/[^0-9]/g, "") })
              }
            />
          </div>

          <div className="fila">
            <label>Correo</label>
            <input
              type="text"
              maxLength={30}
              value={form.mail}
              onChange={(e) => setForm({ ...form, mail: e.target.value })}
            />
          </div>

          <div className="fila">
            <label>Clave</label>
            <input
              type="password"
              maxLength={4}
              value={form.clave}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setForm({ ...form, clave: val });
                if (val !== "0000") {
                  setClaveEditada(true);
                }
              }}
            />
          </div>
          <div className="fila-checkbox">
            <input
              type="checkbox"
              checked={guardarDatos}
              disabled={!clienteId} // 👈 clave
              onChange={(e) => setGuardarDatos(e.target.checked)}
            />

            <label>{textoCheckbox}</label>
          </div>
        </div>

        <button className="cliente-btn" onClick={actualizar}>
          {modo === "venta" ? "Confirmar pedido" : "Actualizar"}
        </button>

        {/* ⚠️ Mensaje legal en gris */}
        <p className="cliente-legal">
          Su información personal será guardada y protegida según la{" "}
          <a
            href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981"
            target="_blank"
            rel="noopener noreferrer"
            className="cliente-legal-link"
          >
            Ley 1581 de 2012
          </a>{" "}
          y decretos reglamentarios. Al dar clic en “Actualizar” autoriza el
          almacenamiento de su información en nuestra base de datos.
        </p>

        {errorMsg && <p className="cliente-alerta">{errorMsg}</p>}
      </div>
      {mostrarZeus && (
        <ZeusBot
          inicio="fraSi"
          userName={tnombre || Ttel}
          nota={nota}
          onClose={() => {
            setMostrarZeus(false); // cierra Zeus
            onClose(); // cierra Cliente
          }}
        />
      )}
    </div>
  );
}
