import React from "react";
import { InputGroup, FormControl } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const CuadroBusqueda = ({searchText, handleSearchChange}) => {
    return(
        <InputGroup className="mb-3" style={{width: "400px"}}>
            <InputGroup.Text>
            <i className="bi bi-search"></i>
            </InputGroup.Text>

            <FormControl
            type="text"
            placeholder="Buscar..."
            value={searchText}
            onChange={handleSearchChange}

            />
        </InputGroup>
    );
}

export default CuadroBusqueda;