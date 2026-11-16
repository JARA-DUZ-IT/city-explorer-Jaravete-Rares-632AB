import { useState, useEffect } from 'react';
import { getDestinatii, patchVizitat, postDestinatie } from './api/destinatii.js';
import PanouStatistici from './components/PanouStatistici.jsx'
import Cautare from './components/Cautare.jsx';
import {
  getNevizitate,
  totalZile,
  marcheazaVizitat,
  adaugaDestinatie,
  stergeDestinatie
} from './utils/destinatii.js';
import ListaDestinatii from './components/ListaDestinatii.jsx';
import Rezumat from './components/Rezumat.jsx';
import FormularDestinatie from './components/FormularDestinatie.jsx';
import './App.css';

export default function App() {
  // 1. Modificăm starea inițială să fie un tablou gol și adăugăm stările pentru cererea către server
  const [destinatii, setDestinatii] = useState([]);
  const [incarcare, setIncarcare] = useState(true);
  const [eroare, setEroare] = useState(null);
  const [seTrimite, setSeTrimite] = useState(false);
  const [cautare, setCautare] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPagini, setTotalPagini] = useState(1);

  // 2. Adăugăm efectul care aduce datele de la server la încărcarea paginii
  useEffect(() => {
    async function incarca() {
      setIncarcare(true);
      try {
        const rezultat = await getDestinatii(pagina);
        setDestinatii(rezultat.data); // Luăm doar lista de destinații din răspuns
        setTotalPagini(rezultat.pages); // Salvăm numărul total de pagini
      } catch (error) {
        setEroare(error.message);
      } finally {
        setIncarcare(false);
      }
    }
    incarca();
  },[pagina]); // Cererea se repetă când se schimbă pagina

  const total = destinatii.length;
  const nevizitate = getNevizitate(destinatii).length;
  const zile = totalZile(getNevizitate(destinatii));

  async function handleToggle(id) {
  // Găsim destinația ca să știm ce valoare are acum 'vizitat'
  const destinatieCurenta = destinatii.find((d) => d.id === id);
  if (!destinatieCurenta) return;

  try {
    // Trimitem modificarea către server (valoarea inversă)
    const salvata = await patchVizitat(id, !destinatieCurenta.vizitat);
    
    // Înlocuim în stare destinația veche cu obiectul întors de server
    setDestinatii((curent) => curent.map((d) => (d.id === id ? salvata : d)));
  } catch (err) {
    console.error("Nu am putut actualiza destinația pe server", err);
  }
}

  async function handleAdd(nouaDestinatie) {
  setSeTrimite(true);
  try {
    const salvata = await postDestinatie(nouaDestinatie);
    setDestinatii((curent) => [...curent, salvata]);
  } catch (err) {
    console.error("Eroare la adăugare:", err);
  } finally {
    setSeTrimite(false);
  }
}

  function handleDelete(id) {
    setDestinatii((curent) => stergeDestinatie(curent, id));
  }

  // 3. Afișăm condiționat casetele de stare înainte de a randa aplicația propriu-zisă
  if (incarcare) {
    return <p className="stare">Se încarcă destinațiile...</p>;
  }

  if (eroare) {
    return <p className="stare eroare">{eroare}</p>;
  }
  const textCautat = cautare.trim().toLowerCase();
  const afisate = destinatii.filter(
    (d) => d.oras.toLowerCase().includes(textCautat) ||
           d.tara.toLowerCase().includes(textCautat)
  );

  return (
    <main>
      <h1>City Explorer</h1>
      
      {/* Dacă mai ai <PanouStatistici /> aici, îl poți lăsa sau șterge */}
      
      <Rezumat total={total} nevizitate={nevizitate} zile={zile} />
      <FormularDestinatie onAdd={handleAdd} seTrimite={seTrimite} />
      
      <Cautare 
        valoare={cautare} 
        onChange={(e) => setCautare(e.target.value)} 
      />

      {/* Condițiile pentru lista goală (Exercițiul 3c) + Paginare (Exercițiul 5c) */}
      {destinatii.length === 0 ? (
        <p className="gol">Nu există nicio destinație. Adaugă prima din formular.</p>
      ) : afisate.length === 0 ? (
        <p className="gol">Niciun rezultat pentru „{cautare}”.</p>
      ) : (
        <>
          <ListaDestinatii
            destinatii={afisate}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button 
              onClick={() => setPagina(pagina - 1)} 
              disabled={pagina === 1}
            >
              Înapoi
            </button>
            <span>pagina {pagina} din {totalPagini}</span>
            <button 
              onClick={() => setPagina(pagina + 1)} 
              disabled={pagina === totalPagini}
            >
              Înainte
            </button>
          </div>
        </>
      )}
    </main>
  );
}