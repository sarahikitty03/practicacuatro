import React, { useState, useEffect } from "react";
import { Container, Row, Form, Col, Button } from "react-bootstrap";
import { db } from "../../database/firebaseconfig";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import TarjetaProducto from "../catalogo/TarjetaProducto";
import ModalEdicionProducto from "../productos/ModalEdicionProducto";

const Catalogo = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");

  const [showEditModal, setShowEditModal] = useState(false);
  const [productoEditado, setProductoEditado] = useState(null);

  const productosCollection = collection(db, "productos");
  const categoriasCollection = collection(db, "categorias");

  const fetchData = async () => {
    try {
      // Obtener productos
      const productosData = await getDocs(productosCollection);
      const fetchedProductos = productosData.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setProductos(fetchedProductos);

      // Obtener categorías
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

  // Función para abrir el modal de edición con el producto seleccionado
  const handleEditClick = (producto) => {
    setProductoEditado(producto);
    setShowEditModal(true);
  };

  // Función para manejar cambios en el formulario de edición
  const handleEditInputChange = (e) => {
    setProductoEditado({ ...productoEditado, [e.target.name]: e.target.value });
  };

  // Función para manejar la carga de una nueva imagen
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProductoEditado({ ...productoEditado, imagen: imageUrl });
    }
  };

  // Función para actualizar el producto en Firebase
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
      fetchData(); // Recargar datos
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      alert("Error al actualizar el producto");
    }
  };

  // Filtrar productos por categoría
  const productosFiltrados =
    categoriaSeleccionada === "Todas"
      ? productos
      : productos.filter((producto) => producto.categoria === categoriaSeleccionada);

  return (
    <Container className="mt-5">
      <br />
      <h4>Catálogo de Productos</h4>
      {/* Filtro de categorías */}
      <Row>
        <Col lg={3} md={3} sm={6}>
          <Form.Group className="mb-3">
            <Form.Label>Filtrar por categoría:</Form.Label>
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
          {/* Botón de actualización */}
          <Button variant="primary" onClick={fetchData}>
            Actualizar
          </Button>
        </Col>
      </Row>
      {/* Catálogo de productos filtrados */}
      <Row>
        {productosFiltrados.length > 0 ? (
          productosFiltrados.map((producto) => (
            <TarjetaProducto key={producto.id} producto={producto} onEdit={handleEditClick} />
          ))
        ) : (
          <p>No hay productos en esta categoría.</p>
        )}
      </Row>

      {/* Modal de edición */}
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