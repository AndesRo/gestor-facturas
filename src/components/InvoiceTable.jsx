import React from 'react';

const InvoiceTable = ({ invoices, editInvoice, deleteInvoice, filterText, setFilterText }) => {
  
  // Filtrar facturas por número o cliente
  const filteredInvoices = invoices.filter(invoice => {
    const searchText = filterText.toLowerCase();
    return (
      invoice.numero.toLowerCase().includes(searchText) ||
      invoice.cliente.toLowerCase().includes(searchText)
    );
  });

  // Calcular total general
  const totalMonto = filteredInvoices.reduce((sum, invoice) => {
    return sum + parseInt(invoice.monto || 0);
  }, 0);

  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Formatear monto en CLP (peso chileno sin decimales)
  const formatMonto = (monto) => {
    // Remover decimales y formatear con separador de miles
    const montoEntero = parseInt(monto) || 0;
    return `$${montoEntero.toLocaleString('es-CL')}`;
  };

  // Obtener clase CSS según el estado
  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'pagado':
        return 'badge-pagado';
      case 'pendiente':
        return 'badge-pendiente';
      case 'vencida':
        return 'badge-vencida';
      default:
        return 'badge-secondary';
    }
  };

  // Obtener texto del estado
  const getEstadoText = (estado) => {
    switch (estado) {
      case 'pagado':
        return 'Pagado';
      case 'pendiente':
        return 'Pendiente';
      case 'vencida':
        return 'Vencida';
      default:
        return estado;
    }
  };

  return (
    <div className="card shadow">
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Listado de Facturas</h5>
        <div className="d-flex align-items-center">
          <div className="input-group me-3" style={{ maxWidth: '300px' }}>
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por número o cliente..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <div className="text-muted">
            <small>Mostrando {filteredInvoices.length} de {invoices.length} facturas</small>
          </div>
        </div>
      </div>
      
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col">#</th>
                <th scope="col">Número</th>
                <th scope="col">Fecha</th>
                <th scope="col">Cliente</th>
                <th scope="col">Monto (CLP)</th>
                <th scope="col">Estado</th>
                <th scope="col">Notas</th>
                <th scope="col" className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="text-muted">
                      <i className="bi bi-file-text display-6 d-block mb-2"></i>
                      No hay facturas registradas. ¡Agrega tu primera factura!
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice, index) => (
                  <tr key={invoice.id}>
                    <th scope="row">{index + 1}</th>
                    <td className="fw-bold">{invoice.numero}</td>
                    <td>{formatDate(invoice.fecha)}</td>
                    <td>{invoice.cliente}</td>
                    <td className="fw-semibold">{formatMonto(invoice.monto)}</td>
                    <td>
                      <span className={`badge ${getEstadoClass(invoice.estado)}`}>
                        {getEstadoText(invoice.estado)}
                      </span>
                    </td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '150px' }} title={invoice.notas}>
                        {invoice.notas || '-'}
                      </div>
                    </td>
                    <td className="text-center">
                      <button 
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => editInvoice(invoice)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteInvoice(invoice.id)}
                        title="Eliminar"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredInvoices.length > 0 && (
              <tfoot className="table-light">
                <tr>
                  <td colSpan="4" className="text-end fw-bold">Total General (CLP):</td>
                  <td className="fw-bold text-primary">${totalMonto.toLocaleString('es-CL')}</td>
                  <td colSpan="3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTable;