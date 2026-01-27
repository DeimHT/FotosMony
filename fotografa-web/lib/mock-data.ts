// FotosMony/lib/mock-data.ts

export type Foto = {
  id: string;
  public_id: string;
  precio: number;
};

export type SubEvento = {
  id: string;
  slug: string;

  // Datos del partido
  fecha: string;        // formato ISO: YYYY-MM-DD
  categoria: string;    // ej: U15, U18, Adulto
  equipoLocal: string;
  equipoVisita: string;

  fotos: Foto[];
};

export type Evento = {
  id: string;
  nombre: string;
  slug: string;
  fotos?: Foto[];           // solo si NO tiene subeventos
  subEventos?: SubEvento[]; // si tiene, aquí van
};

// ✅ Lista de eventos
export const MOCK_EVENTOS: Evento[] = [
  {
    id: "1",
    nombre: "Licenciatura Colegio San Pedro 2024",
    slug: "licenciatura-2024",
    fotos: [
      { id: "f1", public_id: "eventos/foto1", precio: 2500 },
      { id: "f2", public_id: "eventos/foto2", precio: 2500 },
      { id: "f3", public_id: "eventos/foto3", precio: 2500 },
    ],
  },
  {
    id: "2",
    nombre: "Torneo Basquet Puerto Varas 2025",
    slug: "torneo-basquet-2025",
    subEventos: [
      {
        id: "2-1",
        slug: "2026-01-27-u15-equipo1-vs-equipo2",
        fecha: "2026-01-27",
        categoria: "U15",
        equipoLocal: "Equipo1",
        equipoVisita: "Equipo2",
        fotos: [
          { id: "p1f1", public_id: "torneo/p1/foto1", precio: 2500 },
          { id: "p1f2", public_id: "torneo/p1/foto2", precio: 2500 },
        ],
      },
      {
        id: "2-2",
        slug: "2026-01-28-u15-equipo3-vs-equipo4",
        fecha: "2026-01-28",
        categoria: "U15",
        equipoLocal: "Equipo3",
        equipoVisita: "Equipo4",
        fotos: [
          { id: "p2f1", public_id: "torneo/p2/foto1", precio: 2500 },
          { id: "p2f2", public_id: "torneo/p2/foto2", precio: 2500 },
          { id: "p2f3", public_id: "torneo/p2/foto3", precio: 2500 },
        ],
      },
    ],
  },
];

// Helpers (para no repetir lógica en páginas)
export const getEventoBySlug = (slug: string) =>
  MOCK_EVENTOS.find((e) => e.slug === slug);

export const getSubEventoBySlugs = (eventSlug: string, subSlug: string) => {
  const evento = getEventoBySlug(eventSlug);
  const subEvento = evento?.subEventos?.find((s) => s.slug === subSlug);
  return { evento, subEvento };
};

// Helper para título legible del partido: "27/01/2026 - U15 - Equipo1 vs Equipo2"
export const formatSubEventoTitle = (s: Pick<
  SubEvento,
  "fecha" | "categoria" | "equipoLocal" | "equipoVisita"
>) => {
  const fechaFormateada = new Date(s.fecha).toLocaleDateString("es-CL");
  return `${fechaFormateada} - ${s.categoria} - ${s.equipoLocal} vs ${s.equipoVisita}`;
};
