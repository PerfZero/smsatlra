import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { setUser } from '../../store/slices/userSlice';
import { authService, userService } from '../../services/api';
import { User } from '../../types';
import './Login.css';
import { AuthResponse } from '../../services/api';

interface LoginResponse {
  message: string;
  token: string;
}

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [iin, setIin] = useState('');
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleIinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 12) setIin(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (iin.length !== 12) {
      setError('Введите ИИН полностью');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.login(iin, password) as AuthResponse;
      
      // Сохраняем токен
      localStorage.setItem('token', response.token);
      
      // Получаем данные пользователя после успешного входа
      try {
        const profileData = await userService.getProfile();
        const userData: User = {
          iin: profileData.iin,
          phoneNumber: profileData.phone,
          balance: profileData.balance?.amount || 0,
          isFirstLogin: false,
          role: profileData.role === 'ADMIN' ? 'ADMIN' : 'USER',
          name: profileData.name || ''
        };
        dispatch(setUser(userData));
        navigate('/');
      } catch (profileErr) {
        setError('Ошибка при получении данных пользователя');
      }
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration">
      <div className="registration__header">
        <img src="images/logos.svg" alt="Atlas Save" className="registration__logo" />
      </div>
      <div className="registration__content">
        <div className="dost_image login_dost_image">
          <img src="images/dots.svg" alt="" />
        </div>
        <h1 className="registration__title login_title">Вход <br /> с аккаунтом Atlas</h1>
        <div className="registration__form">
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="registration__input-group">
              <input
                type="text"
                className="registration__input"
                placeholder="ИИН"
                value={iin}
                onChange={handleIinChange}
                maxLength={12}
              />
            </div>
            <div className="registration__input-group">
              <input
                type="password"
                className="registration__input"
                placeholder="Пароль"
                value={password}
                onChange={handlePasswordChange}
              />
              <div className="registration__checkbox-group">
                <input
                  type="checkbox"
                  className="registration__checkbox"
                  checked={stayLoggedIn}
                  onChange={(e) => setStayLoggedIn(e.target.checked)}
                  id="stayLoggedIn"
                />
                <label className="registration__checkbox-label" htmlFor="stayLoggedIn">
                  <span>Оставаться в системе</span>
                </label>
              </div>
            </div>
            <div className="registration__login-link mbp">
              <Link to="/forgot-password">Забыли пароль?</Link>
            </div>
            <div className="registration__login-link mbp">
              <Link to="/registration">Создание аккаунта Atlas</Link>
            </div>
            <button
              type="submit"
              className="registration__button"
              disabled={isLoading || !iin || !password || iin.length !== 12 || password.length < 6}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
           
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 