import React from 'react';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow mb-4">
      <div className="container">
        <a className="navbar-brand fw-bold" href="#">
          <i className="bi bi-receipt me-2"></i>
          Gestor de Facturas
        </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <span className="nav-link">Gestiona tus facturas personales</span>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;