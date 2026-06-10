import type { Role, OrderStatus, PaymentStatus } from '@homestore/types'
export type { Role, OrderStatus, PaymentStatus }

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
}

export interface RefreshResponse {
  accessToken: string
}

// ── Products ──────────────────────────────────────────────────────────────────

export interface ProductImage {
  id?: string
  url: string
  altText?: string
  sortOrder?: number
  isPrimary?: boolean
  createdAt?: string
}

export interface ProductCategory {
  category: {
    slug: string
    name: string
  }
}

export interface ProductSummary {
  id: string
  slug: string
  name: string
  description: string
  priceCents: number
  stock: number
  sku: string | null
  isActive: boolean
  isFeatured: boolean
  color: string | null
  material: string | null
  images: ProductImage[]
  categories: ProductCategory[]
  createdAt: string
  updatedAt: string
}

export interface ProductDetail extends ProductSummary {
  attributes?: Record<string, string[]>
}

export interface ProductListResponse {
  products: ProductSummary[]
  total: number
  page: number
  limit: number
}

export interface ProductListParams {
  page?: number
  limit?: number
  categorySlug?: string
  q?: string
  sort?: 'price_asc' | 'price_desc' | 'newest'
  minPrice?: number
  maxPrice?: number
  color?: string
  material?: string
}

export interface CreateProductRequest {
  name: string
  slug?: string
  description: string
  priceCents: number
  stock: number
  sku?: string | null
  isActive?: boolean
  isFeatured?: boolean
  color?: string | null
  material?: string | null
  categories?: string[]
  images?: Pick<ProductImage, 'url' | 'altText' | 'isPrimary' | 'sortOrder'>[]
}

export type UpdateProductRequest = Partial<CreateProductRequest>

// ── Categories ────────────────────────────────────────────────────────────────

export interface CategorySummary {
  id: string
  slug: string
  name: string
  parentId: string | null
}

export interface CategoryListResponse {
  categories: CategorySummary[]
  total: number
}

export interface CreateCategoryRequest {
  name: string
  slug?: string
  parentId?: string | null
}

// ── Addresses ─────────────────────────────────────────────────────────────────

export interface AddressSummary {
  id: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string  // ISO 2-char code: "AR", "MX", "ES", etc.
  label: string | null
  isDefault: boolean
}

export interface CreateAddressRequest {
  street: string
  city: string
  state: string
  postalCode: string
  country: string   // ISO 2-char code
  label?: string
  isDefault?: boolean
}

export interface UpdateAddressRequest {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  label?: string
  isDefault?: boolean
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export interface CartItemInput {
  productId: string
  slug: string
  name: string
  priceCents: number
  imageUrl: string
}

// ── Orders ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  productId: string
  productName: string
  unitPriceCents: number
  quantity: number
  subtotalCents: number
  imageUrl?: string
}

export interface OrderSummary {
  id: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  totalCents: number
  itemCount: number
  items?: OrderItem[]
  createdAt: string
}

export interface OrderDetail {
  id: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  items: OrderItem[]
  subtotalCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  shippingStreet: string
  shippingCity: string
  shippingState: string
  shippingPostalCode: string
  shippingCountry: string
  createdAt: string
  updatedAt: string
}

export interface OrderListResponse {
  orders: OrderSummary[]
  total: number
  page: number
  limit: number
}

// ── Cart (backend shapes) ─────────────────────────────────────────────────────

export interface BackendCartItem {
  id: string
  cartId: string
  productId: string
  quantity: number
  product: {
    id: string
    slug: string
    name: string
    priceCents: number
    stock: number
    images: { url: string }[]
  }
}

export interface BackendCart {
  id: string | null
  userId: string
  items: BackendCartItem[]
}

export interface WishlistItem {
  id: string
  wishlistId: string
  productId: string
  createdAt: string
  product: {
    id: string
    slug: string
    name: string
    priceCents: number
    images: { url: string }[]
  }
}

export interface WishlistResponse {
  id: string | null
  userId: string
  items: WishlistItem[]
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export interface Review {
  id: string
  productId: string
  userId: string
  rating: number
  title: string | null
  body: string | null
  isVerifiedPurchase: boolean
  createdAt: string
  updatedAt: string
  user: { firstName: string; lastName: string }
}

export interface ReviewListResponse {
  reviews: Review[]
  total: number
  page: number
  limit: number
  pages: number
  averageRating: number | null
}

// ── Users (admin) ─────────────────────────────────────────────────────────────

export interface UserSummary {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: 'CUSTOMER' | 'ADMIN'
  createdAt: string
  updatedAt: string
  _count: { orders: number }
}

export interface UserListResponse {
  users: UserSummary[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface UserListParams {
  page?: number
  limit?: number
  q?: string
  role?: 'CUSTOMER' | 'ADMIN'
}

// Cart is server-side: POST /api/orders only needs address id and notes
export interface CreateOrderRequest {
  shippingAddressId?: string
  notes?: string
}

export interface CreateOrderResponse {
  orderId: string
}

export interface PaymentCheckoutResponse {
  checkoutUrl: string
}
