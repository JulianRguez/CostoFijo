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
  ClipboardList,
  AlertCircle,
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
            pago: "Pago en verificación",
            imgPago: urlImg,
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
    return data.secure_url; // 👈 ESTE es el URL público
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
          <p style={{ margin: 0 }}>
            <br />
            <Smile
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>Menu Principal: </strong>
            Hola {userName || "Usuario"}, ¿Cómo podemos ayudarte hoy? Elige una
            opción del menú para continuar.
          </p>
        ),
        options: [
          { label: "Ver medios de pago", next: "medPag" },
          { label: "Gestionar mi compra", next: "ingFra" },
          { label: "Cotizar cámaras y vigilancia", next: "camMenu" },
          { label: "Recuperar contraseña", next: "recClav" },
          { label: "Guía de compra", next: "comCom" },
          { label: "Hablar con un asesor", next: "aWpp" },
        ],
      },
      medPag: {
        resp: () => (
          <p style={{ margin: 0 }}>
            <Receipt
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>Medios de pago: </strong>
            Seleccione un medio de pago para obtener más información.
          </p>
        ),
        options: [
          { label: "Pago por transferencia", next: "transf" },
          { label: "Pago Contra entrega", next: "conEnt" },
          { label: "Pago con Sistecedito", next: "sisCre" },
          { label: "Pago con ADDI", next: "addi" },
          { label: "Pago con PSE", next: "pse" },
        ],
      },
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
      },
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
      },
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
      },
      addi: {
        resp: () =>
          "Esta opción aún no está disponible, puedes usar Sistecredito como metodo de financiacion.",
      },
      pse: {
        resp: () =>
          "Esta opción aún no está disponible, recomendamos realizar su pago a través de transferencia u otro medio disponible",
      },
      ingFra: {
        resp: () => (
          <p style={{ margin: 0 }}>
            <FileText
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>Radicados: </strong>
            Para pagar, cancelar, solicitar una devolución o registrar una queja
            o comentario sobre una compra realizada, ingresa el número de
            factura.
          </p>
        ),
        input: {
          placeholder: "Número de factura",
          buttonLabel: "Continuar",
          action: buscarFra2,
        },
      },
      fraNo: {
        resp: () => (
          <p style={{ margin: 0 }}>
            <AlertCircle
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>Error: </strong>
            El número de factura ingresado no es válido. Puedes verificar tus
            facturas desde el menú lateral izquierdo, en la opción “Compras”.
          </p>
        ),
      },
      gesCom: {
        resp: () => (
          <p style={{ margin: 0 }}>
            <Smile
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>Gestion de compra: </strong>
            Elige una opción para modificar el estado de tu compra o para
            presentar alguna petición:
          </p>
        ),
        options: (() => {
          const pago = compraData?.pago ?? "";
          const opts = [{ label: "Estado de la compra", next: "estcom" }];

          if (pago === "Pendiente por pagar")
            opts.push({ label: "Realizar pago", next: "opsPag" });
          else
            opts.push({
              label: "PQRS, devolución y garantía",
              next: "reclamo",
            });

          return opts;
        })(),
      },
      estcom: {
        resp: () => {
          if (!compraData) {
            return "No se encontró información de la compra.";
          }

          return (
            <p style={{ margin: 0 }}>
              <ShoppingCart
                size={30}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              <strong>Importante:</strong> La información refleja el estado
              actual de la compra y puede cambiar posteriormente. Si espera
              alguna actualización, consulte más tarde.
              <div className="space-y-3">
                <br />
                {/* Datos generales */}
                <div>
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
                  {new Intl.NumberFormat("es-CO").format(
                    compraData.otrosCobros,
                  )}
                </p>
                <p>
                  <b>Total compra:</b> $
                  {new Intl.NumberFormat("es-CO").format(totalFinal)}
                </p>
              </div>
            </p>
          );
        },
      },
      opsPag: {
        resp: () => (
          <p style={{ margin: 0 }}>
            <BadgeCheck
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>Opciones de pago: </strong>
            Elige el medio de pago que desea usar para cancelar la factura
          </p>
        ),
        options: [
          { label: "Pago por transferencia", next: "pagTra" },
          { label: "Contra entrega", next: "pagCen" },
          { label: "Pago con Sistecedito", next: "pagCre" },
          { label: "Pago con ADDI", next: "pagCre" },
          { label: "Pago con PSE", next: "no" },
        ],
      },
      pagTra: {
        resp: () => {
          if (mensajeFactura === "") {
            return (
              <p style={{ margin: 0 }}>
                <br />
                <FileText
                  size={30}
                  color="orange"
                  style={{ float: "left", marginRight: "10px" }}
                />
                <strong>Realizar pago: </strong>
                <>
                  Realice la transferencia o consignación y carge el comprobante
                  desde "Seleccionar archivo".
                  <br />
                  <br />
                  <div style={{ color: "orange" }}>Datos bancarios:</div>
                  Cuenta ahorros Bancolombia: 24083017828
                  <br />
                  llave BRE-B: 3226400155
                  <br />
                  <br />
                  Si va a cargar el comprobante posteriormente, puede hacerlo
                  ingresando a este chat desde el icono{" "}
                  <Bot
                    size={18}
                    style={{ verticalAlign: "middle", color: "orange" }}
                  />{" "}
                  e ingresar el número de factura, el cual puede visualizar en
                  el menú lateral en la opción “Compras”.
                </>
              </p>
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
      pagCen: {
        resp: () => (
          <p style={{ margin: 0 }}>
            <br />
            <CheckCircle
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>Pedido confirmado con pago contra entrega: </strong>
            Tu pedido ha sido registrado. Pagarás al momento de recibir el
            producto. Nuestro equipo se pondrá en contacto via WhatsApp para
            coordinar la entrega.
          </p>
        ),
        onEnter: () => {
          fetch(`/api/vent/${compraData._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": API_KEY,
            },
            body: JSON.stringify({ pago: "Pendiente de envío" }),
          }).catch(console.error);
        },
      },
      pagCre: {
        resp: () => (
          <p style={{ margin: 0 }}>
            <br />
            <CheckCircle
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>Pedido confirmado para pago a credito: </strong>
            Tu pedido ha sido registrado. Nuestro equipo se pondrá en contacto
            contigo para coordinar el pago a credito.
          </p>
        ),
        onEnter: () => {
          fetch(`/api/vent/${compraData._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": API_KEY,
            },
            body: JSON.stringify({ pago: "Esperando crédito" }),
          }).catch(console.error);
        },
      },
      reclamo: {
        resp: () => (
          <p style={{ margin: 0 }}>
            <ClipboardList
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>Presentar una Solicitud: </strong>
            Selecciona la opción que corresponda para presentar un PQRS, obtener
            garantía o realizar la devolución de un producto.
          </p>
        ),
        options: [
          {
            label: "Radicar una solicitud",
            next: "fin",
            action: () => {
              const WPP_LINK = import.meta.env.VITE_WPP_LINK;

              const mensaje = encodeURIComponent(
                `Hola, necesito Radicar una solicitud relacionado con un producto de la factura ${compraData?.factura}`,
              );

              window.open(`${WPP_LINK}?text=${mensaje}`, "_blank");
            },
          },
          {
            label: "Hacer devolución",
            next: "fin",
            action: () => {
              const WPP_LINK = import.meta.env.VITE_WPP_LINK;

              const mensaje = encodeURIComponent(
                `Hola, necesito Hacer devolución relacionado con un producto de la factura ${compraData?.factura}`,
              );

              window.open(`${WPP_LINK}?text=${mensaje}`, "_blank");
            },
          },
          {
            label: "Solicitar una Garantía",
            next: "fin",
            action: () => {
              const WPP_LINK = import.meta.env.VITE_WPP_LINK;

              const mensaje = encodeURIComponent(
                `Hola, necesito Solicitar una Garantía relacionado con un producto de la factura ${compraData?.factura}`,
              );

              window.open(`${WPP_LINK}?text=${mensaje}`, "_blank");
            },
          },
        ],
      },
      fin: {
        resp: () => (
          <p style={{ margin: 0 }}>
            <CheckCircle
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>El chat ha finalizado: </strong>
            Si tiene alguna inquietud o solicitud, cierre esta ventana e ingrese
            nuevamente a este chat de atención automatizada.
          </p>
        ),
      },
      finErr: {
        resp: () => (
          <p style={{ margin: 0 }}>
            <CheckCircle
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>El chat ha finalizado: </strong>
            Error en la solicitud registrada, cierre esta venta e ingrese
            nuevamente a este chat de atención automatizada.
          </p>
        ),
      },
      procFin: {
        resp: () => (
          <p style={{ margin: 0 }}>
            <CheckCircle
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>El chat ha finalizado: </strong>
            Su solicitud ha registrada con éxito, si tiene alguna inquietud o
            solicitud ingrese nuevamente a este chat de atención automatizada.
          </p>
        ),
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
              <strong> Comprobante erróneo: </strong>
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
      recClav: {
        resp: () => (
          <p style={{ margin: 0 }}>
            <ShoppingCart
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>Recuperar su contraseña: </strong>
            Debes suministrar la información más completa posible, siendo
            obligatorio el número de celular o correo electrónico, acompañado de
            contraseñas anteriores, correos usados, nombre de usuario y número
            de documento de identidad. la información será revisada y si
            coincide con nuestros registros enviaremos en un plazo máximo de 30
            minutos el link de recuperación de contraseña a su correo
            electrónico y por mensaje de mensaje de texto al número celular si
            se encuentra registrado. Recuerde que también puede solicitar el
            link de recuperación de contraseña a través de la línea whatsapp.
          </p>
        ),
        input: {
          placeholder: "Ingrese datos que recuerde.",
          buttonLabel: "Continuar",
          action: async (valor) => {
            if (!valor || valor.trim() === "") return "finErr";
            try {
              await fetch("/api/soli", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": API_KEY,
                },
                body: JSON.stringify({ solicitud: valor.trim() }),
              });
            } catch (error) {
              console.error("Error al guardar solicitud:", error);
            }
            return "procFin"; // 👈 retorna el next para que ZeusBot navegue
          },
        },
      },
      comCom: {
        resp: () => (
          <div className="space-y-3">
            <p style={{ margin: 0 }}>
              <strong>
                Para realizar una compra tenga en cuenta los siguientes
                pasos:{" "}
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
              Ingresa tus datos de envío y datos personales, selecciona el medio
              de pago y haz clic en “Confirmar pedido”.
            </p>
            <br />
            <p style={{ margin: 0 }}>
              <Truck
                size={30}
                color="orange"
                style={{ float: "left", marginRight: "10px" }}
              />
              <strong>3. Realiza el pago: </strong>
              Sigue las instrucciones según el medio de pago seleccionado. Una
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
      },
      aWpp: {
        resp: () => (
          <p style={{ margin: 0 }}>
            <ShoppingCart
              size={30}
              color="orange"
              style={{ float: "left", marginRight: "10px" }}
            />
            <strong>Iniciar chat: </strong>
            Haga clic en el siguiente botón para recibir atención personalizada
            por parte de uno de nuestros asesores.
          </p>
        ),
        options: [
          {
            label: "Ir a WhatsApp",
            next: "fin",
            action: () => {
              const WPP_LINK = import.meta.env.VITE_WPP_LINK;
              window.open(WPP_LINK, "_blank");
            },
          },
        ],
      },
    }),
    [userName, nota, GuardarImg, compraData],
  );

  return { rules, selectedImage };
}
