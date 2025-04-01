import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import LoginForm from "../components/LoginForm";
import { appfirebase } from "../database/firebaseconfig";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "../database/authcontext";

import "../App.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/inicio");
    }
  }, [user, navigate]); // ahora se va a ejecutar antes del render, porque me salia un error en la consola del navegador que utilizo.

  const handleSubmit = (e) => {
    e.preventDefault();
    const auth = getAuth(appfirebase);

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Usuario autenticado:", userCredential.user);
        localStorage.setItem("adminEmail", email);
        localStorage.setItem("adminPassword", password);
        navigate("/inicio");
      })
      .catch((error) => {
        setError("Error de autenticación. Verifica tus credenciales.");
        console.error(error);
      });
  };

  return (
    <Container className="d-flex vh-100 justify-content-center align-items-center">
      <LoginForm
        email={email}
        password={password}
        error={error}
        setEmail={setEmail}
        setPassword={setPassword}
        handleSubmit={handleSubmit}
      />
    </Container>
  );
};

export default Login;