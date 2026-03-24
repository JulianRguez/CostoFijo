// useRules2.jsx
import { useState, useEffect, useMemo } from "react";
import { Cable } from "lucide-react";

export function useRules(userName, nota) {
  const [productos, setProductos] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [qtyTemp, setQtyTemp] = useState({});

  const [canalesSel, setCanalesSel] = useState(null);
  const [resSel, setResSel] = useState(null);
  const [grabadorSel, setGrabadorSel] = useState(null);
  const [formatoSel, setFormatoSel] = useState(null);
  const [audioSel, setAudioSel] = useState(null);
  const [usoSel, setUsoSel] = useState(null);

  useEffect(() => {
    fetch("/api/prod?etiqueta=Vigilancia")
      .then((r) => r.json())
      .then(setProductos);
  }, []);
  function limpiarNombre(nombre) {
    return nombre.replace(/CMR\d{0,2}$/, "").trim();
  }
  function precioFinal(prod) {
    const match = prod.nombre.match(/CMR(\d{2})$/);
    if (!match) return prod.precio;
    const desc = Number(match[1]);
    return Math.round(prod.precio * (1 - desc / 100));
  }
  function agregarArticulosQty() {
    const nuevos = Object.entries(qtyTemp)
      .filter(([id, c]) => c > 0)
      .map(([id, c]) => {
        const p = productos.find((x) => x._id === id);
        return {
          id,
          nombre: limpiarNombre(p.nombre),
          cantidad: c,
          precio: precioFinal(p),
        };
      });

    setArticulos((a) => [...a, ...nuevos]);
    setQtyTemp({});
  }
  const rules = useMemo(
    () => ({
      /* MENU CAMARAS */

      camMenu: {
        resp: () => (
          <div className="space-y-6">
            <p
              style={{
                margin: 0,
                fontWeight: "500",
                color: "#444",
              }}
            >
              A continuación se presentan los sistemas de videovigilancia más
              utilizados. Seleccione uno haciendo clic en los botones ubicados
              en la parte inferior del chat para comenzar a armar su paquete.
            </p>

            <br />

            {/* KIT NVR / XVR */}
            <div>
              <strong style={{ fontSize: "15px" }}>KIT NVR, XVR o DVR</strong>

              <div style={{ marginTop: "8px" }}>
                <img
                  src="https://res.cloudinary.com/ddjdox6b0/image/upload/v1771811916/1000-1002_jytcaf.png"
                  alt="Kit NVR XVR"
                  style={{
                    width: "80px",
                    borderRadius: "8px",
                    float: "left",
                    marginRight: "10px",
                    marginBottom: "6px",
                  }}
                />

                <p style={{ margin: 0 }}>
                  Es un sistema profesional de videovigilancia que utiliza un
                  grabador (NVR, XVR o DVR) central donde se conectan las
                  cámaras mediante cableado. Permite grabación continua 24/7 y
                  almacenamiento en disco duro para mayor seguridad y
                  estabilidad.
                </p>

                <div style={{ clear: "both" }} />
              </div>
            </div>

            <br />

            {/* KIT WIFI */}
            <div>
              <strong style={{ fontSize: "15px" }}>Kit CÁMARAS WIFI</strong>

              <div style={{ marginTop: "8px" }}>
                <img
                  src="https://res.cloudinary.com/ddjdox6b0/image/upload/v1771811918/1030-1031-1032_yft2rc.png"
                  alt="Kit Camaras WIFI"
                  style={{
                    width: "80px",
                    borderRadius: "8px",
                    float: "left",
                    marginRight: "10px",
                    marginBottom: "6px",
                  }}
                />

                <p style={{ margin: 0 }}>
                  Sistema inalámbrico que conecta las cámaras directamente a la
                  red WIFI del lugar. Son fáciles de instalar y permiten
                  grabación en tarjeta SD o almacenamiento en la nube.
                </p>

                <div style={{ clear: "both" }} />
              </div>
            </div>
          </div>
        ),

        options: [
          { label: "Kit NVR-XVR-DVR", next: "camPaso1" },
          { label: "Kit cámaras WIFI", next: "camWifi1" },
        ],
      },

      /* PUERTOS ANALOGOS */

      camPaso1: {
        resp: () => (
          <div className="flex items-center gap-2 font-semibold">
            <Cable size={30} color="orange" />{" "}
            <span>
              Seleccione la cantidad de puertos analógicos que debe tener el
              grabador. Cada puerto permite conectar una cámara mediante cable,
              por lo tanto esta cantidad corresponde al número máximo de cámaras
              cableadas que podrá instalar en el sistema.
            </span>
          </div>
        ),
        options: [
          ...new Set(
            productos
              .filter((p) => p.meta?.Categoria === "grabador")
              .map((p) => p.meta.CanalesAnalogos),
          ),
        ].map((c) => ({
          label: `Con ${c} puertos para cámaras`,
          next: "camPaso2",
          action: () => setCanalesSel(c),
        })),
      },

      /* RESOLUCION */

      camPaso2: {
        resp: () => (
          <div>
            <p>
              La resolución indica el nivel de detalle que puede capturar la
              cámara. Entre mayor sea el número de megapíxeles (MP), más nítida
              será la imagen.
            </p>
            <br />
            <a
              href="https://res.cloudinary.com/ddjdox6b0/image/upload/v1773025089/ResolucionMP_fv8loo.png"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://res.cloudinary.com/ddjdox6b0/image/upload/v1773025089/ResolucionMP_fv8loo.png"
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
                alt="Comparación de resoluciones de cámaras"
              />
            </a>
            <p>
              Seleccione la resolución que desea para el grabador, puede tomar
              la imagen como referencia (clic para ampliarla).
            </p>
          </div>
        ),
        options: [
          ...new Set(
            productos
              .filter((p) => p.meta?.Categoria === "grabador")
              .map((p) => p.meta.ResolucionMaxMP),
          ),
        ].map((r) => ({
          label: `Resolución máxima de ${r} MP`,
          action: () => {
            setResSel(r);
          },
          next: "camPaso3",
        })),
      },

      /* SELECCION GRABADOR */

      camPaso3: {
        resp: () => {
          const grabadores = productos.filter(
            (p) =>
              p.meta?.Categoria === "grabador" &&
              p.meta.CanalesAnalogos === canalesSel &&
              p.meta.ResolucionMaxMP === resSel,
          );

          return (
            <div>
              <span>
                {grabadores.length === 1
                  ? "Para las especificaciones seleccionadas solo tenemos disponible la siguiente referencia, haga clic en la opción para confirmar."
                  : "Para las especificaciones seleccionadas tenemos disponibles las siguientes referencias, haga clic en una opción para confirmar."}
              </span>

              {grabadores.map((g) => (
                <div
                  key={g._id}
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "12px",
                  }}
                >
                  <img
                    src={g.urlFoto1}
                    style={{ width: "80px", borderRadius: "8px" }}
                  />

                  <div>
                    <b>{limpiarNombre(g.nombre)}</b>

                    <p style={{ margin: 0 }}>
                      {g.meta.CanalesAnalogos} analógicos,
                      {g.meta.CanalesIP} IP
                      <span style={{ color: "orange", marginLeft: "6px" }}>
                        ${precioFinal(g).toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          );
        },

        options: productos
          .filter(
            (p) =>
              p.meta?.Categoria === "grabador" &&
              p.meta.CanalesAnalogos === canalesSel &&
              p.meta.ResolucionMaxMP === resSel,
          )
          .map((g) => ({
            label: limpiarNombre(g.nombre),
            next: "camFormato",
            action: () => {
              setGrabadorSel(g);

              setArticulos((a) => [
                ...a,
                {
                  id: g._id,
                  nombre: limpiarNombre(g.nombre),
                  cantidad: 1,
                  precio: precioFinal(g),
                },
              ]);
            },
          })),
      },

      /*FORMATO*/
      camFormato: {
        resp: () =>
          "Seleccione las características para la primera cámara o grupo de cámaras. Si necesita agregar alguna con características diferentes, podrá hacerlo más adelante en este chat.",

        options: [
          ...new Set(
            productos
              .filter(
                (p) =>
                  p.meta?.Categoria === "camara" &&
                  p.meta.Tipo === "analogica" &&
                  p.meta.ResolucionMaxMP === resSel,
              )
              .map((p) => p.meta.Formato),
          ),
        ].map((f) => ({
          label: f,
          next: grabadorSel?.meta?.GrabaAudio ? "camAudio" : "camUso",
          action: () => {
            setFormatoSel(f);
            if (!grabadorSel?.meta?.GrabaAudio) setAudioSel(false);
          },
        })),
      },
      /*AUDIO*/
      camAudio: {
        resp: () => "¿Desea cámaras con audio?",

        options: (() => {
          const cams = productos.filter(
            (p) =>
              p.meta?.Categoria === "camara" &&
              p.meta.Tipo === "analogica" &&
              p.meta.ResolucionMaxMP === resSel &&
              p.meta.Formato === formatoSel,
          );

          const hayAudio = cams.some((c) => c.meta.Audio === true);
          const haySinAudio = cams.some((c) => c.meta.Audio === false);
          const opts = [];

          if (hayAudio)
            opts.push({
              label: "Con audio",
              next: "camUso",
              action: () => setAudioSel(true),
            });

          if (haySinAudio)
            opts.push({
              label: "Sin audio",
              next: "camUso",
              action: () => setAudioSel(false),
            });

          return opts;
        })(),
      },
      /*USO*/
      camUso: {
        resp: () => "Seleccione el tipo de uso",

        options: [
          ...new Set(
            productos
              .filter(
                (p) =>
                  p.meta?.Categoria === "camara" &&
                  p.meta.Tipo === "analogica" &&
                  p.meta.ResolucionMaxMP === resSel &&
                  p.meta.Formato === formatoSel &&
                  p.meta.Audio === audioSel,
              )
              .map((p) => p.meta.Uso),
          ),
        ].map((u) => ({
          label: u,
          next: "camPaso4",
          action: () => setUsoSel(u),
        })),
      },

      /* CAMARAS ANALOGAS */

      camPaso4: {
        resp: () => "Seleccione modelos y cantidades de cámaras", // hasta aca y un cambio mas queda bien

        quantityInput: {
          items: productos
            .filter(
              (p) =>
                p.meta?.Categoria === "camara" &&
                p.meta.Tipo === "analogica" &&
                p.meta.ResolucionMaxMP === resSel &&
                p.meta.Formato === formatoSel &&
                p.meta.Audio === audioSel &&
                p.meta.Uso === usoSel,
            )
            .map((p) => ({
              id: p._id,
              label: limpiarNombre(p.nombre),
            })),

          max: grabadorSel?.meta?.MaximoCamaras ?? 99,

          onChange: (id, val) => {
            setQtyTemp((q) => {
              const nuevo = { ...q, [id]: val };
              const suma = Object.values(nuevo).reduce((t, c) => t + c, 0);
              const max = grabadorSel?.meta?.MaximoCamaras ?? 99;
              if (suma > max) return q; // rechaza el cambio si supera el límite
              return nuevo;
            });
          },

          next: "camPaso5",
        },
      },

      /* GUARDAR CAMARAS */

      camPaso5: {
        resp: () => "Se agregaron las cámaras seleccionadas.",
        onEnter: () => agregarArticulosQty(),
        options: [{ label: "Continuar", next: "camResumen" }],
      },

      /* RESUMEN */

      camResumen: {
        resp: () => {
          const total = articulos.reduce(
            (t, a) => t + a.precio * a.cantidad,
            0,
          );

          return (
            <div>
              <strong>Cotización</strong>

              {articulos.map((a, i) => (
                <p key={i}>
                  {a.nombre} x{a.cantidad}= $
                  {(a.precio * a.cantidad).toLocaleString()}
                </p>
              ))}

              <hr />

              <b>Total ${total.toLocaleString()}</b>
            </div>
          );
        },

        options: [{ label: "Finalizar", next: "camFin" }],
      },

      /* FINAL */

      camFin: {
        resp: () => {
          alert("Recorrido finalizado");
          return "Gracias por usar el cotizador";
        },
      },

      /* WIFI INICIO */

      camWifi1: {
        resp: () => "Seleccione la resolución para cámaras WIFI",
        options: [
          ...new Set(
            productos
              .filter((p) => p.meta?.Tipo === "wifi")
              .map((p) => p.meta.ResolucionMaxMP),
          ),
        ].map((r) => ({
          label: `${r} Megapíxeles`,
          next: "camWifi2",
        })),
      },

      camWifi2: {
        resp: () => "Seleccione modelos y cantidades de cámaras WIFI",

        quantityInput: {
          items: productos
            .filter((p) => p.meta?.Tipo === "wifi")
            .map((p) => ({
              id: p._id,
              label: limpiarNombre(p.nombre),
            })),

          onChange: (id, val) => {
            setQtyTemp((q) => ({ ...q, [id]: val }));
          },

          next: "camPaso5",
        },
      },
    }),
    [
      productos,
      canalesSel,
      resSel,
      grabadorSel,
      articulos,
      formatoSel,
      audioSel,
      usoSel,
      qtyTemp,
    ],
  );

  return { rules, qtyTemp };
}
