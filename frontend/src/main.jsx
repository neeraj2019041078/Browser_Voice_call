import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Admin from '../user1/App';
import Guest from '../user2/App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/user1" element={<Admin />} />
      <Route path="/user2" element={<Guest />} />
    </Routes>
  </BrowserRouter>
);
