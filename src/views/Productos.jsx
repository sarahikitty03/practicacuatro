import React, { useState, useEffect } from "react";
import { Container, Button, Col, Row } from "react-bootstrap";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

  const handleCopy = (producto) => {
    const rowData = `Nombre: ${producto.nombre}\nPrecio: C$${producto.precio}\nCategoría: ${producto.categoria}`;

    navigator.clipboard
    .writeText(rowData)
    .then(() => {
      console.log("Datos de la fila copiados al portapapeles:\n" + rowData);
    })
    .catch((err) => {
      console.error("Error al copiar al portapapeles", err); 
    });
  };

  const openEditModal = (producto) => {
    setProductoEditado({ ...producto });
    setShowEditModal(true);
  };

  const openDeleteModal = (producto) => {
    setProductoAEliminar(producto);
    setShowDeleteModal(true);
  };

  const generarPDFProductos = () => {
    const doc = new jsPDF();

    doc.setFillColor(28, 41, 51);
    doc.rect(0, 0, 220, 30, 'F'); // Rectangle for header
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(28);
    doc.text('Lista de Productos', 105, 20, { align: 'center' });

    const columnas = ["#", "Nombre", "Precio", "Categoria"];
    const filas = productosFiltrados.map((producto, index) => [
      index + 1,
      producto.nombre,
      `C$ ${producto.precio}`,
      producto.categoria,
    ]);

    const totalPaginas = "{total_pages_count_string}";
    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 40,
      theme: "striped",
      styles: { fontSize: 10,cellPadding: 2 },
      margin: { top: 20, left: 14, right: 14 },
      tableWidth: "auto",
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
      },
      pageBreak: "auto",
      rowPageBreak: "auto",

      didDrawPage: function (data) {
        
        const alturaPagina = doc.internal.pageSize.getHeight();
        const anchoPagina = doc.internal.pageSize.getWidth();

        const numeroPagina = doc.internal.getNumberOfPages();

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const piePagina = `Página ${numeroPagina} de ${totalPaginas}`;
        doc.text(piePagina, anchoPagina / 2 + 15, alturaPagina - 10, {align: "center" });
      }
    });
    if (typeof doc.putTotalPages === 'function') {
      doc.putTotalPages(totalPaginas);
    }

    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2,'0');
    const anio = fecha.getFullYear();
    const nombreArchivo = `productos_${dia}${mes}${anio}.pdf`;

    doc.save(nombreArchivo);

  };

  const generarPDFDetalleProducto = (producto) => {
  const pdf = new jsPDF();

  pdf.setFillColor(28, 41, 51);
  pdf.rect(0, 0, 220, 30, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.text(producto.nombre, pdf.internal.pageSize.getWidth() / 2, 18, { align: "center" });

  if (producto.imagen) {
    const propiedadesImagen = pdf.getImageProperties(producto.imagen);
    const anchoPagina = pdf.internal.pageSize.getWidth();
    const anchoImagen = 60;
    const altoImagen = (propiedadesImagen.height * anchoImagen) / propiedadesImagen.width;
    const posicionX = (anchoPagina - anchoImagen) / 2;
    pdf.addImage(producto.imagen, 'JPEG', posicionX, 40, anchoImagen, altoImagen);
    
    const posicionY = 40 + altoImagen + 10;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.text(`Precio: C$ ${producto.precio}`, anchoPagina / 2, posicionY, { align: "center" });
    pdf.text(`Categoría: ${producto.categoria}`, anchoPagina / 2, posicionY + 10, {align: "center"});
  } else {
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.text(`Precio: C$ ${producto.precio}`, pdf.internal.pageSize.getWidth() / 2, 50, { align: "center" });
    pdf.text(`Categoría: ${producto.categoria}`, pdf.internal.pageSize.getWidth() / 2, 60, {align: "center"});
  }

  pdf.save(`${producto.nombre}.pdf`);
  };

  const exportarExcelProductos = () => {
    const datos = productosFiltrados.map((producto, index) => ({
      "#": index + 1,
      Nombre: producto.nombre,
      Precio: parseFloat(producto.precio),
      Categoría: producto.categoria,
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Productos');

    const excelBuffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });

    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();

    const nombreArchivo = `Productos_${dia}${mes}${anio}.xlsx`;
  
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, nombreArchivo);
  }

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
      <Row className="align-items-center flex-wrap mb-4">
        <Col xs={12} md="auto" className="mb-2 me-md-2">
          <Button onClick={() => setShowModal(true)} className="w-100 w-md-auto px-4">
            Agregar producto
          </Button>
        </Col>

        <Col xs={12} md="auto" className="mb-2 me-md-2">
          <Button
            onClick={generarPDFProductos}
            variant="secondary"
            className="w-100 w-md-auto px-4"
          >
            Generar PDF
          </Button>
        </Col>

        <Col xs={12} md="auto" className="mb-2 me-md-2">
          <Button
            onClick={exportarExcelProductos}
            variant="secondary"
            className="w-100 w-md-auto px-4"
          >
            Generar Excel
          </Button>
        </Col>

        <Col xs={12} md className="mb-2">
          <CuadroBusqueda
            searchText={searchText}
            handleSearchChange={handleSearchChange}
          />
        </Col>
      </Row>

      <TablaProductos
        productos={paginatedProductos}
        openEditModal={openEditModal}
        openDeleteModal={openDeleteModal}
        handleCopy={handleCopy}
        generarPDFDetalleProducto={generarPDFDetalleProducto}
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