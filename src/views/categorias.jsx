import React, { useState, useEffect } from "react";
import { Container, Button, Col } from "react-bootstrap";
import { db } from "../database/firebaseconfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import TablaCategorias from "../components/categorias/tablacategorias";
import ModalRegistroCategoria from "../components/categorias/modalregistrocategoria";
import ModalEdicionCategoria from "../components/categorias/modaledicioncategoria";
import ModalEliminacionCategoria from "../components/categorias/modaleliminacioncategoria";
import CuadroBusqueda from "../components/Busqueda/CuadroBusqueda";
import Paginacion from "../components/ordenamiento/Paginacion";
import ChatIA from "../components/chat/ChatIA";

import { useTranslation } from "react-i18next";

const Categorias = () => {
  const { t } = useTranslation();

  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
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
  const [offlineChanges, setOfflineChanges] = useState({
    added: [],
    updated: [],
    deleted: [],
  });

  const categoriasCollection = collection(db, "categorias");

  useEffect(() => {
    fetchCategorias();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
      if (isOffline) {
        console.warn(t("categorias.offlineAviso"));
      } else {
        console.error("Error al obtener las categorías:", error);
      }
    }
  };

  const handleSearchChange = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);
    const filtradas = categorias.filter((categoria) =>
      categoria.nombre.toLowerCase().includes(text) ||
      categoria.descripcion.toLowerCase().includes(text)
    );
    setCategoriasFiltradas(filtradas);
  };

  const paginatedCategorias = categoriaFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaCategoria((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setCategoriaEditada((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddCategoria = async () => {
    if (!nuevaCategoria.nombre || !nuevaCategoria.descripcion) {
      alert(t("categorias.errorCampos"));
      return;
    }

    setShowModal(false);
    const tempId = `temp_${Date.now()}`;
    const categoriaConId = { ...nuevaCategoria, id: tempId };

    if (isOffline) {
      setOfflineChanges((prev) => ({
        ...prev,
        added: [...prev.added, categoriaConId],
      }));
      alert(t("categorias.offlineAviso"));
    }

    try {
      setCategorias((prev) => [...prev, categoriaConId]);
      setCategoriasFiltradas((prev) => [...prev, categoriaConId]);
      setNuevaCategoria({ nombre: "", descripcion: "" });

      if (!isOffline) {
        await addDoc(categoriasCollection, nuevaCategoria);
      }

      console.log(t("categorias.agregado"));
    } catch (error) {
      console.error(t("categorias.errorAgregar"), error);
      setCategorias((prev) => prev.filter((cat) => cat.id !== tempId));
      setCategoriasFiltradas((prev) => prev.filter((cat) => cat.id !== tempId));
      alert(t("categorias.errorAgregar") + " " + error.message);
    }
  };

  const handleEditCategoria = async () => {
    if (!categoriaEditada.nombre || !categoriaEditada.descripcion) {
      alert(t("categorias.errorActualizar"));
      return;
    }

    if (isOffline) {
      setOfflineChanges((prev) => ({
        ...prev,
        updated: [
          ...prev.updated,
          { id: categoriaEditada.id, data: categoriaEditada },
        ],
      }));
      alert(t("categorias.offlineAviso"));
    }

    try {
      const categoriaRef = doc(db, "categorias", categoriaEditada.id);
      if (!isOffline) {
        await updateDoc(categoriaRef, {
          nombre: categoriaEditada.nombre,
          descripcion: categoriaEditada.descripcion,
        });
      }

      setCategorias((prev) =>
        prev.map((cat) =>
          cat.id === categoriaEditada.id ? categoriaEditada : cat
        )
      );
      setCategoriasFiltradas((prev) =>
        prev.map((cat) =>
          cat.id === categoriaEditada.id ? categoriaEditada : cat
        )
      );

      alert(t("categorias.actualizado"));
      setShowEditModal(false);
    } catch (error) {
      console.error(t("categorias.errorActualizar2"), error);
      alert(t("categorias.errorActualizar2") + " " + error.message);
    }
  };

  const handleDeleteCategoria = async () => {
    if (!categoriaAEliminar) return;

    setShowDeleteModal(false);

    try {
      if (isOffline) {
        setOfflineChanges((prev) => ({
          ...prev,
          deleted: [...prev.deleted, categoriaAEliminar],
        }));
        alert(t("categorias.offlineAviso"));
      }

      setCategorias((prev) =>
        prev.filter((cat) => cat.id !== categoriaAEliminar.id)
      );
      setCategoriasFiltradas((prev) =>
        prev.filter((cat) => cat.id !== categoriaAEliminar.id)
      );

      const categoriaRef = doc(db, "categorias", categoriaAEliminar.id);
      if (!isOffline) {
        await deleteDoc(categoriaRef);
      }

      console.log(t("categorias.eliminado"));
    } catch (error) {
      console.error(t("categorias.errorEliminar"), error);
      alert(t("categorias.errorEliminar") + " " + error.message);
    }
  };

  const openEditModal = (categoria) => {
    setCategoriaEditada({ ...categoria });
    setShowEditModal(true);
  };

  const openDeleteModal = (categoria) => {
    setCategoriaAEliminar(categoria);
    setShowDeleteModal(true);
  };

  return (
    <Container className="mt-5">
      {isOffline && (
        <div className="alert alert-warning text-center" role="alert">
          {t("categorias.offline")}
        </div>
      )}

      <h4>{t("categorias.titulo")}</h4>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <Button onClick={() => setShowModal(true)}>
          {t("categorias.agregar")}
        </Button>
        <Col lg={3} md={4} sm={4} xs={12}>
          <Button
            className="mb-2"
            variant="info"
            style={{ width: "100%" }}
            onClick={() => setShowChatModal(true)}
          >
            {t("categorias.chat")}
          </Button>
        </Col>
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

      {/* Modal para Chat IA */}
      <ChatIA
        showChatModal={showChatModal}
        onHide={() => setShowChatModal(false)}
      />
    </Container>
  );
};

export default Categorias;