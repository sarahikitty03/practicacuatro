import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./database/authcontext";
import ProtectedRoute from "./components/ProtectedRoute"; 
import Login from './views/Login'
import Encabezado from "./components/Encabezado";
import Inicio from "./views/Inicio";
import Categorias from "./views/categorias";
//importacion de categorias

import './App.css'

function App() {

  return (
    <>
      <AuthProvider>
        <Router>
          <div className="App">
            <Encabezado />
            <main>
              <Routes>
                
                <Route path="/" element={<Login />} />
                <Route path="/inicio" element={<ProtectedRoute element={<Inicio />} />} />
                <Route path="/categorias" element={<ProtectedRoute element={<Categorias />} />}/> //Ruta de Categorias protegida

              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </>
  )
}

export default App