import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Clientes.css";
import { Eye, EyeOff } from "lucide-react";

export default function Clientes() {
  const URLAPI = import.meta.env.VITE_URLAPI;
  const [clientes, setClientes] = useState([]);
  const [filtroDoc, setFiltroDoc] = useState("");
  const [busquedaAbono, setBusquedaAbono] = useState("");
  const [clienteAbono, setClienteAbono] = useState(null);
  const [creditos, setCreditos] = useState([]);
  const [creditoSel, setCreditoSel] = useState("");
  const [valorAbono, setValorAbono] = useState("");
  const [mostrarClave, setMostrarClave] = useState({});
  const [cargando, setCargando] = useState(false);

  // Crear cliente
  const [newDoc, setNewDoc] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [newDire, setNewDire] = useState("");
  const [newTel, setNewTel] = useState("");
  const [newMail, setNewMail] = useState("");

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const res = await axios.get(`${URLAPI}/api/clie`);
      setClientes(res.data);
    } catch (err) {
      console.error("Error al cargar clientes", err);
    }
  };

  // Solo mostrar clientes cuyo doc NO empieza con X
  const clientesFiltrados = clientes.filter((c) => {
    if (!c.doc || c.doc.startsWith("X")) return false; // ocultar eliminados
    if (!filtroDoc.trim()) return true; // si no hay búsqueda, mostrar todos
    return String(c.doc).trim() === filtroDoc.trim(); // coincidencia exacta
  });

  // Buscar cliente (debounce)
  useEffect(() => {
    if (!busquedaAbono.trim()) {
      setClienteAbono(null);
      setCreditos([]);
      return;
    }
    const t = setTimeout(() => buscarClienteAbono(busquedaAbono), 500);
    return () => clearTimeout(t);
  }, [busquedaAbono]);

  const buscarClienteAbono = async (doc) => {
    try {
      const res = await axios.get(`${URLAPI}/api/clie/cc/${doc}`);
      const cliente = res.data;
      const creditosConNombre = await Promise.all(
        cliente.porpagar.map(async (p) => {
          try {
            const prodRes = await axios.get(`${URLAPI}/api/prod/${p.producto}`);
            return { ...p, nombreProd: prodRes.data.nombre };
          } catch {
            return { ...p, nombreProd: "Producto desconocido" };
          }
        })
      );
      setClienteAbono(cliente);
      setCreditos(creditosConNombre);
    } catch {
      setClienteAbono(null);
      setCreditos([]);
    }
  };

  const registrarAbono = async () => {
    try {
      if (!clienteAbono)
        return alert("Primero busque un cliente válido por documento.");
      if (!creditoSel) return alert("Debe seleccionar un crédito.");

      const valorNum = Number(valorAbono);
      if (isNaN(valorNum) || valorNum <= 0)
        return alert("Ingrese un valor de abono válido.");

      const credito = creditos.find((c) => c.producto === creditoSel);
      if (!credito) return alert("Crédito no encontrado.");

      const nuevoValor = credito.valor - valorNum;
      if (nuevoValor < 0)
        return alert(
          "El valor del abono no puede superar el saldo del crédito."
        );

      const nuevoAbono = { fecha: new Date().toISOString(), valor: valorNum };

      // Buscar el cliente completo para obtener todos los campos
      const clienteCompleto = clientes.find((c) => c._id === clienteAbono._id);

      // Reconstruir porpagar completo con todos los campos necesarios
      const porpagarActualizado = clienteCompleto.porpagar.map((p) => {
        if (p.producto === creditoSel) {
          return {
            producto: p.producto,
            diaCredito: p.diaCredito,
            proxPago: p.proxPago,
            valor: nuevoValor,
            clave: p.clave,
            abonos: [...(p.abonos || []), nuevoAbono],
          };
        }
        return {
          producto: p.producto,
          diaCredito: p.diaCredito,
          proxPago: p.proxPago,
          valor: p.valor,
          clave: p.clave,
          abonos: p.abonos || [],
        };
      });

      const payload = [
        { _id: clienteCompleto._id, porpagar: porpagarActualizado },
      ];

      await axios.put(`${URLAPI}/api/clie`, payload);

      await cargarClientes();
      setBusquedaAbono("");
      setClienteAbono(null);
      setCreditoSel("");
      setValorAbono("");

      alert("✅ Abono registrado correctamente.");
    } catch (err) {
      console.error(
        "Error registrando abono:",
        err.response?.data || err.message
      );
      alert("❌ No se pudo registrar el abono. Revise la consola.");
    }
  };

  const docExiste = (doc) =>
    clientes.some((c) => String(c.doc) === String(doc));
  const puedeCrearCliente =
    newDoc.trim() &&
    !docExiste(newDoc) &&
    newNombre.trim().length >= 6 &&
    newTel.trim().length >= 6;

  const crearCliente = async () => {
    if (!puedeCrearCliente) return;
    const payload = {
      doc: newDoc.trim(),
      nombre: newNombre.trim().toUpperCase(),
      dire: newDire.trim(),
      tel: newTel.trim(),
      mail: newMail.trim(),
    };
    try {
      await axios.post(`${URLAPI}/api/clie`, payload);
      await cargarClientes();
      setNewDoc("");
      setNewNombre("");
      setNewDire("");
      setNewTel("");
      setNewMail("");
    } catch (err) {
      console.error("Error creando cliente", err);
    }
  };

  // Eliminación lógica: cambia doc a X<doc>
  const eliminarCliente = async (id) => {
    try {
      const cliente = clientes.find((c) => c._id === id);
      if (!cliente) return;
      const nuevoDoc = cliente.doc.startsWith("X")
        ? cliente.doc
        : `X${cliente.doc}`;
      await axios.put(`${URLAPI}/api/clie`, [
        { _id: id, doc: nuevoDoc, porpagar: cliente.porpagar },
      ]);
      await cargarClientes();
    } catch (err) {
      console.error("Error marcando cliente como eliminado", err);
    }
  };

  const eliminarCredito = async (clienteId, productoId, indexCredito) => {
    try {
      const cliente = clientes.find((c) => c._id === clienteId);
      if (!cliente) return;

      // Filtrar por índice (posición exacta)
      const nuevos = cliente.porpagar.filter((_, idx) => idx !== indexCredito);

      const payload = [
        {
          _id: clienteId,
          porpagar: nuevos.map((p) => ({
            producto: p.producto,
            diaCredito: p.diaCredito,
            proxPago: p.proxPago,
            valor: p.valor,
            clave: p.clave || "1234",
            abonos: p.abonos || [],
          })),
        },
      ];

      await axios.put(`${URLAPI}/api/clie`, payload);
      await cargarClientes();
    } catch (err) {
      console.error("Error eliminando crédito:", err);
    }
  };

  const eliminarAbono = async (clienteId, productoId, fecha) => {
    try {
      const cliente = clientes.find((c) => c._id === clienteId);
      const nuevos = cliente.porpagar.map((p) =>
        p.producto === productoId
          ? { ...p, abonos: p.abonos.filter((a) => a.fecha !== fecha) }
          : p
      );
      await axios.put(`${URLAPI}/api/clie`, [
        { _id: clienteId, porpagar: nuevos },
      ]);
      cargarClientes();
    } catch (err) {
      console.error("Error eliminando abono", err);
    }
  };

  return (
    <div className="clientes-contenedor">
      <h2 className="titulo-clientes">Clientes</h2>

      <div className="filtro-clientes">
        <input
          type="text"
          placeholder="Buscar cliente por documento..."
          value={filtroDoc}
          onChange={(e) => setFiltroDoc(e.target.value)}
          className="input-filtro"
          maxLength={32}
        />
      </div>

      {/* LISTA CON SCROLL CONTROLADO */}
      <div className="lista-clientes-scroll">
        {clientesFiltrados.map((c) => (
          <div key={c._id} className="card-cliente">
            <div className="cliente-header">
              <div className="cliente-info-linea">
                <div className="cliente-info">
                  <h3 className="cliente-nombre">{c.nombre}</h3>
                  <span>{c.doc}</span>
                  <span>{c.dire}</span>
                  <span>{c.tel}</span>
                  <span>{c.mail}</span>
                  <span>
                    {mostrarClave[c._id]
                      ? c.clave?.length
                        ? c.clave
                        : "Sin clave"
                      : "******"}
                    {mostrarClave[c._id] ? (
                      <EyeOff
                        className="icono-ver"
                        onClick={() =>
                          setMostrarClave({ ...mostrarClave, [c._id]: false })
                        }
                      />
                    ) : (
                      <Eye
                        className="icono-ver"
                        onClick={() =>
                          setMostrarClave({ ...mostrarClave, [c._id]: true })
                        }
                      />
                    )}
                  </span>
                </div>
              </div>

              <button
                className="btn-eliminar"
                onClick={() => eliminarCliente(c._id)}
              >
                ✖
              </button>
            </div>

            {c.porpagar.map((p, i) => (
              <div key={i} className="credito-card">
                <div className="credito-linea">
                  <button
                    className="btn-eliminar"
                    onClick={() => eliminarCredito(c._id, p.producto, i)}
                  >
                    ✖
                  </button>
                  <span className="credito-text">
                    Crédito realizado el{" "}
                    {new Date(p.proxPago || p.diaCredito).toLocaleDateString()}{" "}
                    por ${p.valor}
                  </span>

                  {p.abonos?.map((a, idx) => (
                    <span key={idx} className="abono-item">
                      <button
                        className="btn-x"
                        onClick={() =>
                          eliminarAbono(c._id, p.producto, a.fecha)
                        }
                      >
                        ✖
                      </button>
                      Abono de ${a.valor} el{" "}
                      {new Date(a.fecha).toLocaleDateString()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* CLIENTE NUEVO */}
      <div className="cliente-nuevo-linea">
        <div className="cliente-nuevo-titulo">Cliente nuevo</div>
        <div className="cliente-nuevo-campos">
          <input
            type="text"
            placeholder="Documento"
            value={newDoc}
            onChange={(e) => setNewDoc(e.target.value)}
          />
          <input
            type="text"
            placeholder="Nombre"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
          />
          <input
            type="text"
            placeholder="Dirección"
            value={newDire}
            onChange={(e) => setNewDire(e.target.value)}
          />
          <input
            type="text"
            placeholder="Teléfono"
            value={newTel}
            onChange={(e) => setNewTel(e.target.value)}
          />
          <input
            type="email"
            placeholder="Mail"
            value={newMail}
            onChange={(e) => setNewMail(e.target.value)}
          />
          <button
            className="btn-crear-cliente"
            onClick={crearCliente}
            disabled={!puedeCrearCliente}
          >
            Crear Cliente
          </button>
        </div>
      </div>

      {/* REGISTRAR ABONO */}
      <div className="bottom-bar">
        <div className="fila-abono-bottom">
          <span className="titulo-abono">Registrar abono</span>
          <input
            type="text"
            placeholder="Documento del cliente"
            value={busquedaAbono}
            onChange={(e) => setBusquedaAbono(e.target.value)}
          />
          <select
            value={creditoSel}
            onChange={(e) => setCreditoSel(e.target.value)}
          >
            <option value="">Seleccionar crédito</option>
            {creditos.map((c, i) => (
              <option key={i} value={c.producto}>
                {c.nombreProd} — ${c.valor}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Valor del abono"
            value={valorAbono}
            onChange={(e) => setValorAbono(e.target.value)}
          />
          <button className="btn-registrar" onClick={registrarAbono}>
            Registrar Abono
          </button>
        </div>
      </div>
    </div>
  );
}
