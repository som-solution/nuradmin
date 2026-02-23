import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { countriesApi } from '@/api/countries'
import type { CreateCountryRequest, UpdateCountryRequest } from '@/types'

export function useCountries() {
  return useQuery({
    queryKey: ['admin', 'countries'],
    queryFn: () => countriesApi.list().then((r) => r.data),
  })
}

export function useCreateCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCountryRequest) => countriesApi.create(body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'countries'] }),
  })
}

export function useUpdateCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ countryCode, body }: { countryCode: string; body: UpdateCountryRequest }) =>
      countriesApi.update(countryCode, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'countries'] }),
  })
}
