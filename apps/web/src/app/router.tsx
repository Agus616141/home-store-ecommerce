import { Suspense, lazy, type ReactElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DesktopLayout } from '../layouts/DesktopLayout'
import { CheckoutLayout } from '../layouts/CheckoutLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RequireAdmin } from './RequireAdmin'
import { HomePage } from '../features/home/desktop/HomePage'
import { NotFoundPage } from '../features/not-found/desktop/NotFoundPage'

function RouteSkeleton() {
  return (
    <div className="wrap-wide py-[40px]">
      <div className="animate-pulse">
        <div
          className="h-[14px] w-[120px] rounded-full mb-[20px]"
          style={{ background: 'color-mix(in srgb, var(--color-cream) 55%, white)' }}
        />
        <div
          className="h-[54px] w-[320px] rounded-[14px] mb-[16px]"
          style={{ background: 'color-mix(in srgb, var(--color-cream) 50%, white)' }}
        />
        <div
          className="h-[18px] w-[480px] max-w-full rounded-full mb-[34px]"
          style={{ background: 'color-mix(in srgb, var(--color-cream) 42%, white)' }}
        />
        <div className="grid grid-cols-3 gap-[24px] max-md:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex flex-col gap-[14px]">
              <div
                className="aspect-[3/4] rounded-[12px]"
                style={{ background: 'color-mix(in srgb, var(--color-cream) 58%, white)' }}
              />
              <div
                className="h-[18px] w-[76%] rounded-full"
                style={{ background: 'color-mix(in srgb, var(--color-cream) 44%, white)' }}
              />
              <div
                className="h-[16px] w-[38%] rounded-full"
                style={{ background: 'color-mix(in srgb, var(--color-cream) 38%, white)' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function withRouteFallback(element: ReactElement) {
  return <Suspense fallback={<RouteSkeleton />}>{element}</Suspense>
}

const CatalogPage = lazy(() =>
  import('../features/catalog/desktop/CatalogPage').then((mod) => ({ default: mod.CatalogPage })),
)
const ProductPage = lazy(() =>
  import('../features/product/desktop/ProductPage').then((mod) => ({ default: mod.ProductPage })),
)
const CartPage = lazy(() =>
  import('../features/cart/desktop/CartPage').then((mod) => ({ default: mod.CartPage })),
)
const CheckoutPage = lazy(() =>
  import('../features/checkout/desktop/CheckoutPage').then((mod) => ({ default: mod.CheckoutPage })),
)
const AuthPage = lazy(() =>
  import('../features/auth/desktop/AuthPage').then((mod) => ({ default: mod.AuthPage })),
)
const AccountPage = lazy(() =>
  import('../features/account/desktop/AccountPage').then((mod) => ({ default: mod.AccountPage })),
)
const OrderDetailPage = lazy(() =>
  import('../features/orders/desktop/OrderDetailPage').then((mod) => ({ default: mod.OrderDetailPage })),
)
const OrderSuccessPage = lazy(() =>
  import('../features/orders/desktop/OrderSuccessPage').then((mod) => ({ default: mod.OrderSuccessPage })),
)
const AdminPage = lazy(() =>
  import('../features/admin/desktop/AdminPage').then((mod) => ({ default: mod.AdminPage })),
)
const AdminProductsPage = lazy(() =>
  import('../features/admin/desktop/AdminProductsPage').then((mod) => ({ default: mod.AdminProductsPage })),
)
const AdminProductFormPage = lazy(() =>
  import('../features/admin/desktop/AdminProductFormPage').then((mod) => ({ default: mod.AdminProductFormPage })),
)
const AdminOrdersPage = lazy(() =>
  import('../features/admin/desktop/AdminOrdersPage').then((mod) => ({ default: mod.AdminOrdersPage })),
)
const AdminInventoryPage = lazy(() =>
  import('../features/admin/desktop/AdminInventoryPage').then((mod) => ({ default: mod.AdminInventoryPage })),
)
const AdminCategoriesPage = lazy(() =>
  import('../features/admin/desktop/AdminCategoriesPage').then((mod) => ({ default: mod.AdminCategoriesPage })),
)
const AdminCustomersPage = lazy(() =>
  import('../features/admin/desktop/AdminCustomersPage').then((mod) => ({ default: mod.AdminCustomersPage })),
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DesktopLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalog', element: withRouteFallback(<CatalogPage />) },
      { path: 'catalog/:ambient', element: withRouteFallback(<CatalogPage />) },
      { path: 'product/:slug', element: withRouteFallback(<ProductPage />) },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'cart', element: withRouteFallback(<CartPage />) },
          { path: 'account', element: withRouteFallback(<AccountPage />) },
          { path: 'orders/:id', element: withRouteFallback(<OrderDetailPage />) },
          { path: 'orders/:id/success', element: withRouteFallback(<OrderSuccessPage />) },
        ],
      },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
  {
    path: '/checkout',
    element: <CheckoutLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [{ index: true, element: withRouteFallback(<CheckoutPage />) }],
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [{ index: true, element: withRouteFallback(<AuthPage />) }],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        element: <RequireAdmin />,
        children: [
          { index: true, element: withRouteFallback(<AdminPage />) },
          { path: 'products', element: withRouteFallback(<AdminProductsPage />) },
          { path: 'products/new', element: withRouteFallback(<AdminProductFormPage />) },
          { path: 'products/:slug/edit', element: withRouteFallback(<AdminProductFormPage />) },
          { path: 'orders', element: withRouteFallback(<AdminOrdersPage />) },
          { path: 'inventory', element: withRouteFallback(<AdminInventoryPage />) },
          { path: 'categories', element: withRouteFallback(<AdminCategoriesPage />) },
          { path: 'customers', element: withRouteFallback(<AdminCustomersPage />) },
        ],
      },
    ],
  },
])
