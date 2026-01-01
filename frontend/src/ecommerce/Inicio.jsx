// Inicio.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Buscar from "./Buscar";
import MenuLateral from "./Menu";
import Detalle from "./Detalle";
import CarroCompra from "./CarroCompra";
import Cliente from "./Cliente";
import {
  Menu,
  ArrowLeft,
  ArrowRight,
  Heart,
  Truck,
  ShoppingCart,
  Home,
  User,
  Star,
  Copy,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Alerta from "./Alerta";
import "./Inicio.css";

const URLAPI = import.meta.env.VITE_URLAPI;
const WPP_LINK = import.meta.env.VITE_WPP_LINK;
function formatPrice(n) {
  if (typeof n !== "number") return n;
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}
function stripCodigo(name = "") {
  return name.replace(/\s*([A-Za-z]{3})(\d{2})?$/i, "").trim();
}

function avgRating(arr = []) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// main component
export default function Inicio() {
  const [data, setData] = useState([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [tags, setTags] = useState(["Todos"]);
  const [tagPageIndex, setTagPageIndex] = useState(0);
  const [tagWindowSize, setTagWindowSize] = useState(3);
  const [activeTag, setActiveTag] = useState("Todos");
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [dataFiltrada, setDataFiltrada] = useState([]);
  const [favorites, setFavorites] = useState({});
  const containerRef = useRef(null);
  const [autenticado, setAutenticado] = useState(false);
  const [opcionOrden, setOpcionOrden] = useState("Aleatorio");
  const [detalleId, setDetalleId] = useState(null);
  const [detalleProducto, setDetalleProducto] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [mostrarCarro, setMostrarCarro] = useState(false);
  const [productoCompraDirecta, setProductoCompraDirecta] = useState(null);
  const [versionesSeleccionadas, setVersionesSeleccionadas] = useState({});
  const [alertaInicio, setAlertaInicio] = useState({
    visible: false,
    titulo: "",
    texto: "",
  });
  const [mostrarCliente, setMostrarCliente] = useState(false);
  const [modoCliente, setModoCliente] = useState("inicio");
  const [searchPlaceholder, setSearchPlaceholder] =
    useState("Buscar por Nombre");
  const [searchClearSignal, setSearchClearSignal] = useState(0);
  const [infoPedido, setInfoPedido] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/P")) {
      const id = path.slice(2);
      setDetalleId(id);
    }

    const handlePopState = () => {
      const newPath = window.location.pathname;
      if (newPath.startsWith("/P")) {
        const id = newPath.slice(2);
        setDetalleId(id);
      } else {
        setDetalleId(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    window.dispararAlerta = mostrarAlertaInicio;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setVisibleCount(mobile ? 12 : 40);
      if (mobile) {
        setTagWindowSize(3);
      } else {
        const total = window.innerWidth;

        const menuWidth = 50; // botón menú
        const searchWidth = total * 0.2; // buscador 20%
        const arrowsWidth = 40 * 2; // flecha izq + derecha
        const gaps = 40; // márgenes y espacios internos

        const available =
          total - (menuWidth + searchWidth + arrowsWidth + gaps);

        // Valor real que ocupan tus tags (probado con tu CSS)
        const tagWidth = 95;

        const fit = Math.max(3, Math.floor(available / tagWidth));
        setTagWindowSize(fit);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (usuario && Array.isArray(usuario.favoritos)) {
      const favMap = {};
      usuario.favoritos.forEach((id) => (favMap[id] = true));
      setFavorites(favMap);
    } else {
      setFavorites({});
    }
    // Si usuario viene con carrito prellenado, no hacemos nada especial aquí
  }, [usuario]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${URLAPI}/api/prod`);
        if (cancelled) return;

        const exclude = new Set(["Servicios papeleria", "Servicios técnicos"]);
        const productosValidos = (Array.isArray(data) ? data : []).filter(
          (p) => !exclude.has(p.etiqueta)
        );

        setData(productosValidos);

        const etiquetas = Array.from(
          new Set(productosValidos.map((p) => p.etiqueta).filter(Boolean))
        );

        setTags(["Todos", ...etiquetas]);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => (cancelled = true);
  }, [URLAPI]);

  useEffect(() => {
    const onScroll = () => {
      const scrollable = document.documentElement;
      const scrolled = window.scrollY + window.innerHeight;
      const nearBottom = scrolled + 200 >= scrollable.scrollHeight;
      if (nearBottom) {
        setVisibleCount((v) => v + (isMobile ? 12 : 40));
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  const displayed = (dataFiltrada.length ? dataFiltrada : data)
    .filter((p) => (activeTag === "Todos" ? true : p.etiqueta === activeTag))
    .slice(0, visibleCount);

  // NUEVO: función central para agregar desde la card
  const handleAddToCartFromCard = async (p) => {
    if (!autenticado || !usuario || !usuario._id) {
      mostrarAlertaInicio(
        "Inicia sesión",
        "Necesitas iniciar sesión para continuar."
      );
      return;
    }

    // --- Parseo de versiones igual que en Detalle ---
    function parseVersiones(str) {
      if (!str) return [];
      const parts = str.split("-");
      const res = [];
      for (let i = 0; i < parts.length; i += 2) {
        const nombre = parts[i];
        const stock = parseInt(parts[i + 1], 10);
        if (nombre && !isNaN(stock)) res.push({ nombre, stock });
      }
      return res;
    }

    const versionesParsed = parseVersiones(p.version);

    // ✔️ TOMAR LA VERSIÓN ELEGIDA EN LA CARD
    let versionSel = versionesSeleccionadas[p._id] || "";
    let maxStock = p.stock ?? p.cantidad ?? 0;

    if (versionesParsed.length) {
      // buscar la versión seleccionada
      const v = versionesParsed.find((x) => x.nombre === versionSel);

      if (!v) {
        // si por alguna razón no existe, usar la primera como fallback
        versionSel = versionesParsed[0].nombre;
        maxStock = versionesParsed[0].stock;
      } else {
        maxStock = v.stock;
      }
    }

    if (maxStock <= 0) {
      mostrarAlertaInicio(
        "Cantidad Máxima",
        "Ya agregó el maximo de unidades disponibles."
      );
      return;
    }

    const carritoActual = usuario.carrito || [];

    // Buscar si ya existe este producto + versión
    const existente = carritoActual.find(
      (item) =>
        item.productoId === p._id &&
        item.version ===
          (versionesParsed.length ? `${versionSel}-${maxStock}` : "")
    );

    let nuevoCarrito;

    if (existente) {
      // aumentar +1
      if (existente.cantidad + 1 > maxStock) {
        mostrarAlertaInicio(
          "Cantidad Máxima",
          "Ya agregó el maximo de unidades disponibles."
        );
        return;
      }

      nuevoCarrito = carritoActual.map((x) =>
        x === existente ? { ...x, cantidad: x.cantidad + 1 } : x
      );
    } else {
      // agregar nuevo ítem
      nuevoCarrito = [
        ...carritoActual,
        {
          productoId: p._id,
          cantidad: 1,
          version: versionesParsed.length ? `${versionSel}-${maxStock}` : "",
        },
      ];
    }

    // Ajustes si stock bajó en el servidor (igual que en detalle)
    nuevoCarrito = nuevoCarrito.map((item) => {
      if (item.productoId !== p._id) return item;

      if (!versionesParsed.length) {
        const globalStock = p.stock ?? p.cantidad ?? 0;
        if (item.cantidad > globalStock) item.cantidad = globalStock;
        return item;
      }

      const nombre = item.version.split("-")[0];
      const v = versionesParsed.find((x) => x.nombre === nombre);
      const max = v ? v.stock : 0;

      if (item.cantidad > max) item.cantidad = max;
      return item;
    });

    // --- payload EXACTO que usa Detalle ---
    const payload = [
      {
        _id: usuario._id,
        carrito: nuevoCarrito,
      },
    ];

    try {
      await axios.put(`${URLAPI}/api/clie`, payload);
      setUsuario((u) => ({ ...u, carrito: nuevoCarrito }));
      mostrarAlertaInicio(
        "Proceso exitoso",
        "Un Producto agregado al carrito."
      );
    } catch (err) {
      console.error("Error agregando al carrito:", err);
      mostrarAlertaInicio("Algo salio mal", "Error al agregar al carrito.");
    }
  };
  const volverAlInicio = () => {
    // Restaurar listado completo
    setDataFiltrada(data);

    // Restaurar placeholder del buscador
    setSearchPlaceholder("Buscar por Nombre");

    // Limpiar input del componente Buscar
    setSearchClearSignal((n) => n + 1);

    // Llevar scroll a 0
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Toggle favorito (ya lo tenías): lo dejamos igual pero sin alert()
  const toggleFavorite = async (productoId) => {
    if (!autenticado || !usuario || !usuario._id) {
      mostrarAlertaInicio(
        "Inicia sesión",
        "Necesitas iniciar sesión para continuar."
      );
      return;
    }

    try {
      const esFavorito = !!favorites[productoId];
      const nuevosFavoritos = esFavorito
        ? (usuario.favoritos || []).filter((id) => id !== productoId)
        : [...(usuario.favoritos || []), productoId];

      setFavorites((prev) => ({ ...prev, [productoId]: !esFavorito }));
      setUsuario((prev) => ({ ...prev, favoritos: nuevosFavoritos }));

      const payload = [
        {
          _id: usuario._id,
          favoritos: nuevosFavoritos,
        },
      ];

      await axios.put(`${URLAPI}/api/clie`, payload);
    } catch (error) {
      console.error("❌ Error al actualizar favoritos:", error);
      mostrarAlertaInicio("Algo salio mal", "Error al actualizar favoritos.");
    }
  };

  const totalTagPages = Math.ceil(Math.max(tags.length - 0, 0) / tagWindowSize);
  const visibleTags = tags.slice(
    tagPageIndex * tagWindowSize,
    tagPageIndex * tagWindowSize + tagWindowSize
  );
  const prevTagPage = () => setTagPageIndex((i) => Math.max(0, i - 1));
  const nextTagPage = () =>
    setTagPageIndex((i) => Math.min(totalTagPages - 1, i + 1));

  const onMenuClick = () => {
    if (isMobile) {
      setShowMenuModal(true);
    } else {
      const newState = !menuAbierto;
      setMenuAbierto(newState);
      document.body.classList.toggle("show-left-sidebar", newState);
    }
  };

  // cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!menuAbierto) return;

    const handleClickOutside = (e) => {
      const sidebar = document.querySelector(".left-sidebar");
      const toggleButton = document.querySelector(".icon-btn");

      if (
        sidebar &&
        !sidebar.contains(e.target) &&
        toggleButton &&
        !toggleButton.contains(e.target)
      ) {
        setMenuAbierto(false);
        document.body.classList.remove("show-left-sidebar");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuAbierto]);
  const mostrarAlertaInicio = (titulo, texto) => {
    setAlertaInicio({
      visible: true,
      titulo,
      texto,
    });
  };

  const onClickCerrarInicio = () => {
    setAlertaInicio({
      ...alertaInicio,
      visible: false,
    });
  };

  const abrirDetalleDesdeRecomendado = (id) => {
    setDetalleId(id);
    window.history.pushState({}, "", `/P${id}`);
  };
  // ✔ Mostrar solo los productos favoritos del usuario
  const mostrarSoloFavoritos = () => {
    if (!autenticado || !usuario?.favoritos?.length) {
      setDataFiltrada([]); // No hay favoritos
      return;
    }
    setSearchPlaceholder("Mostrando favoritos");
    setSearchClearSignal((x) => x + 1);
    const idsFavoritos = new Set(usuario.favoritos);

    // Filtrar igual que el buscador
    const filtrados = data.filter((p) => idsFavoritos.has(p._id));

    setDataFiltrada(filtrados);
    setActiveTag("Todos"); // Evitar conflictos con categorías
    setTagPageIndex(0); // Reset paginado de categorías si quieres
  };
  const copiarLinkProducto = async (id) => {
    const url = `${window.location.origin}/P${id}`;

    try {
      await navigator.clipboard.writeText(url);
      mostrarAlertaInicio(
        "Link copiado",
        "El enlace del producto fue copiado."
      );
    } catch (e) {
      console.error("Error copiando link", e);
      mostrarAlertaInicio("Error", "No se pudo copiar el enlace.");
    }
  };

  return (
    <div className="inicio-root">
      {/* Top area */}
      <header className={`top-area ${isMobile ? "top-hide-on-scroll" : ""}`}>
        <div className="top-row first-row">
          <button className="icon-btn" onClick={onMenuClick} aria-label="menu">
            <Menu />
          </button>
          <Buscar
            data={data}
            onBuscar={(filtrados, rawQuery) => {
              // Si el usuario empezó a escribir → placeholder vuelve a normal
              if (rawQuery && rawQuery.length > 0) {
                if (searchPlaceholder !== "Buscar por Nombre") {
                  setSearchPlaceholder("Buscar por Nombre");
                }
              }

              setDataFiltrada(filtrados);
            }}
            placeholder={searchPlaceholder}
            clearSignal={searchClearSignal}
            // ⬅️ NUEVO: comando para limpiar desde el botón X
            onClear={() => {
              setDataFiltrada(data); // restaurar lista completa
              setSearchPlaceholder("Buscar por Nombre"); // restaurar texto
              setSearchClearSignal((n) => n + 1); // vacía el input en Buscar.jsx
            }}
          />
        </div>

        <div className="top-row second-row">
          <button
            className="tag-nav"
            onClick={prevTagPage}
            disabled={tagPageIndex === 0}
            aria-label="prev"
          >
            <ArrowLeft />
          </button>

          <div className="tags-scroll">
            {visibleTags.map((t) => (
              <button
                key={t}
                className={`tag-btn ${t === activeTag ? "active" : ""}`}
                onClick={() => {
                  setActiveTag(t);

                  // SI NO ESTOY mostrando favoritos → restauro buscador
                  if (searchPlaceholder !== "Mostrando favoritos") {
                    setSearchPlaceholder("Buscar por Nombre");
                  }

                  setSearchClearSignal((x) => x + 1);
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            className="tag-nav"
            onClick={nextTagPage}
            disabled={tagPageIndex >= totalTagPages - 1 || totalTagPages === 0}
            aria-label="next"
          >
            <ArrowRight />
          </button>
        </div>
      </header>

      {/* Center - products */}
      <main className="products-area" ref={containerRef}>
        <div className="cards-grid">
          {displayed.map((p) => {
            const rating = Math.round(avgRating(p.calificacion));
            const match = p.nombre.match(/(\d{2})$/);
            const discount = match ? parseInt(match[1], 10) : 0;
            const hasDiscount = discount > 0;
            const shortName = stripCodigo(p.nombre);
            const discountedPrice = hasDiscount
              ? p.valorVenta - (p.valorVenta * discount) / 100
              : p.valorVenta;

            const grayedClass = !autenticado ? "btn-grayed" : "";

            return (
              <article className="card" key={p._id}>
                <div className="card-media">
                  <img
                    src={p.urlFoto1}
                    alt={p.nombre}
                    loading="lazy"
                    onClick={() => {
                      setDetalleProducto(p);
                      setDetalleId(p._id);
                      window.history.pushState({}, "", `/P${p._id}`);
                    }}
                  />
                  <button
                    className="fav-btn"
                    onClick={() => {
                      if (!autenticado) {
                        mostrarAlertaInicio(
                          "Inicia sesión",
                          "Necesitas iniciar sesión para continuar."
                        );
                        return;
                      }
                      toggleFavorite(p._id);
                    }}
                    aria-label="fav"
                    style={{
                      cursor: autenticado ? "pointer" : "pointer",
                      opacity: autenticado ? 1 : 0.6,
                    }}
                  >
                    <Heart
                      className={`fav-icon ${favorites[p._id] ? "fav-on" : ""}`}
                    />
                  </button>
                  <div className="stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`star-icon ${i < rating ? "on" : "off"}`}
                        size={14}
                      />
                    ))}
                  </div>
                </div>

                <div className="card-body">
                  <h3 className="card-title">{shortName}</h3>
                  <p className="card-desc">
                    {p.descripcion || "Sin descripción"}
                  </p>
                  <div className="card-price">
                    {hasDiscount ? (
                      <>
                        <span className="price-old">
                          {formatPrice(p.valorVenta)}
                        </span>
                        <span className="price-new">
                          {formatPrice(discountedPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="price-new">
                        {formatPrice(p.valorVenta)}
                      </span>
                    )}

                    {p.version ? (
                      (() => {
                        const partes = p.version.split("-");
                        const versiones = [];
                        for (let i = 0; i < partes.length; i += 2) {
                          const nombre = partes[i];
                          const cantidad = parseInt(partes[i + 1], 10) || 0;
                          versiones.push({ nombre, cantidad });
                        }

                        const seleccionada =
                          versionesSeleccionadas[p._id] || versiones[0]?.nombre;

                        return (
                          <select
                            className="version-select"
                            value={seleccionada}
                            onChange={(e) =>
                              setVersionesSeleccionadas((prev) => ({
                                ...prev,
                                [p._id]: e.target.value,
                              }))
                            }
                          >
                            {versiones.map((v) => (
                              <option key={v.nombre} value={v.nombre}>
                                {v.nombre} ({v.cantidad})
                              </option>
                            ))}
                          </select>
                        );
                      })()
                    ) : (
                      <span className="stock-info">
                        Disponibles {p.stock ?? p.cantidad ?? 0}
                      </span>
                    )}
                    {/* BOTÓN COPIAR LINK */}
                    <div
                      className="copy-link-container"
                      onClick={() => copiarLinkProducto(p._id)}
                    >
                      {isMobile ? <Copy size={18} /> : "Copiar Link"}
                    </div>
                  </div>

                  <div className="card-buttons">
                    <button
                      className={`buy-btn ${hasDiscount ? "discount" : ""}`}
                      onClick={() => {
                        setProductoCompraDirecta(p);
                        setMostrarCarro(true);
                      }}
                    >
                      {hasDiscount ? `Comprar (-${discount}%)` : "Comprar"}
                    </button>

                    <button
                      className={`buy-btn ${grayedClass}`}
                      onClick={() =>
                        handleAddToCartFromCard(
                          p,
                          versionesSeleccionadas[p._id]
                        )
                      }
                    >
                      <ShoppingCart size={18} />
                      x1
                    </button>
                  </div>

                  <div className="card-footer">
                    <span>Envió Gratis según el valor comprado</span>
                    <Truck className="mini-cart" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* Bottom fixed bar */}
      <nav className="bottom-bar">
        {/* CARRITO */}
        <button
          className={`bottom-btn carrito-btn ${!autenticado ? "disabled" : ""}`}
          onClick={() => {
            if (!autenticado) return;
            setProductoCompraDirecta(null);
            setMostrarCarro(true);
          }}
          style={{
            cursor: autenticado ? "pointer" : "default",
          }}
        >
          <ShoppingCart />

          <span className="carrito-badge">
            {autenticado && usuario?.carrito?.length
              ? usuario.carrito.reduce(
                  (acc, item) => acc + (item.cantidad || 0),
                  0
                )
              : 0}
          </span>
        </button>

        {/* INICIO */}
        <button
          className="bottom-btn"
          onClick={volverAlInicio}
          style={{ cursor: "pointer" }}
        >
          <Home />
        </button>

        {/* USUARIO */}
        <button
          className={`bottom-btn ${!autenticado ? "disabled" : ""}`}
          onClick={() => {
            if (!autenticado) return;
            setModoCliente("inicio");
            setMostrarCliente(true);
          }}
          style={{
            cursor: autenticado ? "pointer" : "default",
          }}
        >
          <User />
        </button>

        {/* WHATSAPP */}
        <button
          className="bottom-btn whatsapp"
          onClick={() => {
            if (!WPP_LINK) {
              console.error("❌ No existe VITE_WPP_LINK en .env");
              return;
            }
            window.open(WPP_LINK, "_blank");
          }}
          style={{ cursor: "pointer" }}
        >
          <FaWhatsapp />
        </button>
      </nav>

      {/* Sidebar desktop */}
      <aside className="left-sidebar">
        <MenuLateral
          autenticado={autenticado}
          setAutenticado={setAutenticado}
          usuario={usuario}
          setUsuario={setUsuario}
          onOrdenar={(orden) => {
            if (searchPlaceholder !== "Mostrando favoritos") {
              setSearchPlaceholder("Buscar por Nombre");
            }
            setSearchClearSignal((x) => x + 1);
            setOpcionOrden(orden);
            setDataFiltrada((prev) => {
              let arr = [...(prev.length ? prev : data)];

              switch (orden) {
                case "Menor Precio":
                  arr.sort((a, b) => a.valorVenta - b.valorVenta);
                  break;
                case "Mayor Precio":
                  arr.sort((a, b) => b.valorVenta - a.valorVenta);
                  break;
                case "Mejor Calificación":
                  arr.sort((a, b) => {
                    const ra =
                      (a.calificacion || []).reduce((x, y) => x + y, 0) /
                      ((a.calificacion || []).length || 1);
                    const rb =
                      (b.calificacion || []).reduce((x, y) => x + y, 0) /
                      ((b.calificacion || []).length || 1);
                    return rb - ra;
                  });
                  break;
                case "Aleatorio":
                default:
                  arr.sort(() => Math.random() - 0.5);
                  break;
              }

              return arr;
            });
          }}
          opcionOrden={opcionOrden}
          onMostrarFavoritos={mostrarSoloFavoritos}
        />
      </aside>

      {/* Mobile Menu Modal */}
      {showMenuModal && isMobile && (
        <div className="modal-overlay" onClick={() => setShowMenuModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <MenuLateral
              isMobile={true}
              autenticado={autenticado}
              setAutenticado={setAutenticado}
              usuario={usuario}
              setUsuario={setUsuario}
              onOrdenar={(orden) => {
                if (searchPlaceholder !== "Mostrando favoritos") {
                  setSearchPlaceholder("Buscar por Nombre");
                }
                setSearchClearSignal((x) => x + 1);
                setOpcionOrden(orden);
                setDataFiltrada((prev) => {
                  let arr = [...(prev.length ? prev : data)];
                  switch (orden) {
                    case "Menor Precio":
                      arr.sort((a, b) => a.valorVenta - b.valorVenta);
                      break;
                    case "Mayor Precio":
                      arr.sort((a, b) => b.valorVenta - a.valorVenta);
                      break;
                    case "Mejor Calificación":
                      arr.sort((a, b) => {
                        const ra =
                          (a.calificacion || []).reduce((x, y) => x + y, 0) /
                          ((a.calificacion || []).length || 1);
                        const rb =
                          (b.calificacion || []).reduce((x, y) => x + y, 0) /
                          ((b.calificacion || []).length || 1);
                        return rb - ra;
                      });
                      break;
                    default:
                      arr.sort(() => Math.random() - 0.5);
                      break;
                  }
                  return arr;
                });
              }}
              opcionOrden={opcionOrden}
              onMostrarFavoritos={mostrarSoloFavoritos}
            />
          </div>
        </div>
      )}

      {detalleId && (
        <Detalle
          productoId={detalleId}
          onClose={() => {
            setDetalleId(null);
            setDetalleProducto(null);
            window.history.pushState({}, "", "/");
          }}
          usuario={usuario}
          autenticado={autenticado}
          setUsuario={setUsuario}
          setInfoPedido={setInfoPedido}
          setMostrarCliente={setMostrarCliente}
          setModoCliente={setModoCliente}
          mostrarAlertaInicio={mostrarAlertaInicio} // ✔ agregado
          abrirDetalleDesdeRecomendado={abrirDetalleDesdeRecomendado}
        />
      )}

      {mostrarCarro && (
        <CarroCompra
          visible={mostrarCarro}
          onClose={() => setMostrarCarro(false)}
          clienteId={usuario?._id}
          productoDirecto={productoCompraDirecta}
          setUsuario={setUsuario}
          setMostrarCliente={setMostrarCliente}
          setModoCliente={setModoCliente}
          setInfoPedido={setInfoPedido}
        />
      )}
      {mostrarCliente && (
        <Cliente
          onClose={() => setMostrarCliente(false)}
          clienteId={usuario ? usuario._id : null}
          modo={modoCliente}
          setUsuario={setUsuario}
          infoPedido={infoPedido}
        />
      )}
      <Alerta
        visible={alertaInicio.visible}
        titulo={alertaInicio.titulo}
        texto={alertaInicio.texto}
        onClose={onClickCerrarInicio}
      />
    </div>
  );
}
