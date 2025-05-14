import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { goalService, balanceService, type Goal, type Transaction } from '../../services/api';
import { SemiCircleProgress } from 'react-semicircle-progressbar';
import './GoalDetail.css';

const GoalDetail: React.FC = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const goals = await goalService.getAllGoals();
        // Найти цель по ID из параметров URL или первую цель, если ID не передан
        const targetGoal = goalId 
          ? goals.find(g => g.id === parseInt(goalId)) 
          : goals.find(g => !g.relativeId); // Личная цель пользователя
        
        if (targetGoal) {
          setGoal(targetGoal);
          
          // Загрузка истории транзакций
          const allTransactions = await balanceService.getTransactions();
          
          // Теперь API возвращает goalId, поэтому мы можем корректно фильтровать транзакции
          const filteredTransactions = allTransactions.filter(transaction => {
            // Основной фильтр - по ID цели
            if (transaction.goalId !== null && transaction.goalId !== undefined) {
              return transaction.goalId === targetGoal.id;
            }
            
            // Резервный вариант если по какой-то причине goalId не пришел с сервера
            if (transaction.type === 'DEPOSIT') {
              // Для транзакций пополнения цели 
              if (transaction.description === 'Пополнение цели') {
                // Для личной цели
                if (!targetGoal.relativeId && !transaction.goal?.relativeName) {
                  return true;
                }
                
                // Для целей родственников
                if (targetGoal.relativeId && transaction.goal?.relativeName) {
                  return targetGoal.relative?.fullName === transaction.goal.relativeName;
                }
              }
              
              // Включаем бонусные транзакции только для личных целей
              if (transaction.description.includes('Бонусные баллы') && !targetGoal.relativeId) {
                return true;
              }
            }
            
            return false;
          });
          
          console.log(`Отфильтровано ${filteredTransactions.length} транзакций из ${allTransactions.length} для цели ID:${targetGoal.id}`);
          setTransactions(filteredTransactions);
        } else {
          setError('Цель не найдена');
        }
      } catch (err) {
        setError('Произошла ошибка при загрузке данных');
        console.error('Error fetching goal details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [goalId]);

  if (isLoading) {
    return <div className="goal-detail__loading">Загрузка...</div>;
  }

  if (error || !goal) {
    return (
      <div className="goal-detail__error">
        <p>{error || 'Цель не найдена'}</p>
        <Link to="/" className="goal-detail__back-link">Вернуться на главную</Link>
      </div>
    );
  }

  // Вычисляем прогресс и оставшуюся сумму
  const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
  const remainingAmount = goal.targetAmount - goal.currentAmount;

  // Форматирование даты для транзакций
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('ru-RU', options);
  };

  // Группировка транзакций по дате
  const groupByDate = (items: Transaction[]) => {
    return items.reduce((acc: Record<string, Transaction[]>, item) => {
      const date = item.date.split('T')[0]; // Извлекаем только дату
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});
  };

  const grouped = groupByDate(transactions);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="goal-detail">
      <div className="profile__header">
        <img src="/images/logos.svg" alt="Atlas Save" className="profile__logo" />
      </div>
      
      <div className="goals__header-title-container">
        <Link to="/" className="goals__back">
          ← Главная
        </Link>
        <div className="goals__header-title">Детали цели</div>
        <div className="empty-space"></div>
      </div>

      <div className="goal-detail__content">
        {/* Карточка цели */}
        <div className="goal-detail__card">
          <div className="home__goal-section">
            <span className="home__balance-label--active">
              {goal.relativeId ? `Цель для ${goal.relative?.fullName}` : 'Ваша цель'}
            </span>
            <div className="home__goal-details">
              <img src="/images/homes.svg" alt="Goal icon" className="home__goal-icon" />
              <span className="home__goal-name">{goal.type === 'UMRAH' ? 'Умра' : 'Хадж'}</span>
              {goal.packageType && (
                <>
                  <span className="home__goal-separator">|</span>
                  <span className="home__goal-package">{goal.packageType.charAt(0).toUpperCase() + goal.packageType.slice(1)}</span>
                </>
              )}
            </div>
          </div>

          <div className="goal-detail__progress-section">
            <div>
              <SemiCircleProgress
                percentage={Math.round(progressPercentage)}
                size={{
                  width: 400,
                  height: 300,
                }}
                hasBackground={true}
                bgStrokeColor="#ffffff50"
                strokeWidth={10}
                fontStyle={{
                  fontSize: '24px',
                  fontFamily: 'SF Pro Display',
                  fontWeight: 'bold',
                  fill: '#fff'
                }}
                strokeColor="#fff"
              />
            </div>
            <div className="goal-detail__remaining-section">
              <span className="home__remaining-label">Осталось накопить</span>
              <div className="home__remaining-amount">
                {remainingAmount.toLocaleString()} ₸
                <span className="home__remaining-percentage">
                  из {goal?.targetAmount.toLocaleString()} ₸
                </span>
              </div>
            </div>
          </div>

          <button className="home__button home__button--primary red" onClick={() => window.location.href = `/?deposit=true`}>
            Пополнить счет
            <img src="/images/kaspy.svg" alt="Add" />
          </button>
        </div>

        {/* Информация о пакете */}
        <div className="goal-detail__package-info">
          <h2 className="goal-detail__section-title">Информация о пакете</h2>
          <div className="goal-detail__package-card">
            <div className="package-details">
              <div className="package-detail">
                <span className="package-detail-label">Тип паломничества</span>
                <span className="package-detail-value">{goal.type === 'UMRAH' ? 'Умра' : 'Хадж'}</span>
              </div>
              <div className="package-detail">
                <span className="package-detail-label">Пакет</span>
                <span className="package-detail-value">{goal.packageType.charAt(0).toUpperCase() + goal.packageType.slice(1)}</span>
              </div>
              <div className="package-detail">
                <span className="package-detail-label">Целевая сумма</span>
                <span className="package-detail-value">{goal.targetAmount.toLocaleString()} ₸</span>
              </div>
              <div className="package-detail">
                <span className="package-detail-label">Ежемесячный платеж</span>
                <span className="package-detail-value">{goal.monthlyTarget.toLocaleString()} ₸</span>
              </div>
              <div className="package-detail">
                <span className="package-detail-label">Дата создания</span>
                <span className="package-detail-value">{new Date(goal.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* История пополнений */}
        <div className="goal-detail__transactions">
          <h2 className="goal-detail__section-title">История пополнений</h2>
          <div className="goal-detail__transactions-list">
            {sortedDates.length === 0 ? (
              <div className="goal-detail__empty-transactions">
                История пополнений для этой цели пуста
              </div>
            ) : (
              sortedDates.map(date => (
                <div className="goal-detail__date-group" key={date}>
                  <div className="goal-detail__date-title">{formatDate(date)}</div>
                  {grouped[date].map(transaction => (
                    <div className="goal-detail__transaction-item" key={transaction.id}>
                      <div className="goal-detail__transaction-header">
                        <div className="goal-detail__transaction-type">
                          {transaction.type === 'DEPOSIT' ? 'Пополнение' : 'Списание'}
                        </div>
                        <div className={`goal-detail__transaction-amount ${
                          transaction.type === 'DEPOSIT' ? 'goal-detail__transaction-amount--positive' : 'goal-detail__transaction-amount--negative'
                        }`}>
                          {transaction.type === 'DEPOSIT' ? '+' : '-'} {transaction.amount.toLocaleString()} ₸
                        </div>
                      </div>
                      <div className="goal-detail__transaction-details">
                        <div className="goal-detail__transaction-payer">
                          <span className="goal-detail__transaction-label">Плательщик:</span>
                          <span className="goal-detail__transaction-value">{transaction.payerName}</span>
                        </div>
                        <div className="goal-detail__transaction-iin">
                          <span className="goal-detail__transaction-label">ИИН:</span>
                          <span className="goal-detail__transaction-value">{transaction.payerIin}</span>
                        </div>
                        {transaction.description && (
                          <div className="goal-detail__transaction-description">
                            <span className="goal-detail__transaction-label">Описание:</span>
                            <span className="goal-detail__transaction-value">{transaction.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalDetail; 