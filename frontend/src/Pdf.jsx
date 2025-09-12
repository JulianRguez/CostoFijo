import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Pdf.css";

export default function Pdf({ datos, onRegresar }) {
  const contRef = useRef();

  const handleDescargar = async () => {
    const input = contRef.current;
    if (!input) return;
    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "letter");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
      pdf.save("hoja_de_vida.pdf");
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("No se pudo generar el PDF.");
    }
  };

  const {
    documento,
    nombre,
    profesion,
    telefono,
    telefono2,
    correo,
    nacionalidad,
    direccion,
    municipio,
    departamento,
    perfil,
    herramientas,
    idiomas,
    estudios,
    experiencias,
    referencias,
    imagenFile,
  } = datos;

  const imagenURL = imagenFile ? URL.createObjectURL(imagenFile) : null;

  return (
    <div className="pdf-wrapper">
      <div className="pdf-layout" ref={contRef}>
        {/* Sidebar izquierda */}
        <div className="sidebar">
          {imagenURL ? (
            <img src={imagenURL} alt="Foto" />
          ) : (
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                marginBottom: "20px",
              }}
            >
              Sin foto
            </div>
          )}

          <h2>{nombre}</h2>
          <h4>{profesion}</h4>

          <div className="sidebar-section">
            <h3>Contacto</h3>
            <p>📞 {telefono}</p>
            <p>📞 {telefono2}</p>
            <p>📧 {correo}</p>
            <p>🌎 {nacionalidad}</p>
            <p>🏠 {direccion}</p>
            <p>🏙️ {municipio}</p>
            <p>🗺️ {departamento}</p>
            <p>🆔 {documento}</p>
          </div>

          {herramientas && herramientas.length > 0 && (
            <div className="sidebar-section">
              <h3>Habilidades</h3>
              <div>{herramientas.join(", ")}</div>
            </div>
          )}

          {idiomas && idiomas.length > 0 && (
            <div className="sidebar-section">
              <h3>Idiomas</h3>
              {idiomas.map((it, i) => (
                <div key={i}>
                  {it.nombre} — {it.nivel}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contenido derecha */}
        <div className="content">
          <div className="content-section">
            <h3>Sobre mí</h3>
            <p>{perfil}</p>
          </div>

          <div className="content-section">
            <h3>Experiencia laboral</h3>
            {experiencias && experiencias.length > 0 ? (
              experiencias.map((it, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <strong>{it.empresa}</strong> — {it.cargo} ({it.meses} meses)
                  <br />
                  <span style={{ fontSize: "12px", color: "#555" }}>
                    Contacto: {it.contacto}
                  </span>
                </div>
              ))
            ) : (
              <p>No se registraron experiencias.</p>
            )}
          </div>

          <div className="content-section">
            <h3>Formación académica</h3>
            {estudios && estudios.length > 0 ? (
              estudios.map((it, i) => (
                <div key={i} style={{ marginBottom: "6px" }}>
                  {it.anio} — <strong>{it.titulo}</strong> <br />
                  <span style={{ fontSize: "12px", color: "#555" }}>
                    {it.institucion}
                  </span>
                </div>
              ))
            ) : (
              <p>No se registraron estudios.</p>
            )}
          </div>

          <div className="content-section">
            <h3>Referencias</h3>
            {referencias && referencias.length > 0 ? (
              referencias.map((it, i) => (
                <div key={i} style={{ marginBottom: "6px" }}>
                  <strong>{it.refNombre}</strong> — {it.refProfesion} (
                  {it.refTipo})
                  <br />
                  <span style={{ fontSize: "12px", color: "#555" }}>
                    Contacto: {it.refContacto}
                  </span>
                </div>
              ))
            ) : (
              <p>No se registraron referencias.</p>
            )}
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="pdf-buttons">
        <button onClick={handleDescargar} className="btn-action">
          Descargar PDF
        </button>
        <button onClick={onRegresar} className="btn-action btn-secondary">
          Regresar
        </button>
      </div>
    </div>
  );
}
