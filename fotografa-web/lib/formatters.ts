export const formatPartidoTitle = (s: {
  fecha: string;
  categoria: string;
  equipoLocal: string;
  equipoVisita: string;
}) => {
  const fechaFormateada = new Date(s.fecha).toLocaleDateString("es-CL");
  return `${fechaFormateada} · ${s.categoria} · ${s.equipoLocal} vs ${s.equipoVisita}`;
};
