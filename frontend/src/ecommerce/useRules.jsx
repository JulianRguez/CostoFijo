// Rules.js
import { useState, useCallback, useMemo, useEffect } from "react";
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
} from "lucide-react";

export function useRules(userName, nota) {
  const [respuesta, setRespuesta] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [compraData, setCompraData] = useState(null);
  useEffect(() => {
    if (nota && respuesta === null) {
      (async () => {
        try {
          const resp = await fetch(`/api/vent?factura=${nota}`);
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
      const resp = await fetch(`/api/vent?factura=${valor}`);
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
      const resp = await fetch(`/api/vent?factura=${valor}`);
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
      return "gesCompra";
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
          const resp = await fetch(`/api/vent?factura=${nota}`);
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
  // 📜 reglas del bot
  const rules = useMemo(
    () => ({
      menu: {
        resp: () => (
          <div className="flex items-center gap-2 font-semibold">
            <Smile size={30} color="orange" />
            {"  "}
            <span>
              Hola {userName || "Usuario"}, Elige una opción del menú principal:
            </span>
          </div>
        ),
        options: [
          { label: "Medios de pago", next: "nPagos" },
          { label: "Gestionar compras", next: "estadoComp" },
          { label: "Cotizar Cámaras Vigilancia", next: "camMenu" },
          { label: "Recuperar clave", next: "no" },
          { label: "Como comprar", next: "no" },
          { label: "Contactar un asesor", next: "no" },
        ],
      }, //ok
      nPagos: {
        resp: () => (
          <div className="flex items-center gap-2 font-semibold">
            <Receipt size={30} color="orange" />{" "}
            <span>Seleccione un medio de pago para continuar.</span>
          </div>
        ),
        options: [
          { label: "Pago transferencia", next: "pTransfer" },
          { label: "Contra entrega", next: "contraEnt" },
          { label: "Pago SisteCedito", next: "sisteCredito" },
          { label: "PSE", next: "no" },
        ],
      }, //ok
      pTransfer: {
        resp: () => "Ingrese el número de la factura pendiente por pagar.",
        input: {
          placeholder: "Número de factura",
          buttonLabel: "Continuar",
          action: buscarFra,
        },
      }, //ok
      fraNo: {
        resp: () =>
          "El número de factura ingresado no es válido o no está pendiente por pagar. Puede verificar sus facturas desde el menú.",
        options: [{ label: "Menú principal", next: "menu" }],
      }, //ok
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
      }, //ok
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
      }, //ok
      no: {
        resp: () => "Esta opción aún no está disponible.",
        options: [{ label: "Menú principal", next: "menu" }],
      }, //ok
      contraEnt: {
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
      sisteCredito: {
        resp: () => (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <BadgeCheck size={18} color="orange" />
              <div>
                <strong>Compra con sistema de crédito:</strong>
                <p>
                  Para comprar mediante nuestro sistema de crédito, debes
                  seleccionar el producto que deseas adquirir desde la tienda.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <ShoppingCart size={18} color="orange" />
              <div>
                <strong>Agregar al carrito o compra rápida:</strong>
                <p>
                  Haz clic en <strong>Compra rápida</strong> o agrega el
                  producto al
                  <strong> carrito de compras</strong> para continuar con el
                  proceso.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CreditCard size={18} color="orange" />
              <div>
                <strong>Seleccionar medio de pago:</strong>
                <p>
                  Ingresa al carrito, continúa la compra y selecciona
                  <strong> Sistema de crédito</strong> como medio de pago.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MessageCircle size={18} color="orange" />
              <div>
                <strong>Contacto para finalizar la compra:</strong>
                <p>
                  Uno de nuestros asesores te contactará vía WhatsApp desde el
                  número
                  <strong> 333 735 1040</strong> en un plazo máximo de
                  <strong> 30 minutos</strong> en horario laboral o al siguiente
                  día hábil para generar el link de pago y finalizar tu compra.
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
      gesCompra: {
        resp: () => (
          <div className="flex items-center gap-2 font-semibold">
            <Smile size={30} color="orange" />
            {"  "}
            <span>
              Hola {userName || "Usuario"}, Elige una opción del menú principal:
            </span>
          </div>
        ),
        options: [
          { label: "Estado de una compra", next: "compEstado" },
          { label: "Modificar compra", next: "no" },
          { label: "Cancelar compra", next: "no" },
        ],
      },
      estadoComp: {
        resp: () => "Ingrese el número de la factura que desea gestionar.",
        input: {
          placeholder: "Número de factura",
          buttonLabel: "Continuar",
          action: buscarFra2,
        },
      },
      compEstado: {
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
                  <b>Estado de pago:</b> {compraData.pago}
                </p>
                <p>
                  <b>Cliente:</b> {compraData.idClient}
                </p>
              </div>

              {/* Productos */}
              <div>
                <strong>Productos:</strong>

                {compraData.productos.map((prod, i) => (
                  <div key={i} className="border rounded-xl p-2 mt-2">
                    <p>
                      <b>Nombre:</b> {prod.nomProd}
                    </p>
                    <p>
                      <b>Cantidad:</b> {prod.cantidad}
                    </p>
                    <p>
                      <b>Valor:</b> ${prod.valor}
                    </p>
                    <p>
                      <b>Categoría:</b> {prod.etiqueta}
                    </p>
                    <p>
                      <b>Versión:</b> {prod.version}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        },
        options: [{ label: "Menú principal", next: "menu" }],
      },
    }),
    [userName, nota, buscarFra, respFra, GuardarImg, compraData],
  );

  return { rules, selectedImage };
}
