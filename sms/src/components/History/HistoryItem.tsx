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
        <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 24.4922C5.47266 24.4922 0.046875 19.0664 0.046875 12.5391C0.046875 6 5.46094 0.585938 11.9883 0.585938C18.5273 0.585938 23.9531 6 23.9531 12.5391C23.9531 19.0664 18.5391 24.4922 12 24.4922ZM12 22.5C17.5312 22.5 21.9609 18.0703 21.9609 12.5391C21.9609 7.00781 17.5195 2.57812 11.9883 2.57812C6.45703 2.57812 2.05078 7.00781 2.05078 12.5391C2.05078 18.0703 6.46875 22.5 12 22.5ZM10.7109 18.1055C10.3242 18.1055 10.0078 17.9414 9.71484 17.5547L6.85547 14.0391C6.69141 13.8164 6.58594 13.5703 6.58594 13.3125C6.58594 12.7969 6.98438 12.3867 7.48828 12.3867C7.81641 12.3867 8.07422 12.4805 8.35547 12.8555L10.6641 15.8438L15.5273 8.03906C15.75 7.69922 16.043 7.51172 16.3359 7.51172C16.8281 7.51172 17.2969 7.85156 17.2969 8.37891C17.2969 8.63672 17.1445 8.89453 17.0156 9.12891L11.6602 17.5547C11.4258 17.918 11.0977 18.1055 10.7109 18.1055Z" fill="#35C759" />
</svg>
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
            {/* <div className={`history-item__status ${getStatusClass(status)}`}>
              {getStatusText(status)}
            </div> */}
          </div>
          <svg width="6" height="12" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 6C6 6.14648 5.94141 6.27539 5.83008 6.38672L1.18945 10.9277C1.08398 11.0332 0.955078 11.0859 0.802734 11.0859C0.503906 11.0859 0.269531 10.8574 0.269531 10.5527C0.269531 10.4004 0.328125 10.2715 0.421875 10.1719L4.6875 6L0.421875 1.82812C0.328125 1.72852 0.269531 1.59375 0.269531 1.44727C0.269531 1.14258 0.503906 0.914062 0.802734 0.914062C0.955078 0.914062 1.08398 0.966797 1.18945 1.06641L5.83008 5.61328C5.94141 5.71875 6 5.85352 6 6Z" fill="#222222" />
</svg>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal__content">
            <button className="modal__close" onClick={() => setIsModalOpen(false)}><svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8.5 16.3281C4.14844 16.3281 0.53125 12.7109 0.53125 8.35938C0.53125 4 4.14062 0.390625 8.49219 0.390625C12.8516 0.390625 16.4688 4 16.4688 8.35938C16.4688 12.7109 12.8594 16.3281 8.5 16.3281ZM5.875 11.6406C6.05469 11.6406 6.21875 11.5781 6.34375 11.4531L8.5 9.28125L10.6641 11.4531C10.7812 11.5781 10.9453 11.6406 11.125 11.6406C11.4922 11.6406 11.7812 11.3516 11.7812 10.9922C11.7812 10.8125 11.7188 10.6484 11.5859 10.5312L9.42188 8.36719L11.5938 6.19531C11.7344 6.05469 11.7891 5.91406 11.7891 5.73438C11.7891 5.375 11.5 5.09375 11.1406 5.09375C10.9688 5.09375 10.8281 5.14844 10.6953 5.28125L8.5 7.46094L6.32031 5.28906C6.19531 5.17188 6.05469 5.10938 5.875 5.10938C5.51562 5.10938 5.23438 5.38281 5.23438 5.75C5.23438 5.92188 5.29688 6.07812 5.42188 6.20312L7.58594 8.36719L5.42188 10.5391C5.29688 10.6562 5.23438 10.8203 5.23438 10.9922C5.23438 11.3516 5.51562 11.6406 5.875 11.6406Z" fill="#222222" />
</svg></button>
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