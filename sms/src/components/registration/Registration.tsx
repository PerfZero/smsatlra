import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import './Registration.css';
import { authService, userService, verificationService, AuthResponse } from '../../services/api';
import { setUser } from '../../store/slices/userSlice';
import { User } from '../../types';
import InputMask from 'react-input-mask';

type RegistrationStep = 'initial' | 'verification' | 'password' | 'success';

interface RegistrationResponse {
  message: string;
  token: string;
}

interface FormErrors {
  iin?: string;
  phone?: string;
  verificationCode?: string;
  password?: string;
  confirmPassword?: string;
}

export const Registration: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState<RegistrationStep>('initial');
  const [iin, setIin] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [iinError, setIINError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const handleResendCode = async () => {
    if (canResend) {
      try {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        await verificationService.sendCode(cleanPhone);
        setTimer(60);
        setCanResend(false);
      } catch (error) {
        if (error instanceof Error) {
          setVerificationError(error.message);
        } else {
          setVerificationError('Ошибка при повторной отправке кода');
        }
      }
    }
  };

  const handleIinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setIin(value);
    setIINError(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setPhone(value);
    setPhoneError(null);
  };

  const handleVerificationCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      setVerificationError(null);
      
      if (value && index < 3) {
        const nextInput = document.querySelector(`input[name="code-${index + 1}"]`) as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setErrors(prev => ({ ...prev, password: undefined }));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setErrors(prev => ({ ...prev, confirmPassword: undefined }));
  };

  const validateIin = (value: string): string | null => {
    if (value.length !== 12) {
      return 'ИИН должен содержать 12 цифр';
    }
    return null;
  };

  const validatePhone = (value: string): string | null => {
    if (value.length !== 11) {
      return 'Номер телефона должен содержать 11 цифр';
    }
    return null;
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIin = iin.replace(/[^\d]/g, '');
    const cleanPhone = phone.replace(/[^\d]/g, '');

    if (cleanIin.length !== 12) {
      setIINError('ИИН должен содержать 12 цифр');
      return;
    }
    if (cleanPhone.length !== 11) {
      setPhoneError('Номер телефона должен содержать 11 цифр');
      return;
    }

    try {
      await verificationService.sendCode(cleanPhone);
      setStep('verification');
      setTimer(60);
      setCanResend(false);
    } catch (error) {
      if (error instanceof Error) {
        setPhoneError(error.message);
      } else {
        setPhoneError('Ошибка при отправке кода. Попробуйте позже.');
      }
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join('');
    if (!code || code.length !== 4) {
      setVerificationError('Введите код подтверждения');
      return;
    }

    try {
      const cleanPhone = phone.replace(/[^\d]/g, '');
      await verificationService.verifyCode(cleanPhone, code);
      setVerificationError(null);
      setStep('password');
    } catch (error) {
      if (error instanceof Error) {
        setVerificationError(error.message);
        setVerificationCode(['', '', '', '']);
        const firstInput = document.querySelector('input[name="code-0"]') as HTMLInputElement;
        if (firstInput) firstInput.focus();
      } else {
        setVerificationError('Неверный код подтверждения');
      }
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(password)) {
      setPasswordError('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Пароли не совпадают');
      return;
    }
    const code = verificationCode.join('');
    try {
      console.log('=== Registration Submit Start ===');
      console.log('Registration data:', { iin, phone, code, password });
      
      const response = await authService.register({
        iin,
        phone,
        code,
        password
      }) as AuthResponse;
      
      console.log('Registration response:', response);
      
      if (!response.token) {
        throw new Error('Token not received from server');
      }
      
      // Очищаем старый токен если есть и сохраняем новый
      localStorage.removeItem('token');
      localStorage.setItem('token', response.token);
      
      try {
        console.log('=== Getting Profile Start ===');
        const profileData = await userService.getProfile();
        console.log('Profile data from server:', profileData);
        
        // Преобразуем данные в формат User
        const userData: User = {
          iin: profileData.iin,
          phoneNumber: profileData.phone,
          balance: profileData.balance?.amount || 0,
          isFirstLogin: true,
          role: profileData.role === 'ADMIN' ? 'ADMIN' : 'USER',
          name: profileData.name || ''
        };
        
        console.log('Transformed user data:', userData);
        dispatch(setUser(userData));
        setStep('success');
      } catch (profileError) {
        console.error('Profile fetch error:', profileError);
        localStorage.removeItem('token');
        throw new Error('Не удалось получить данные профиля. Попробуйте войти через страницу входа.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        setPasswordError(`Ошибка при регистрации: ${error.message}`);
      } else {
        setPasswordError('Ошибка при регистрации. Попробуйте позже.');
      }
    }
  };

  return (
    <div className="registration">
      <div className="registration__header">
        <img src="images/logos.svg" alt="Atlas Save" className="registration__logo" />
      </div>

      <div className="registration__content">
        {step === 'initial' && (
          <>
           <div className="dost_image">
          <img src="images/dots.svg" alt="" />
        </div>
            <h1 className="registration__title">Регистрация аккаунта Atlas</h1>
            <div className="registration__form">
              <form onSubmit={handleInitialSubmit}>
                <div className="registration__input-group">
                  <InputMask
                    mask="999 999 999 999"
                    value={iin}
                    onChange={handleIinChange}
                    placeholder="Введите свой ИИН"
                    className={iinError ? 'error' : ''}
                  >
                    {(inputProps: any) => <input {...inputProps} type="text" />}
                  </InputMask>
                  {iinError && <div className="registration__error">{iinError}</div>}
                </div>
                <div className="registration__input-group">
                  <InputMask
                    mask="+7 (999) 999 9999"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="Введите свой номер телефона"
                    className={phoneError ? 'error' : ''}
                  >
                    {(inputProps: any) => <input {...inputProps} type="text" />}
                  </InputMask>
                  {phoneError && <div className="registration__error">{phoneError}</div>}
                </div>
                <div className="registration__login-link">
                  <Link to="/login">Вход с аккаунтом Atlas</Link>
                </div>
                <button 
                  type="submit"
                  className="registration__button" 
                  disabled={!iin || !phone}
                >
                  Регистрация
                </button>
                <div className="registration__agreement">
                  Регистрируясь, Вы соглашаетесь с <a href="/agreement">Договором офферты</a>
                </div>
              </form>
            </div>
          </>
        )}

        {step === 'verification' && (
          <>
            <p className="registration__subtitle">
              Мы отправили Вам СМС с кодом верификации на номер {phone}
            </p>
                 <p className="registration__subtitles">
              Введите его ниже </p>
            <div className="registration__verification">
              <div className="registration__code-inputs">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    name={`code-${index}`}
                    value={digit}
                    onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && index > 0) {
                        const prevInput = document.querySelector(`input[name="code-${index - 1}"]`) as HTMLInputElement;
                        if (prevInput) {
                          prevInput.focus();
                          setVerificationCode(prev => {
                            const newCode = [...prev];
                            newCode[index - 1] = '';
                            return newCode;
                          });
                        }
                      }
                    }}
                    maxLength={1}
                    className={verificationError ? 'error' : ''}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              {verificationError && (
                <div className="registration__error">{verificationError}</div>
              )}
              <div className="registration__resend">
                {canResend ? (
                  <button onClick={handleResendCode} className="registration__resend-button">
                    Отправить код заново
                  </button>
                ) : (
                  `Отправить код заново через ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`
                )}
              </div>
              <button 
                className="registration__button" 
                onClick={handleVerificationSubmit}
                disabled={verificationCode.some(digit => !digit)}
              >
                Подтвердить
              </button>
            </div>
          </>
        )}

        {step === 'password' && (
          <>
            <p className="registration__subtitle">Осталось совсем немного.</p>
                      <p className="registration__subtitle">Создайте пароль для своего аккаунта Atlas</p>

            <div className="registration__form">
              <div className="registration__input-group">
                <input
                  type="password"
                  value={password}
                  placeholder="Введите пароль"
                  onChange={handlePasswordChange}
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <div className="registration__error">{errors.password}</div>}
              </div>
              <div className="registration__input-group">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Подтвердите пароль"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && (
                  <div className="registration__error">{errors.confirmPassword}</div>
                )}
              </div>
              <button className="registration__button" onClick={handlePasswordSubmit}>
                Завершить регистрацию
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="dost_image greeen">
          <img src="images/dots.svg" alt="" />
        </div>
            <h1 className="registration__title sa">Ваш аккаунт Atlas <br /> успешно создан! 
<br />
<br />  
Теперь Вы можете:</h1>
            <div className="registration__success hs">
              <div className="registration__success-item">
                <img src="images/check.svg" alt="" />
                <div className="registration__success-item-text">
                <h3>Начать накапливать</h3>
                <p>Выбирайте цель и пополняйте счёт через Kaspi.</p>
                </div>
              </div>
              <div className="registration__success-item">      
                                <img src="images/check.svg" alt="" />

                <div className="registration__success-item-text">
                <h3>Следить за прогрессом</h3>
                <p>Отслеживайте, сколько уже накоплено.</p>
                </div>
              </div>
              <div className="registration__success-item">
                            <img src="images/check.svg" alt="" />

                <div className="registration__success-item-text">
                <h3>Подарить путь к паломничеству</h3>
                <p>За себя или близкого человека.</p>
                </div>
              </div>
              <button className="registration__button bottom" onClick={() => navigate('/')}>
                Начать копить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 