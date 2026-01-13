import React, { useEffect, useState, useMemo } from "react";
import "./Info.css";

export default function Info() {
  const fechaActual = new Date();
  const [mes, setMes] = useState(fechaActual.getMonth() + 1);
  const [anio, setAnio] = useState(fechaActual.getFullYear());

  const [creditos, setCreditos] = useState([]);
  const [compras, setCompras] = useState([]);

  const [resumenVentas, setResumenVentas] = useState({
    ingresosPorEtiqueta: {},
    totalIngresos: 0,
  });

  const [loading, setLoading] = useState(true);

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resCred, resComp, resResumen] = await Promise.all([
          fetch(`/api/cred`),
          fetch(`/api/comp`),
          fetch(`/api/vent/resumen?mes=${mes}&anio=${anio}`),
        ]);

        const dataCred = await resCred.json();
        const dataComp = await resComp.json();
        const dataResumen = await resResumen.json();

        setCreditos(dataCred);
        setCompras(dataComp);
        setResumenVentas(dataResumen);
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mes, anio]);

  // 🎯 Calcular cuentas por cobrar
  const calcularCreditos = () => {
    return creditos
      .filter((c) => c.pagado === false)
      .reduce((acc, c) => acc + c.monto, 0);
  };

  // 🎯 Calcular total gastos
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

  const totalCreditos = useMemo(() => calcularCreditos(), [creditos]);
  const totalGastos = useMemo(() => calcularGastos(), [compras, mes, anio]);

  return (
    <div className="info-container">
      <div className="filtros">
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
          {meses.map((m, i) => (
            <option key={i} value={i + 1}>
              {m}
            </option>
          ))}
        </select>

        <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>

      <h2 className="titulo-principal">
        Ingresos del mes de {meses[mes - 1]} del año {anio}
      </h2>

      {loading ? (
        <p className="loading">Cargando información...</p>
      ) : (
        <>
          {/* Bloque de ingresos */}
          <div className="cards-grid">
            {categoriasIngresos.map((cat, idx) => (
              <div key={idx} className="card">
                <h3>{cat.titulo}</h3>
                <p>
                  $
                  {(
                    resumenVentas.ingresosPorEtiqueta?.[cat.etiqueta] || 0
                  ).toLocaleString()}
                </p>
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
              <p>${(resumenVentas.totalIngresos || 0).toLocaleString()}</p>
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
