import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../database/firebaseconfig";
import { Button, Form, ListGroup, Spinner, Modal } from "react-bootstrap";

const ChatIA = ({ showChatModal, setShowChatModal }) => {
  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [intencion, setIntencion] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [categorias, setCategorias] = useState([]);

  const chatCollection = collection(db, "chat");
  const categoriasCollection = collection(db, "categorias");

  // Escucha mensajes en tiempo real
  useEffect(() => {
    const q = query(chatCollection, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mensajesObtenidos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMensajes(mensajesObtenidos);
    });
    return () => unsubscribe();
  }, []);

  // Carga categorías solo una vez o cuando se modifiquen
  const cargarCategorias = useCallback(async () => {
    const snapshot = await getDocs(categoriasCollection);
    const cats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setCategorias(cats);
  }, []);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  // Función para llamar a la IA
  const obtenerRespuestaIA = useCallback(async (promptUsuario) => {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    const prompt = `
      Analiza el mensaje del usuario: "${promptUsuario}".
      Determina la intención del usuario respecto a operaciones con categorías:
      - "crear": Crear una nueva categoría.
      - "listar": Ver las categorías existentes.
      - "actualizar": Modificar una categoría existente.
      - "eliminar": Eliminar una categoría.
      - "seleccionar_categoria": Selección por nombre o número.
      - "actualizar_datos": Proporcionar nuevos datos tras seleccionar.

      Devuelve un JSON con estructura:
      {
        "intencion": "...",
        "datos": { "nombre": "...", "descripcion": "..." },
        "seleccion": "..."
      }
      Si no se detecta intención, devuelve: { "intencion": "desconocida" }
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: "application/json" },
          }),
        }
      );

      if (response.status === 429) {
        return { intencion: "error", mensaje: "Límite de solicitudes alcanzado." };
      }

      const data = await response.json();
      const respuestaIA = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
      return respuestaIA.intencion ? respuestaIA : { intencion: "desconocida" };
    } catch (error) {
      console.error("Error al obtener respuesta de la IA:", error);
      return { intencion: "error", mensaje: "No se pudo conectar con la IA." };
    }
  }, []);

  // Función para agregar mensaje a Firestore
  const agregarMensaje = useCallback(async (texto, emisor) => {
    await addDoc(chatCollection, {
      texto,
      emisor,
      timestamp: new Date(),
    });
  }, []);

  // Procesa el mensaje según la intención detectada
  const procesarMensaje = useCallback(
    async (mensajeUsuario) => {
      try {
        // Guardar mensaje usuario
        await agregarMensaje(mensajeUsuario, "usuario");

        // Obtener respuesta IA
        const respuestaIA = await obtenerRespuestaIA(mensajeUsuario);

        if (respuestaIA.intencion === "error") {
          await agregarMensaje(respuestaIA.mensaje, "ia");
          return;
        }

        // Según la intención, realizar operaciones
        switch (respuestaIA.intencion) {
          case "listar":
            if (categorias.length === 0) {
              await agregarMensaje("No hay categorías registradas.", "ia");
            } else {
              const lista = categorias
                .map((cat, i) => `${i + 1}. ${cat.nombre}: ${cat.descripcion}`)
                .join("\n");
              await agregarMensaje(`Categorías disponibles:\n${lista}`, "ia");
            }
            break;

          case "crear":
            {
              const datos = respuestaIA.datos;
              if (datos?.nombre && datos?.descripcion) {
                await addDoc(categoriasCollection, datos);
                await agregarMensaje(`Categoría "${datos.nombre}" registrada con éxito.`, "ia");
                await cargarCategorias(); // actualizar lista local
              } else {
                await agregarMensaje("Faltan datos para registrar la categoría.", "ia");
              }
            }
            break;

          case "eliminar":
            if (categorias.length === 0) {
              await agregarMensaje("No hay categorías para eliminar.", "ia");
              setIntencion(null);
            } else if (respuestaIA.seleccion) {
              const encontrada = categorias.find(
                (cat, i) =>
                  cat.nombre.toLowerCase() === respuestaIA.seleccion.toLowerCase() ||
                  parseInt(respuestaIA.seleccion) === i + 1
              );
              if (encontrada) {
                await deleteDoc(doc(db, "categorias", encontrada.id));
                await agregarMensaje(`Categoría "${encontrada.nombre}" eliminada.`, "ia");
                setIntencion(null);
                await cargarCategorias();
              } else {
                await agregarMensaje("No se encontró la categoría.", "ia");
              }
            } else {
              setIntencion("eliminar");
              const lista = categorias
                .map((cat, i) => `${i + 1}. ${cat.nombre}: ${cat.descripcion}`)
                .join("\n");
              await agregarMensaje(`Selecciona una categoría:\n${lista}`, "ia");
            }
            break;

          case "seleccionar_categoria":
            if (intencion === "eliminar") {
              const encontrada = categorias.find(
                (cat, i) =>
                  cat.nombre.toLowerCase() === mensajeUsuario.toLowerCase() ||
                  parseInt(mensajeUsuario) === i + 1
              );
              if (encontrada) {
                await deleteDoc(doc(db, "categorias", encontrada.id));
                await agregarMensaje(`Categoría "${encontrada.nombre}" eliminada.`, "ia");
                setIntencion(null);
                await cargarCategorias();
              } else {
                await agregarMensaje("Selección inválida.", "ia");
              }
            } else if (intencion === "actualizar") {
              const encontrada = categorias.find(
                (cat, i) =>
                  cat.nombre.toLowerCase() === mensajeUsuario.toLowerCase() ||
                  parseInt(mensajeUsuario) === i + 1
              );
              if (encontrada) {
                setCategoriaSeleccionada(encontrada);
                await agregarMensaje(
                  `Seleccionaste "${encontrada.nombre}". Proporciona los nuevos datos.`,
                  "ia"
                );
              } else {
                await agregarMensaje("Categoría no encontrada.", "ia");
              }
            }
            break;

          case "actualizar":
            if (categorias.length === 0) {
              await agregarMensaje("No hay categorías para actualizar.", "ia");
              setIntencion(null);
            } else if (respuestaIA.seleccion) {
              const encontrada = categorias.find(
                (cat, i) =>
                  cat.nombre.toLowerCase() === respuestaIA.seleccion.toLowerCase() ||
                  parseInt(respuestaIA.seleccion) === i + 1
              );
              if (encontrada) {
                setCategoriaSeleccionada(encontrada);
                setIntencion("actualizar");
                await agregarMensaje(
                  `Selecciona "${encontrada.nombre}". Proporciona los nuevos datos.`,
                  "ia"
                );
              } else {
                await agregarMensaje("Categoría no encontrada.", "ia");
              }
            } else {
              setIntencion("actualizar");
              const lista = categorias
                .map((cat, i) => `${i + 1}. ${cat.nombre}: ${cat.descripcion}`)
                .join("\n");
              await agregarMensaje(`Selecciona una categoría para actualizar:\n${lista}`, "ia");
            }
            break;

          case "actualizar_datos":
            if (intencion === "actualizar" && categoriaSeleccionada) {
              const datos = respuestaIA.datos;
              if (datos?.nombre && datos?.descripcion) {
                const ref = doc(db, "categorias", categoriaSeleccionada.id);
                await updateDoc(ref, {
                  nombre: datos.nombre,
                  descripcion: datos.descripcion,
                });
                await agregarMensaje("Categoría actualizada con éxito.", "ia");
                setIntencion(null);
                setCategoriaSeleccionada(null);
                await cargarCategorias();
              } else {
                await agregarMensaje("Datos incompletos para actualizar.", "ia");
              }
            }
            break;

          case "desconocida":
          default:
            await agregarMensaje("No entendí tu intención. Por favor intenta de nuevo.", "ia");
            break;
        }
      } catch (error) {
        console.error("Error procesando mensaje:", error);
        await agregarMensaje("Ocurrió un error procesando tu mensaje.", "ia");
      }
    },
    [
      agregarMensaje,
      categorias,
      categoriaSeleccionada,
      cargarCategorias,
      intencion,
      obtenerRespuestaIA,
      setIntencion,
      setCategoriaSeleccionada,
    ]
  );

  const enviarMensaje = () => {
    if (!mensaje.trim() || cargando) return;
    setCargando(true);
    const mensajeActual = mensaje;
    setMensaje("");
    procesarMensaje(mensajeActual).finally(() => setCargando(false));
  };

  return (
    <Modal show={showChatModal} onHide={() => setShowChatModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Chat con IA</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup style={{ maxHeight: "300px", overflowY: "auto" }}>
          {mensajes.map((msg) => (
            <ListGroup.Item key={msg.id} variant={msg.emisor === "ia" ? "light" : "primary"}>
              <strong>{msg.emisor === "ia" ? "IA: " : "Tú: "}</strong>
              {msg.texto}
            </ListGroup.Item>
          ))}
        </ListGroup>
        <Form.Control
          className="mt-3"
          type="text"
          placeholder="Escribe tu mensaje..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowChatModal(false)}>
          Cerrar
        </Button>
        <Button onClick={enviarMensaje} disabled={cargando}>
          {cargando ? <Spinner size="sm" animation="border" /> : "Enviar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ChatIA;