import React, { useState, useEffect, useCallback } from 'react';
import InvoiceForm from '../components/InvoiceForm';
import InvoiceTable from '../components/InvoiceTable';
import Dashboard from '../components/Dashboard';
import { getInvoicesFromStorage, saveInvoicesToStorage, generateId } from '../utils/storage';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const HomePage = () => {
  // Estado para facturas
  const [invoices, setInvoices] = useState([]);
  
  // Estado para controlar el modal
  const [showModal, setShowModal] = useState(false);
  
  // Estado para factura en edición
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);
  
  // Estado para filtro de búsqueda
  const [filterText, setFilterText] = useState('');
  
  // Estado para vista actual (tabla o dashboard)
  const [currentView, setCurrentView] = useState('table'); // 'table' o 'dashboard'

  // Función para cargar facturas (memoizada con useCallback)
  const loadInvoices = useCallback(() => {
    const storedInvoices = getInvoicesFromStorage();
    return storedInvoices;
  }, []);

  // Cargar facturas desde localStorage al iniciar
  useEffect(() => {
    let isMounted = true;
    
    // Usar setTimeout para evitar actualización síncrona
    const timer = setTimeout(() => {
      if (isMounted) {
        const storedInvoices = loadInvoices();
        setInvoices(storedInvoices);
      }
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [loadInvoices]);

  // Guardar facturas en localStorage cuando cambian
  useEffect(() => {
    if (invoices.length > 0) {
      saveInvoicesToStorage(invoices);
    }
  }, [invoices]);

  // Abrir modal para nueva factura
  const handleNewInvoice = () => {
    setInvoiceToEdit(null);
    setShowModal(true);
  };

  // Abrir modal para editar factura
  const handleEditInvoice = (invoice) => {
    setInvoiceToEdit(invoice);
    setShowModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setInvoiceToEdit(null);
  };

  // Guardar factura (nueva o editada)
  const handleSaveInvoice = (invoiceData) => {
    if (invoiceData.id) {
      // Editar factura existente
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => 
          inv.id === invoiceData.id ? invoiceData : inv
        )
      );
    } else {
      // Agregar nueva factura
      const newInvoice = {
        ...invoiceData,
        id: generateId(),
        fecha: invoiceData.fecha || new Date().toISOString().split('T')[0]
      };
      setInvoices(prevInvoices => [...prevInvoices, newInvoice]);
    }
  };

  // Eliminar factura
  const handleDeleteInvoice = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta factura?')) {
      setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== id));
    }
  };

  // Exportar a Excel
  const handleExportExcel = () => {
    if (invoices.length === 0) {
      alert('No hay facturas para exportar');
      return;
    }
    
    const success = exportToExcel(invoices);
    if (success) {
      alert('Facturas exportadas a Excel correctamente');
    } else {
      alert('Error al exportar a Excel');
    }
  };

  // Exportar a PDF
  const handleExportPDF = () => {
    if (invoices.length === 0) {
      alert('No hay facturas para exportar');
      return;
    }
    
    const success = exportToPDF(invoices);
    if (success) {
      alert('Facturas exportadas a PDF correctamente');
    } else {
      alert('Error al exportar a PDF');
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Navbar actualizado con navegación */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow">
        <div className="container">
          <span className="navbar-brand fw-bold">
            <i className="bi bi-receipt me-2"></i>
            Gestor de Facturas
          </span>
          
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link ${currentView === 'table' ? 'active' : ''}`}
                  onClick={() => setCurrentView('table')}
                >
                  <i className="bi bi-table me-1"></i>
                  Tabla de Facturas
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setCurrentView('dashboard')}
                >
                  <i className="bi bi-bar-chart me-1"></i>
                  Dashboard
                </button>
              </li>
            </ul>
            
            <div className="d-flex align-items-center">
              <span className="text-white me-3 d-none d-md-block">
                <i className="bi bi-file-text me-1"></i>
                {invoices.length} facturas
              </span>
              <button 
                className="btn btn-outline-light btn-sm"
                onClick={handleNewInvoice}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Nueva Factura
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="container py-4">
        {/* Encabezado con botones según vista */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-0">
              {currentView === 'table' ? 'Mis Facturas' : 'Dashboard de Facturación'}
            </h1>
            <p className="text-muted mb-0">
              {currentView === 'table' 
                ? 'Administra tus facturas' 
                : 'Visualiza estadísticas y tendencias de tus facturas'}
            </p>
          </div>
          
          {currentView === 'table' && (
            <div className="d-flex gap-2">
              <div className="btn-group">
                <button 
                  className="btn btn-outline-success"
                  onClick={handleExportExcel}
                  disabled={invoices.length === 0}
                >
                  <i className="bi bi-file-earmark-excel me-1"></i>
                  Exportar Excel
                </button>
                <button 
                  className="btn btn-outline-danger"
                  onClick={handleExportPDF}
                  disabled={invoices.length === 0}
                >
                  <i className="bi bi-file-earmark-pdf me-1"></i>
                  Exportar PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contenido según vista seleccionada */}
        {currentView === 'table' ? (
          <InvoiceTable 
            invoices={invoices}
            editInvoice={handleEditInvoice}
            deleteInvoice={handleDeleteInvoice}
            filterText={filterText}
            setFilterText={setFilterText}
          />
        ) : (
          <Dashboard invoices={invoices} />
        )}

        {/* Información adicional */}
        {currentView === 'table' && invoices.length > 0 && (
          <div className="mt-4">
            <div className="alert alert-info">
              <div className="d-flex">
                <div className="me-3">
                  <i className="bi bi-info-circle fs-4"></i>
                </div>
                <div>
                  <h6 className="alert-heading">¿Cómo usar esta aplicación?</h6>
                  <p className="mb-2">
                    - Para agregar una nueva factura, haz clic en <strong>"Nueva Factura"</strong>.<br/>
                    - Para editar o eliminar una factura existente, usa los botones en la columna "Acciones".<br/>
                    - Puedes buscar facturas por número o cliente usando el campo de búsqueda.<br/>
                    - Tus datos se guardan automáticamente en tu navegador.
                  </p>
                  <small className="text-muted">
                    <i className="bi bi-lightbulb me-1"></i>
                    Tip: Visita el Dashboard para ver estadísticas detalladas de tus facturas.
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal para agregar/editar factura */}
      {showModal && (
        <InvoiceForm
          show={showModal}
          handleClose={handleCloseModal}
          invoiceToEdit={invoiceToEdit}
          saveInvoice={handleSaveInvoice}
        />
      )}

      {/* Footer */}
      <footer className="bg-light border-top py-4 mt-4">
        <div className="container text-center">
          <p className="text-muted mb-0">
            Gestor de Facturas &copy; {new Date().getFullYear()} - 
            Desarrollado por AndrewRo-Dev
          </p>
          <small className="text-muted">
        
          </small>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;