// Admin auth
export type AdminType = 'SUPER_ADMIN' | 'ADMIN' | 'OPS' | 'SUPPORT'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  adminId: string
  adminType: AdminType
  email: string
}

export interface RefreshRequest {
  refreshToken: string
}

// Spring Page
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// Users
export interface User {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  enabled: boolean
  frozen: boolean
  countryCode?: string
  userNumber?: string
  phoneNormalized?: string
  onboardingStep?: 'PROFILE_REQUIRED' | 'KYC_REQUIRED' | 'READY'
  createdAt?: string
  updatedAt?: string
}

// Admins
export interface Admin {
  id: string
  email: string
  adminType: AdminType
  mfaEnabled?: boolean
  enabled: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateAdminRequest {
  email: string
  password: string
  adminType: AdminType
}

export interface UpdateAdminRequest {
  email?: string
  password?: string
}

// Transactions
export type TransactionStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_RECEIVED'
  | 'PAYOUT_INITIATED'
  | 'PAYOUT_SUCCESS'
  | 'FINALIZED'
  | 'PAYMENT_FAILED'
  | 'PAYOUT_FAILED'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'COMPENSATION'

export interface Transaction {
  id: string
  userId: string
  recipientId?: string
  amount: number
  fee?: number
  currency: string
  status: TransactionStatus
  idempotencyKey?: string
  payoutProviderRef?: string
  receiveAmount?: number
  receiveCurrency?: string
  failureReason?: string
  b2cConversationId?: string
  createdAt?: string
  updatedAt?: string
}

// Audit
export interface AuditLog {
  id: string
  eventType: string
  entityType: string
  entityId: string
  actorId?: string
  actorEmail?: string
  adminType?: string
  reason?: string
  ipAddress?: string
  payloadJson?: string
  createdAt: string
}

// KYC Documents
export type DocumentType = 'PASSPORT' | 'DRIVING_LICENCE' | 'PAYSLIP' | 'BANK_STATEMENT'
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface UserDocument {
  id: string
  userId: string
  documentType: DocumentType
  fileName?: string
  status: DocumentStatus
  uploadedAt?: string
  reviewedAt?: string
  rejectionReason?: string
}

export interface DocumentViewResponse {
  viewUrl: string
  expiresMinutes: number
}

// Exchange rates
export interface ExchangeRate {
  id: string
  sendCurrency: string
  receiveCurrency: string
  rate: number
  updatedByAdminId?: string
  createdAt?: string
  updatedAt?: string
}

export interface UpsertRateRequest {
  sendCurrency: string
  receiveCurrency: string
  rate: string
}

// Fee config
export interface FeeConfig {
  id: string
  sendCurrency: string
  feePercent: number
  feeMinAmount: number
  feeMaxAmount: number
  feeCurrency: string
  updatedByAdminId?: string
  createdAt?: string
  updatedAt?: string
}

export interface UpsertFeeConfigRequest {
  sendCurrency: string
  feePercent: number
  feeMinAmount: number
  feeMaxAmount: number
  feeCurrency: string
}

// Countries
export interface SupportedCountry {
  id: string
  countryCode: string
  name: string
  currencyCode: string
  dialCode: string
  phoneLength: number
  enabled: boolean
  displayOrder?: number
}

export interface CreateCountryRequest {
  countryCode: string
  name: string
  currencyCode: string
  dialCode: string
  phoneLength: number
  displayOrder?: number
}

export interface UpdateCountryRequest {
  name?: string
  currencyCode?: string
  dialCode?: string
  phoneLength?: number
  enabled?: boolean
  displayOrder?: number
}

// Provider
export interface ProviderStatus {
  providerCode: string
  enabled: boolean
}

// Outbox
export interface OutboxEvent {
  id: string
  aggregateType?: string
  eventType?: string
  payload?: string
  createdAt?: string
}

// Disputes
export type DisputeStatus =
  | 'OPEN'
  | 'IN_REVIEW'
  | 'RESOLVED_REFUND'
  | 'RESOLVED_NO_REFUND'
  | 'CLOSED'

export interface Dispute {
  id: string
  transactionId?: string
  status: DisputeStatus
  createdAt?: string
  updatedAt?: string
}

// API error
export interface ApiError {
  code?: string
  message?: string
  error?: string
  errors?: Record<string, string>
}
