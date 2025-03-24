import { useNavigate } from "react-router-dom";

const Inicio = () => {

    const navigate = useNavigate();

    // Función de navegación
    const handleNavigate = (path) => {
      navigate(path);
    };

  return (
    <div>
    <h1>Inicio</h1>
    <h2>Este es el componente de inicio</h2>
  </div>
  )
}

export default Inicio;