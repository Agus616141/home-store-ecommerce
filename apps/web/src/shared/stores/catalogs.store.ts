import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AMBIENT_MAP } from '../../features/catalog/lib/ambients'

export type CatalogKey = 'living' | 'dormitorio' | 'decoracion' | 'cocina'

export const CATALOG_KEYS: CatalogKey[] = ['living', 'dormitorio', 'decoracion', 'cocina']

export const CATALOG_META: Record<CatalogKey, { label: string; description: string }> = {
  living:     { label: 'Living',      description: AMBIENT_MAP.living.description },
  dormitorio: { label: 'Dormitorio',  description: AMBIENT_MAP.dormitorio.description },
  decoracion: { label: 'Decoración',  description: AMBIENT_MAP.decoracion.description },
  cocina:     { label: 'Cocina',      description: AMBIENT_MAP.cocina.description },
}

type CatalogMap = Record<CatalogKey, string[]>

const DEFAULT_MAP: CatalogMap = {
  living:     [...AMBIENT_MAP.living.categories],
  dormitorio: [...AMBIENT_MAP.dormitorio.categories],
  decoracion: [...AMBIENT_MAP.decoracion.categories],
  cocina:     [...AMBIENT_MAP.cocina.categories],
}

interface CatalogsState {
  map: CatalogMap
  setCategories: (catalog: CatalogKey, slugs: string[]) => void
  addCategory: (catalog: CatalogKey, slug: string) => void
  removeCategory: (catalog: CatalogKey, slug: string) => void
  getCatalogFor: (slug: string) => CatalogKey | null
  reset: () => void
}

export const useCatalogsStore = create<CatalogsState>()(
  persist(
    (set, get) => ({
      map: { ...DEFAULT_MAP },

      setCategories: (catalog, slugs) =>
        set(s => ({ map: { ...s.map, [catalog]: slugs } })),

      addCategory: (catalog, slug) =>
        set(s => ({
          map: { ...s.map, [catalog]: [...new Set([...s.map[catalog], slug])] },
        })),

      removeCategory: (catalog, slug) =>
        set(s => ({
          map: { ...s.map, [catalog]: s.map[catalog].filter(x => x !== slug) },
        })),

      getCatalogFor: (slug) => {
        const m = get().map
        for (const key of CATALOG_KEYS) {
          if (m[key].includes(slug)) return key
        }
        return null
      },

      reset: () => set({ map: { ...DEFAULT_MAP } }),
    }),
    {
      name: 'homestore-catalogs-v2',
      version: 1,
      migrate: () => ({ map: { ...DEFAULT_MAP } }),
    },
  ),
)
