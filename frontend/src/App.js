import React from 'react';
import ProductList from './components/ProductList';
import AddProductForm from './components/AddProductForm';

const App = () => {
  return (
    <div>
      <h1>Sistema de Gerenciamento de Estoque</h1>
      <AddProductForm />
      <ProductList />
    </div>
  );
}

export default App;
