// useRules2.jsx
import { useState, useEffect, useMemo } from "react";
import { Cable, Cctv, Server } from "lucide-react";
const API_KEY = import.meta.env.VITE_API_KEY;

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
  const [tipoGrabadorSel, setTipoGrabadorSel] = useState(null);
  const [tipoCamaraCiclo, setTipoCamaraCiclo] = useState("analogica");

  useEffect(() => {
    fetch("/api/prod?etiqueta=Monitoreo", {
      headers: { "x-api-key": API_KEY },
    })
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

  function camarasYaAgregadas(ciclo = "analogica") {
    const ids = new Set(
      productos
        .filter((p) => {
          if (p.meta?.Categoria !== "camara") return false;
          if (ciclo === "analogica") return p.meta.Tipo === "analogica";
          return p.meta.Tipo === "ip" || p.meta.Tipo === "wifi";
        })
        .map((p) => p._id),
    );
    return articulos
      .filter((a) => ids.has(a.id))
      .reduce((t, a) => t + a.cantidad, 0);
  }
  const rules = useMemo(
    () => ({
      /* MENU CAMARAS */
      camMenu: {
        sinHistorial: true,
        resp: () => (
          <div className="space-y-6">
            <br />
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}
            >
              <Cctv className="icon" />
              <strong className="iconText">
                Los sistemas de video vigilancia más utilizados son:
              </strong>
            </div>
            <br />
            <br />
            <div>
              <strong style={{ fontSize: "13px" }}>KIT NVR, XVR o DVR</strong>

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
                  Un grabador de video con cámaras conectadas por cable y
                  almacenamiento en disco duro.
                </p>

                <div style={{ clear: "both" }} />
              </div>
            </div>
            <br />
            {/* KIT WIFI */}
            <div>
              <strong style={{ fontSize: "13px" }}>KIT CÁMARAS WIFI</strong>

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
                  Cámaras independientes conectadas a internet y grabación en
                  tarjeta micro SD.
                </p>

                <div style={{ clear: "both" }} />
              </div>
            </div>
            <br />
            <strong style={{ fontSize: "12px", color: "#444" }}>
              De las siguientes opciones, Elija el kit que desea cotizar:
            </strong>
          </div>
        ),

        options: [
          { label: "Kit NVR-XVR-DVR", next: "camTipoGrabador" },
          { label: "Kit cámaras WIFI", next: "camWifi1" },
        ],
      },
      /* TIPO GRABADOR */
      camTipoGrabador: {
        sinHistorial: true,
        resp: () => (
          <div>
            <br />
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}
            >
              <Server className="icon" />
              <strong className="iconText">
                Los tipos de grabadores de vídeo más usados son:
              </strong>
            </div>
            <br />
            <strong style={{ fontSize: "13px" }}>NVR</strong>
            <p style={{ margin: 0 }}>
              Solo compatible con cámaras IP, transmiten vídeo a través de la
              red de internet o red local.
            </p>
            <strong style={{ fontSize: "13px" }}>DVR</strong>
            <p style={{ margin: 0 }}>
              {" "}
              Solo compatible con cámaras analógicas, transmiten vídeo a través
              de cable UTP o par cobre.
            </p>
            <strong style={{ fontSize: "13px" }}>XVR</strong>
            <p style={{ margin: 0 }}>Compatible con cámaras analógicas e IP</p>
            <br />
            <strong style={{ fontSize: "12px", color: "#444" }}>
              De las siguientes opciones, Elija el grabador que desea cotizar:
            </strong>
          </div>
        ),
        options: [
          ...new Set(
            productos
              .filter((p) => p.meta?.Categoria === "grabador")
              .map((p) => p.meta.Tipo),
          ),
        ].map((tipo) => ({
          label: tipo,
          next: "camPaso1",
          action: () => {
            setTipoGrabadorSel(tipo);
            // DVR y XVR primer ciclo = analogica, NVR = ip
            setTipoCamaraCiclo(tipo === "NVR" ? "ip" : "analogica");
          },
        })),
      },
      /* PUERTOS ANALOGOS */
      camPaso1: {
        sinHistorial: true,
        resp: () => {
          const esNVR = tipoGrabadorSel === "NVR";
          const opciones = [
            ...new Set(
              productos
                .filter(
                  (p) =>
                    p.meta?.Categoria === "grabador" &&
                    p.meta.Tipo === tipoGrabadorSel,
                )
                .map((p) =>
                  esNVR ? p.meta.CanalesIP : p.meta.CanalesAnalogos,
                ),
            ),
          ];
          console.log(
            "🟡 opciones:",
            opciones.length,
            "productos:",
            productos.length,
          );
          return (
            <div style={{ display: "flex", gap: "10px" }}>
              <Cable
                size={30}
                color="orange"
                style={{ flexShrink: 0, marginTop: "2px" }}
              />
              <span>
                {esNVR
                  ? "Seleccione la cantidad de puertos IP que debe tener el grabador. Cada puerto permite conectar una cámara IP, por lo tanto esta cantidad corresponde al número máximo de cámaras que podrá instalar en el sistema."
                  : "Seleccione la cantidad de puertos analógicos que debe tener el grabador. Cada puerto permite conectar una cámara mediante cable, por lo tanto esta cantidad corresponde al número máximo de cámaras cableadas que podrá instalar en el sistema."}
                <br />
                <br />
                {opciones.length === 1
                  ? `El grabador solo lo tenemos disponible con ${opciones[0]} puertos, haga clic para continuar.`
                  : "De las siguientes opciones, elija la cantidad de puertos para el grabador:"}
              </span>
            </div>
          );
        },
        options: (() => {
          const esNVR = tipoGrabadorSel === "NVR";
          return [
            ...new Set(
              productos
                .filter(
                  (p) =>
                    p.meta?.Categoria === "grabador" &&
                    p.meta.Tipo === tipoGrabadorSel,
                )
                .map((p) =>
                  esNVR ? p.meta.CanalesIP : p.meta.CanalesAnalogos,
                ),
            ),
          ].map((c) => ({
            label: esNVR
              ? `Con ${c} puertos IP`
              : `Con ${c} puertos para cámaras`,
            next: "camPaso2",
            action: () => setCanalesSel(c),
          }));
        })(),
      },
      /* RESOLUCION */
      camPaso2: {
        sinHistorial: true,
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
              .filter(
                (p) =>
                  p.meta?.Categoria === "grabador" &&
                  p.meta.Tipo === tipoGrabadorSel &&
                  (tipoGrabadorSel === "NVR"
                    ? p.meta.CanalesIP
                    : p.meta.CanalesAnalogos) === canalesSel,
              )
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
        sinHistorial: true,
        resp: () => {
          const grabadores = productos.filter(
            (p) =>
              p.meta?.Categoria === "grabador" &&
              p.meta.Tipo === tipoGrabadorSel &&
              (tipoGrabadorSel === "NVR"
                ? p.meta.CanalesIP
                : p.meta.CanalesAnalogos) === canalesSel &&
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
              p.meta.Tipo === tipoGrabadorSel &&
              (tipoGrabadorSel === "NVR"
                ? p.meta.CanalesIP
                : p.meta.CanalesAnalogos) === canalesSel &&
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
        sinHistorial: true,
        resp: () =>
          "Seleccione las características para la primera cámara o grupo de cámaras. Si necesita agregar alguna con características diferentes, podrá hacerlo más adelante en este chat.",

        options: [
          ...new Set(
            productos
              .filter(
                (p) =>
                  p.meta?.Categoria === "camara" &&
                  (tipoCamaraCiclo === "analogica"
                    ? p.meta.Tipo === "analogica"
                    : p.meta.Tipo === "ip" || p.meta.Tipo === "wifi") &&
                  p.meta.Marca === grabadorSel?.meta?.Marca &&
                  p.meta.ResolucionMaxMP <= resSel,
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
        sinHistorial: true,
        resp: () => "¿Desea cámaras con audio?",

        options: (() => {
          const cams = productos.filter(
            (p) =>
              p.meta?.Categoria === "camara" &&
              (tipoCamaraCiclo === "analogica"
                ? p.meta.Tipo === "analogica"
                : p.meta.Tipo === "ip" || p.meta.Tipo === "wifi") &&
              p.meta.Marca === grabadorSel?.meta?.Marca &&
              p.meta.ResolucionMaxMP <= resSel &&
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
        sinHistorial: true,
        resp: () => "Seleccione el tipo de uso",

        options: [
          ...new Set(
            productos
              .filter(
                (p) =>
                  p.meta?.Categoria === "camara" &&
                  (tipoCamaraCiclo === "analogica"
                    ? p.meta.Tipo === "analogica"
                    : p.meta.Tipo === "ip" || p.meta.Tipo === "wifi") &&
                  p.meta.Marca === grabadorSel?.meta?.Marca &&
                  p.meta.ResolucionMaxMP <= resSel &&
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
        sinHistorial: true,
        resp: () => "Seleccione modelos y cantidades de cámaras",

        quantityInput: {
          items: productos
            .filter(
              (p) =>
                p.meta?.Categoria === "camara" &&
                (tipoCamaraCiclo === "analogica"
                  ? p.meta.Tipo === "analogica"
                  : p.meta.Tipo === "ip" || p.meta.Tipo === "wifi") &&
                p.meta.Marca === grabadorSel?.meta?.Marca &&
                p.meta.ResolucionMaxMP <= resSel &&
                p.meta.Formato === formatoSel &&
                p.meta.Audio === audioSel &&
                p.meta.Uso === usoSel,
            )
            .map((p) => ({
              id: p._id,
              label: limpiarNombre(p.nombre),
            })),

          max:
            tipoCamaraCiclo === "analogica"
              ? (grabadorSel?.meta?.CanalesAnalogos ?? 99)
              : (grabadorSel?.meta?.CanalesIP ?? 99),
          yaAgregadas: camarasYaAgregadas(tipoCamaraCiclo),

          onChange: (id, val) => {
            setQtyTemp((q) => {
              const nuevo = { ...q, [id]: val };
              const sumaActual = Object.values(nuevo).reduce(
                (t, c) => t + c,
                0,
              );
              const max = grabadorSel?.meta?.CanalesAnalogos ?? 99;
              const ya = camarasYaAgregadas(tipoCamaraCiclo);
              if (sumaActual + ya > max) return q;
              return nuevo;
            });
          },

          next: "camPaso5",
          nextOtra: "camFormato",
          onAgregar: () => agregarArticulosQty(),
        },
      },
      /* GUARDAR CAMARAS */
      camPaso5: {
        sinHistorial: true,
        resp: () => "Se agregaron las cámaras seleccionadas.",
        onEnter: () => agregarArticulosQty(),
        options: (() => {
          const esXVR = grabadorSel?.meta?.Tipo === "XVR";
          const primerCiclo = tipoCamaraCiclo === "analogica";
          const hayIP = (grabadorSel?.meta?.CanalesIP ?? 0) > 0;

          const hayCaramasIP = productos.some(
            (p) =>
              p.meta?.Categoria === "camara" &&
              (p.meta.Tipo === "ip" || p.meta.Tipo === "wifi") &&
              p.meta.Marca === grabadorSel?.meta?.Marca &&
              p.meta.ResolucionMaxMP <= resSel,
          );

          if (esXVR && primerCiclo && hayIP && hayCaramasIP) {
            return [
              {
                label: "Continuar con cámaras IP/WIFI",
                next: "camFormato",
                action: () => setTipoCamaraCiclo("ip"),
              },
            ];
          }

          return [{ label: "Continuar", next: "camResumen" }];
        })(),
      },
      /* RESUMEN */
      camResumen: {
        sinHistorial: true,
        resp: () => "__RESUMEN__",
        getArticulos: () => articulos,
        options: [{ label: "Finalizar", next: "camFin" }],
      },
      /* FINAL */
      camFin: {
        sinHistorial: true,
        resp: () => {
          alert("Recorrido finalizado");
          return "Gracias por usar el cotizador";
        },
      } /* WIFI INICIO */,
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
      tipoGrabadorSel,
      tipoCamaraCiclo,
    ],
  );

  return { rules };
}
