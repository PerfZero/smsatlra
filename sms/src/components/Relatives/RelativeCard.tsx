import React from 'react';
import './RelativeCard.css';

interface RelativeCardProps {
  name: string;
  balance: number;
  balanceUsd: number;
  remaining: number;
  remainingUsd: number;
  progress: number;
  color: 'orange' | 'blue' | 'purple' | 'sen';
  icon: string;
  onReplenish: () => void;
  index: number;
  isExpanded: boolean;
}

export const RelativeCard: React.FC<RelativeCardProps> = ({
  name,
  balance,
  balanceUsd,
  remaining,
  remainingUsd,
  progress,
  color,
  icon,
  onReplenish,
  index,
  isExpanded
}) => {
  return (
    <div 
      className={`relative-card relative-card--${color}`}
      style={{ 
        transform: `translateY(${index * 64}px)`,
        zIndex: isExpanded ? 10 : 4 - index
      }}
    >
      <div className="relative-card__header">
        <img src={icon} alt="" className="relative-card__icon" />
        <div className="relative-card__name">{name}</div>
        <div className="relative-card__action">Перейти {'>'}</div>
      </div>

      {isExpanded ? (
        <div className="relative-card__content">
          <div className="relative-card__amounts">
            <div>
              <div className="relative-card__label">Баланс:</div>
              <div className="relative-card__balance">₸ {balance.toLocaleString()}</div>
              <div className="relative-card__balance-usd">≈ ${balanceUsd.toLocaleString()}</div>
            </div>
            <div>
              <div className="relative-card__label">Осталось до цели</div>
              <div className="relative-card__remaining">₸ {remaining.toLocaleString()}</div>
              <div className="relative-card__remaining-usd">≈ ${remainingUsd}</div>
            </div>
          </div>

          <div className="relative-card__progress">
            <div className="relative-card__progress-bar">
              <div 
                className="relative-card__progress-fill" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <div className="relative-card__progress-percentage">{progress}%</div>
          </div>

          <button className="relative-card__replenish" onClick={onReplenish}>
            Пополнить счет
            <img src="/images/kaspi.svg" alt="Kaspi" />
          </button>
        </div>
      ) : null}
    </div>
  );
}; 