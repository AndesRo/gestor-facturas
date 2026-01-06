// Utilidades para exportar facturas a Excel y PDF

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Formatear fecha para exportación
const formatDateForExport = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES');
};

// Exportar a Excel
export const exportToExcel = (invoices, fileName = 'facturas') => {
  try {
    // Preparar datos para Excel
    const data = invoices.map(invoice => ({
      'Número': invoice.numero,
      'Fecha': formatDateForExport(invoice.fecha),
      'Cliente': invoice.cliente,
      'Monto (CLP)': parseInt(invoice.monto) || 0,
      'Estado': invoice.estado === 'pagado' ? 'Pagado' : 
                invoice.estado === 'pendiente' ? 'Pendiente' : 'Vencida',
      'Notas': invoice.notas || ''
    }));

    // Crear libro de trabajo
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Ajustar anchos de columna
    const colWidths = [
      { wch: 15 }, // Número
      { wch: 12 }, // Fecha
      { wch: 25 }, // Cliente
      { wch: 15 }, // Monto
      { wch: 12 }, // Estado
      { wch: 40 }  // Notas
    ];
    worksheet['!cols'] = colWidths;
    
    // Formatear columna de Monto como número sin decimales
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: 3 }); // Columna D (Monto)
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].z = '#,##0'; // Formato sin decimales
      }
    }
    
    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');
    
    // Generar archivo
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    return false;
  }
};

// Exportar a PDF (tamaño carta)
export const exportToPDF = (invoices, fileName = 'facturas') => {
  try {
    // Crear documento PDF en tamaño carta (letter)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'letter' // Tamaño carta: 216x279 mm
    });
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('LISTADO DE FACTURAS', 14, 20);
    
    // Información de generación
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 28);
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, 14, 33);
    
    // Total de facturas y monto total
    const totalInvoices = invoices.length;
    const totalMonto = invoices.reduce((sum, invoice) => sum + parseInt(invoice.monto || 0), 0);
    
    doc.setFontSize(11);
    doc.text(`Total facturas: ${totalInvoices}`, 200, 28, { align: 'right' });
    doc.text(`Total facturado (CLP): $${totalMonto.toLocaleString('es-CL')}`, 200, 33, { align: 'right' });
    
    // Preparar datos para la tabla
    const tableData = invoices.map(invoice => [
      invoice.numero,
      formatDateForExport(invoice.fecha),
      invoice.cliente,
      `$${(parseInt(invoice.monto) || 0).toLocaleString('es-CL')}`,
      invoice.estado === 'pagado' ? 'Pagado' : 
      invoice.estado === 'pendiente' ? 'Pendiente' : 'Vencida',
      invoice.notas || '-'
    ]);
    
    // Configurar y crear tabla
    doc.autoTable({
      startY: 40,
      head: [['N° Factura', 'Fecha', 'Cliente', 'Monto (CLP)', 'Estado', 'Notas/Observaciones']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' }, // Número
        1: { cellWidth: 25, halign: 'center' }, // Fecha
        2: { cellWidth: 50 }, // Cliente
        3: { cellWidth: 30, halign: 'right' }, // Monto
        4: { cellWidth: 25, halign: 'center' }, // Estado
        5: { cellWidth: 61 } // Notas
      },
      margin: { left: 14, right: 14 },
      styles: { 
        overflow: 'linebreak',
        lineWidth: 0.1
      },
      didParseCell: function (data) {
        // Colorear celdas de estado
        if (data.column.index === 4) { // Columna Estado
          if (data.cell.text === 'Pagado') {
            data.cell.styles.fillColor = [212, 237, 218]; // Verde claro
            data.cell.styles.textColor = [21, 87, 36]; // Verde oscuro
          } else if (data.cell.text === 'Pendiente') {
            data.cell.styles.fillColor = [255, 243, 205]; // Amarillo claro
            data.cell.styles.textColor = [133, 100, 4]; // Amarillo oscuro
          } else if (data.cell.text === 'Vencida') {
            data.cell.styles.fillColor = [248, 215, 218]; // Rojo claro
            data.cell.styles.textColor = [114, 28, 36]; // Rojo oscuro
          }
        }
        
        // Formato para columna de Monto
        if (data.column.index === 3) { // Columna Monto
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: function (data) {
        // Pie de página
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
        
        // Línea separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(14, doc.internal.pageSize.height - 15, 
                doc.internal.pageSize.width - 14, 
                doc.internal.pageSize.height - 15);
      }
    });
    
    // Agregar firma o nota al final si hay espacio
    const finalY = doc.lastAutoTable.finalY || 40;
    if (finalY < doc.internal.pageSize.height - 30) {
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Documento generado por Gestor de Facturas', 14, finalY + 15);
      doc.text('Los datos mostrados son de carácter informativo', 14, finalY + 20);
    }
    
    // Guardar PDF
    doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    return false;
  }
};