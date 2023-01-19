import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/app.css';

import { useEffect, useRef } from 'react';
import { useSetAtom } from 'jotai';

import { toastAtom } from './hooks';
import { Toast } from 'primereact/toast';

import Providers from './providers';
import { HomeRoute } from './layouts/home';
import { TestRoute } from './layouts/test';

export default function App() {
  const toasts = useRef(null);
  const setToatst = useSetAtom(toastAtom)
  useEffect(() => setToatst(toasts.current), [])

  return (
    <Providers>
      <Toast ref={toasts} position="bottom-left" />
      <Router>
        <Routes>
          <Route {...HomeRoute}/>
          <Route {...TestRoute}/>
        </Routes>
      </Router>
    </Providers>
  );
}
