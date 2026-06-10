import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { productsApi, cartApi } from '../../../shared/api/endpoints'
import { useCartStore } from '../../../shared/stores/cart.store'
import { useAuthStore, selectIsAuthenticated } from '../../../shared/stores/auth.store'
import { ApiError } from '../../../shared/api/client'
import { AMBIENT_MAP, ALL_CATEGORIES, type AmbientKey } from '../lib/ambients'
import { fetchCachedCatalogPage, getCachedCatalogPage, prefetchCatalogPage } from '../lib/catalog-cache'
import { useCatalogsStore, type CatalogKey } from '../../../shared/stores/catalogs.store'
import type { ProductSummary, ProductListParams } from '../../../shared/api/dto.types'
import type { ProductCardData } from '../../products/components/ProductCard'

export function toProductCardData(p: ProductSummary): ProductCardData {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    priceCents: p.priceCents,
    imageUrl: p.images[0]?.url,
    badge: undefined,
  }
}

// Parses a comma-separated URL param into a string array
function parseList(raw: string | null): string[] {
  return raw ? raw.split(',').filter(Boolean) : []
}

// Toggles a value in an array (adds if absent, removes if present)
function toggleValue(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
}

const PAGE_SIZE = 6

export function useCatalogController(ambient?: string) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<ProductListParams['sort']>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const cartAddItem = useCartStore((s) => s.addItem)
  const syncFromBackend = useCartStore((s) => s.syncFromBackend)
  const isAuth = useAuthStore(selectIsAuthenticated)
  const navigate = useNavigate()

  // Use catalog store overrides only if stored slugs are still valid
  const catalogMap = useCatalogsStore(s => s.map)
  const ambientBase = ambient ? AMBIENT_MAP[ambient as AmbientKey] : undefined
  const knownSlugs = useMemo(() => new Set(ALL_CATEGORIES.map(c => c.slug)), [])
  const storedCats = ambient ? catalogMap[ambient as CatalogKey] : undefined
  // Memoized so its reference stays stable across renders — otherwise `ambientConfig`
  // (and the fetch effect that depends on it) would re-run on every render, leaving the
  // catalog stuck on the loading spinner and never reaching the error/empty state.
  const validStoredCats = useMemo(
    () => storedCats?.filter(s => knownSlugs.has(s)),
    [storedCats, knownSlugs],
  )
  const ambientConfig = useMemo(
    () =>
      ambientBase
        ? { ...ambientBase, categories: (validStoredCats && validStoredCats.length > 0) ? validStoredCats : ambientBase.categories }
        : undefined,
    [ambientBase, validStoredCats],
  )

  const ambientCatsKey = ambientConfig ? ambientConfig.categories.join(',') : ''

  const catParam = searchParams.get('cat')
  const colorParam = searchParams.get('color')
  const materialParam = searchParams.get('material')
  const q         = ambient ? undefined : (searchParams.get('q') ?? undefined)
  const categories = useMemo(() => parseList(catParam), [catParam])
  const colors     = useMemo(() => parseList(colorParam), [colorParam])
  const materials  = useMemo(() => parseList(materialParam), [materialParam])

  // When multi-filtering client-side, fetch a large batch and filter locally
  const clientFilter = categories.length > 1 || colors.length > 0 || materials.length > 0 || Boolean(ambientConfig)
  const requestParams = useMemo<ProductListParams>(() => ({
    page: clientFilter ? 1 : page,
    limit: clientFilter ? 100 : PAGE_SIZE,
    q,
    categorySlug: categories.length === 1 && !ambientConfig ? categories[0] : undefined,
    sort,
  }), [ambientConfig, categories, clientFilter, page, q, sort])

  useEffect(() => {
    let cancelled = false
    setError('')

    const cachedPage = clientFilter ? undefined : getCachedCatalogPage(requestParams)
    if (cachedPage) {
      setProducts(cachedPage.products)
      setTotal(cachedPage.total)
      setLoading(false)
      return () => { cancelled = true }
    }

    setLoading(true)
    setProducts([])

    const loadProducts = clientFilter
      ? productsApi.listAll
      : (params: ProductListParams) => fetchCachedCatalogPage(params, productsApi.list)

    loadProducts(requestParams)
      .then((res) => {
        if (cancelled) return

        let items = res.products

        // Ambient base filter
        if (ambientConfig && categories.length === 0) {
          items = items.filter(p =>
            p.categories?.some(c => ambientConfig.categories.includes(c.category.slug))
          )
        }

        // Multi-category client-side filter
        if (categories.length > 1 || (ambientConfig && categories.length > 0)) {
          const allowed = ambientConfig && categories.length > 0
            ? categories.filter(s => ambientConfig.categories.includes(s))
            : categories
          items = items.filter(p =>
            p.categories?.some(c => allowed.includes(c.category.slug))
          )
        }

        // Color filter (client-side — field not in Prisma schema yet)
        if (colors.length > 0) {
          items = items.filter(p => p.color && colors.some(c => p.color!.toLowerCase() === c.toLowerCase()))
        }

        // Material filter (client-side — field not in Prisma schema yet)
        if (materials.length > 0) {
          items = items.filter(p => p.material && materials.some(m => p.material!.toLowerCase() === m.toLowerCase()))
        }

        setProducts(items)
        setTotal(clientFilter ? items.length : res.total)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'No pudimos cargar los productos.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [ambient, ambientCatsKey, ambientConfig, categories, clientFilter, colors, materials, requestParams])

  // Prefetch the next server-side page so pagination feels instant after the first view.
  useEffect(() => {
    if (clientFilter) return

    const totalPages = Math.ceil(Math.max(total, 1) / PAGE_SIZE)
    if (page >= totalPages) return

    void prefetchCatalogPage(
      { ...requestParams, page: page + 1, limit: PAGE_SIZE },
      productsApi.list,
    )
  }, [clientFilter, page, requestParams, total])

  function updateParams(updates: Record<string, string | undefined>) {
    const current: Record<string, string> = {}
    searchParams.forEach((v, k) => { current[k] = v })
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined) delete current[k]
      else current[k] = v
    })
    setSearchParams(current, { replace: true })
    setPage(1)
  }

  function toggleCategory(slug: string) {
    const next = toggleValue(categories, slug)
    updateParams({ cat: next.length > 0 ? next.join(',') : undefined })
  }

  function toggleColor(val: string) {
    const next = toggleValue(colors, val)
    updateParams({ color: next.length > 0 ? next.join(',') : undefined })
  }

  function toggleMaterial(val: string) {
    const next = toggleValue(materials, val)
    updateParams({ material: next.length > 0 ? next.join(',') : undefined })
  }

  function clearFilters() {
    setSearchParams({}, { replace: true })
    setPage(1)
  }

  function addToCart(id: string) {
    if (!isAuth) {
      navigate('/auth')
      return
    }
    const product = products.find(p => p.id === id)
    if (!product) return
    const prevItems = useCartStore.getState().items
    cartAddItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      imageUrl: product.images[0]?.url ?? '',
    })
    cartApi.addItem(product.id, 1)
      .then(cart => syncFromBackend(cart.items))
      .catch(() => useCartStore.setState({ items: prevItems }))
  }

  const hasActiveFilters = categories.length > 0 || colors.length > 0 || materials.length > 0

  // Pagination is server-side only when not doing client-side filtering
  const effectiveTotal = clientFilter ? products.length : total
  const totalPages = Math.ceil(Math.max(effectiveTotal, 1) / PAGE_SIZE)

  // When client-side filtering, paginate the already-filtered array
  const visibleProducts = clientFilter
    ? products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : products

  return {
    cardData: visibleProducts.map(toProductCardData),
    total: effectiveTotal,
    totalPages,
    page,
    setPage,
    sort,
    setSort,
    loading,
    error,
    showSkeletons: loading,
    addToCart,
    searchQuery: q,
    categories,
    toggleCategory,
    colors,
    toggleColor,
    materials,
    toggleMaterial,
    clearFilters,
    hasActiveFilters,
    ambientConfig,
    isEmpty: !loading && !error && products.length === 0,
  }
}
