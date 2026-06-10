export type AmbientKey = 'living' | 'dormitorio' | 'decoracion' | 'cocina'

export interface AmbientConfig {
  label: string
  description: string
  categories: string[]  // slugs reales de la DB
}

// Mapa de ambientes a categorías reales del backend.
// Cada producto se muestra en el ambiente si tiene al menos UNA de estas categorías.
export const AMBIENT_MAP: Record<AmbientKey, AmbientConfig> = {
  living: {
    label: 'Living',
    description: 'Sofás, sillas y mesas que definen tu sala. Piezas seleccionadas para durar.',
    categories: ['sofas', 'sillas', 'mesas'],
  },
  dormitorio: {
    label: 'Dormitorio',
    description: 'Todo para tu habitación. Muebles pensados para el descanso.',
    categories: ['camas', 'armarios'],
  },
  decoracion: {
    label: 'Decoración',
    description: 'Piezas que dan carácter a cualquier ambiente.',
    categories: ['iluminacion', 'cuadros', 'alfombras'],
  },
  cocina: {
    label: 'Cocina',
    description: 'Funcionalidad y estilo para tu cocina y comedor.',
    categories: ['vajilla', 'utensilios'],
  },
}

// Categorías que aparecen en el sidebar de filtros de /catalog (Tienda).
export const ALL_CATEGORIES = [
  // ── Living ─────────────────────────────────
  { slug: 'sofas',      label: 'Sofás' },
  { slug: 'sillas',     label: 'Sillas' },
  { slug: 'mesas',      label: 'Mesas' },
  // ── Dormitorio ─────────────────────────────
  { slug: 'camas',      label: 'Camas' },
  { slug: 'armarios',   label: 'Armarios' },
  // ── Decoración ─────────────────────────────
  { slug: 'iluminacion', label: 'Iluminación' },
  { slug: 'cuadros',    label: 'Cuadros' },
  { slug: 'alfombras',  label: 'Alfombras' },
  // ── Cocina ─────────────────────────────────
  { slug: 'vajilla',    label: 'Vajilla' },
  { slug: 'utensilios', label: 'Utensilios' },
]
