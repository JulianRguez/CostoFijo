// Cliente.jsx
import React, { useState, useEffect } from "react";
import "./Cliente.css";
import axios from "axios";
import { X } from "lucide-react";

const URLAPI = import.meta.env.VITE_URLAPI;

export default function Cliente({
  onClose,
  clienteId,
  modo,
  setUsuario,
  infoPedido,
}) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    doc: "",
    nombre: "",
    dire: "",
    tel: "",
    mail: "",
    clave: "",
  });
  const [docBloqueado, setDocBloqueado] = useState(false);
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
        const { data } = await axios.get(`${URLAPI}/api/clie/id/${clienteId}`);
        setForm({
          doc: data.doc || "",
          nombre: data.nombre || "",
          dire:
            modo === "venta" && infoPedido
              ? infoPedido.direccion
              : data.dire || "",
          tel: data.tel || "",
          mail: data.mail || "",
          clave: "",
        });
        setDocBloqueado(!!data.doc);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [clienteId, modo, infoPedido]);

  const validarTelefonoDisponible = async (tel) => {
    try {
      const { data } = await axios.get(`${URLAPI}/api/clie/${tel}`);
      if (data && data._id && data._id !== clienteId) return false;
      return true;
    } catch {
      return true;
    }
  };

  const validarMailDisponible = async (mail) => {
    try {
      const { data } = await axios.get(`${URLAPI}/api/clie/${mail}`);
      if (data && data._id && data._id !== clienteId) return false;
      return true;
    } catch {
      return true;
    }
  };

  const actualizar = async () => {
    setErrorMsg("");

    const { doc, nombre, dire, tel, mail, clave } = form;

    // -------------------------
    // VALIDACIONES MODO VENTA
    // -------------------------
    if (modo === "venta") {
      console.log(clave);

      if (!doc || doc.length < 5 || isNaN(doc))
        return setErrorMsg("Documento inválido");

      if (!nombre || nombre.trim().length < 8 || !nombre.includes(" "))
        return setErrorMsg("Nombre inválido");

      if (!dire || dire.length < 8) return setErrorMsg("Dirección inválida");

      if (!tel || tel.length !== 10 || isNaN(tel))
        return setErrorMsg("Teléfono inválido");

      if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail))
        return setErrorMsg("Correo inválido");

      if (clave && (clave.length !== 4 || isNaN(clave)))
        return setErrorMsg("Clave inválida");
    }

    // -----------------------------------------
    // SI NO HAY clienteId → COMPRA SIN LOGIN
    // NO llamar API, NO validar teléfono/mail en API
    // SOLO mostrar resumen y salir
    // -----------------------------------------
    if (!clienteId) {
      if (modo === "venta" && infoPedido) {
        const texto = `
          📦 PRODUCTOS:
          ${infoPedido.productos.join("\n")}

          📍 DIRECCIÓN:
          ${infoPedido.direccion}

          💳 PAGO:
          ${infoPedido.pago}

          💰 RESUMEN:
          Subtotal: ${infoPedido.subtotal}
          Envío: ${infoPedido.envio}
          Descuento: ${infoPedido.descuento}
          Cupón: ${infoPedido.cupon}
          Costo Transaccional: ${infoPedido.costoTrans}
          TOTAL A PAGAR: ${infoPedido.total}

          👤 CLIENTE:
          Documento: ${doc}
          Nombre: ${nombre}
          Teléfono: ${tel}
          Correo: ${mail}`;
        console.log(texto);
      }

      return; // ⛔ NO seguir
    }

    // -------------------------
    // VALIDACIONES EXTERNAS — SOLO si HAY clienteId
    // -------------------------
    if (clienteId) {
      // validar teléfono
      if (tel) {
        if (tel.length !== 10)
          return setErrorMsg("El teléfono debe tener 10 dígitos");

        const dispTel = await validarTelefonoDisponible(tel);
        if (!dispTel) return setErrorMsg("El teléfono ya está registrado");
      }

      // validar correo
      if (mail) {
        const formato = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!formato.test(mail)) return setErrorMsg("Correo inválido");

        const dispMail = await validarMailDisponible(mail);
        if (!dispMail) return setErrorMsg("El correo ya está registrado");
      }
    }

    // -------------------------
    // ACTUALIZAR API — SOLO si hay clienteId
    // -------------------------
    try {
      const payload = [
        {
          _id: clienteId,
          doc,
          nombre,
          dire,
          tel,
          mail,
          ...(clave ? { clave } : {}), // 👈 SOLO SI EXISTE
        },
      ];

      await axios.put(`${URLAPI}/api/clie`, payload);

      const { data: actualizado } = await axios.get(
        `${URLAPI}/api/clie/id/${clienteId}`
      );

      setUsuario(actualizado);
      setErrorMsg("Actualizado correctamente");

      if (modo === "venta" && infoPedido) {
        const resumenCliente = {
          documento: doc,
          nombre,
          telefono: tel,
          correo: mail,
        };

        const texto = `
          Documento: ${doc}
          Nombre: ${nombre}
          dirección: ${infoPedido.direccion}
          Teléfono: ${tel}
          Correo: ${mail}
          Clave: ${clave} 
          productos: ${infoPedido.productos.join("\n")}
          subtotal: ${infoPedido.subtotal}
          medio pago: ${infoPedido.pago}
          costoTrans: ${infoPedido.costoTrans}
          cupon: ${infoPedido.cupon}
          descuento: ${infoPedido.descuento}
          envio: ${infoPedido.envio}
          total a pagar: ${infoPedido.total}




          
          `;
        console.log(texto);
      }
    } catch (e) {
      setErrorMsg("Error al actualizar");
    }
  };

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
              placeholder="****" // 👈 SOLO VISUAL
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setForm({ ...form, clave: val });
              }}
            />
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
    </div>
  );
}
