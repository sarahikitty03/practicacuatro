import React, { useState, useEffect } from "react";
import { Container, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../database/firebaseconfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import TablaLibros from "../components/libros/TablaLibros";
import ModalRegistroLibro from "../components/libros/ModalRegistroLibro";
import ModalEdicionLibro from "../components/libros/ModalEdicionLibro";
import ModalEliminacionLibro from "../components/libros/ModalEliminacionLibro";
import { useAuth } from "../database/authcontext";
import CuadroBusqueda from "../components/Busqueda/CuadroBusqueda";
import Paginacion from "../components/ordenamiento/Paginacion";

const Libros = () => {
  const [libros, setLibros] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nuevoLibro, setNuevoLibro] = useState({
    nombre: "",
    autor: "",
    genero: "",
    pdfUrl: "",
  });
  const [libroEditado, setLibroEditado] = useState(null);
  const [libroAEliminar, setLibroAEliminar] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [error, setError] = useState(null);
  const [librosFiltrados, setLibrosFiltrados] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Número de productos por página

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const librosCollection = collection(db, "libros");

  const fetchData = async () => {
    try {
      const librosData = await getDocs(librosCollection);
      const fetchedLibros = librosData.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setLibros(fetchedLibros);
      setLibrosFiltrados(fetchedLibros);
    } catch (error) {
      console.error("Error al obtener datos:", error);
      setError("Error al cargar los datos. Intenta de nuevo.");
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      fetchData();
    }
  }, [isLoggedIn, navigate]);

  const handleSearchChange = (e) => {
    console.log(e);
    const text = e.target.value.toLowerCase();
    setSearchText(text);

    const filtradas = libros.filter((libro) =>
      libro.nombre.toLowerCase().includes(text) ||
      libro.autor.toLowerCase().includes(text) ||
      libro.genero.toLowerCase().includes(text) ||
      libro.pdfUrl.toLowerCase().includes(text)
    );
    setLibrosFiltrados(filtradas);
  }

    // Calcular productos paginados
    const paginatedLibros = librosFiltrados.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoLibro((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setLibroEditado((prev) => ({ ...prev, [name]: value }));
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      alert("Por favor, selecciona un archivo PDF.");
    }
  };

  const handleEditPdfChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      alert("Por favor, selecciona un archivo PDF.");
    }
  };

  const handleAddLibro = async () => {
    if (!isLoggedIn) {
      alert("Debes iniciar sesión para agregar un libro.");
      navigate("/login");
      return;
    }

    if (!nuevoLibro.nombre || !nuevoLibro.autor || !nuevoLibro.genero || !pdfFile) {
      alert("Por favor, completa todos los campos y selecciona un PDF.");
      return;
    }
    try {
      const storageRef = ref(storage, `libros/${pdfFile.name}`);
      await uploadBytes(storageRef, pdfFile);
      const pdfUrl = await getDownloadURL(storageRef);

      await addDoc(librosCollection, { ...nuevoLibro, pdfUrl });
      setShowModal(false);
      setNuevoLibro({ nombre: "", autor: "", genero: "", pdfUrl: "" });
      setPdfFile(null);
      await fetchData();
    } catch (error) {
      console.error("Error al agregar libro:", error);
      setError("Error al agregar el libro. Intenta de nuevo.");
    }
  };

  const handleEditLibro = async () => {
    if (!isLoggedIn) {
      alert("Debes iniciar sesión para editar un libro.");
      navigate("/login");
      return;
    }

    if (!libroEditado.nombre || !libroEditado.autor || !libroEditado.genero) {
      alert("Por favor, completa todos los campos requeridos.");
      return;
    }
    try {
      const libroRef = doc(db, "libros", libroEditado.id);
      if (pdfFile) {
        if (libroEditado.pdfUrl) {
          const oldPdfRef = ref(storage, libroEditado.pdfUrl);
          await deleteObject(oldPdfRef).catch((error) => {
            console.error("Error al eliminar el PDF anterior:", error);
          });
        }
        const storageRef = ref(storage, `libros/${pdfFile.name}`);
        await uploadBytes(storageRef, pdfFile);
        const newPdfUrl = await getDownloadURL(storageRef);
        await updateDoc(libroRef, { ...libroEditado, pdfUrl: newPdfUrl });
      } else {
        await updateDoc(libroRef, libroEditado);
      }
      setShowEditModal(false);
      setPdfFile(null);
      await fetchData();
    } catch (error) {
      console.error("Error al actualizar libro:", error);
      setError("Error al actualizar el libro. Intenta de nuevo.");
    }
  };

  const handleDeleteLibro = async () => {
    if (!isLoggedIn) {
      alert("Debes iniciar sesión para eliminar un libro.");
      navigate("/login");
      return;
    }

    if (libroAEliminar) {
      try {
        const libroRef = doc(db, "libros", libroAEliminar.id);
        if (libroAEliminar.pdfUrl) {
          const pdfRef = ref(storage, libroAEliminar.pdfUrl);
          await deleteObject(pdfRef).catch((error) => {
            console.error("Error al eliminar el PDF de Storage:", error);
          });
        }
        await deleteDoc(libroRef);
        setShowDeleteModal(false);
        await fetchData();
      } catch (error) {
        console.error("Error al eliminar libro:", error);
        setError("Error al eliminar el libro. Intenta de nuevo.");
      }
    }
  };

  const openEditModal = (libro) => {
    setLibroEditado({ ...libro });
    setShowEditModal(true);
  };

  const openDeleteModal = (libro) => {
    setLibroAEliminar(libro);
    setShowDeleteModal(true);
  };

  return (
    <Container className="mt-5">
      <br />
      <h4>Gestión de Libros</h4>

      {/* Agrupamos el botón y el cuadro de búsqueda en un contenedor con flexbox */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Button onClick={() => setShowModal(true)}>Agregar libro</Button>
        <div style={{ width: "300px" }}>
          <CuadroBusqueda searchText={searchText} handleSearchChange={handleSearchChange} />
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <TablaLibros
        libros={paginatedLibros}
        openEditModal={openEditModal}
        openDeleteModal={openDeleteModal}
      />

      <Paginacion
        itemsPerPage={itemsPerPage}
        totalItems={librosFiltrados.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      {/* Modales */}
      <ModalRegistroLibro
        showModal={showModal}
        setShowModal={setShowModal}
        nuevoLibro={nuevoLibro}
        handleInputChange={handleInputChange}
        handlePdfChange={handlePdfChange}
        handleAddLibro={handleAddLibro}
      />
      <ModalEdicionLibro
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        libroEditado={libroEditado}
        handleEditInputChange={handleEditInputChange}
        handleEditPdfChange={handleEditPdfChange}
        handleEditLibro={handleEditLibro}
      />
      <ModalEliminacionLibro
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDeleteLibro={handleDeleteLibro}
      />
    </Container>

  );
};

export default Libros;