// rules.js
export let nombreUsuario = "Usuario";
// 🧠 variable global compartida entre rules
export let respuesta = null;
// funcion para actualizar nombre
export function setNombreUsuario(nombre) {
  nombreUsuario = nombre || "Usuario";
}
// 👉 función que se ejecuta desde el chat
function buscarFra(valor) {
  //en verdad debe validar factura en API
  if (isNaN(valor) || valor.toString().length !== 5) {
    respuesta = "El valor ingresado no es válido";
    return;
  }
  const numero = Number(valor);
  if (numero % 2 === 0) {
    respuesta = "Factura valida";
  } else {
    respuesta = "El valor ingresado no es válido";
  }
}
function respFra() {
  if (respuesta === "El valor ingresado no es válido") {
    return "fraNo";
  } else {
    return "fraSi";
  }
}
function GuardarImg() {
  console.log("factura guardada. ");
  
}

// 📜 reglas del bot
export const rules = {
  menu: {
    resp: () => `Hola 👋 ${nombreUsuario}, Elige una opción del menú principal`,
    options: [
      { label: "Medios de pago", next: "nPagos" },
      { label: "Gestionar compras", next: "no" },
      { label: "Recuperar Clave", next: "no" },
      { label: "Contactar un asesor", next: "no" },
    ],
  },
  nPagos: {
    resp: () => `Seleccione un medio de pago para obtener mayor información.`,
    options: [
      { label: "Pago transferencia", next: "infoTransfer" },
      { label: "Contra entrega", next: "no" },
      { label: "Pago SisteCedito", next: "no" },
      { label: "PSE", next: "no" },
    ],
  },
  infoTransfer: {
    resp: () => `¿Desea obtener nuestra información bancaria o realizar el pago de una factura pendiente?`,
    options: [
      { label: "Pago de factura pendiente", next: "pTransfer" },
      { label: "Información Bancaria", next: "datoBanco" },
    ],
  },
  datoBanco: {
    resp: () => `Puede realizar la transferencia  a nuestra cuenta de Ahorros de Bancolombia 24083017828 o con nuestra llave Pre-B 0090625768, ingresar nuevamente a este chat para cargar el comprobante y el numero de factura relacionado con el pago.`,
    options: [{ label: "Menú principal", next: "menu" }],
  },

  pTransfer: {
    resp: () => "Ingrese el numero de factura pendiente por pagar. ",
      input: {
        placeholder: "Numero de factura",
        buttonLabel: "Continuar",
        action: buscarFra,
        next: respFra //fraNo o fraSi 
      }
    },

  fraNo: {
    resp: () => `El número de factura ingresado no es válido, puede ingresar al menú principal de este Chat, en la opción “Gestionar compras” > “Mis facturas” o en el menú lateral de esta página Web en la opción “Compras” y ver todas tus facturas. también puedes comunicarte a nuestra línea WhatsApp 3337351040.`,
    options: [{ label: "Menú principal", next: "menu" }],
  },
  
  fraSi: {
    resp: () => `Para realizar el pago de la factura debe realizar la transferencia a nuestra cuenta de Ahorros de Bancolombia 24083017828 o con nuestra llave Pre-B 0090625768, y cargar la imagen del comprobante de pago en el botón “Cargar Imagen”.`,
    options: [
      { label: "Cargar Imagen",
        action: GuardarImg,
        next: "cargarimg" },
      { label: "Menú principal", next: "menu" },
    ],
  },

  cargarimg: {
    resp: () =>
      `La imagen  fue cargada con éxito nuestro equipo confirmara la transición en los próximos 30 minutos en horario laborar o al siguiente día hábil y te confirmaremos la recepción del pago y la continuidad del proceso.\n\nChat finalizado, muchas gracias por acceder a nuestros servicios,  `,
    options: [{ label: "Volver al menu Principal",
        next: "menu" }],
  },
  fin: {
    resp: () =>
      `Chat finalizado, muchas gracias por acceder a nuestros servicios.`,
    options: [{ label: "Menú principal", next: "menu" }],
  },
  no: {
    resp: () =>
      `Esta opción aun no esta disponible.`,
    options: [{ label: "Menú principal", next: "menu" }],
  },

  /* ejemplos ----------------------
  recuperarTelefono: {
    resp: () => "Tu teléfono registrado es 3001234567",
    options: [{ label: "Volver al inicio", next: "inicio" }],
  },

  descuento: {
    resp: () => "Ingresa el valor para calcular el descuento:",
    input: {
      placeholder: "Ej: 50000",
      buttonLabel: "Calcular",
      action: calcularDescuento,
      next: "respuestaDescuento",
    },
  },

  respuestaDescuento: {
    resp: () =>
      `La respuesta a tu petición es:\n\n${respuesta ?? "Sin respuesta aún"}`,
    options: [{ label: "Volver al inicio", next: "menu" }],
  }*/
};
