// src/components/ModalForm.js
import React, { useEffect, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input } from 'reactstrap';

const ModalForm = ({ isOpen, toggle, itemData, onSave }) => {
  // Inicializa formData como un objeto vacío para evitar el error inicial
  const [formData, setFormData] = useState({});

  // Usa useEffect para actualizar formData solo cuando itemData cambie
  useEffect(() => {
    if (itemData) {
      setFormData(itemData);
    }
  }, [itemData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    onSave(formData);
    toggle();
  };

  // El componente se renderiza, pero el mapeo solo ocurrirá si formData tiene datos
  const formFields = Object.keys(formData).map((key, index) => {
    if (key === 'id') {
      return null;
    }
    return (
      <FormGroup key={index}>
        <Label for={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
        <Input
          type="text"
          name={key}
          id={key}
          value={formData[key]}
          onChange={handleChange}
        />
      </FormGroup>
    );
  });

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      {/* Asegúrate de que itemData exista antes de usarlo en el encabezado */}
      {itemData && <ModalHeader toggle={toggle}>Edit Item {itemData.id}</ModalHeader>}
      <ModalBody>
        <Form>
          {formFields}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={handleSave}>Save</Button>{' '}
        <Button color="secondary" onClick={toggle}>Cancel</Button>
      </ModalFooter>
    </Modal>
  );
};

export default ModalForm;