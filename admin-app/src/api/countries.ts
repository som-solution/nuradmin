import { apiClient } from './client'
import type { SupportedCountry, CreateCountryRequest, UpdateCountryRequest } from '@/types'

export const countriesApi = {
  list: () => apiClient.get<SupportedCountry[]>('/admin/countries'),

  create: (body: CreateCountryRequest) =>
    apiClient.post<SupportedCountry>('/admin/countries', body),

  update: (countryCode: string, body: UpdateCountryRequest) =>
    apiClient.put<SupportedCountry>(`/admin/countries/${countryCode}`, body),
}
