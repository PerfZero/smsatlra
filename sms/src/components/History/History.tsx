import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HistoryItem from './HistoryItem';
import { balanceService, Transaction } from '../../services/api';
import './History.css';

// Группировка по дате
const groupByDate = (items: Transaction[]) => {
  return items.reduce((acc: Record<string, Transaction[]>, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});
};

const formatDate = (dateStr: string) => {
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('ru-RU', options);
};

const History: React.FC = () => {
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await balanceService.getTransactions();
        // Преобразуем данные в нужный формат
        const transformedData = data.map(item => {
          // Определяем ИИН плательщика и получателя
          let payerIin = item.iin;
          let recipientIin = item.iin;
          let payerName = item.name;

          // Если это транзакция для родственника
          if (item.goal?.relativeIin) {
            recipientIin = item.goal.relativeIin;
            // Убираем эту проверку, так как плательщик всегда текущий пользователь
            // if (item.description?.includes('Пополнение от родственника:')) {
            //   payerIin = item.goal.relativeIin;
            //   payerName = item.goal.relativeName || '';
            // }
          }

          return {
            id: item.id.toString(),
            iin: item.iin,
            amount: item.amount,
            type: item.type,
            status: item.status,
            description: item.description || '',
            name: item.name || '',
            date: item.date,
            time: new Date().toLocaleTimeString('ru-RU'),
            payerName,
            payerIin,
            paymentId: item.transactionNumber || '',
            recipientIin,
            phoneNumber: '',
            goalId: item.goalId,
            goal: item.goal,
            bonus: item.bonus,
            isFirstDeposit: item.isFirstDeposit,
            transactionNumber: item.transactionNumber
          };
        });
        
        setTransactions(transformedData);
      } catch (err) {
        setError('Не удалось загрузить историю транзакций');
        console.error('Error fetching transactions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filtered = transactions.filter(item => 
    item.iin.includes(search)
  );
  const grouped = groupByDate(filtered);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="history">
      <div className="profile__header ds">
        <img src="/images/logos.svg" alt="Atlas Save" className="profile__logo" />
      </div>
      <div className="goals__header-title-container bod">
        <Link to="/" className="goals__back">
          ← Главная
        </Link>
        <div className="goals__header-title">История</div>
        <div className="empty-space"></div>
      </div>
      <div className="history__search-container">
        <input
          className="history__search"
          type="text"
          placeholder="Поиск по ИИН"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="history__list">
        {isLoading ? (
          <div className="history__loading">Загрузка...</div>
        ) : error ? (
          <div className="history__error">{error}</div>
        ) : sortedDates.length === 0 ? (
          <div className="history__empty">
            {search ? 'Ничего не найдено' : 'История пуста'}
          </div>
        ) : (
          sortedDates.map(date => (
            <div className="history__date-group" key={date}>
              <div className="history__date-title">{formatDate(date)}</div>
              {grouped[date].map(item => (
                <HistoryItem 
                  key={item.id}
                  {...item}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History; 