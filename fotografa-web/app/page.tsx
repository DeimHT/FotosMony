import Image from "next/image";
import Link from "next/link";

const eventos = [
  { nombre: 'Licenciatura 2024', slug: 'licenciatura-2024' },
  { nombre: 'Boda Maria & Juan', slug: 'boda-maria-juan' }
];

export default function Home() {
  return (
    <div>
      {eventos.map((evento) => (
        <Link 
          key={evento.slug} 
          href={`/eventos/${evento.slug}`}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          Ver galería de {evento.nombre}
        </Link>
      ))}
    </div>
  );
}
