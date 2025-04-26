import React, { useState, useEffect } from "react";
import { Container, Button } from "react-bootstrap";
import { db } from "../database/firebaseconfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// Importaciones de componentes personalizados
import TablaCategorias from "../components/categorias/tablacategorias";
import ModalRegistroCategoria from "../components/categorias/modalregistrocategoria";
import ModalEdicionCategoria from "../components/categorias/modaledicioncategoria";
import ModalEliminacionCategoria from "../components/categorias/modaleliminacioncategoria";
import CuadroBusqueda from "../components/Busqueda/CuadroBusqueda";
import Paginacion from "../components/ordenamiento/Paginacion";

const Categorias = () => {
  // Estados para manejo de datos
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombre: "",
    descripcion: "",
  });
  const [categoriaEditada, setCategoriaEditada] = useState(null);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [categoriaFiltradas, setCategoriasFiltradas] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Referencia a la colección de Firestore
  const categoriasCollection = collection(db, "categorias");

  // Obtener datos al cargar la vista
  useEffect(() => {
    fetchCategorias();

    // Manejar eventos de conexión/desconexión
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Obtener todas las categorías de Firestore
  const fetchCategorias = async () => {
    try {
      const data = await getDocs(categoriasCollection);
      const fetchedCategorias = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setCategorias(fetchedCategorias);
      setCategoriasFiltradas(fetchedCategorias);
    } catch (error) {
      console.error("Error al obtener las categorías:", error);
    }
  };

  // Buscar categorías por texto
  const handleSearchChange = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);

    const filtradas = categorias.filter((categoria) =>
      categoria.nombre.toLowerCase().includes(text) ||
      categoria.descripcion.toLowerCase().includes(text)
    );
    setCategoriasFiltradas(filtradas);
  };

  // Categorías por página
  const paginatedCategorias = categoriaFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Cambios en formulario de nueva categoría
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaCategoria((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Cambios en formulario de edición
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setCategoriaEditada((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Agregar categoría con manejo offline
  const handleAddCategoria = async () => {
    if (!nuevaCategoria.nombre || !nuevaCategoria.descripcion) {
      alert("Por favor, completa todos los campos antes de guardar.");
      return;
    }

    setShowModal(false);

    const tempId = `temp_${Date.now()}`;
    const categoriaConId = { ...nuevaCategoria, id: tempId };

    try {
      // Agregar localmente
      setCategorias((prev) => [...prev, categoriaConId]);
      setCategoriasFiltradas((prev) => [...prev, categoriaConId]);

      // Limpiar formulario
      setNuevaCategoria({ nombre: "", descripcion: "" });

      // Guardar en Firestore
      await addDoc(categoriasCollection, nuevaCategoria);

      if (isOffline) {
        console.log("Categoría agregada localmente (sin conexión).");
      } else {
        console.log("Categoría agregada exitosamente en la nube.");
      }
    } catch (error) {
      console.error("Error al agregar la categoría:", error);

      if (isOffline) {
        console.log("Offline: Categoría almacenada localmente.");
      } else {
        // Revertir si falla
        setCategorias((prev) => prev.filter((cat) => cat.id !== tempId));
        setCategoriasFiltradas((prev) => prev.filter((cat) => cat.id !== tempId));
        alert("Error al agregar la categoría: " + error.message);
      }
    }
  };

  // Editar categoría
  const handleEditCategoria = async () => {
    if (!categoriaEditada.nombre || !categoriaEditada.descripcion) {
      alert("Por favor, completa todos los campos antes de actualizar.");
      return;
    }
    try {
      const categoriaRef = doc(db, "categorias", categoriaEditada.id);
      await updateDoc(categoriaRef, {
        nombre: categoriaEditada.nombre,
        descripcion: categoriaEditada.descripcion
      });
      alert("Categoría actualizada correctamente.");
      setShowEditModal(false);
      await fetchCategorias();
    } catch (error) {
      console.error("Error al actualizar la categoría:", error);
    }
  };

  // Eliminar categoría con manejo offline
  const handleDeleteCategoria = async () => {
    if (!categoriaAEliminar) return;

    setShowDeleteModal(false);

    try {
      // Eliminar localmente
      setCategorias((prev) => prev.filter((cat) => cat.id !== categoriaAEliminar.id));
      setCategoriasFiltradas((prev) => prev.filter((cat) => cat.id !== categoriaAEliminar.id));

      // Eliminar en Firestore
      const categoriaRef = doc(db, "categorias", categoriaAEliminar.id);
      await deleteDoc(categoriaRef);

      if (isOffline) {
        console.log("Categoría eliminada localmente (sin conexión).");
      } else {
        console.log("Categoría eliminada exitosamente en la nube.");
      }
    } catch (error) {
      console.error("Error al eliminar la categoría:", error);

      if (isOffline) {
        console.log("Offline: Eliminación almacenada localmente.");
      } else {
        // Revertir si falla
        setCategorias((prev) => [...prev, categoriaAEliminar]);
        setCategoriasFiltradas((prev) => [...prev, categoriaAEliminar]);
        alert("Error al eliminar la categoría: " + error.message);
      }
    }
  };

  // Abrir modal de edición
  const openEditModal = (categoria) => {
    setCategoriaEditada({ ...categoria });
    setShowEditModal(true);
  };

  // Abrir modal de eliminación
  const openDeleteModal = (categoria) => {
    setCategoriaAEliminar(categoria);
    setShowDeleteModal(true);
  };

  // Renderizado del componente
  return (
    <Container className="mt-5">
      <br />
      <h4>Gestión de Categorías</h4>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button onClick={() => setShowModal(true)}>
          Agregar categoría
        </Button>
        <CuadroBusqueda
          searchText={searchText}
          handleSearchChange={handleSearchChange}
        />
      </div>

      <TablaCategorias
        categorias={paginatedCategorias}
        openEditModal={openEditModal}
        openDeleteModal={openDeleteModal}
      />
      <Paginacion
        itemsPerPage={itemsPerPage}
        totalItems={categoriaFiltradas.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <ModalRegistroCategoria
        showModal={showModal}
        setShowModal={setShowModal}
        nuevaCategoria={nuevaCategoria}
        handleInputChange={handleInputChange}
        handleAddCategoria={handleAddCategoria}
      />
      <ModalEdicionCategoria
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        categoriaEditada={categoriaEditada}
        handleEditInputChange={handleEditInputChange}
        handleEditCategoria={handleEditCategoria}
      />
      <ModalEliminacionCategoria
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDeleteCategoria={handleDeleteCategoria}
      />
    </Container>
  );
};

export default Categorias;