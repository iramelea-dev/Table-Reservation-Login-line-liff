import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import {I18nextProvider} from "react-i18next";
import i18next from "i18next";
import en from './translate/en.json'
import th from './translate/th.json'  

i18next.init({
  fallbackLng: 'th',
  lng: 'th',                              // language to use
  interpolation: { escapeValue: false },  // React already does escaping
  resources: {
      en: {
          translation: en ,
        },
      th: {
          translation: th ,
      },
  },
});


const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18next}> 
    <App />
    </I18nextProvider>
  </React.StrictMode>
);