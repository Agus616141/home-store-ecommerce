import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DesktopLayout } from '../layouts/DesktopLayout'
import { CheckoutLayout } from '../layouts/CheckoutLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RequireAdmin } from './RequireAdmin'
import { HomePage } from '../features/home/desktop/HomePage'
import { CatalogPage } from '../features/catalog/desktop/CatalogPage'
import { ProductPage } from '../features/product/desktop/ProductPage'
import { CartPage } from '../features/cart/desktop/CartPage'
import { CheckoutPage } from '../features/checkout/desktop/CheckoutPage'
import { AuthPage } from '../features/auth/desktop/AuthPage'
import { AccountPage } from '../features/account/desktop/AccountPage'
import { OrderDetailPage } from '../features/orders/desktop/OrderDetailPage'
import { OrderSuccessPage } from '../features/orders/desktop/OrderSuccessPage'
import { AdminPage } from '../features/admin/desktop/AdminPage'
import { AdminProductsPage } from '../features/admin/desktop/AdminProductsPage'
import { AdminProductFormPage } from '../features/admin/desktop/AdminProductFormPage'
import { AdminOrdersPage } from '../features/admin/desktop/AdminOrdersPage'
import { AdminInventoryPage } from '../features/admin/desktop/AdminInventoryPage'
import { AdminCategoriesPage } from '../features/admin/desktop/AdminCategoriesPage'
import { AdminCustomersPage } from '../features/admin/desktop/AdminCustomersPage'
import { NotFoundPage } from '../features/not-found/desktop/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DesktopLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'catalog/:ambient', element: <CatalogPage /> },
      { path: 'product/:slug', element: <ProductPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'cart', element: <CartPage /> },
          { path: 'account', element: <AccountPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
          { path: 'orders/:id/success', element: <OrderSuccessPage /> },
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
        children: [{ index: true, element: <CheckoutPage /> }],
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [{ index: true, element: <AuthPage /> }],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        element: <RequireAdmin />,
        children: [
          { index: true, element: <AdminPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'products/new', element: <AdminProductFormPage /> },
          { path: 'products/:slug/edit', element: <AdminProductFormPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'inventory', element: <AdminInventoryPage /> },
          { path: 'categories', element: <AdminCategoriesPage /> },
          { path: 'customers', element: <AdminCustomersPage /> },
        ],
      },
    ],
  },
])
