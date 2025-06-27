import { apiClient } from './client'

export interface UploadStudentsData {
  file: File
  brigadeId?: string
  createUserAccounts?: boolean
}

export interface BulkUploadResult {
  message: string
  imported: number
  errors?: string[]
  users: User[]
  emailResults: {
    successful: number
    failed: number
    failedEmails: {
      email: string
      error: string
    }[]
  }
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: string
}

export interface UploadStudentsResult {
  message: string
  imported: number
  errors?: string[]
  students: Student[]
}

export interface Student {
  id: string
  tempRollNumber: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  brigadeId?: string
  userId?: string
  createdAt: string
}

export const uploadsApi = {
  uploadStudents: async (data: UploadStudentsData) => {
    const formData = new FormData()
    formData.append('file', data.file)
    if (data.brigadeId) formData.append('brigadeId', data.brigadeId)
    if (data.createUserAccounts) formData.append('createUserAccounts', 'true')
    
    return apiClient.upload('/uploads/students', formData)
  },

  bulkUploadUsers: async (file: File): Promise<BulkUploadResult> => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.upload('/uploads/users', formData)
  },
  
  downloadStudentsTemplate: async (): Promise<Blob> => {
    return apiClient.download('/uploads/template/students')
  },
}