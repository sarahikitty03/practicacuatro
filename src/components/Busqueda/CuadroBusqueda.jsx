import React from "react";
import { InputGroup, FormControl } from "react-bootstrap";
import { Form } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";

const CuadroBusqueda = ({ searchText, handleSearchChange }) => {
  return (
    <Form.Group>
      <Form.Label className="mb-2">Buscar</Form.Label>
      <InputGroup>
        <InputGroup.Text>
          <FaSearch />
        </InputGroup.Text>
        <FormControl
          placeholder="Buscar..."
          value={searchText}
          onChange={handleSearchChange}
        />
      </InputGroup>
    </Form.Group>
  );
};

export default CuadroBusqueda;