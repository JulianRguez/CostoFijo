// HojaVida.jsx
import React, { useState } from "react";
import "./HojaVida.css";

export default function HojaVida({ onGenerarPDF }) {
  // Datos básicos
  const [documento, setDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [profesion, setProfesion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [telefono2, setTelefono2] = useState("");
  const [correo, setCorreo] = useState("");
  const [nacionalidad, setNacionalidad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [perfil, setPerfil] = useState("");

  // Herramientas
  const [herramienta, setHerramienta] = useState("");
  const [herramientas, setHerramientas] = useState([]);

  // Idiomas
  const [idioma, setIdioma] = useState("");
  const [nivel, setNivel] = useState("A1 (Principiante)");
  const [idiomas, setIdiomas] = useState([]);

  // Estudios
  const [institucion, setInstitucion] = useState("");
  const [titulo, setTitulo] = useState("");
  const [anio, setAnio] = useState("");
  const [estudios, setEstudios] = useState([]);

  // Experiencia laboral
  const [empresa, setEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [meses, setMeses] = useState("");
  const [contacto, setContacto] = useState("");
  const [experiencias, setExperiencias] = useState([]);

  // Referencias
  const [refNombre, setRefNombre] = useState("");
  const [refProfesion, setRefProfesion] = useState("");
  const [refTipo, setRefTipo] = useState("Personal");
  const [refContacto, setRefContacto] = useState("");
  const [referencias, setReferencias] = useState([]);

  // Imagen
  const [imagenFile, setImagenFile] = useState(null);

  // Validaciones
  const validDocumento = documento.length >= 4 && documento.length <= 12;
  const validNombre = nombre.length >= 6 && nombre.length <= 32;
  const validProfesion = profesion.length >= 6 && profesion.length <= 32;
  const validTelefono = telefono.length >= 5 && telefono.length <= 15;
  const validTelefono2 = telefono2.length >= 5 && telefono2.length <= 25;
  const validCorreo = correo.length >= 5 && correo.length <= 25;
  const validNacionalidad =
    nacionalidad.length >= 5 && nacionalidad.length <= 25;
  const validDireccion = direccion.length >= 5 && direccion.length <= 25;
  const validMunicipio = municipio.length >= 5 && municipio.length <= 25;
  const validDepartamento =
    departamento.length >= 5 && departamento.length <= 25;
  const validPerfil = perfil.length >= 100 && perfil.length <= 400;

  // Habilitar botón PDF
  const habilitarPDF =
    validDocumento &&
    validNombre &&
    validProfesion &&
    validTelefono &&
    validTelefono2 &&
    validCorreo &&
    validNacionalidad &&
    validDireccion &&
    validMunicipio &&
    validDepartamento &&
    validPerfil &&
    idiomas.length > 0 &&
    estudios.length > 0 &&
    experiencias.length > 0;

  // Handlers
  const agregarHerramienta = () => {
    if (
      herramienta.length >= 3 &&
      herramienta.length <= 20 &&
      herramientas.length < 8
    ) {
      setHerramientas([...herramientas, herramienta]);
      setHerramienta("");
    }
  };
  const limpiarHerramientas = () => setHerramientas([]);

  const agregarIdioma = () => {
    if (idioma.length >= 3 && idioma.length <= 12 && idiomas.length < 3) {
      setIdiomas([...idiomas, { nombre: idioma, nivel }]);
      setIdioma("");
      setNivel("A1 (Principiante)");
    }
  };
  const eliminarIdioma = (i) => {
    const arr = [...idiomas];
    arr.splice(i, 1);
    setIdiomas(arr);
  };

  const agregarEstudio = () => {
    const anioActual = new Date().getFullYear();
    if (
      institucion.length >= 6 &&
      institucion.length <= 32 &&
      titulo.length >= 6 &&
      titulo.length <= 32 &&
      /^\d{4}$/.test(anio) &&
      parseInt(anio) <= anioActual &&
      estudios.length < 5
    ) {
      setEstudios([...estudios, { institucion, titulo, anio }]);
      setInstitucion("");
      setTitulo("");
      setAnio("");
    }
  };
  const eliminarEstudio = (i) => {
    const arr = [...estudios];
    arr.splice(i, 1);
    setEstudios(arr);
  };

  const agregarExperiencia = () => {
    if (
      empresa.length >= 6 &&
      empresa.length <= 30 &&
      cargo.length >= 6 &&
      cargo.length <= 15 &&
      parseInt(meses) > 1 &&
      parseInt(meses) < 300 &&
      contacto.length >= 4 &&
      contacto.length <= 15 &&
      experiencias.length < 5
    ) {
      setExperiencias([...experiencias, { empresa, cargo, meses, contacto }]);
      setEmpresa("");
      setCargo("");
      setMeses("");
      setContacto("");
    }
  };
  const eliminarExperiencia = (i) => {
    const arr = [...experiencias];
    arr.splice(i, 1);
    setExperiencias(arr);
  };

  const agregarReferencia = () => {
    if (
      refNombre.length >= 6 &&
      refNombre.length <= 30 &&
      refProfesion.length >= 4 &&
      refProfesion.length <= 20 &&
      refContacto.length >= 5 &&
      refContacto.length <= 15 &&
      referencias.length < 5
    ) {
      setReferencias([
        ...referencias,
        { refNombre, refProfesion, refTipo, refContacto },
      ]);
      setRefNombre("");
      setRefProfesion("");
      setRefTipo("Personal");
      setRefContacto("");
    }
  };
  const eliminarReferencia = (i) => {
    const arr = [...referencias];
    arr.splice(i, 1);
    setReferencias(arr);
  };

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImagenFile(file);
    }
  };

  const handleLimpiar = () => {
    setDocumento("");
    setNombre("");
    setProfesion("");
    setTelefono("");
    setTelefono2("");
    setCorreo("");
    setNacionalidad("");
    setDireccion("");
    setMunicipio("");
    setDepartamento("");
    setPerfil("");
    setHerramienta("");
    setHerramientas([]);
    setIdioma("");
    setNivel("A1 (Principiante)");
    setIdiomas([]);
    setInstitucion("");
    setTitulo("");
    setAnio("");
    setEstudios([]);
    setEmpresa("");
    setCargo("");
    setMeses("");
    setContacto("");
    setExperiencias([]);
    setRefNombre("");
    setRefProfesion("");
    setRefTipo("Personal");
    setRefContacto("");
    setReferencias([]);
    setImagenFile(null);
  };

  const handleGenerarPDF = () => {
    const datos = {
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
    };
    onGenerarPDF(datos);
  };

  return (
    <div className="hoja-vida-container">
      <h2 className="titulo-hoja-vida">Datos para crear hoja de vida</h2>

      {/* Datos básicos */}
      <div className="grid-hoja-vida">
        <div className="campo">
          <label>Documento</label>
          <input
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />
        </div>
        <div className="campo">
          <label>Nombre completo</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="campo">
          <label>Profesión</label>
          <input
            value={profesion}
            onChange={(e) => setProfesion(e.target.value)}
          />
        </div>
        <div className="campo">
          <label>Teléfono</label>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
        <div className="campo">
          <label>Teléfono 2</label>
          <input
            value={telefono2}
            onChange={(e) => setTelefono2(e.target.value)}
          />
        </div>
      </div>

      {/* Fila adicional */}
      <div className="grid-hoja-vida" style={{ marginTop: "14px" }}>
        <div className="campo">
          <label>Correo electrónico</label>
          <input value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </div>
        <div className="campo">
          <label>Nacionalidad</label>
          <input
            value={nacionalidad}
            onChange={(e) => setNacionalidad(e.target.value)}
          />
        </div>
        <div className="campo">
          <label>Dirección</label>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
          />
        </div>
        <div className="campo">
          <label>Municipio</label>
          <input
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
          />
        </div>
        <div className="campo">
          <label>Departamento</label>
          <input
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
          />
        </div>
      </div>

      {/* Herramientas */}
      <div className="seccion">
        <h3>Herramientas tecnológicas</h3>
        <div className="fila-agregar">
          <input
            value={herramienta}
            onChange={(e) => setHerramienta(e.target.value)}
          />
          <button className="btn-verde" onClick={agregarHerramienta}>
            Agregar
          </button>
          <button className="btn-gris" onClick={limpiarHerramientas}>
            Limpiar
          </button>
        </div>
        <div className="lista">{herramientas.join(", ")}</div>
      </div>

      {/* Idiomas */}
      <div className="seccion">
        <h3>Idiomas</h3>
        <div className="fila-agregar">
          <input value={idioma} onChange={(e) => setIdioma(e.target.value)} />
          <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
            <option>A1 (Principiante)</option>
            <option>A2 (Básico)</option>
            <option>B1 (Intermedio)</option>
            <option>B2 (Intermedio Alto)</option>
            <option>C1 (Avanzado)</option>
            <option>C2 (Experto)</option>
          </select>
          <button className="btn-verde" onClick={agregarIdioma}>
            Agregar
          </button>
        </div>
        <div className="lista">
          {idiomas.map((it, i) => (
            <div key={i}>
              {it.nombre} — {it.nivel}
              <span className="x" onClick={() => eliminarIdioma(i)}>
                ✕
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Estudios */}
      <div className="seccion">
        <h3>Estudios realizados</h3>
        <div className="fila-agregar">
          <input
            placeholder="Institución"
            value={institucion}
            onChange={(e) => setInstitucion(e.target.value)}
          />
          <input
            placeholder="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <input
            placeholder="Año"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
          />
          <button className="btn-verde" onClick={agregarEstudio}>
            Agregar
          </button>
        </div>
        <div className="lista">
          {estudios.map((it, i) => (
            <div key={i}>
              {it.institucion} — {it.titulo} — {it.anio}
              <span className="x" onClick={() => eliminarEstudio(i)}>
                ✕
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Experiencia */}
      <div className="seccion">
        <h3>Experiencia laboral</h3>
        <div className="fila-agregar">
          <input
            placeholder="Empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          />
          <input
            placeholder="Cargo"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
          />
          <input
            placeholder="Meses"
            value={meses}
            onChange={(e) => setMeses(e.target.value)}
          />
          <input
            placeholder="Contacto"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
          />
          <button className="btn-verde" onClick={agregarExperiencia}>
            Agregar
          </button>
        </div>
        <div className="lista">
          {experiencias.map((it, i) => (
            <div key={i}>
              {it.empresa} — {it.cargo} — {it.meses} meses — {it.contacto}
              <span className="x" onClick={() => eliminarExperiencia(i)}>
                ✕
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Referencias */}
      <div className="seccion">
        <h3>Referencias</h3>
        <div className="fila-agregar">
          <input
            placeholder="Nombre"
            value={refNombre}
            onChange={(e) => setRefNombre(e.target.value)}
          />
          <input
            placeholder="Profesión"
            value={refProfesion}
            onChange={(e) => setRefProfesion(e.target.value)}
          />
          <select value={refTipo} onChange={(e) => setRefTipo(e.target.value)}>
            <option>Personal</option>
            <option>Laboral</option>
          </select>
          <input
            placeholder="Contacto"
            value={refContacto}
            onChange={(e) => setRefContacto(e.target.value)}
          />
          <button className="btn-verde" onClick={agregarReferencia}>
            Agregar
          </button>
        </div>
        <div className="lista">
          {referencias.map((it, i) => (
            <div key={i}>
              {it.refNombre} — {it.refProfesion} — {it.refTipo} —{" "}
              {it.refContacto}
              <span className="x" onClick={() => eliminarReferencia(i)}>
                ✕
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Perfil */}
      <div className="seccion">
        <h3>Perfil profesional</h3>
        <textarea
          value={perfil}
          onChange={(e) => setPerfil(e.target.value)}
          rows={5}
        ></textarea>
      </div>

      {/* Imagen */}
      <div className="seccion">
        <h3>Cargar imagen medio cuerpo</h3>
        <input type="file" accept="image/*" onChange={handleImagen} />
        <span>
          {imagenFile
            ? imagenFile.name.length > 10
              ? imagenFile.name.substring(0, 10) + "..."
              : imagenFile.name
            : "Sin imagen"}
        </span>
      </div>

      {/* Botones finales */}
      <div className="acciones-finales">
        <button
          className="btn-verde"
          disabled={!habilitarPDF}
          onClick={handleGenerarPDF}
        >
          Generar PDF
        </button>
        <button className="btn-gris" onClick={handleLimpiar}>
          Limpiar
        </button>
      </div>
    </div>
  );
}
