// Utilidades para manejar localStorage

export const STORAGE_KEY = 'facturas_app_invoices';

export const getInvoicesFromStorage = () => {
  try {
    const invoices = localStorage.getItem(STORAGE_KEY);
    return invoices ? JSON.parse(invoices) : [];
  } catch (error) {
    console.error('Error al leer facturas de localStorage:', error);
    return [];
  }
};

export const saveInvoicesToStorage = (invoices) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    return true;
  } catch (error) {
    console.error('Error al guardar facturas en localStorage:', error);
    return false;
  }
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};