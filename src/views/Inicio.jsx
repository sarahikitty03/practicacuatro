import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import ModalInstalacionIOS from "../components/inicio/ModalInstalacionIOS";
import { Container, Button } from "react-bootstrap";

const Inicio = () => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  const [solicitudInstalacion, setSolicitudInstalacion] = useState(null);
  const [mostrarBotonInstalacion, setMostrarBotonInstalacion] = useState(false);
  const [esDispositivoIOS, setEsDispositivoIOS] = useState(false);
  const [mostrarModalInstrucciones, setMostrarModalInstrucciones] = useState(false);

  // Detectar si es un dispositivo iOS
  useEffect(() => {
    const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setEsDispositivoIOS(esIOS);
    console.log("Dispositivo iOS:", esIOS);
  }, []);

  // Manejar evento beforeinstallprompt con protección completa
  useEffect(() => {
    const manejarSolicitudInstalacion = (evento) => {
      try {
        console.log("Evento beforeinstallprompt detectado");
        evento.preventDefault();
        setSolicitudInstalacion(evento);
        setMostrarBotonInstalacion(true);
      } catch (error) {
        console.error("Error al manejar beforeinstallprompt:", error);
      }
    };

    if ("onbeforeinstallprompt" in window) {
      console.log("Soporte para beforeinstallprompt detectado");
      window.addEventListener("beforeinstallprompt", manejarSolicitudInstalacion);
    } else {
      console.log("Este navegador no soporta beforeinstallprompt");
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", manejarSolicitudInstalacion);
    };
  }, []);

  // Acción al instalar la PWA
  const instalacion = async () => {
    if (!solicitudInstalacion) return;

    try {
      await solicitudInstalacion.prompt();
      const { outcome } = await solicitudInstalacion.userChoice;
      console.log(outcome === "accepted" ? "Instalación aceptada" : "Instalación rechazada");
    } catch (error) {
      console.error("Error al intentar instalar la PWA", error);
    } finally {
      setSolicitudInstalacion(null);
      setMostrarBotonInstalacion(false);
    }
  };

  const abrirModalInstrucciones = () => setMostrarModalInstrucciones(true);
  const cerrarModalInstrucciones = () => setMostrarModalInstrucciones(false);

  return (
    <Container className="text-center">
      <h1>Bienvenido a la pantalla de inicio</h1>

      {!esDispositivoIOS && mostrarBotonInstalacion && (
        <div className="my-4">
          <Button className="sombra" variant="primary" onClick={instalacion}>
            Instalar app Ferretería Selva <i className="bi bi-download"></i>
          </Button>
        </div>
      )}

      {esDispositivoIOS && (
        <div className="text-center my-4">
          <Button className="sombra" variant="primary" onClick={abrirModalInstrucciones}>
            Cómo instalar Ferretería Selva en iPhone <i className="bi-phone"></i>
          </Button>
        </div>
      )}

      <ModalInstalacionIOS
        mostrar={mostrarModalInstrucciones}
        cerrar={cerrarModalInstrucciones}
      />
    </Container>
  );
};

export default Inicio;