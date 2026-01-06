import React, { useState, useEffect, useCallback } from 'react';

const InvoiceForm = ({ show, handleClose, invoiceToEdit, saveInvoice }) => {
  // Función para obtener el estado inicial (usando useCallback para memoizar)
  const getInitialState = useCallback(() => ({
    id: null,
    numero: '',
    fecha: new Date().toISOString().split('T')[0],
    cliente: '',
    monto: '',
    estado: 'pendiente',
    notas: ''
  }), []);

  const [invoice, setInvoice] = useState(getInitialState());
  const [errors, setErrors] = useState({});

  // Resetear formulario cuando cambia invoiceToEdit o show
  useEffect(() => {
    let isMounted = true;
    
    // Usamos setTimeout para evitar la actualización síncrona
    const timer = setTimeout(() => {
      if (isMounted) {
        if (invoiceToEdit) {
          setInvoice(invoiceToEdit);
        } else {
          setInvoice(getInitialState());
        }
        setErrors({});
      }
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [invoiceToEdit, show, getInitialState]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoice(prevInvoice => ({
      ...prevInvoice,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }
  };

const validateForm = () => {
  const newErrors = {};
  
  if (!invoice.numero.trim()) {
    newErrors.numero = 'El número de factura es requerido';
  }
  
  if (!invoice.fecha) {
    newErrors.fecha = 'La fecha es requerida';
  }
  
  if (!invoice.cliente.trim()) {
    newErrors.cliente = 'El cliente es requerido';
  }
  
  const montoNumero = parseInt(invoice.monto);
  if (!invoice.monto || isNaN(montoNumero) || montoNumero <= 0) {
    newErrors.monto = 'El monto debe ser un número entero mayor a 0';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      saveInvoice(invoice);
      handleClose();
    }
  };

  const handleReset = () => {
    setInvoice(getInitialState());
    setErrors({});
  };

  // Función para cerrar el modal
  const handleModalClose = () => {
    handleClose();
    // Resetear el formulario después de cerrar
    setTimeout(() => {
      setInvoice(getInitialState());
      setErrors({});
    }, 300); // Esperar a que termine la animación del modal
  };

  return (
    <div className={`modal fade ${show ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: show ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              {invoiceToEdit ? 'Editar Factura' : 'Nueva Factura'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={handleModalClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="numero" className="form-label">Número de Factura *</label>
                <input
                  type="text"
                  className={`form-control ${errors.numero ? 'is-invalid' : ''}`}
                  id="numero"
                  name="numero"
                  value={invoice.numero}
                  onChange={handleChange}
                  placeholder="Ej: FAC-001"
                />
                {errors.numero && <div className="invalid-feedback">{errors.numero}</div>}
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="fecha" className="form-label">Fecha *</label>
                  <input
                    type="date"
                    className={`form-control ${errors.fecha ? 'is-invalid' : ''}`}
                    id="fecha"
                    name="fecha"
                    value={invoice.fecha}
                    onChange={handleChange}
                  />
                  {errors.fecha && <div className="invalid-feedback">{errors.fecha}</div>}
                </div>
                <div className="col-md-6">
  <label htmlFor="monto" className="form-label">Monto (CLP) *</label>
 <input
  type="number"
  className={`form-control ${errors.monto ? 'is-invalid' : ''}`}
  id="monto"
  name="monto"
  value={invoice.monto}
  onChange={handleChange}
  placeholder="100000"
  step="1"
  min="0"
/>
  <div className="form-text"></div>
  {errors.monto && <div className="invalid-feedback">{errors.monto}</div>}
</div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="cliente" className="form-label">Cliente *</label>
                <input
                  type="text"
                  className={`form-control ${errors.cliente ? 'is-invalid' : ''}`}
                  id="cliente"
                  name="cliente"
                  value={invoice.cliente}
                  onChange={handleChange}
                  placeholder="Nombre del cliente"
                />
                {errors.cliente && <div className="invalid-feedback">{errors.cliente}</div>}
              </div>
              
              <div className="mb-3">
                <label htmlFor="estado" className="form-label">Estado</label>
                <select
                  className="form-select"
                  id="estado"
                  name="estado"
                  value={invoice.estado}
                  onChange={handleChange}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="vencida">Vencida</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label htmlFor="notas" className="form-label">Notas</label>
                <textarea
                  className="form-control"
                  id="notas"
                  name="notas"
                  rows="3"
                  value={invoice.notas}
                  onChange={handleChange}
                  placeholder="Observaciones adicionales"
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleReset}>
                Limpiar
              </button>
              <button type="button" className="btn btn-light" onClick={handleModalClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {invoiceToEdit ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;