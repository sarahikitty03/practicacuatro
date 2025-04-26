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
  onSnapshot,
} from "firebase/firestore";
import TablaProductos from "../components/productos/Tablaproductos";
import ModalRegistroProducto from "../components/productos/ModalRegistroProducto";
import ModalEdicionProducto from "../components/productos/ModalEdicionProducto";
import ModalEliminacionProducto from "../components/productos/ModalEliminacionProducto";
import CuadroBusqueda from "../components/Busqueda/CuadroBusqueda";
import Paginacion from "../components/ordenamiento/Paginacion";

const Productos = () => {
  // 🔌 Estado para detectar conexión
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Otros estados
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    precio: "",
    categoria: "",
    imagen: ""
  });
  const [productoEditado, setProductoEditado] = useState(null);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 🔌 useEffect para manejar cambios de conexión
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Referencia a las colecciones en Firestore
  const productosCollection = collection(db, "productos");
  const categoriasCollection = collection(db, "categorias");

  // Función para obtener productos y categorías
  const fetchData = () => {
    const unsubscribeProductos = onSnapshot(productosCollection, (snapshot) => {
      const fetchedProductos = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setProductos(fetchedProductos);
      setProductosFiltrados(fetchedProductos);
      if (isOffline) console.log("Offline: Productos desde caché.");
    }, (error) => {
      console.error("Error al escuchar productos:", error);
      if (isOffline) {
        console.log("Offline: Datos desde caché local.");
      } else {
        alert("Error al cargar productos: " + error.message);
      }
    });

    const unsubscribeCategorias = onSnapshot(categoriasCollection, (snapshot) => {
      const fetchedCategorias = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setCategorias(fetchedCategorias);
      if (isOffline) console.log("Offline: Categorías desde caché.");
    }, (error) => {
      console.error("Error al escuchar categorías:", error);
      if (isOffline) {
        console.log("Offline: Datos desde caché local.");
      } else {
        alert("Error al cargar categorías: " + error.message);
      }
    });

    return () => {
      unsubscribeProductos();
      unsubscribeCategorias();
    };
  };

  // useEffect para carga inicial de datos
  useEffect(() => {
    fetchData();
  }, []);

  const handleSearchChange = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);
    const filtradas = productos.filter((producto) =>
      producto.nombre.toLowerCase().includes(text) ||
      producto.precio.toString().includes(text) ||
      producto.categoria.toLowerCase().includes(text)
    );
    setProductosFiltrados(filtradas);
  };

  const paginatedProductos = productosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoProducto((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setProductoEditado((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNuevoProducto((prev) => ({ ...prev, imagen: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductoEditado((prev) => ({ ...prev, imagen: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProducto = async () => {
    if (
      !nuevoProducto.nombre ||
      !nuevoProducto.precio ||
      !nuevoProducto.categoria ||
      !nuevoProducto.imagen
    ) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    setShowModal(false);
    const tempId = `temp_${Date.now()}`;
    const productoConId = {
      ...nuevoProducto,
      id: tempId,
      precio: parseFloat(nuevoProducto.precio),
    };

    try {
      setProductos((prev) => [...prev, productoConId]);
      setProductosFiltrados((prev) => [...prev, productoConId]);

      if (isOffline) {
        console.log("Producto agregado localmente.");
        alert("Sin conexión: Producto agregado localmente.");
      }

      await addDoc(productosCollection, {
        nombre: nuevoProducto.nombre,
        precio: parseFloat(nuevoProducto.precio),
        categoria: nuevoProducto.categoria,
        imagen: nuevoProducto.imagen,
      });

      setNuevoProducto({ nombre: "", precio: "", categoria: "", imagen: "" });
    } catch (error) {
      console.error("Error al agregar:", error);
      if (!isOffline) {
        setProductos((prev) => prev.filter((prod) => prod.id !== tempId));
        setProductosFiltrados((prev) => prev.filter((prod) => prod.id !== tempId));
        alert("Error al agregar el producto: " + error.message);
      }
    }
  };

  const handleEditProducto = async () => {
    if (
      !productoEditado.nombre ||
      !productoEditado.precio ||
      !productoEditado.categoria ||
      !productoEditado.imagen
    ) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    setShowEditModal(false);
    const productoRef = doc(db, "productos", productoEditado.id);

    try {
      setProductos((prev) =>
        prev.map((prod) =>
          prod.id === productoEditado.id ? { ...productoEditado, precio: parseFloat(productoEditado.precio) } : prod
        )
      );
      setProductosFiltrados((prev) =>
        prev.map((prod) =>
          prod.id === productoEditado.id ? { ...productoEditado, precio: parseFloat(productoEditado.precio) } : prod
        )
      );

      if (isOffline) {
        console.log("Producto actualizado localmente.");
        alert("Sin conexión: Producto actualizado localmente.");
      }

      await updateDoc(productoRef, {
        nombre: productoEditado.nombre,
        precio: parseFloat(productoEditado.precio),
        categoria: productoEditado.categoria,
        imagen: productoEditado.imagen,
      });

    } catch (error) {
      console.error("Error al actualizar:", error);
      if (!isOffline) {
        alert("Error al actualizar el producto: " + error.message);
      }
    }
  };

  const handleDeleteProducto = async () => {
    if (!productoAEliminar) return;

    setShowDeleteModal(false);
    try {
      setProductos((prev) => prev.filter((prod) => prod.id !== productoAEliminar.id));
      setProductosFiltrados((prev) => prev.filter((prod) => prod.id !== productoAEliminar.id));

      if (isOffline) {
        console.log("Producto eliminado localmente.");
        alert("Sin conexión: Producto eliminado localmente.");
      }

      const productoRef = doc(db, "productos", productoAEliminar.id);
      await deleteDoc(productoRef);

    } catch (error) {
      console.error("Error al eliminar:", error);
      if (!isOffline) {
        alert("Error al eliminar el producto: " + error.message);
      }
    }
  };

  const openEditModal = (producto) => {
    setProductoEditado({ ...producto });
    setShowEditModal(true);
  };

  const openDeleteModal = (producto) => {
    setProductoAEliminar(producto);
    setShowDeleteModal(true);
  };

  return (
    <Container className="mt-5">
      <br />
      <h4>Gestión de Productos</h4>

      {/* 🔌 Mostrar mensaje si está sin conexión */}
      {isOffline && (
        <div className="alert alert-warning text-center">
          ⚠ Estás sin conexión. Los cambios se guardarán localmente y se sincronizarán al reconectar.
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button onClick={() => setShowModal(true)}>Agregar producto</Button>
        <CuadroBusqueda searchText={searchText} handleSearchChange={handleSearchChange} />
      </div>

      <TablaProductos
        productos={paginatedProductos}
        openEditModal={openEditModal}
        openDeleteModal={openDeleteModal}
      />

      <Paginacion
        itemsPerPage={itemsPerPage}
        totalItems={productosFiltrados.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <ModalRegistroProducto
        showModal={showModal}
        setShowModal={setShowModal}
        nuevoProducto={nuevoProducto}
        handleInputChange={handleInputChange}
        handleImageChange={handleImageChange}
        handleAddProducto={handleAddProducto}
        categorias={categorias}
      />

      <ModalEdicionProducto
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        productoEditado={productoEditado}
        handleEditInputChange={handleEditInputChange}
        handleEditImageChange={handleEditImageChange}
        handleEditProducto={handleEditProducto}
        categorias={categorias}
      />

      <ModalEliminacionProducto
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDeleteProducto={handleDeleteProducto}
      />
    </Container>
  );
};

export default Productos;