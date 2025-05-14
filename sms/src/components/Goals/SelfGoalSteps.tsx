import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { goalService } from '../../services/api';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './Goals.css';
import { ReactComponent as UmrahIcon } from './icons/umrah_1.svg';
import { ReactComponent as HajjIcon } from './icons/hajj_1.svg';
import { ReactComponent as CheckIcon } from './icons/check.svg';

const SelfGoalSteps: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPilgrimage, setSelectedPilgrimage] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [isFirstStepConfirmed, setIsFirstStepConfirmed] = useState(false);
  const [isSecondStepConfirmed, setIsSecondStepConfirmed] = useState(false);
  const [isThirdStepConfirmed, setIsThirdStepConfirmed] = useState(false);
  const [months, setMonths] = useState(24);
  const [currentSlide, setCurrentSlide] = useState(0);

  const pilgrimageTypes = [
    {
      id: 'umrah',
      name: 'Умра',
      description: 'Можно совершать круглый год',
      Icon: UmrahIcon
    },
    {
      id: 'hajj',
      name: 'Хадж',
      description: 'Совершается только раз в году, по определённым датам',
      Icon: HajjIcon
    }
  ];

  const packages = [
    {
      id: 'premium',
      name: 'Premium Package',
      price: '700 550',
      images: [
        '/rut.png',
        '/rut.png',
        '/rut.png',
        '/rut.png'

      ],
      details: {
        duration: '6/8 ночей',
        flight: 'Прямой рейс / air astana',
        hotelMecca: {
          name: 'Fairmont Makkah *5',
          distance: 'До Каабы 100 м'
        },
        hotelMedina: {
          name: 'Waqf Safi *4',
          distance: 'До мечети Пророка 350м'
        },
        transfer: 'Высокоскоростной поезд',
        food: 'Двухразовое (завтрак и ужин)',
        additionalServices: 'Виза, услуги гида, экскурсия, фирменный хадж набор'
      }
    },
    {
      id: 'comfort',
      name: 'Comfort Package',
      price: '600 550',
      images: [
        '/rut.png',
        '/rut.png',
        '/rut.png',
        '/rut.png'
      ],
      details: {
        duration: '6/8 ночей',
        flight: 'Прямой рейс / air astana',
        hotelMecca: {
          name: 'Swissotel Makkah *5',
          distance: 'До Каабы 200 м'
        },
        hotelMedina: {
          name: 'Pullman ZamZam *4',
          distance: 'До мечети Пророка 500м'
        },
        transfer: 'Высокоскоростной поезд',
        food: 'Двухразовое (завтрак и ужин)',
        additionalServices: 'Виза, услуги гида, экскурсия, фирменный хадж набор'
      }
    },
    {
      id: 'standard',
      name: 'Standard Package',
      price: '400 550',
      images: [
        '/rut.png',
        '/rut.png',
        '/rut.png',
        '/rut.png'
      ],
      details: {
        duration: '6/8 ночей',
        flight: 'Прямой рейс / air astana',
        hotelMecca: {
          name: 'Mövenpick Makkah *4',
          distance: 'До Каабы 300 м'
        },
        hotelMedina: {
          name: 'Novotel Madinah *4',
          distance: 'До мечети Пророка 700м'
        },
        transfer: 'Высокоскоростной поезд',
        food: 'Двухразовое (завтрак и ужин)',
        additionalServices: 'Виза, услуги гида, экскурсия, фирменный хадж набор'
      }
    }
  ];

  // Автоматическое переключение слайдов
  useEffect(() => {
    if (currentStep === 2 && selectedPackage) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % packages[0].images.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentStep, selectedPackage]);

  const handlePilgrimageSelect = (type: string) => {
    setSelectedPilgrimage(type);
  };

  const handleSaveGoal = async (shouldRedirectToDeposit: boolean) => {
    try {
      const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);
      if (!selectedPkg) return;

      const targetAmount = parseInt(selectedPkg.price.replace(/\s/g, ''));
      
      await goalService.createSelfGoal({
        type: selectedPilgrimage.toUpperCase() as 'UMRAH' | 'HAJJ',
        packageType: selectedPackage.toUpperCase() as 'PREMIUM' | 'COMFORT' | 'STANDARD',
        targetAmount,
        monthlyTarget: monthlyPayment,
        currentAmount: 0
      });

      // После успешного создания цели
      if (shouldRedirectToDeposit) {
        navigate('/?deposit=true'); // Перенаправляем на главную с флагом для открытия модалки депозита
      } else {
        navigate('/'); // Просто перенаправляем на главную
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      // Здесь можно добавить отображение ошибки пользователю
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedPilgrimage) {
      setIsFirstStepConfirmed(true);
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedPackage) {
      setIsSecondStepConfirmed(true);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setIsThirdStepConfirmed(true);
      handleSaveGoal(false); // Просто сохраняем без перехода к депозиту
    }
  };

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
    setCurrentSlide(0); // Сброс слайдера при выборе пакета
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % packages[0].images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + packages[0].images.length) % packages[0].images.length);
  };

  const renderProgressStepText = (stepNumber: number, text: string) => {
    // Активный шаг (зеленый текст)
    const isActive = (stepNumber === 1 && currentStep >= 1) ||
      (stepNumber === 2 && (isSecondStepConfirmed || currentStep >= 2));

    // Завершенный шаг (текст скрыт, есть галочка)
    const isCompleted = (stepNumber === 1 && isFirstStepConfirmed) ||
      (stepNumber === 2 && isSecondStepConfirmed);

    // Показывать галочку только для завершенных шагов
    const showCheck = isCompleted;

    return (
      <div className={`progress-step-text ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
        <div className="progress-step-number">
          {showCheck && (
            <div className="progress-step-check">
              <CheckIcon />
            </div>
          )}
          <span>{text}</span>
        </div>
      </div>
    );
  };

  const monthlyPayment = Math.ceil(parseInt(packages[0].price.replace(/\s/g, '')) / months);

  const updateSliderBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const min = parseInt(e.target.min);
    const max = parseInt(e.target.max);
    const percentage = ((value - min) / (max - min)) * 100;
    e.target.style.background = `linear-gradient(to right, #35c759 0%, #35c759 ${percentage}%, rgba(120, 120, 128, 0.16) ${percentage}%, rgba(120, 120, 128, 0.16) 100%)`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="goals__content">
            <div className="goals__options">
              {pilgrimageTypes.map((type) => (
                <button
                  key={type.id}
                  className={`goals__option-button ${selectedPilgrimage === type.id ? 'selected' : ''}`}
                  onClick={() => handlePilgrimageSelect(type.id)}
                >
                  <type.Icon className="goals__option-icon" />
                  <div className="goals__option-content">
                    <div className="goals__option-title">{type.name}</div>
                    <div className="goals__option-description">{type.description}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              className="goals__next-button"
              disabled={!selectedPilgrimage}
              onClick={handleNext}
            >
              Далее
            </button>
          </div>
        );

      case 2:
        return (
          <div className="goals__content">
            <div className="goals__description">
              В стоимость включены перелет, отели, трансферы, сопровождение и всё необходимое.
            </div>
            <div className="goals__options" style={{ display: 'block' }}>
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`package-card ${selectedPackage === pkg.id ? 'selected' : ''}`}
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                    <div className="package-header">
                      <div className="package-name">{pkg.name}</div>
                      <div className="package-price">От {pkg.price} ₸</div>
                    </div>
                  <div className="package-slider">
                    <Swiper
                      modules={[Navigation, Pagination, Autoplay]}
                      spaceBetween={10}
                      
                      slidesPerView={1.05}
                      breakpoints={{
                        768: {
                          slidesPerView: 2,
                          spaceBetween: 15
                        }
                      }}

                      className="package-swiper"
                    >
                      {pkg.images.map((image, index) => (
                        <SwiperSlide key={index}>
                          <img
                            src={image}
                            alt={`${pkg.name} - фото ${index + 1}`}
                            className="package-image"
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                  <div className="package-content">
                  
                    <div className="package-details">
                      <div className="package-detail">
                        <span className="package-detail-label">Длительность тура</span>
                        <span className="package-detail-value">{pkg.details.duration}</span>
                      </div>
                      <div className="package-detail">
                        <span className="package-detail-label">Рейс</span>
                        <span className="package-detail-value">{pkg.details.flight}</span>
                      </div>
                      <div className="package-detail">
                        <span className="package-detail-label">Отель в Мекке</span>
                        <div>
                          <div className="package-detail-value">{pkg.details.hotelMecca.name}</div>
                          <div className="package-detail-subtext">{pkg.details.hotelMecca.distance}</div>
                        </div>
                      </div>
                      <div className="package-detail">
                        <span className="package-detail-label">Отель в Медине</span>
                        <div>
                          <div className="package-detail-value">{pkg.details.hotelMedina.name}</div>
                          <div className="package-detail-subtext">{pkg.details.hotelMedina.distance}</div>
                        </div>
                      </div>
                      <div className="package-detail">
                        <span className="package-detail-label">Трансфер</span>
                        <span className="package-detail-value">{pkg.details.transfer}</span>
                      </div>
                      <div className="package-detail">
                        <span className="package-detail-label">Питание</span>
                        <span className="package-detail-value">{pkg.details.food}</span>
                      </div>
                      <div className="package-detail">
                        <span className="package-detail-label package-detail-label--services">
                          Виза, услуги гида, экскурсия,<br />фирменный хадж набор
                        </span>
                        <span className="package-detail-value package-detail-value--check">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.29004 15.4692C5.84733 15.4692 5.47103 15.2783 5.16113 14.8965L0.861328 9.60059C0.739583 9.45671 0.651042 9.31559 0.595703 9.17725C0.545898 9.0389 0.520996 8.89502 0.520996 8.74561C0.520996 8.41357 0.631673 8.13965 0.853027 7.92383C1.07438 7.70801 1.35384 7.6001 1.69141 7.6001C2.07324 7.6001 2.39421 7.76335 2.6543 8.08984L6.25684 12.6553L13.2876 1.51562C13.4315 1.29427 13.5809 1.13932 13.7358 1.05078C13.8908 0.956706 14.0845 0.909668 14.3169 0.909668C14.6545 0.909668 14.9312 1.01481 15.147 1.2251C15.3628 1.43538 15.4707 1.70378 15.4707 2.03027C15.4707 2.16309 15.4486 2.2959 15.4043 2.42871C15.36 2.56152 15.2909 2.69987 15.1968 2.84375L7.42725 14.8633C7.16162 15.2673 6.78255 15.4692 6.29004 15.4692Z" fill="#35C759"/>
</svg>
                        </span>
                      </div>
                    </div>
                    <button 
                      className="package-select-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePackageSelect(pkg.id);
                      }}
                    >
                      {selectedPackage === pkg.id ? 'Выбрано' : 'Выбрать пакет'}
                    </button>
                    {selectedPackage === pkg.id && (
                      <button 
                        className="package-cancel-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPackage('');
                        }}
                      >
                        Отменить выбор
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {selectedPackage && (
                <button
                  className="goals__next-button"
                  onClick={handleNext}
                >
                  Далее
                </button>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="goals__content">
            <div className="verify-data">
              <div className="verfi_cont">
                <div className="verify-field">
                  <span className="verify-label">ФИО</span>
                  <span className="verify-value">Иванов Иван Иванович</span>
                </div>
                <div className="verify-field">
                  <span className="verify-label">ИИН</span>
                  <span className="verify-value">890919300267</span>
                </div>
                <div className="verify-field">
                  <span className="verify-label">Тип паломничества</span>
                  <span className="verify-value green">{selectedPilgrimage === 'umrah' ? 'Умра' : 'Хадж'}</span>
                </div>
                <div className="verify-field">
                  <span className="verify-label">Турпакет</span>
                  <span className="verify-value green">Premium Package</span>
                </div>
                <div className="verify-field">
                  <span className="verify-label">Стоимость</span>
                  <span className="verify-value">{packages[0].price} ₸</span>
                </div>
              </div>
              <div className="saving-period">
                <h3>Укажите примерный срок накопления <span className="saving-period-value">{months} месяца</span></h3>
                <input type="range" min="1" max="48" value={months} onChange={(e) => {
                  setMonths(parseInt(e.target.value));
                  updateSliderBackground(e);
                }}
                  className="period-slider"
                />
              </div>

              <div className="monthly-payment">
                <p>Чтобы накопить за {months} месяца, Вам нужно вносить:</p>
                <h2>{monthlyPayment.toLocaleString()} ₸ в месяц</h2>
                <p className="payment-note">
                  Сумма рассчитана без применения общей системы. Главное — исправное накопление. Чистота и сумма пополнений — на Ваше усмотрение.
                </p>
              </div>

              <div className="goals__actions">
                <button 
                  className="goals__next-button bnx" 
                  onClick={() => handleSaveGoal(false)}
                >
                  Сохранить
                </button>
                <button 
                  className="goals__submit-button bnx" 
                  onClick={() => handleSaveGoal(true)}
                >
                  Сохранить и перейти к пополнению
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.17282 21.7672C6.42514 16.572 4.93852 16.3943 4.93852 13.8735C4.93852 13.0332 5.60104 11.0214 5.69799 10.0438C5.92421 7.79773 5.36673 8.39561 7.00687 6.73124L7.10382 4.42051C7.92793 3.62872 8.33998 2.91772 9.34992 3.16819C9.96396 4.99415 8.80051 4.42051 8.6874 6.55349C9.37415 7.46647 9.83469 7.55535 10.3518 8.70263C11.0062 10.1569 10.5376 10.1408 11.7738 11.3608C13.5916 11.5709 14.6905 11.5789 15.9913 10.2701C16.1286 8.8723 15.3207 8.9935 16.1448 7.70886C16.7103 6.82819 17.2678 6.3515 18.3262 6.707C18.6736 8.08051 17.1143 8.3633 17.5991 9.89032C19.6917 10.1004 20.1764 7.21601 21.7762 7.07058C21.7762 10.1489 18.5605 10.5528 18.4878 13.0575C18.4393 14.6249 19.829 18.9393 21.2348 19.8604C22.471 17.9617 23.8041 15.8934 23.9576 13.5988C25.0322 -2.05924 4.3164 -4.91129 0.381689 8.79959C0.179702 9.5025 0.0585095 10.2135 0.00195312 10.9245V12.7424C0.349371 17.2507 3.12871 21.2097 5.17282 21.7672Z" fill="white" />
                    <path d="M11.232 23.8676C16.8311 24.5301 16.2413 22.8011 15.1344 16.4264C14.6981 13.9137 14.1891 12.5886 11.2078 12.823C9.34948 15.0287 10.2867 19.3269 10.3513 21.2095C10.3998 22.6961 10.1494 22.793 11.232 23.8676ZM17.6714 22.3325C18.6086 22.2194 18.7702 22.0255 19.5296 21.4195C19.6508 20.1349 18.7702 18.0665 17.3967 17.6545C16.7503 18.8987 16.9361 21.1125 17.6714 22.3325ZM8.44458 23.399C8.44458 21.8316 8.63849 18.5917 7.83054 17.4767C6.75597 17.7918 7.08723 18.7129 7.07915 20.6762C7.07107 22.1144 6.80445 23.2536 8.44458 23.399Z" fill="white" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="goals">
      <div className="profile__header ds">
        <img src="/images/logos.svg" alt="Atlas Save" className="profile__logo" />
      </div>
      <div className="goals__header-title-container">
        <Link to="/goals" className="goals__back">
          ← Главная
        </Link>
        <div className="goals__header-title">Цели</div>
        <div className="empty-space"></div>
      </div>
    <div className="wrapper">
      <div className="goals__progress">
        <div className="progress-container">
          <div className="progress-steps-text">
            {renderProgressStepText(1, 'Шаг 1')}
            {renderProgressStepText(2, 'Шаг 2')}
          </div>
          <div className="progress-bars">
            <div className="progress-step">
              <div
                className="progress-step-fill"
                style={{
                  width: selectedPilgrimage ? (isFirstStepConfirmed ? '100%' : '50%') : '0%'
                }}
              />
            </div>
            <div className="progress-step">
              <div
                className="progress-step-fill"
                style={{
                  width: currentStep === 3 ? '100%' : (isSecondStepConfirmed ? '100%' : (selectedPackage ? '50%' : '0%'))
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="title_header">
        {currentStep === 1 ? 'Выберите тип паломничества' :
          currentStep === 2 ? 'Выберите пакет' :
            'Проверьте корректность данных'}
      </div>
      
      {renderStepContent()}
      </div>
    </div>
  );
};

export default SelfGoalSteps; 