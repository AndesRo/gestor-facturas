import React, { useEffect } from 'react';
import HomePage from './pages/HomePage';

// Importar Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  // Inicializar Bootstrap JS y agregar íconos
  useEffect(() => {
    // Importar Bootstrap JS dinámicamente
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
    
    // Agregar Bootstrap Icons desde CDN
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="App">
      <HomePage />
    </div>
  );
}

export default App;
