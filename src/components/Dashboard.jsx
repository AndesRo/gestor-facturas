import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard = ({ invoices }) => {
  // Estado para filtro de período
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all', 'month', 'quarter', 'year'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filtrar facturas según el período seleccionado
  const filteredInvoices = useMemo(() => {
    if (periodFilter === 'all' || !customStartDate || !customEndDate) {
      return invoices;
    }

    const start = parseISO(customStartDate);
    const end = parseISO(customEndDate);

    return invoices.filter(invoice => {
      const invoiceDate = parseISO(invoice.fecha);
      return invoiceDate >= start && invoiceDate <= end;
    });
  }, [invoices, periodFilter, customStartDate, customEndDate]);

  // Estadísticas principales
  const stats = useMemo(() => {
    const total = filteredInvoices.reduce((sum, inv) => sum + parseInt(inv.monto || 0), 0);
    const paid = filteredInvoices.filter(inv => inv.estado === 'pagado').length;
    const pending = filteredInvoices.filter(inv => inv.estado === 'pendiente').length;
    const overdue = filteredInvoices.filter(inv => inv.estado === 'vencida').length;
    
    const avgInvoice = filteredInvoices.length > 0 
      ? Math.round(total / filteredInvoices.length) 
      : 0;

    return {
      total,
      totalFormatted: `$${total.toLocaleString('es-CL')}`,
      count: filteredInvoices.length,
      paid,
      pending,
      overdue,
      avgInvoice: `$${avgInvoice.toLocaleString('es-CL')}`,
      paidPercentage: filteredInvoices.length > 0 
        ? Math.round((paid / filteredInvoices.length) * 100) 
        : 0,
    };
  }, [filteredInvoices]);

  // Datos para gráfico de estado de facturas
  const statusData = useMemo(() => [
    { name: 'Pagadas', value: stats.paid, color: '#28a745' },
    { name: 'Pendientes', value: stats.pending, color: '#ffc107' },
    { name: 'Vencidas', value: stats.overdue, color: '#dc3545' }
  ], [stats.paid, stats.pending, stats.overdue]);

  // Datos para gráfico de facturación mensual
  const monthlyData = useMemo(() => {
    if (filteredInvoices.length === 0) return [];

    // Obtener todas las fechas de las facturas
    const dates = filteredInvoices.map(inv => parseISO(inv.fecha));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    // Generar meses entre la fecha mínima y máxima
    const months = eachMonthOfInterval({ start: minDate, end: maxDate });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthInvoices = filteredInvoices.filter(inv => {
        const invoiceDate = parseISO(inv.fecha);
        return invoiceDate >= monthStart && invoiceDate <= monthEnd;
      });

      const total = monthInvoices.reduce((sum, inv) => sum + parseInt(inv.monto || 0), 0);
      const paid = monthInvoices.filter(inv => inv.estado === 'pagado').reduce((sum, inv) => sum + parseInt(inv.monto || 0), 0);

      return {
        month: format(month, 'MMM yyyy', { locale: es }),
        total,
        pagado: paid,
        pendiente: total - paid,
        count: monthInvoices.length
      };
    });
  }, [filteredInvoices]);

  // Top 5 clientes
  const topClients = useMemo(() => {
    const clientMap = {};
    
    filteredInvoices.forEach(invoice => {
      if (!clientMap[invoice.cliente]) {
        clientMap[invoice.cliente] = {
          cliente: invoice.cliente,
          total: 0,
          count: 0,
          pagado: 0,
          pendiente: 0
        };
      }
      
      const monto = parseInt(invoice.monto || 0);
      clientMap[invoice.cliente].total += monto;
      clientMap[invoice.cliente].count += 1;
      
      if (invoice.estado === 'pagado') {
        clientMap[invoice.cliente].pagado += monto;
      } else {
        clientMap[invoice.cliente].pendiente += monto;
      }
    });

    return Object.values(clientMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(client => ({
        ...client,
        totalFormatted: `$${client.total.toLocaleString('es-CL')}`,
        pagadoFormatted: `$${client.pagado.toLocaleString('es-CL')}`,
        pendienteFormatted: `$${client.pendiente.toLocaleString('es-CL')}`
      }));
  }, [filteredInvoices]);

  // Datos para tendencia de facturación
  const trendData = useMemo(() => {
    if (monthlyData.length < 2) return [];
    
    return monthlyData.map((item, index) => {
      const previous = index > 0 ? monthlyData[index - 1].total : item.total;
      const growth = index > 0 ? ((item.total - previous) / previous * 100).toFixed(1) : 0;
      
      return {
        ...item,
        crecimiento: parseFloat(growth)
      };
    });
  }, [monthlyData]);

  // Manejar cambio de período
  const handlePeriodChange = (period) => {
    setPeriodFilter(period);
    
    if (period === 'month') {
      const end = new Date();
      const start = subMonths(end, 1);
      setCustomStartDate(format(start, 'yyyy-MM-dd'));
      setCustomEndDate(format(end, 'yyyy-MM-dd'));
    } else if (period === 'quarter') {
      const end = new Date();
      const start = subMonths(end, 3);
      setCustomStartDate(format(start, 'yyyy-MM-dd'));
      setCustomEndDate(format(end, 'yyyy-MM-dd'));
    } else if (period === 'year') {
      const end = new Date();
      const start = subMonths(end, 12);
      setCustomStartDate(format(start, 'yyyy-MM-dd'));
      setCustomEndDate(format(end, 'yyyy-MM-dd'));
    } else {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  // Configurar fechas por defecto
  React.useEffect(() => {
    if (invoices.length > 0 && !customStartDate) {
      const end = new Date();
      const start = subMonths(end, 3); // Último trimestre por defecto
      setCustomStartDate(format(start, 'yyyy-MM-dd'));
      setCustomEndDate(format(end, 'yyyy-MM-dd'));
      setPeriodFilter('quarter');
    }
  }, [invoices, customStartDate]);

  // Renderizar indicadores de crecimiento
  const renderGrowthIndicator = (value) => {
    if (value > 0) {
      return <span className="text-success"><i className="bi bi-arrow-up-right"></i> {value}%</span>;
    } else if (value < 0) {
      return <span className="text-danger"><i className="bi bi-arrow-down-right"></i> {Math.abs(value)}%</span>;
    }
    return <span className="text-muted">0%</span>;
  };

  return (
    <div className="dashboard">
      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Filtros del Dashboard</h5>
          <div className="d-flex gap-2">
            <div className="btn-group">
              <button 
                className={`btn btn-sm ${periodFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handlePeriodChange('all')}
              >
                Todos
              </button>
              <button 
                className={`btn btn-sm ${periodFilter === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handlePeriodChange('month')}
              >
                Último mes
              </button>
              <button 
                className={`btn btn-sm ${periodFilter === 'quarter' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handlePeriodChange('quarter')}
              >
                Último trimestre
              </button>
              <button 
                className={`btn btn-sm ${periodFilter === 'year' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handlePeriodChange('year')}
              >
                Último año
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <label className="form-label">Fecha de inicio</label>
              <input
                type="date"
                className="form-control"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Fecha de fin</label>
              <input
                type="date"
                className="form-control"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3">
            <small className="text-muted">
              Mostrando {filteredInvoices.length} de {invoices.length} facturas
              {periodFilter !== 'all' && (
                <span> • Período: {customStartDate} a {customEndDate}</span>
              )}
            </small>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Facturado
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.totalFormatted}
                  </div>
                  <div className="mt-2 mb-0 text-muted text-xs">
                    <span>Promedio: {stats.avgInvoice}</span>
                  </div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-currency-dollar fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-success shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Facturas Pagadas
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.paid}
                  </div>
                  <div className="mt-2 mb-0 text-muted text-xs">
                    <span>{stats.paidPercentage}% del total</span>
                  </div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-warning shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Facturas Pendientes
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.pending}
                  </div>
                  <div className="mt-2 mb-0 text-muted text-xs">
                    <span>{Math.round((stats.pending / stats.count) * 100) || 0}% del total</span>
                  </div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-clock fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-danger shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                    Total Facturas
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.count}
                  </div>
                  <div className="mt-2 mb-0 text-muted text-xs">
                    <span>En período seleccionado</span>
                  </div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-file-text fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="row mb-4">
        <div className="col-xl-8 col-lg-7">
          <div className="card shadow mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-primary">Facturación Mensual</h6>
              <small className="text-muted">En pesos chilenos (CLP)</small>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${parseInt(value).toLocaleString('es-CL')}`, 'Monto']}
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="pagado" name="Pagado" fill="#28a745" />
                  <Bar dataKey="pendiente" name="Pendiente" fill="#ffc107" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-lg-5">
          <div className="card shadow mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-primary">Distribución por Estado</h6>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} facturas`, 'Cantidad']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda fila de gráficos */}
      <div className="row mb-4">
        <div className="col-xl-6 col-lg-6">
          <div className="card shadow mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-primary">Tendencia de Facturación</h6>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value) => [`$${parseInt(value).toLocaleString('es-CL')}`, 'Monto']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    name="Facturación Total" 
                    stroke="#4e73df" 
                    fill="#4e73df" 
                    fillOpacity={0.3} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-xl-6 col-lg-6">
          <div className="card shadow mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold text-primary">Top 5 Clientes</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th className="text-end">Total Facturado</th>
                      <th className="text-end">Pagado</th>
                      <th className="text-end">Pendiente</th>
                      <th className="text-center">Facturas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClients.length > 0 ? (
                      topClients.map((client, index) => (
                        <tr key={index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2">
                                <span className="text-primary fw-bold">{client.cliente.charAt(0)}</span>
                              </div>
                              <span>{client.cliente}</span>
                            </div>
                          </td>
                          <td className="text-end fw-bold">{client.totalFormatted}</td>
                          <td className="text-end text-success">{client.pagadoFormatted}</td>
                          <td className="text-end text-warning">{client.pendienteFormatted}</td>
                          <td className="text-center">
                            <span className="badge bg-primary">{client.count}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-3">
                          No hay datos de clientes para mostrar
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="row">
        <div className="col-lg-12">
          <div className="card shadow mb-4">
            <div className="card-header bg-white">
              <h6 className="m-0 font-weight-bold text-primary">Estadísticas Detalladas</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 text-center">
                  <div className="border rounded p-3">
                    <div className="text-muted mb-2">Ticket Promedio</div>
                    <div className="h4">{stats.avgInvoice}</div>
                    <small className="text-muted">Por factura</small>
                  </div>
                </div>
                <div className="col-md-3 text-center">
                  <div className="border rounded p-3">
                    <div className="text-muted mb-2">Crecimiento Mensual</div>
                    <div className="h4">
                      {trendData.length > 1 ? renderGrowthIndicator(trendData[trendData.length - 1].crecimiento) : 'N/A'}
                    </div>
                    <small className="text-muted">Último período</small>
                  </div>
                </div>
                <div className="col-md-3 text-center">
                  <div className="border rounded p-3">
                    <div className="text-muted mb-2">Mejor Mes</div>
                    <div className="h4">
                      {monthlyData.length > 0 
                        ? `$${Math.max(...monthlyData.map(m => m.total)).toLocaleString('es-CL')}`
                        : 'N/A'
                      }
                    </div>
                    <small className="text-muted">Mayor facturación</small>
                  </div>
                </div>
                <div className="col-md-3 text-center">
                  <div className="border rounded p-3">
                    <div className="text-muted mb-2">Eficiencia de Cobro</div>
                    <div className="h4">{stats.paidPercentage}%</div>
                    <small className="text-muted">Facturas pagadas</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje cuando no hay datos */}
      {filteredInvoices.length === 0 && (
        <div className="alert alert-info mt-4">
          <div className="d-flex align-items-center">
            <i className="bi bi-info-circle-fill me-3 fs-4"></i>
            <div>
              <h6 className="alert-heading">No hay datos para mostrar</h6>
              <p className="mb-0">
                No hay facturas en el período seleccionado. 
                {invoices.length > 0 ? ' Intenta con un rango de fechas diferente.' : ' Comienza agregando algunas facturas.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;