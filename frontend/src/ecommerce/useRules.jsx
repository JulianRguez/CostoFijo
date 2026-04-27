// Rules.js
import { useState, useCallback, useMemo, useEffect } from "react";
const API_KEY = import.meta.env.VITE_API_KEY;
import {
  CheckCircle,
  Clock,
  ImageUp,
  HeartHandshake,
  Smile,
  Receipt,
  Bot,
  PackageCheck,
  ShoppingCart,
  CreditCard,
  Truck,
  BadgeCheck,
  MessageCircle,
  FileText,
} from "lucide-react";

export function useRules(userName, nota) {
  const [respuesta, setRespuesta] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [compraData, setCompraData] = useState(null);
  useEffect(() => {
    if (nota && respuesta === null) {
      (async () => {
        try {
          const resp = await fetch(`/api/vent?factura=${nota}`, {
            headers: { "x-api-key": API_KEY },
          });
          const data = await resp.json();

          if (Array.isArray(data) && data.length > 0) {
            const textoRespuesta = construirRespuestaFactura(data[0]);
            setRespuesta(textoRespuesta);
          }
        } catch (e) {
          setRespuesta("Error al consultar la factura");
        }
      })();
    }
  }, [nota, respuesta]);
  let mensajeFactura = "";
  // 🔎 acciones
  const buscarFra = useCallback(async (valor) => {
    const regex = /^[0-9]{8}$/;
    if (!regex.test(valor)) {
      setRespuesta("El valor ingresado no es válido");
      return "fraNo";
    }

    try {
      const resp = await fetch(`/api/vent?factura=${valor}`, {
        headers: { "x-api-key": API_KEY },
      });
      const data = await resp.json();

      if (!Array.isArray(data) || data.length === 0) {
        setRespuesta("Factura no encontrada");
        return "fraNo";
      }

      const factura = data[0];

      if (factura.pago === "pendiente") {
        const textoRespuesta = construirRespuestaFactura(factura);

        const partes = textoRespuesta.split("|");
        const total = construirvalor(partes);
        mensajeFactura = `Para reportar el pago de la factura debe realizar la transferencia o consignación por un valor de $${total.toLocaleString()} y cargar el comprobante.`;

        setRespuesta(textoRespuesta); // solo para usar el id luego
        return "fraSi";
      } else {
        setRespuesta("Factura no pendiente de pago");
        return "fraNo";
      }
    } catch (error) {
      console.error(error);
      setRespuesta("Error al consultar la factura");
      return "fraNo";
    }
  }, []);
  const buscarFra2 = useCallback(async (valor) => {
    const regex = /^[0-9]{8}$/;

    if (!regex.test(valor)) {
      setRespuesta("El valor ingresado no es válido");
      return "fraNo";
    }

    try {
      const resp = await fetch(`/api/vent?factura=${valor}`, {
        headers: { "x-api-key": API_KEY },
      });
      const data = await resp.json();

      if (!Array.isArray(data) || data.length === 0) {
        setRespuesta("Factura no encontrada");
        return "fraNo";
      }

      const factura = data[0];

      // 👇 Guardamos TODA la información cruda
      setCompraData(factura);

      // 👇 También guardamos la versión transformada si luego la necesitas
      const textoRespuesta = construirRespuestaFactura(factura);
      setRespuesta(textoRespuesta);

      // 👇 A diferencia de buscarFra, aquí NO validamos pago
      return "gesCom";
    } catch (error) {
      console.error(error);
      setRespuesta("Error al consultar la factura");
      return "fraNo";
    }
  }, []);
  const respFra = useCallback(() => {
    const respuestasNo = [
      "El valor ingresado no es válido",
      "Factura no encontrada",
      "Factura no pendiente de pago",
      "Error al consultar la factura",
    ];

    return respuestasNo.includes(respuesta) ? "fraNo" : "fraSi";
  }, [respuesta]);
  const GuardarImg = useCallback(
    async (file) => {
      if (!file) {
        setSelectedImage(null);
        return;
      }

      try {
        let idventa;

        if (respuesta === null) {
          const resp = await fetch(`/api/vent?factura=${nota}`, {
            headers: { "x-api-key": API_KEY },
          });
          const data = await resp.json();

          if (!Array.isArray(data) || data.length === 0) {
            setRespuesta("Factura no encontrada");
            return;
          }
          const textoRespuesta = construirRespuestaFactura(data[0]);
          setRespuesta(textoRespuesta);
          idventa = data[0]._id;
        } else {
          idventa = respuesta.split("|")[0];
        }
        const urlImg = await subirImagenCloudinary(file);
        // 2️⃣ ACTUALIZAR LA VENTA (PUT)
        await fetch(`/api/vent/${idventa}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
          body: JSON.stringify({
            pago: urlImg,
          }),
        });

        // 3️⃣ Guardar imagen local (preview)
        setSelectedImage(file);
      } catch (error) {
        console.error(error);
        setRespuesta("Error al subir el comprobante");
      }
    },
    [respuesta, nota],
  );
  async function subirImagenCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "pagos_facturas");
    formData.append("folder", "comprobantes_pago");

    const resp = await fetch(
      "https://api.cloudinary.com/v1_1/ddjdox6b0/image/upload",
      {
        method: "POST",
        body: formData,
      },
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error("Error Cloudinary: " + errorText);
    }

    const data = await resp.json();
    return "P" + data.secure_url; // 👈 ESTE es el URL público
  }
  const construirRespuestaFactura = (factura) => {
    if (!factura) return null;

    const partes = [factura._id];

    if (Array.isArray(factura.productos)) {
      factura.productos.forEach((p) => {
        partes.push(p.idProd, String(p.cantidad), String(p.valor));
      });
    }

    return partes.join("|");
  };
  const construirvalor = (valor) => {
    let total = 0;
    for (let i = 1; i < valor.length; i += 3) {
      total += Number(valor[i + 1]) * Number(valor[i + 2]);
    }
    return total;
  };
  const limpiarNombre = (nombre) => {
    return nombre.replace(/\s+[A-Z]{3}\d{0,2}$/i, "");
  };
  const totalCompra =
    compraData?.productos?.reduce(
      (acc, prod) => acc + prod.valor * prod.cantidad,
      0,
    ) || 0;

  const totalFinal = totalCompra + (compraData?.otrosCobros || 0);
  // 📜 reglas del bot
  const rules = useMemo(
    () => ({
      menu: {
        resp: () => (
          <div>
            <br />
            <div style={{ display: "flex", gap: "10px" }}>
              <Smile size={35} color="orange" />
              {"  "}
              <span>
                Hola {userName || "Usuario"}, Elige una opción del menú
                principal:
              </span>
            </div>
          </div>
        ),
        options: [
          { label: "Medios de pago", next: "medPag" },
          { label: "Gestionar compras", next: "ingFra" },
          { label: "Cotizar Cámaras Vigilancia", next: "camMenu" },
          { label: "Recuperar clave", next: "no" },
          { label: "Como comprar", next: "no" },
          { label: "Contactar un asesor", next: "no" },
        ],
      }, //ok
      medPag: {
        resp: () => (
          <div style={{ display: "flex", gap: "10px" }}>
            <Receipt size={35} color="orange" />{" "}
            <span>
              Seleccione un medio de pago para obtener más información.
            </span>
          </div>
        ),
        options: [
          { label: "Pago por transferencia", next: "transf" },
          { label: "Pago Contra entrega", next: "conEnt" },
          { label: "Pago con Sistecedito", next: "sisCre" },
          { label: "Pago con ADDI", next: "addi" },
          { label: "Pago con PSE", next: "pse" },
        ],
      }, //ok
      transf: {
        resp: () => (
          <div className="space-y-3">
            <p style={{ margin: 0 }}>
              <strong>
                Para realizar una compra con pago por transferencia bancaria
                tenga en cuenta los siguientes pasos:{" "}
              </strong>
            </p>
            <br />
            <p style={{ margin: 0 }}>
              <ShoppingCart
                size={30}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              <strong>1. Selecciona tus productos: </strong>
              Agrega los productos al carrito y luego haz clic en “Realizar
              pedido” para continuar o utiliza el botón “Comprar” para adquirir
              un solo producto.
            </p>
            <br />
            <p style={{ margin: 0 }}>
              <FileText
                size={30}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              <strong>2. Completa tu información: </strong>
              Ingresa tus datos de envío y datos personales, selecciona
              “Transferencia” como medio de pago y haz clic en “Confirmar
              pedido”.
            </p>
            <br />
            <p style={{ margin: 0 }}>
              <Truck
                size={30}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              <strong>3. Realiza el pago: </strong>
              Sigue las instrucciones para efectuar la transferencia bancaria y
              luego carga el comprobante en la opción “Cargar comprobante”. Una
              vez verificado, procederemos con el envío o entrega de tu pedido.
            </p>
            <br />
            <p style={{ margin: 0 }}>
              <HeartHandshake
                size={20}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              ¡Estaremos atentos para ayudarte!
            </p>
          </div>
        ),
      }, //ok
      conEnt: {
        resp: () => (
          <div className="space-y-3">
            <p style={{ margin: 0 }}>
              <strong>
                Para realizar una Compra y pagar a contra entrega tenga en
                cuenta los siguientes pasos:{" "}
              </strong>
            </p>
            <br />
            <p style={{ margin: 0 }}>
              <ShoppingCart
                size={30}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              <strong>1. Selecciona tus productos: </strong>
              Agrega los productos al carrito y luego haz clic en “Realizar
              pedido” para continuar o utiliza el botón “Comprar” para adquirir
              un solo producto.
            </p>
            <br />
            <p style={{ margin: 0 }}>
              <FileText
                size={30}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              <strong>2. Completa tu información: </strong>
              Ingresa tus datos de envío y datos personales, selecciona “Contra
              Entrega” como medio de pago y haz clic en “Confirmar pedido”.
            </p>
            <br />
            <p style={{ margin: 0 }}>
              <Truck
                size={30}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              <strong>3. Verificación : </strong>
              Verificaremos los datos ingresados y te confirmaremos a través de
              WhatsApp el envío o entrega de tu pedido pagando al recibirlo.
            </p>
            <br />
            <p style={{ margin: 0 }}>
              <HeartHandshake
                size={20}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              ¡Estaremos atentos para ayudarte!
            </p>
          </div>
        ),
      }, //ok
      sisCre: {
        resp: () => (
          <div className="space-y-3">
            <p style={{ margin: 0 }}>
              <strong>
                Para realizar una Compra con Sistecredito, tenga en cuenta los
                siguientes pasos:
              </strong>
            </p>
            <br />
            <p style={{ margin: 0 }}>
              <ShoppingCart
                size={30}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              <strong>1. Selecciona tus productos: </strong>
              Agrega los productos al carrito y luego haz clic en “Realizar
              pedido” para continuar o utiliza el botón “Comprar” para adquirir
              un solo producto.
            </p>
            <br />
            <p style={{ margin: 0 }}>
              <FileText
                size={30}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              <strong>2. Completa tu información: </strong>
              Ingresa tus datos de envío y datos personales, selecciona
              “Sistecredito” como medio de pago y haz clic en “Confirmar
              pedido”.
            </p>
            <br />
            <p style={{ margin: 0 }}>
              <Truck
                size={30}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              <strong>3. Verificación : </strong>
              Verificaremos los datos ingresados y uno de nuestros asesores te
              contactará vía WhatsApp desde el número 333 7351040 en un plazo
              máximo de 30 minutos en horario laboral o al siguiente día hábil
              para generar el link de pago y finalizar tu compra.
            </p>
            <br />
            <p style={{ margin: 0 }}>
              <HeartHandshake
                size={20}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              ¡Estaremos atentos para ayudarte!
            </p>
          </div>
        ),
      }, //ok
      addi: {
        resp: () =>
          "Esta opción aún no está disponible, puedes usar Sistecredito como metodo de financiacion.",
        options: [{ label: "Menú principal", next: "menu" }],
      }, //ok
      pse: {
        resp: () =>
          "Esta opción aún no está disponible, recomendamos realizar su pago a través de transferencia u otro medio de pago disponible",
        options: [{ label: "Menú principal", next: "menu" }],
      }, //ok
      ingFra: {
        resp: () => "Ingrese el número de la factura que desea gestionar.",
        input: {
          placeholder: "Número de factura",
          buttonLabel: "Continuar",
          action: buscarFra2,
        },
      }, //ok
      gesCom: {
        resp: () => (
          <div className="flex items-center gap-2 font-semibold">
            <Smile size={30} color="orange" />
            {"  "}
            <span>
              Hola {userName || "Usuario"}, elige una opción para gestionar tu
              compra:
            </span>
          </div>
        ),
        options: (() => {
          const pago = compraData?.pago ?? "";
          const opts = [{ label: "Estado de la compra", next: "estcom" }];

          if (pago === "pendiente")
            opts.push({ label: "Realizar pago", next: "no" });

          if (pago.startsWith("P") || pago.startsWith("A"))
            opts.push({ label: "Cancelar pedido", next: "no" });

          if (pago.startsWith("F"))
            opts.push({ label: "Devolución o garantía", next: "no" });

          return opts;
        })(),
      }, //ok
      estcom: {
        resp: () => {
          if (!compraData) {
            return "No se encontró información de la compra.";
          }

          return (
            <div className="space-y-3">
              {/* Datos generales */}
              <div>
                <strong>Información de la compra:</strong>
                <p>
                  <b>Factura:</b> {compraData.factura}
                </p>
                <p>
                  <b>Fecha:</b> {new Date(compraData.fecha).toLocaleString()}
                </p>
                <p>
                  <b>Estado de pago:</b>{" "}
                  {compraData.pago === "pendiente"
                    ? "Por pagar"
                    : compraData.pago.startsWith("P")
                      ? "Verificando pago"
                      : compraData.pago.startsWith("A")
                        ? "Pendiente de envío"
                        : compraData.pago.startsWith("X")
                          ? "Compra cancelada"
                          : compraData.pago.startsWith("E")
                            ? "Pedido enviado"
                            : compraData.pago.startsWith("F")
                              ? "Pedido entregado"
                              : compraData.pago}
                </p>
                <p>
                  <b>Cliente:</b> {compraData.idClient}
                </p>
              </div>

              {/* Productos */}
              <div>
                {compraData.productos.map((prod, i) => (
                  <div key={i} className="border rounded-xl p-2 mt-2">
                    <p>
                      <b>• {limpiarNombre(prod.nomProd)}:</b>
                      {" $"}
                      {new Intl.NumberFormat("es-CO").format(prod.valor)}{" "}
                      {" X "} {prod.cantidad}
                    </p>
                  </div>
                ))}
              </div>
              <p>
                <b>• Otros cobros:</b> $
                {new Intl.NumberFormat("es-CO").format(compraData.otrosCobros)}
              </p>
              <p>
                <b>Total compra:</b> $
                {new Intl.NumberFormat("es-CO").format(totalFinal)}
              </p>
            </div>
          );
        },
        options: [{ label: "Menú principal", next: "menu" }],
      },

      pTransfer: {
        resp: () => "Ingrese el número de la factura pendiente por pagar.",
        input: {
          placeholder: "Número de factura",
          buttonLabel: "Continuar",
          action: buscarFra,
        },
      },
      fraNo: {
        resp: () =>
          "El número de factura ingresado no es válido o no está pendiente por pagar. Puede verificar sus facturas desde el menú.",
        options: [{ label: "Menú principal", next: "menu" }],
      },
      fraSi: {
        resp: () => {
          if (mensajeFactura === "") {
            return (
              <>
                Realice la transferencia o consignación y cargar el comprobante
                desde "Seleccionar archivo".
                <br />
                <br />
                <div style={{ color: "orange" }}>Datos bancarios:</div>
                Cuenta ahorros Bancolombia: 24083017828
                <br />
                llave PRE-B: 0090625768.
                <br />
                <br />
                Si va a cargar el comprobante posteriormente, puede hacerlo
                ingresando a este chat desde el icono{" "}
                <Bot
                  size={18}
                  style={{ verticalAlign: "middle", color: "orange" }}
                />{" "}
                e ingresar el número de factura, el cual puede visualizar en el
                menú lateral en la opción “Compras”.
              </>
            );
          }

          return mensajeFactura;
        },
        fileInput: {
          label: "Cargar comprobante",
          accept: "image/*",
          action: GuardarImg,
          next: "respImg",
        },
      },
      respImg: {
        resp: () => (
          <div className="space-y-3">
            <div>
              <CheckCircle size={18} color="orange" fontWeight={"bold"} />{" "}
              <strong>Imagen recibida correctamente:</strong>
              <p>
                Nuestro equipo evaluará su validez y te confirmaremos vía
                WhatsApp si se presentó alguna irregularidad o si fue aprobada y
                procederemos al envío, entrega o cancelación de la factura.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} color="orange" fontWeight={"bold"} />{" "}
              <strong>Tiempo de respuesta:</strong>
              <p>
                Uno de nuestros asesores confirmara la aprobación del pago en un
                plazo máximo de 30 minutos si el comprobante fue cargado en
                horario laboral o a primera hora en el siguiente día hábil.
              </p>
            </div>
            <div>
              <ImageUp size={18} color="orange" fontWeight={"bold"} />
              <strong>Comprobante erróneo: </strong>
              <p>
                ¿Subiste una imagen equivocada? Puedes volver a cargarla
                ingresando a este chat, accediendo a la opción “ Medios de pago
                – pago transferencia” e ingresando el número de factura.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <HeartHandshake size={18} color="orange" fontWeight={"bold"} />{" "}
              Gracias por tu compra. Te atenderemos muy pronto.
            </div>
          </div>
        ),
      },
      no: {
        resp: () => "Esta opción aún no está disponible.",
        options: [{ label: "Menú principal", next: "menu" }],
      },
      conEntrega: {
        resp: () => (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <PackageCheck size={18} color="orange" />
              <div>
                <strong>Compra contra entrega:</strong>
                <p>
                  Para realizar tu compra con pago contra entrega, primero debes
                  seleccionar el producto que deseas adquirir desde nuestra
                  tienda.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <ShoppingCart size={18} color="orange" />
              <div>
                <strong>Agregar al carrito o compra rápida:</strong>
                <p>
                  Puedes hacer clic en <strong>Compra rápida</strong> o agregar
                  el producto al <strong>carrito de compras</strong> para
                  continuar con el proceso.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CreditCard size={18} color="orange" />
              <div>
                <strong>Seleccionar medio de pago:</strong>
                <p>
                  Al ingresar al carrito, continúa con la compra y en la sección
                  <strong> Medio de pago</strong> elige la opción
                  <strong> Contra entrega</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Truck size={18} color="orange" />
              <div>
                <strong>Confirmación y entrega:</strong>
                <p>
                  Verifica tus datos de envío, confirma el pedido y pagarás el
                  producto al momento de recibirlo en la dirección registrada.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <HeartHandshake size={18} color="orange" />
              ¡Estaremos atentos para ayudarte con tu pedido!
            </div>
          </div>
        ),
      },
    }),
    [userName, nota, buscarFra, respFra, GuardarImg, compraData],
  );

  return { rules, selectedImage };
}
