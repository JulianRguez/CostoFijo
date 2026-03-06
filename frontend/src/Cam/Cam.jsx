// Cam.jsx
import React, { useState } from "react";
import { X } from "lucide-react";
import "./Cam.css";

export default function Cam({ onClose }) {
  const kits = [
    "Kit DVR 4 Cámaras 2 mp DD 500 GB",
    "Kit DVR 4 Cámaras 4 mp DD 1 TB",
    "Kit DVR 8 Cámaras 4 mp DD 1 TB",
    "Kit 4 Cámaras IP 360° 3mp + SD",
    "Kit 4 Cámaras IP 360° 5mp + SD",
    "Kit 4 Cámaras IP 3mp SD 128 GB",
    "Kit 4 Cámaras IP 5mp SD 128 GB",
    "Kit 4 Cámaras IP 360° 3mp exterior",
    "Kit 4 Cámaras IP 360° 5mp exterior",
    "Kit 4 Cámaras IP 3mp exterior",
    "Kit 4 Cámaras IP 5mp exterior",
  ];

  const [selectedKit, setSelectedKit] = useState(
    "Kit DVR 4 Cámaras 2 mp DD 500 GB",
  );

  const Card = ({ center }) => (
    <div className={`cam-card `}>
      <button className="cam-card-btn">
        <span className="icon-plus">Ver {center}</span>
        <span className="text-detalles">Ver más detalles{center}</span>
      </button>
      <img
        src="https://master.com.mx/cdn/shop/products/IOT-PTZCAM_1copy_884x.jpg?v=1744663226"
        alt="producto"
        className="cam-card-img"
      />

      <select className="cam-card-select">
        <option>Producto...</option>
        <option>Cámara domo</option>
        <option>Cámara bala</option>
      </select>

      <p className="cam-card-desc">Descripción corta del producto</p>
    </div>
  );

  return (
    <div className="cam-overlay">
      <div className="cam-modal">
        {/* FILA 1 */}
        <div className="cam-topbar">
          <button className="cam-step-btn">Asesoría paso a paso</button>
          <button onClick={onClose} className="cam-close">
            <X />
          </button>
        </div>

        {/* FILA 2 MOBILE / DESKTOP */}
        <div className="cam-kit-row">
          <div className="kit-center">
            <span className="combo-label">Combo</span>
            <select
              value={selectedKit}
              onChange={(e) => setSelectedKit(e.target.value)}
              className="cam-select"
            >
              {kits.map((kit) => (
                <option key={kit}>{kit}</option>
              ))}
            </select>
          </div>
          <div className="kit-left">
            <label className="check-install">
              <input type="checkbox" /> Incluir instalación
            </label>
          </div>
          <div className="kit-price">$ 1.200.000</div>
        </div>

        <div className="form-group">
          <select id="form-group">
            <option>1 camaras</option>
            <option>2 camaras</option>
            <option>3 camaras</option>
            <option>4 camaras</option>
            <option>5 camaras</option>
            <option>6 camaras</option>
            <option>7 camaras</option>
            <option>8 camaras</option>
          </select>
          <select>
            <option>Disco duro 500 GB</option>
          </select>
        </div>

        {/* CARDS + SIDE FORM DESKTOP */}
        <div className="cam-main-layout">
          {/* SIDE FORM */}
          <div className="cam-side-form">
            <div className="form-group2">
              <p className="detalle-info">
                Información descriptiva del
                <br />
                combo
                <br />
                seleccionado.
                <br />
                combo
                <br />
                combo
                <br />
                seleccionado.
                <br />
                seleccionado.
              </p>
            </div>
          </div>
          {/* OCTAGON */}
          <div className="octagon-wrapper">
            <div className="col1">
              <div className="center-pos bor1">
                <Card center="1" />
                <div className="interno1"></div>
              </div>
              <div></div>
              <div className="center-pos bor5">
                <Card center="5" />
                <div className="interno5"></div>
              </div>
              <div></div>
              <div className="center-pos bor3">
                <Card center="3" />
                <div className="interno3"></div>
              </div>
            </div>
            <div className="col2">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            <div className="col3">
              <div className="center-pos bor7">
                <Card center="7" />
                <div className="interno7"></div>
              </div>
              <div></div>
              <div className="center-pos bor0">
                <Card center="0" />
              </div>
              <div></div>
              <div className="center-pos bor8">
                <Card center="8" />
                <div className="interno8"></div>
              </div>
            </div>
            <div className="col4">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            <div className="col5">
              <div className="center-pos bor2">
                <Card center="2" />
                <div className="interno2"></div>
              </div>
              <div></div>
              <div className="center-pos bor6">
                <Card center="6" />
                <div className="interno6"></div>
              </div>
              <div></div>
              <div className="center-pos bor4">
                <Card center="4" />
                <div className="interno4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
