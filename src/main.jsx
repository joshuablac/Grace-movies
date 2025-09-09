import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './context.js';

const Main = () => {
  const [fullDetails, setDetails] = React.useState([]);

  return (
    <BrowserRouter>
      <UserProvider value={{ fullDetails, setDetails }}>
        <App />
      </UserProvider>
    </BrowserRouter>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Main />);