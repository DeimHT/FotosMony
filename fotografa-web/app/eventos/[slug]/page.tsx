"use client";
import { useState } from 'react';
import { getWatermarkedUrl } from 'FotosMony/lib/cloudinary';
import { MOCK_EVENTO } from 'FotosMony/lib/mock-data';


export default function EventoPage() {
  const [selected, setSelected] = useState<string[]>([]);

  const togglePhoto = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Solo para probar el diseño ahora mismo
const getPlaceholderUrl = (id: string) => `https://picsum.photos/seed/${id}/800/1000`;

  return (
    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      {MOCK_EVENTO.fotos.map(foto => (
        <div 
          key={foto.id} 
          onClick={() => togglePhoto(foto.id)}
          className={`relative cursor-pointer border-4 ${selected.includes(foto.id) ? 'border-blue-500' : 'border-transparent'}`}
        >
          <img src={getPlaceholderUrl(foto.id)} alt="Preview" className="w-full h-auto object-cover" />
          {selected.includes(foto.id) && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">✓</div>
          )}
        </div>
      ))}
    </div>
  );
}
