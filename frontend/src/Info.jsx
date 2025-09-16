import React, { useEffect, useState } from "react";
import "./Info.css";

const URLAPI = import.meta.env.VITE_URLAPI;

export default function Info() {
  const fechaActual = new Date();
  const [mes, setMes] = useState(fechaActual.getMonth() + 1);
  const [anio, setAnio] = useState(fechaActual.getFullYear());
  const [ventas, setVentas] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resVent, resCred, resComp] = await Promise.all([
          fetch(`${URLAPI}/api/vent`),
          fetch(`${URLAPI}/api/cred`),
          fetch(`${URLAPI}/api/comp`)
        ]);
        const dataVent = await resVent.json();
        const dataCred = await resCred.json();
        const dataComp = await resComp.json();
        setVentas(dataVent);
        setCreditos(dataCred);
        setCompras(dataComp);
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🎯 Función para calcular totales de ingresos por etiqueta y periodo
  const calcularTotal = (etiqueta) => {
    return ventas
      .filter((v) => {
        const fecha = new Date(v.fecha);
        return (
          fecha.getMonth() + 1 === mes &&
          fecha.getFullYear() === anio &&
          v.etiqueta?.toLowerCase() === etiqueta.toLowerCase()
        );
      })
      .reduce((acc, v) => acc + v.valor * v.cantidad, 0);
  };

  // 🎯 Calcular cuentas por cobrar
  const calcularCreditos = () => {
    return creditos
      .filter((c) => c.pagado === false)
      .reduce((acc, c) => acc + c.monto, 0);
  };

  // 🎯 Calcular total gastos (usa registro en lugar de etiqueta)
  const calcularGastos = () => {
    return compras
      .filter((c) => {
        const fecha = new Date(c.fecha);
        return (
          fecha.getMonth() + 1 === mes &&
          fecha.getFullYear() === anio &&
          c.registro?.toLowerCase() === "gastos"
        );
      })
      .reduce((acc, c) => acc + c.valor * c.cantidad, 0);
  };

  // 🎯 Definición de las categorías de ingresos
  const categoriasIngresos = [
    { titulo: "Papelería y varios", etiqueta: "Papeleria" },
    { titulo: "Celulares y accesorios", etiqueta: "Celulares y accesorios" },
    { titulo: "Fotocopias y trámites", etiqueta: "Servicios papeleria" },
    { titulo: "Electrodomésticos y hogar", etiqueta: "Hogar" },
    { titulo: "Servicio técnico", etiqueta: "Tecnico" },
    { titulo: "Cámaras y seguridad", etiqueta: "Vigilancia" },
    { titulo: "Redes y datos", etiqueta: "Redes y datos" },
    { titulo: "Cargo mensual", etiqueta: "Cargo Mensual" },
  ];

  // 🎯 Totales
  const totalIngresos = categoriasIngresos.reduce(
    (acc, cat) => acc + calcularTotal(cat.etiqueta),
    0
  );
  const totalCreditos = calcularCreditos();
  const totalGastos = calcularGastos();

  return (
    <div className="info-container">
      <h2 className="titulo-principal">
        Ingresos del mes de {meses[mes - 1]} del año {anio}
      </h2>

      <div className="filtros">
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
          {meses.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>

        <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>

      {loading ? (
        <p className="loading">Cargando información...</p>
      ) : (
        <>
          {/* Bloque de ingresos */}
          <div className="cards-grid">
            {categoriasIngresos.map((cat, idx) => (
              <div key={idx} className="card">
                <h3>{cat.titulo}</h3>
                <p>${calcularTotal(cat.etiqueta).toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Bloque de otros registros */}
          <h2 className="titulo-principal">Otros registros</h2>
          <div className="cards-grid">
            <div className="card">
              <h3>Cuentas por cobrar</h3>
              <p>${totalCreditos.toLocaleString()}</p>
            </div>
            <div className="card">
              <h3>Total Ingresos</h3>
              <p>${totalIngresos.toLocaleString()}</p>
            </div>
            <div className="card">
              <h3>Total Gastos</h3>
              <p>${totalGastos.toLocaleString()}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
