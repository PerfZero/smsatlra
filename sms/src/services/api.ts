import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем интерцептор для автоматического добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Добавляем интерцептор для обработки ответов
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status: number; data: unknown } };
      if (axiosError.response?.status === 401) {
        localStorage.removeItem('token');
        // Можно добавить редирект на страницу логина при необходимости
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    iin: string;
    role?: string;
    phone?: string;
    name?: string;
  };
  message: string;
}

export const authService = {
  login: async (iin: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { iin, password });
    return response.data;
  },

  register: async (data: { iin: string; phone: string; code: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  verifyCode: async (iin: string, code: string) => {
    const response = await api.post('/auth/verify-code', { iin, code });
    return response.data;
  },

  completeRegistration: async (iin: string, password: string) => {
    const response = await api.post('/auth/complete-registration', { iin, password });
    return response.data;
  }
};

export interface ProfileResponse {
  iin: string;
  phone: string;
  role: string;
  name: string;
  balance?: {
    amount: number;
  };
}

export const userService = {
  getProfile: async (): Promise<ProfileResponse> => {
    try {
      const response = await api.get<ProfileResponse>('/auth/profile');
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number; data: unknown } };
        if (axiosError.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
      throw error;
    }
  }
};

export interface TransactionResponse {
  id: number;
  transactionNumber: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description: string;
  iin: string;
  name: string;
  date: string;
  bonus?: number;
  isFirstDeposit?: boolean;
  goalId?: number;
  goal?: {
    currentAmount: number;
    targetAmount: number;
    relativeName: string | null;
    relativeIin: string | null;
  };
  relative?: {
    id: number;
    fullName: string;
    iin: string;
  };
}

export interface Transaction {
  id: string;
  iin: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description: string;
  name: string;
  date: string;
  time: string;
  payerName: string;
  payerIin: string;
  paymentId: string;
  recipientIin: string;
  phoneNumber: string;
  goalId?: number;
  goal?: {
    currentAmount: number;
    targetAmount: number;
    relativeName: string | null;
    relativeIin: string | null;
  };
  bonus?: number;
  isFirstDeposit?: boolean;
  transactionNumber: string;
}

export const balanceService = {
  getBalance: async () => {
    const response = await api.get('/balance');
    return response.data;
  },
  
  deposit: async (amount: number, goalId: number | null = null): Promise<TransactionResponse> => {
    // Если указан goalId, делаем депозит в конкретную цель
    if (goalId) {
      const response = await api.post<TransactionResponse>(`/goals/${goalId}/deposit`, { amount });
      return response.data;
    }
    // Иначе делаем обычный депозит в общий баланс
    const response = await api.post<TransactionResponse>('/balance/deposit', { amount });
    return response.data;
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get<Transaction[]>('/balance/transactions');
    return response.data;
  }
};

export interface Goal {
  id: number;
  type: 'UMRAH' | 'HAJJ';
  packageType: 'PREMIUM' | 'COMFORT' | 'STANDARD';
  targetAmount: number;
  currentAmount: number;
  monthlyTarget: number;
  relativeId?: number;
  relative?: {
    id: number;
    fullName: string;
    iin: string;
  };
  createdAt: string;
}

export const goalService = {
  getGoal: async (): Promise<Goal | null> => {
    const response = await api.get<Goal[]>('/goals');
    // Возвращаем первую цель из массива, если она есть
    return Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null;
  },
  
  getAllGoals: async (): Promise<Goal[]> => {
    const response = await api.get<Goal[]>('/goals');
    return response.data;
  },

  createSelfGoal: async (data: { 
    type: 'UMRAH' | 'HAJJ',
    packageType: 'PREMIUM' | 'COMFORT' | 'STANDARD',
    targetAmount: number,
    monthlyTarget: number,
    currentAmount: number
  }): Promise<Goal> => {
    const response = await api.post<Goal>('/goals/self', data);
    return response.data;
  },

  createFamilyGoal: async (data: { 
    fullName: string,
    iin: string,
    type: 'UMRAH' | 'HAJJ',
    packageType: 'PREMIUM' | 'COMFORT' | 'STANDARD',
    targetAmount: number,
    monthlyTarget: number 
  }): Promise<Goal> => {
    try {
      console.log('Отправка запроса на создание цели для родственника:', data);
      const response = await api.post<Goal>('/goals/family', data);
      console.log('Ответ сервера:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка при создании цели для родственника:', error);
      throw error;
    }
  },
  
  updateProgress: async (goalId: number, amount: number): Promise<Goal> => {
    const response = await api.patch<Goal>(`/goals/${goalId}/progress`, { amount });
    return response.data;
  }
};

export interface Relative {
  id: number;
  fullName: string;
  iin: string;
  goal?: Goal;
}

export const relativesService = {
  getRelatives: async (): Promise<Relative[]> => {
    const response = await api.get<Relative[]>('/relatives');
    return response.data;
  }
};

export const notificationService = {
  subscribe: (onMessage: (data: any) => void, onError?: () => void): { unsubscribe: () => void } => {
    let eventSource: EventSource | null = null;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        if (onError) onError();
        return { unsubscribe: () => {} };
      }
      
      // Создаем EventSource с указанием токена в заголовке
      eventSource = new EventSource(`${API_URL}/notifications/subscribe?token=${token}`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Ошибка при обработке уведомления:', error);
        }
      };
      
      eventSource.onerror = () => {
        console.error('Ошибка соединения SSE');
        if (eventSource) {
          eventSource.close();
        }
        if (onError) onError();
      };
      
      return {
        unsubscribe: () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        }
      };
    } catch (error) {
      console.error('Ошибка при подписке на уведомления:', error);
      return { unsubscribe: () => {} };
    }
  }
};

export const verificationService = {
  async sendCode(phone: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/verification/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send verification code');
    }
    
    return response.json();
  },

  async verifyCode(phone: string, code: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/verification/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, code }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify code');
    }
    
    return response.json();
  },
};

export default api; 