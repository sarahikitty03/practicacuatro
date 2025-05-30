import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "es",
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          menu: {
            inicio: "Home",
            categorias: "Categories",
            productos: "Products",
            catalogo: "Catalog",
            libros: "Books",
            clima: "Weather",
            pronunciacion: "Pronunciation",
            estadisticas: "Statistics",
            cerrarSesion: "Logout",
            iniciarSesion: "Login",
            idioma: "Language",
            español: "Spanish",
            ingles: "English",
          },
          categorias: {
            titulo: "Category Management",
            agregar: "Add Category",
            chat: "AI Chat",
            offline:
              "⚠ You are offline. Changes will be saved locally and synchronized once you're back online.",
            errorCampos: "Please fill in all fields before saving.",
            errorActualizar: "Please fill in all fields before updating.",
            agregado: "Category added.",
            actualizado: "Category updated.",
            eliminado: "Category deleted.",
            errorAgregar: "Error adding category:",
            errorActualizar2: "Error updating category:",
            errorEliminar: "Error deleting category:",
            offlineAviso: "You're offline. Changes will sync when you're back online.",
          },
        },
      },
      es: {
        translation: {
          menu: {
            inicio: "Inicio",
            categorias: "Categorías",
            productos: "Productos",
            catalogo: "Catálogo",
            libros: "Libros",
            clima: "Clima",
            pronunciacion: "Pronunciación",
            estadisticas: "Estadísticas",
            cerrarSesion: "Cerrar Sesión",
            iniciarSesion: "Iniciar Sesión",
            idioma: "Idioma",
            español: "Español",
            ingles: "Inglés",
          },
          categorias: {
            titulo: "Gestión de Categorías",
            agregar: "Agregar categoría",
            chat: "Chat IA",
            offline:
              "⚠ Estás sin conexión. Los cambios se guardarán localmente y se sincronizarán automáticamente al volver a estar en línea.",
            errorCampos: "Por favor, completa todos los campos antes de guardar.",
            errorActualizar: "Por favor, completa todos los campos antes de actualizar.",
            agregado: "Categoría agregada.",
            actualizado: "Categoría actualizada.",
            eliminado: "Categoría eliminada.",
            errorAgregar: "Error al agregar la categoría:",
            errorActualizar2: "Error al actualizar la categoría:",
            errorEliminar: "Error al eliminar la categoría:",
            offlineAviso: "Estás offline. El cambio se guardará cuando te conectes.",
          },
        },
      },
    },
  });

export default i18n;