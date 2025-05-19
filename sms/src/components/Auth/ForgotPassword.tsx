import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { passwordResetService } from '../../services/api';
import InputMask from 'react-input-mask';
import './ForgotPassword.css';

type RecoveryStep = 'initial' | 'verification' | 'password' | 'success';

interface FormErrors {
  iin?: string;
  phone?: string;
  verificationCode?: string;
  password?: string;
  confirmPassword?: string;
}

interface ApiError {
  message: string;
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<RecoveryStep>('initial');
  const [iin, setIin] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
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
        const formattedPhone = phone.startsWith('8') ? '7' + phone.slice(1) : phone;
        await passwordResetService.initiateReset(iin, formattedPhone);
        setTimer(60);
        setCanResend(false);
        setErrors({});
      } catch (error) {
        const apiError = error as ApiError;
        setErrors(prev => ({ 
          ...prev, 
          verificationCode: apiError.message || 'Произошла ошибка при отправке кода' 
        }));
      }
    }
  };

  const handleIinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 12) {
      setIin(value);
      setErrors(prev => ({ ...prev, iin: undefined }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      const formattedValue = value.startsWith('8') ? '7' + value.slice(1) : value;
      setPhone(formattedValue);
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  const handleVerificationCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      setErrors(prev => ({ ...prev, verificationCode: undefined }));

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

  const validateIin = (value: string) => {
    if (value.length !== 12) {
      return 'Введите ИИН полностью';
    }
    return undefined;
  };

  const validatePhone = (value: string) => {
    const cleanPhone = value.replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      return 'Введите номер телефона полностью';
    }
    if (!cleanPhone.startsWith('7')) {
      return 'Номер телефона должен начинаться с 7';
    }
    return undefined;
  };

  const handleInitialSubmit = async () => {
    const newErrors: FormErrors = {};
    const iinError = validateIin(iin);
    const phoneError = validatePhone(phone);

    if (iinError) newErrors.iin = iinError;
    if (phoneError) newErrors.phone = phoneError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const formattedPhone = phone.startsWith('8') ? '7' + phone.slice(1) : phone;
      await passwordResetService.initiateReset(iin, formattedPhone);
      setStep('verification');
      setTimer(60);
      setCanResend(false);
      setErrors({});
    } catch (error) {
      const apiError = error as ApiError;
      setErrors(prev => ({ 
        ...prev, 
        phone: apiError.message || 'Произошла ошибка при отправке кода' 
      }));
    }
  };

  const handleVerificationSubmit = async () => {
    const code = verificationCode.join('');
    if (code.length !== 4) {
      setErrors({ verificationCode: 'Введите код полностью' });
      return;
    }

    try {
      const response = await passwordResetService.verifyCode(iin, code);
      setResetToken(response.resetToken);
      setStep('password');
      setErrors({});
    } catch (error) {
      const apiError = error as ApiError;
      setErrors(prev => ({ 
        ...prev, 
        verificationCode: apiError.message || 'Неверный код подтверждения' 
      }));
      setVerificationCode(['', '', '', '']);
      const firstInput = document.querySelector('input[name="code-0"]') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }
  };

  const handlePasswordSubmit = async () => {
    const newErrors: FormErrors = {};
    
    if (password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await passwordResetService.resetPassword(iin, resetToken, password);
      setStep('success');
      setErrors({});
    } catch (error) {
      const apiError = error as ApiError;
      setErrors(prev => ({ 
        ...prev, 
        password: apiError.message || 'Произошла ошибка при сбросе пароля' 
      }));
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length === 1) return cleaned;
    if (cleaned.length <= 4) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1)}`;
    if (cleaned.length <= 7) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
    if (cleaned.length <= 9) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  };

  const formatIin = (iin: string) => {
    if (!iin) return '';
    return iin.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  };

  return (
    <div className="registration">
      <div className="registration__header">
        <img src="/images/logos.svg" alt="Atlas Save" className="registration__logo" />
      </div>

      <div className="registration__content">
        {step === 'initial' && (
          <>
            <div className="dost_image login_dost_image">
              <img src="/images/dots.svg" alt="" />
            </div>
            <h1 className="registration__title login_title">Восстановление <br /> аккаунта Atlas</h1>
            <div className="registration__form">
              <div className="registration__input-group">
                <InputMask
                  mask="999999999999"
                  value={iin}
                  onChange={handleIinChange}
                  placeholder="Введите свой ИИН"
                  className={errors.iin ? 'error' : ''}
                >
                  {(inputProps: any) => <input {...inputProps} type="text" />}
                </InputMask>
                {errors.iin && <div className="registration__error">{errors.iin}</div>}
              </div>
              <div className="registration__input-group">
                <InputMask
                  mask="+7 (999) 999-99-99"
                  value={formatPhone(phone)}
                  onChange={handlePhoneChange}
                  placeholder="Введите свой номер телефона"
                  className={errors.phone ? 'error' : ''}
                >
                  {(inputProps: any) => <input {...inputProps} type="text" />}
                </InputMask>
                {errors.phone && <div className="registration__error">{errors.phone}</div>}
              </div>
              <div className="registration__login-link mn">
                <Link to="/login">Вход с аккаунтом Atlas</Link>
              </div>
              <div className="registration__login-link mn">
                <Link to="/registration">Создание аккаунта Atlas</Link>
              </div>
              <button 
                className="registration__button" 
                onClick={handleInitialSubmit}
                disabled={!iin || !phone || iin.length !== 12 || phone.length !== 11}
              >
                Перейти к восстановлению
              </button>
            </div>
          </>
        )}

        {step === 'verification' && (
          <>
            <p className="registration__subtitle">
              Мы отправили Вам СМС с кодом верификации на номер {formatPhone(phone)}
            </p>
            <p className="registration__subtitles">
              Введите его ниже
            </p>
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
                        if (prevInput) prevInput.focus();
                      }
                    }}
                    maxLength={1}
                    className={errors.verificationCode ? 'error' : ''}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              {errors.verificationCode && (
                <div className="registration__error">{errors.verificationCode}</div>
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
                Подтвердить код
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
                Завершить восстановление
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="dost_image greeen">
              <img src="/images/dots.svg" alt="" />
            </div>
            <h1 className="registration__title sa">Ваш пароль успешно восстановлен!</h1>
            <div className="registration__success hs">
              <p className="registration__subtitle">Вы можете авторизоваться по новому паролю.</p>
              <button className="registration__button bottom" onClick={() => navigate('/login')}>
                Авторизоваться
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword; 