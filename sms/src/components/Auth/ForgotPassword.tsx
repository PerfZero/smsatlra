import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ForgotPassword.css';

type RecoveryStep = 'initial' | 'verification' | 'password' | 'success';

interface FormErrors {
  iin?: string;
  phone?: string;
  verificationCode?: string;
  password?: string;
  confirmPassword?: string;
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

  const handleResendCode = () => {
    if (canResend) {
      setTimer(60);
      setCanResend(false);
      // Here you would typically make an API call to resend the code
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
      setPhone(value);
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
    if (value.length !== 11) {
      return 'Введите номер телефона полностью';
    }
    return undefined;
  };

  const handleInitialSubmit = () => {
    const newErrors: FormErrors = {};
    const iinError = validateIin(iin);
    const phoneError = validatePhone(phone);

    if (iinError) newErrors.iin = iinError;
    if (phoneError) newErrors.phone = phoneError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStep('verification');
  };

  const handleVerificationSubmit = () => {
    const code = verificationCode.join('');
    if (code.length !== 4) {
      setErrors({ verificationCode: 'Введите код полностью' });
      return;
    }
    // Here you would typically verify the code with your API
    setStep('password');
  };

  const handlePasswordSubmit = () => {
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

    // Here you would typically update the password with your API
    setStep('success');
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    return `+7 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9, 11)}`;
  };

  const formatIin = (iin: string) => {
    if (!iin) return '';
    return iin.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  };

  return (
    <div className="registration">
      <div className="registration__header">
        <img src="images/logos.svg" alt="Atlas Save" className="registration__logo" />
      </div>

      <div className="registration__content">
        {step === 'initial' && (
          <>
            <div className="dost_image login_dost_image">
              <img src="images/dots.svg" alt="" />
            </div>
            <h1 className="registration__title login_title">Восстановление <br /> аккаунта Atlas</h1>
            <div className="registration__form">
              <div className="registration__input-group">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formatIin(iin)}
                  onChange={handleIinChange}
                  placeholder="Введите свой ИИН"
                  className={errors.iin ? 'error' : ''}
                />
                {errors.iin && <div className="registration__error">{errors.iin}</div>}
              </div>
              <div className="registration__input-group">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formatPhone(phone)}
                  onChange={handlePhoneChange}
                  placeholder="Введите свой номер телефона"
                  className={errors.phone ? 'error' : ''}
                />
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
                Перейти к восстановлению
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
              <img src="images/dots.svg" alt="" />
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