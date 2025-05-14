import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { userService } from '../services/api';
import { setUser, logout } from '../store/slices/userSlice';
import { User } from '../types';

export const useAuthInit = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      userService.getProfile()
        .then(profileData => {
          const userData: User = {
            iin: profileData.iin,
            phoneNumber: profileData.phone,
            balance: profileData.balance?.amount || 0,
            isFirstLogin: false,
            role: profileData.role === 'ADMIN' ? 'ADMIN' : 'USER',
            name: profileData.name || ''
          };
          dispatch(setUser(userData));
        })
        .catch(() => {
          // При ошибке делаем logout
          dispatch(logout());
        });
    }
  }, [dispatch]);
};

export default useAuthInit; 