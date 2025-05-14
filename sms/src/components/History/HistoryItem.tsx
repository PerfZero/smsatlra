import React, { useState } from 'react';
import { Transaction } from '../../services/api';
import './HistoryItem.css';

type HistoryItemProps = Transaction;

const HistoryItem: React.FC<HistoryItemProps> = ({ 
  iin, 
  amount,
  date,
  time,
  payerName,
  payerIin,
  paymentId,
  recipientIin,
  phoneNumber,
  type,
  status,
  description,
  name,
  goal
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'history-item__status--completed';
      case 'pending':
        return 'history-item__status--pending';
      case 'failed':
        return 'history-item__status--failed';
      default:
        return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'Выполнено';
      case 'pending':
        return 'В обработке';
      case 'failed':
        return 'Ошибка';
      default:
        return status;
    }
  };

  return (
    <>
      <div className="history-item" onClick={() => setIsModalOpen(true)}>
        <div className="history-item__main">
          <div className="history-item__info">
            <div className="history-item__iin">{recipientIin || payerIin}</div>
            {/* {goal && (
              <div className="history-item__goal">
                {goal.relativeName ? `Для ${goal.relativeName}` : 'Личная цель'}
              </div>
            )} */}
          </div>
          <div className="history-item__amount-container">
            <div className={`history-item__amount ${type === 'DEPOSIT' ? 'history-item__amount--positive' : 'history-item__amount--negative'}`}>
              {type === 'DEPOSIT' ? '+' : '-'}{formatAmount(amount)} ₸
            </div>
            <div className={`history-item__status ${getStatusClass(status)}`}>
              {getStatusText(status)}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal__content">
            <button className="modal__close" onClick={() => setIsModalOpen(false)}>×</button>
            <div className="modal__details">
              <div className="modal__row">
                <span className="modal__label">Дата/время:</span>
                <span className="modal__value">{date} / {time}</span>
              </div>
              <div className="modal__row">
                <span className="modal__label">ФИО плательщика:</span>
                <span className="modal__value">{payerName}</span>
              </div>
              <div className="modal__row">
                <span className="modal__label">ИИН плательщика:</span>
                <span className="modal__value">{payerIin}</span>
              </div>
              <div className="modal__row">
                <span className="modal__label">Идентификатор платежа:</span>
                <span className="modal__value">{paymentId}</span>
              </div>
              <div className="modal__row">
                <span className="modal__label">Сумма платежа:</span>
                <span className="modal__value">{formatAmount(amount)} ₸</span>
              </div>
              <div className="modal__row">
                <span className="modal__label">ИИН получателя:</span>
                <span className="modal__value">{recipientIin}</span>
              </div>
              {phoneNumber && (
                <div className="modal__row">
                  <span className="modal__label">Номер телефона:</span>
                  <span className="modal__value">{phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HistoryItem; 