import api from './config'

export type SettingValue = string | number | boolean | Record<string, unknown>

export interface SettingMeta {
  key: string
  label: string
  type: string
  placeholder?: string
  default?: SettingValue
}

export interface Setting {
  id: string
  name: string
  description: string
  value: SettingValue
  meta: SettingMeta[]
}

export const settingsApi = {
  async getAll(): Promise<Setting[]> {
    const response = await api.get<Setting[]>('/settings')
    return response.data
  },

  async getById(id: string): Promise<Setting> {
    const response = await api.get<Setting>(`/settings/${id}`)
    return response.data
  },

  async update(id: string, data: { value: SettingValue }): Promise<Setting> {
    const response = await api.put<Setting>(`/settings/${id}`, data)
    return response.data
  },
}