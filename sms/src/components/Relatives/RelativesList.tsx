import React, { useState } from 'react';
import './RelativeCard.css';

const RELATIVES = [
  {
    id: 0,
    name: "Брат, на Умру",
    icon: "graduate",
    balance: "₸ 12 999 000",
    balanceUSD: "$ 24 990",
    remaining: "₸ 1 000",
    remainingUSD: "$ 2",
    progress: 72,
    color: "orange"
  },
  {
    id: 1,
    name: "Бауыржан, на Умру",
    icon: "graduate",
    balance: "₸ 8 500 000",
    balanceUSD: "$ 16 345",
    remaining: "₸ 3 500",
    remainingUSD: "$ 7",
    progress: 65,
    color: "blue"
  },
  {
    id: 2,
    name: "Маке, на Хадж",
    icon: "mountain",
    balance: "₸ 6 750 000",
    balanceUSD: "$ 12 980",
    remaining: "₸ 5 250 000",
    remainingUSD: "$ 10 095",
    progress: 45,
    color: "sen"
  },
  {
    id: 3,
    name: "Мама, на Хадж",
    icon: "mountain",
    balance: "₸ 9 850 000",
    balanceUSD: "$ 18 940",
    remaining: "₸ 2 150 000",
    remainingUSD: "$ 4 135",
    progress: 82,
    color: "purple"
  }
];

export const RelativesList: React.FC = () => {
  const [activeCard, setActiveCard] = useState(0);

  // Вычисляем общую высоту аккордеона
  const getTotalHeight = () => {
    let totalHeight = 0;
    RELATIVES.forEach((_, index) => {
      if (index === activeCard) {
        totalHeight += 320; // Высота раскрытой карточки
      } else {
        totalHeight += 56; // Высота свернутой карточки
      }
    });
    return totalHeight;
  };

  // Вычисляем позицию каждой карточки
  const getCardPosition = (index: number) => {
    let position = 0;
    for (let i = 0; i < index; i++) {
      position += i === activeCard ? 350 : 46;
    }
    return position;
  };

  return (
    <div className="relatives-list">
      <div className="relatives-list__container">
        <div className="relatives-list__cards" style={{ height: `${getTotalHeight()}px` }}>
          {RELATIVES.map((card, index) => {
            const isActive = activeCard === index;
            const topPosition = getCardPosition(index);
            
            return (
              <div 
                key={card.id}
                onClick={() => setActiveCard(index)}
                className={`relative-card relative-card--${card.color}`}
                style={{
                  top: `${topPosition}px`,
                  height: isActive ? '342px' : '64px',
                  zIndex: isActive ? RELATIVES.length + 1 : index + 1
                }}
              >
                {/* Заголовок карточки */}
                <div className="relative-card__header">
                  <div className="relative-card__icon-wrapper">
                    {card.icon === 'graduate' ? (
                      <img src="/images/icon_1.svg" alt="graduate" />
                    ) : (
                        <img src="/images/icon_2.svg" alt="graduate" />

                    )}
                  </div>
                  <span className="relative-card__name">{card.name}</span>
                  <div className="relative-card__action">
                    <span>Перейти</span>
                    <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
                      <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" />
                    </svg>
                  </div>
                </div>
                
                {/* Контент карточки - виден только когда активна */}
                {isActive && (
                  <div className="relative-card__content">
                    <div className="relative-card__balance-section">
                      <div className="relative-card__label">Баланс</div>
                      <div className="relative-card__balance">{card.balance}</div>
                      <div className="relative-card__balance-usd">~ {card.balanceUSD}</div>
                    </div>
                    
                    <div className="relative-card__remaining-section">
                      <div className="relative-card__label">Осталось до цели</div>
                      <div className="relative-card__remaining">{card.remaining}</div>
                      <div className="relative-card__remaining-usd">~ {card.remainingUSD}</div>
                    </div>
                    
                    <div className="relative-card__progress">
                      <div className="relative-card__progress-percentage">
                        {card.progress}%
                      </div>
                      <div className="relative-card__progress-bar">
                        <div 
                          className="relative-card__progress-fill"
                          style={{ width: `${card.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <button className="relative-card__replenish">
                      <div className="relative-card__replenish-icon">
                        
                      </div>
                      Пополнить счет
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5.17288 21.7672C6.4252 16.572 4.93858 16.3943 4.93858 13.8735C4.93858 13.0332 5.6011 11.0214 5.69805 10.0438C5.92428 7.79773 5.36679 8.39561 7.00693 6.73124L7.10388 4.42051C7.92799 3.62872 8.34004 2.91772 9.34998 3.16819C9.96402 4.99415 8.80057 4.42051 8.68746 6.55349C9.37422 7.46647 9.83475 7.55535 10.3518 8.70263C11.0063 10.1569 10.5377 10.1408 11.7738 11.3608C13.5917 11.5709 14.6905 11.5789 15.9913 10.2701C16.1287 8.8723 15.3207 8.9935 16.1448 7.70886C16.7104 6.82819 17.2679 6.3515 18.3263 6.707C18.6737 8.08051 17.1144 8.3633 17.5991 9.89032C19.6917 10.1004 20.1765 7.21601 21.7762 7.07058C21.7762 10.1489 18.5606 10.5528 18.4879 13.0575C18.4394 14.6249 19.8291 18.9393 21.2349 19.8604C22.4711 17.9617 23.8042 15.8934 23.9577 13.5988C25.0323 -2.05924 4.31646 -4.91129 0.38175 8.79959C0.179763 9.5025 0.0585705 10.2135 0.00201416 10.9245V12.7424C0.349432 17.2507 3.12877 21.2097 5.17288 21.7672Z" fill="#F14635" />
  <path d="M11.2325 23.8681C16.8316 24.5306 16.2418 22.8016 15.1349 16.4269C14.6986 13.9142 14.1896 12.5891 11.2083 12.8234C9.34997 15.0291 10.2872 19.3274 10.3518 21.2099C10.4003 22.6966 10.1498 22.7935 11.2325 23.8681ZM17.6718 22.333C18.6091 22.2199 18.7706 22.026 19.5301 21.42C19.6513 20.1354 18.7707 18.067 17.3971 17.655C16.7508 18.8992 16.9366 21.113 17.6718 22.333ZM8.44507 23.3995C8.44507 21.8321 8.63898 18.5922 7.83103 17.4772C6.75646 17.7923 7.08772 18.7134 7.07964 20.6767C7.07156 22.1148 6.80494 23.2541 8.44507 23.3995Z" fill="#F14635" />
</svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 