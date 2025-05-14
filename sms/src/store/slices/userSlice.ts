import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TourPackage } from '../../types';

export interface User {
  iin: string;
  phoneNumber: string;
  balance: number;
  isFirstLogin: boolean;
  role: 'USER' | 'ADMIN';
  selectedPackage?: TourPackage;
  name?: string;
}

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Вспомогательные функции для работы с localStorage
const saveUserToStorage = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

const removeUserFromStorage = () => {
  localStorage.removeItem('user');
};

const loadUserFromStorage = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

const initialState: UserState = {
  currentUser: loadUserFromStorage(),
  isAuthenticated: !!loadUserFromStorage(),
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      state.error = null;
      saveUserToStorage(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    updateBalance: (state, action: PayloadAction<number>) => {
      if (state.currentUser) {
        state.currentUser.balance = action.payload;
        saveUserToStorage(state.currentUser);
      }
    },
    selectPackage: (state, action: PayloadAction<TourPackage>) => {
      if (state.currentUser) {
        state.currentUser.selectedPackage = action.payload;
        saveUserToStorage(state.currentUser);
      }
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
      removeUserFromStorage();
    },
  },
});

export const {
  setUser,
  setLoading,
  setError,
  updateBalance,
  selectPackage,
  logout,
} = userSlice.actions;

export default userSlice.reducer; 