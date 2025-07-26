import api from './config'

export interface SettingMeta {
  key: string
  label: string
  type: string
  placeholder?: string
  default?: any
}

export interface Setting {
  id: string
  name: string
  description: string
  value: any
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

  async update(id: string, data: { value: any }): Promise<Setting> {
    const response = await api.put<Setting>(`/settings/${id}`, data)
    return response.data
  },
}