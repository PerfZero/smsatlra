import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { TourPackage } from '../../types';
import './SaveDashboard.css';

const SaveDashboard: React.FC = () => {
  const { currentUser } = useSelector((state: RootState) => state.user);

  const calculateProgress = () => {
    if (!currentUser?.selectedPackage) return 0;
    return (currentUser.balance / currentUser.selectedPackage.price) * 100;
  };

  const estimateTimeToComplete = () => {
    if (!currentUser?.selectedPackage) return null;
    const remaining = currentUser.selectedPackage.price - currentUser.balance;
    const monthlyContribution = 50000; // Example monthly contribution
    const months = Math.ceil(remaining / monthlyContribution);
    return months;
  };

  return (
    <div className="save-dashboard">
      <h1 className="save-dashboard__title">
        Atlas Safe - Накопления
      </h1>

      <div className="save-dashboard__grid">
        {/* Progress Card */}
        <div className="save-dashboard__card">
          <div className="save-dashboard__card-content">
            <h2 className="save-dashboard__card-title">
              Прогресс накоплений
            </h2>
            <div className="save-dashboard__progress">
              <div 
                className="save-dashboard__progress-circle"
                style={{ '--progress': `${calculateProgress()}%` } as React.CSSProperties}
              >
                <span className="save-dashboard__progress-text">
                  {`${Math.round(calculateProgress())}%`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Package Details */}
        <div className="save-dashboard__card">
          <div className="save-dashboard__card-content">
            <h2 className="save-dashboard__card-title">
              Выбранный пакет
            </h2>
            {currentUser?.selectedPackage ? (
              <>
                <h3 className="save-dashboard__package-name">
                  {currentUser.selectedPackage.name}
                </h3>
                <p className="save-dashboard__package-detail">
                  Стоимость: {currentUser.selectedPackage.price.toLocaleString()} ₸
                </p>
                <p className="save-dashboard__package-detail">
                  Отель: {currentUser.selectedPackage.hotel}
                </p>
              </>
            ) : (
              <button className="save-dashboard__button">
                Выбрать пакет
              </button>
            )}
          </div>
        </div>

        {/* Balance Info */}
        <div className="save-dashboard__card save-dashboard__card--full">
          <div className="save-dashboard__card-content">
            <h2 className="save-dashboard__card-title">
              Информация о накоплениях
            </h2>
            <p className="save-dashboard__balance">
              Текущий баланс: {currentUser?.balance.toLocaleString()} ₸
            </p>
            {currentUser?.selectedPackage && (
              <>
                <p className="save-dashboard__balance">
                  Осталось накопить:{' '}
                  {(currentUser.selectedPackage.price - currentUser.balance).toLocaleString()}{' '}
                  ₸
                </p>
                <p className="save-dashboard__balance">
                  Примерный срок накопления: {estimateTimeToComplete()} месяцев
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveDashboard; 