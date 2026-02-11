/**
 * Tipos y valores por defecto para el contenido editable del home.
 * Se guarda en la tabla home_sections (id: 'hero' | 'about', content: jsonb).
 */

export type HeroContent = {
  title: string;
  subtitle: string;
  cta_primary_text: string;
  cta_secondary_text: string;
  image_url: string | null;
  image_public_id: string | null;
  badge_visible: boolean;
  badge_title: string;
  badge_subtitle: string;
};

export type BulletItem = { title: string; description: string };
export type StatItem = { value: string; label: string };

export type AboutContent = {
  image_url: string | null;
  image_public_id: string | null;
  card_visible: boolean;
  card_title: string;
  card_text: string;
  section_title: string;
  intro: string;
  bullets: BulletItem[];
  stats: StatItem[];
};

export const DEFAULT_HERO: HeroContent = {
  title: "Capturamos tus\nmomentos más\nespeciales",
  subtitle:
    "En FotosMony ofrecemos servicios profesionales de fotografía en la hermosa región de los lagos. Desde sesiones fotográficas hasta impresión de alta calidad y venta de fotos digitales.",
  cta_primary_text: "Ver Nuestros Servicios",
  cta_secondary_text: "Contactar Ahora",
  image_url: null,
  image_public_id: null,
  badge_visible: true,
  badge_title: "+500 Sesiones",
  badge_subtitle: "Realizadas con éxito",
};

export const DEFAULT_ABOUT: AboutContent = {
  image_url: null,
  image_public_id: null,
  card_visible: true,
  card_title: "Ubicación Privilegiada",
  card_text:
    "Operamos en toda la hermosa región de los lagos, aprovechando paisajes naturales únicos como telón de fondo.",
  section_title: "Sobre FotosMony",
  intro:
    "Somos un estudio de fotografía especializado en capturar los momentos más importantes de tu vida. Con sede en la región de los lagos, aprovechamos los paisajes naturales únicos de nuestra zona para crear fotografías verdaderamente memorables.",
  bullets: [
    {
      title: "Calidad Profesional",
      description: "Utilizamos equipos de última generación y técnicas avanzadas de edición.",
    },
    {
      title: "Servicio Personalizado",
      description: "Adaptamos cada sesión a tus necesidades y preferencias específicas.",
    },
    {
      title: "Entorno Natural",
      description: "Los lagos y paisajes naturales proporcionan el escenario perfecto.",
    },
  ],
  stats: [
    { value: "500+", label: "Clientes Satisfechos" },
    { value: "5+", label: "Años de Experiencia" },
    { value: "24h", label: "Entrega Express" },
    { value: "100%", label: "Región de los Lagos" },
  ],
};

const IMG_HERO_FALLBACK =
  "https://images.unsplash.com/photo-1718147155878-e2baab858e74?w=900&h=1100&fit=crop&q=80";
const IMG_ABOUT_FALLBACK =
  "https://images.unsplash.com/photo-1493724798364-c4ca5e3f5fd3?w=1200&h=800&fit=crop&q=80";

export function heroImageUrl(hero: HeroContent, r2PublicUrl: string | undefined): string {
  if (hero.image_url) return hero.image_url;
  if (hero.image_public_id && r2PublicUrl) return `${r2PublicUrl}/${hero.image_public_id}`;
  return IMG_HERO_FALLBACK;
}

export function aboutImageUrl(about: AboutContent, r2PublicUrl: string | undefined): string {
  if (about.image_url) return about.image_url;
  if (about.image_public_id && r2PublicUrl) return `${r2PublicUrl}/${about.image_public_id}`;
  return IMG_ABOUT_FALLBACK;
}

/** Fusiona contenido parcial con valores por defecto (para uso en API y en la home). */
export function mergeHero(partial: unknown): HeroContent {
  const d = DEFAULT_HERO;
  if (!partial || typeof partial !== "object") return d;
  const p = partial as Record<string, unknown>;
  return {
    title: typeof p.title === "string" ? p.title : d.title,
    subtitle: typeof p.subtitle === "string" ? p.subtitle : d.subtitle,
    cta_primary_text: typeof p.cta_primary_text === "string" ? p.cta_primary_text : d.cta_primary_text,
    cta_secondary_text:
      typeof p.cta_secondary_text === "string" ? p.cta_secondary_text : d.cta_secondary_text,
    image_url: p.image_url === null || typeof p.image_url === "string" ? p.image_url : d.image_url,
    image_public_id:
      p.image_public_id === null || typeof p.image_public_id === "string"
        ? p.image_public_id
        : d.image_public_id,
    badge_visible: typeof p.badge_visible === "boolean" ? p.badge_visible : d.badge_visible,
    badge_title: typeof p.badge_title === "string" ? p.badge_title : d.badge_title,
    badge_subtitle: typeof p.badge_subtitle === "string" ? p.badge_subtitle : d.badge_subtitle,
  };
}

export function mergeAbout(partial: unknown): AboutContent {
  const d = DEFAULT_ABOUT;
  if (!partial || typeof partial !== "object") return d;
  const p = partial as Record<string, unknown>;
  const bullets = Array.isArray(p.bullets)
    ? (p.bullets as unknown[]).map((b) => {
        const x = b && typeof b === "object" ? (b as Record<string, unknown>) : {};
        return {
          title: typeof x.title === "string" ? x.title : "",
          description: typeof x.description === "string" ? x.description : "",
        };
      })
    : d.bullets;
  const stats = Array.isArray(p.stats)
    ? (p.stats as unknown[]).map((s) => {
        const x = s && typeof s === "object" ? (s as Record<string, unknown>) : {};
        return {
          value: typeof x.value === "string" ? x.value : "",
          label: typeof x.label === "string" ? x.label : "",
        };
      })
    : d.stats;
  return {
    image_url: p.image_url === null || typeof p.image_url === "string" ? p.image_url : d.image_url,
    image_public_id:
      p.image_public_id === null || typeof p.image_public_id === "string"
        ? p.image_public_id
        : d.image_public_id,
    card_visible: typeof p.card_visible === "boolean" ? p.card_visible : d.card_visible,
    card_title: typeof p.card_title === "string" ? p.card_title : d.card_title,
    card_text: typeof p.card_text === "string" ? p.card_text : d.card_text,
    section_title: typeof p.section_title === "string" ? p.section_title : d.section_title,
    intro: typeof p.intro === "string" ? p.intro : d.intro,
    bullets: bullets.length ? bullets : d.bullets,
    stats: stats.length ? stats : d.stats,
  };
}
