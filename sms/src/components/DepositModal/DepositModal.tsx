import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Modal from '../Modal/Modal';
import { balanceService, Transaction } from '../../services/api';
import './DepositModal.css';

interface DepositModalProps {
  isOpen: boolean;
  onClose: (transaction?: Transaction) => void;
  goalId?: number | null;
  goalInfo?: {
    relativeName: string;
    targetAmount: number;
    currentAmount: number;
    relativeIin?: string;
  };
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, goalId, goalInfo }) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = useSelector((state: any) => state.user.currentUser);

  // Сбрасываем значение при каждом открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setAmount('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setIsLoading(true);
    try {
      const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
      const response = await balanceService.deposit(numericAmount, goalId);
      
      console.log('Server response:', response);
      
      // Преобразуем ответ от сервера в формат Transaction
      const transaction: Transaction = {
        id: response.id.toString(),
        iin: response.iin,
        amount: response.amount,
        type: response.type,
        status: response.status,
        description: response.description || '',
        name: response.name,
        date: response.date,
        time: new Date().toLocaleTimeString('ru-RU'),
        payerName: currentUser.name || 'Пользователь',
        payerIin: currentUser.iin,
        paymentId: response.transactionNumber,
        recipientIin: goalInfo?.relativeIin || currentUser.iin,
        phoneNumber: currentUser.phone || '',
        goalId: goalId || undefined,
        goal: response.goal,
        transactionNumber: response.transactionNumber
      };

      console.log('Transformed transaction:', transaction);
      
      // Сбрасываем значение поля ввода
      setAmount('');
      // Закрываем модалку и передаем транзакцию
      onClose(transaction);
    } catch (error) {
      console.error('Error making deposit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value) {
      const numericValue = parseInt(value);
      setAmount(numericValue.toLocaleString());
    } else {
      setAmount('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {
      setAmount(''); // Сбрасываем значение при закрытии
      onClose();
    }}>
      <div className="deposit-modal">
        <h2 className="deposit-modal__title">
          {goalInfo ? `Пополнение цели: ${goalInfo.relativeName}` : 'Пополнение счета'}
        </h2>
        
        {goalInfo && (
          <div className="deposit-modal__goal-summary">
            <div className="deposit-modal__goal-progress">
              <div className="deposit-modal__goal-label">Прогресс цели:</div>
              <div className="deposit-modal__goal-percentage">
                {Math.round((goalInfo.currentAmount / goalInfo.targetAmount) * 100)}%
              </div>
            </div>
            <div className="deposit-modal__goal-remaining">
              <div className="deposit-modal__goal-label">Осталось собрать:</div>
              <div className="deposit-modal__goal-amount">
                {(goalInfo.targetAmount - goalInfo.currentAmount).toLocaleString()} ₸
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="deposit-modal__input-group">
            <input
              type="text"
              value={amount ? `${amount} ₸` : ''}
              onChange={handleAmountChange}
              placeholder="Введите сумму"
              className="deposit-modal__input"
            />
          </div>
          <button
            type="submit"
            className="deposit-modal__submit"
            disabled={!amount || isLoading}
          >
            {isLoading ? 'Обработка...' : 'Пополнить'}
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default DepositModal; 