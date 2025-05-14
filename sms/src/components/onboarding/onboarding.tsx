import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './onboarding.css';

const slides = [
  {
    title: 'Atlas Save — начало пути.',
    description: 'Копите на Умру и Хадж через Kaspi. Деньги хранятся отдельно — только на паломничество.',
    image: '/images/onboarding-1.png',
    showBackButton: false,
    nextButtonText: 'Далее'
  },
  {
    title: 'Копите за себя и близких.',
    description: 'Выбирайте цель, следите за прогрессом. Даже 1 000 ₸ — это шаг к Мекке.',
    image: '/images/onboarding-2.png',
    showBackButton: true,
    nextButtonText: 'Далее'
  },
  {
    title: 'Пополнение за минуту.',
    description: 'Через Kaspi — быстро и надёжно. Средства закреплены за вашей целью.',
    image: '/images/onboarding-3.png',
    showBackButton: true,
    nextButtonText: 'Начать копить'
  }
];

export const Onboarding: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/registration');
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    navigate('/registration');
  };

  return (
    <div className="onboarding">
      <div className="onboarding__left">
        <div className="onboarding__header">
          <img src="./logo.svg" alt="Atlas Save" className="onboarding__logo" />
        
          <button className="onboarding__skip-button d-none" onClick={handleSkip}>
            Пропустить
          </button>
        </div>

        <div className="onboarding__content">
        {slides[currentSlide].showBackButton && (
            <button className="onboarding__back-button desktop-only" onClick={handleBack}>
              <img src="/images/back.png" alt="Назад" className="onboarding__back-button-icon" />
            </button>
          )}
          <h1 className="onboarding__title">{slides[currentSlide].title}</h1>
          <p className="onboarding__description">{slides[currentSlide].description}</p>
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            className="onboarding__image d-none"
          />
          <div className="onboarding__footer ">
            {slides[currentSlide].showBackButton && (
              <button className="onboarding__back-button mobile-only" onClick={handleBack}>
                <img src="/images/back.png" alt="Назад" className="onboarding__back-button-icon" />
              </button>
            )}
            <button className="onboarding__next-button" onClick={handleNext}>
              {slides[currentSlide].nextButtonText}
            </button>
            <button className="onboarding__skip-button" onClick={handleSkip}>
              Пропустить
            </button>
          </div>
        </div>
      </div>

      <div className="onboarding__right">
      <img
        src={slides[currentSlide].image}
        alt={slides[currentSlide].title}
        className="onboarding__image "
      />
      </div>
      <div className="onboarding__footer d-none">
        {slides[currentSlide].showBackButton && (
          <button className="onboarding__back-button" onClick={handleBack}>
            <img src="/images/back.png" alt="Назад" className="onboarding__back-button-icon" />
          </button>
        )}
        <button className="onboarding__next-button" onClick={handleNext}>
          {slides[currentSlide].nextButtonText}
        </button>
      </div>
    </div>
  );
}; 