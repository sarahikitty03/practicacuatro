import React, { useState, useEffect } from "react";
import { Container, Row, Form, Col } from "react-bootstrap";
import { db } from "../database/firebaseconfig";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import TarjetaProducto from "../components/catalogo/TarjetaProducto";
import ModalEdicionProducto from "../components/productos/ModalEdicionProducto";
import CuadroBusqueda from "../components/Busqueda/CuadroBusqueda";
import Paginacion from "../components/ordenamiento/Paginacion";

const Catalogo = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");

  const [showEditModal, setShowEditModal] = useState(false);
  const [productoEditado, setProductoEditado] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const productosCollection = collection(db, "productos");
  const categoriasCollection = collection(db, "categorias");

  const fetchData = async () => {
    try {
      const productosData = await getDocs(productosCollection);
      const fetchedProductos = productosData.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setProductos(fetchedProductos);
      setProductosFiltrados(fetchedProductos);

      const categoriasData = await getDocs(categoriasCollection);
      const fetchedCategorias = categoriasData.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setCategorias(fetchedCategorias);
    } catch (error) {
      console.error("Error al obtener datos:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtro por búsqueda y categoría
  useEffect(() => {
    let filtrados = productos;

    if (categoriaSeleccionada !== "Todas") {
      filtrados = filtrados.filter((p) => p.categoria === categoriaSeleccionada);
    }

    if (searchText.trim() !== "") {
      const text = searchText.toLowerCase();
      filtrados = filtrados.filter(
        (p) =>
          p.nombre.toLowerCase().includes(text) ||
          p.precio.toString().toLowerCase().includes(text) ||
          p.categoria.toLowerCase().includes(text)
      );
    }

    setProductosFiltrados(filtrados);
    setCurrentPage(1); // Reiniciar página si cambia la búsqueda o filtro
  }, [productos, categoriaSeleccionada, searchText]);

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleEditClick = (producto) => {
    setProductoEditado(producto);
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    setProductoEditado({ ...productoEditado, [e.target.name]: e.target.value });
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProductoEditado({ ...productoEditado, imagen: imageUrl });
    }
  };

  const handleEditProducto = async () => {
    if (!productoEditado) return;
    try {
      const productoRef = doc(db, "productos", productoEditado.id);
      await updateDoc(productoRef, {
        nombre: productoEditado.nombre,
        precio: productoEditado.precio,
        categoria: productoEditado.categoria,
        imagen: productoEditado.imagen,
      });

      alert("Producto actualizado correctamente");
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      alert("Error al actualizar el producto");
    }
  };

  const paginatedProductos = productosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Container className="mt-5">
      <br />
      <h4>Catálogo de Productos</h4>

      <Row className="mb-3">
  <Col lg={8}>
    <div className="d-flex flex-column flex-md-row align-items-md-end gap-3">
      {/* Selector de categoría */}
      <div className="flex-fill">
        <Form.Group>
          <Form.Label className="mb-2">Categoría</Form.Label>
          <Form.Select
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          >
            <option value="Todas">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.nombre}>
                {categoria.nombre}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </div>

      {/* Cuadro de búsqueda */}
      <div className="flex-fill">
        <CuadroBusqueda
          searchText={searchText}
          handleSearchChange={handleSearchChange}
        />
      </div>
    </div>
  </Col>
</Row>


      <Row>
        {paginatedProductos.length > 0 ? (
          paginatedProductos.map((producto) => (
            <TarjetaProducto
              key={producto.id}
              producto={producto}
              onEdit={handleEditClick}
            />
          ))
        ) : (
          <p>No hay productos que coincidan con los filtros.</p>
        )}
      </Row>

      <Paginacion
        itemsPerPage={itemsPerPage}
        totalItems={productosFiltrados.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
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
    </Container>
  );
};

export default Catalogo;