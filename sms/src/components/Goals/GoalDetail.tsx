import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { goalService, balanceService, type Goal, type Transaction, transformTransactions } from '../../services/api';
import { SemiCircleProgress } from 'react-semicircle-progressbar';
import HistoryItem from '../History/HistoryItem';
import './GoalDetail.css';
import '../Home/Home.css';
import '../History/History.css';
import '../History/HistoryItem.css';
import { getGoalColor, cardColors } from '../../utils/goalColors';
import FAQ from '../FAQ/FAQ';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { ReactComponent as UmrahIcon } from './icons/umrah_1.svg';
import { ReactComponent as HajjIcon } from './icons/hajj_1.svg';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Balance {
  amount: number;
  bonusAmount: number;
}

const GoalDetail: React.FC = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const colorIndex = Number(searchParams.get('colorIndex'));
  const [goal, setGoal] = useState<Goal | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useSelector((state: any) => state.user.currentUser);
  const [packageDetails, setPackageDetails] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [balanceData, goalsData, allTransactionsRaw] = await Promise.all([
          balanceService.getBalance(),
          goalService.getAllGoals(),
          balanceService.getTransactions()
        ]);
        setBalance(balanceData as Balance);
        const targetGoal = goalId 
          ? goalsData.find((g: Goal) => g.id === parseInt(goalId)) 
          : goalsData.find((g: Goal) => !g.relativeId);
        setGoal(targetGoal || null);
        const allTransactions = transformTransactions(allTransactionsRaw);
        if (targetGoal) {
          // Фильтруем только по этой цели
          const filteredTransactions = allTransactions.filter((t: Transaction) => t.goalId === targetGoal.id);
          setTransactions(filteredTransactions);
        }
      } catch (err) {
        setError('Ошибка загрузки данных');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [goalId]);

  useEffect(() => {
    if (goal?.packageId) {
      api.get(`/packages/${goal.packageId}`).then(res => setPackageDetails(res.data));
    }
  }, [goal?.packageId]);

  if (isLoading) {
    return <div className="home__loading">Загрузка...</div>;
  }

  if (error || !goal || !balance) {
    return (
      <div className="home__error">
        <p>{error || 'Цель не найдена'}</p>
        <Link to="/" className="home__back-link">Вернуться на главную</Link>
      </div>
    );
  }

  const currentBalance = goal.currentAmount || 0;
  const currentBonus = balance.bonusAmount || 0;
  const dollarAmount = (currentBalance / 450).toFixed(2);
  const progressPercentage = goal.targetAmount > 0
    ? Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100))
    : 0;
  const remainingAmount = goal.targetAmount - goal.currentAmount;

  // История
  const groupByDate = (items: Transaction[]) => {
    return items.reduce((acc: Record<string, Transaction[]>, item) => {
      const date = item.date.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});
  };
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('ru-RU', options);
  };
  const grouped = groupByDate(transactions);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="home">
      <div className="home__header">
        <img src="/images/logos.svg" alt="Atlas Save" className="home__logo" />
      </div>
      <div className="home__content">
        <div className="home__balance-section home__balance-section--active">
          <div
            className={`home__balance-card home__balance-card--active${goal.relativeId ? ' goal-detail__cards' : ''}`}
            style={goal.relativeId && !isNaN(colorIndex) ? { backgroundColor: cardColors[colorIndex % cardColors.length] } : {}}
          >
            <div className="home__balance-label-container">
              <span className="home__balance-label--active">Ваш баланс</span>
              <button className="home__balance-toggle" onClick={() => setShowBalance(!showBalance)}>
                <img src={showBalance ? "/images/eye-open.svg" : "/images/eye-closed.svg"} alt="Toggle balance visibility" />
              </button>
            </div>
            <div className="home__balance-amount">
              {showBalance ? (
                <>
                  <span className="home__balance-currency">₸</span> {currentBalance.toLocaleString()}
                </>
              ) : (
                '* * * * *'
              )}
              <div className="home__bonus-amount">
                {showBalance ? (
                  <>{currentBonus.toLocaleString()} Б</>
                ) : (
                  '* * * * *'
                )}
              </div>
            </div>
            <div className="home__balance-dollar-amount">
              {showBalance ? `≈ $${dollarAmount}` : '≈ $* * * *'}
            </div>
            <div className="home__goal-section">
              <span className="home__balance-label--active">{goal.relativeId ? `Цель для ${goal.relative?.fullName}` : 'Ваша цель'}</span>
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
            <div className="home__progress-section">
              <div className="home__progress-section-circle">
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
                            strokeLinecap="round"
                          />
              </div>
              <div className="home__remaining-section">
                <span className="home__remaining-label">Осталось накопить</span>
                <div className="home__remaining-amount">
                  {remainingAmount.toLocaleString()} ₸
                  <span className="home__remaining-percentage">
                    ({Math.round(progressPercentage)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
          <a
            href="https://kaspi.kz/pay/_gate?action=service_with_subservice&service_id=3468&subservice_id=22892&region_id=18"
            className="home__button home__button--primary red"
            target="_blank"
            rel="noopener noreferrer"
          >
            Пополнить счет
            <img src="/images/kaspy.svg" alt="Add" />
          </a>
        </div>
        {/* Информация о пакете */}
        <div className="home__package-info">
          <h2 className="home__section-title">Информация о турпакете</h2>
          {packageDetails ? (
            <div className="package-card card-gols">
              <div className="package-main-info">
                <div className="package-main-info__icon">
                  {packageDetails.type?.toLowerCase() === 'umrah' && <UmrahIcon className="goal-detail__icon" fill="#fff" />}
                  {packageDetails.type?.toLowerCase() === 'hajj' && <HajjIcon className="goal-detail__icon" fill="#fff" />}
                  {!['umrah','hajj'].includes(packageDetails.type?.toLowerCase()) && (
                    <img src="/images/homes.svg" alt="Goal icon" className="home__goal-icon goal-detail__icon" />
                  )}
                </div>
                <div className="package-main-info__content">
                  <div className="package-main-info__name">{packageDetails.name}</div>
                  <div className="package-main-info__type">
                    {packageDetails.type === 'Umrah' ? 'Умра' : 'Хадж'}
                  </div>
                  <div className="package-main-info__price">
                    <span className="package-main-info__price-badge">
                      ₸  ~ {packageDetails.price?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="package-slider">
                <div className="package-swiper">
                  {Array.isArray(packageDetails.images) && packageDetails.images.length > 0 ? (
                    <Swiper
                      modules={[Navigation, Pagination]}
                      spaceBetween={10}
                      slidesPerView={1.2}
                      navigation
                      pagination={{ clickable: true }}
                      className="package-swiper-inner"
                    >
                      {packageDetails.images.map((img: string, idx: number) => (
                        <SwiperSlide key={idx}>
                          <img src={img} alt={`Фото пакета ${idx + 1}`} className="package-image" />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  ) : (
                    <div style={{ color: '#999', padding: 16 }}>Нет фотографий</div>
                  )}
                </div>
              </div>
              <div className="package-content">
                <div className="package-details">
                  <div className="package-detail">
                    <span className="package-detail-label">Длительность тура</span>
                    <span className="package-detail-value">{packageDetails.duration}</span>
                  </div>
                  <div className="package-detail">
                    <span className="package-detail-label">Рейс</span>
                    <span className="package-detail-value">{packageDetails.flight}</span>
                  </div>
                  <div className="package-detail">
                    <span className="package-detail-label">Отель в Мекке</span>
                    <div>
                      <div className="package-detail-value">{packageDetails.hotelMeccaName}</div>
                      <div className="package-detail-subtext">{packageDetails.hotelMeccaDistance}</div>
                    </div>
                  </div>
                  <div className="package-detail">
                    <span className="package-detail-label">Отель в Медине</span>
                    <div>
                      <div className="package-detail-value">{packageDetails.hotelMedinaName}</div>
                      <div className="package-detail-subtext">{packageDetails.hotelMedinaDistance}</div>
                    </div>
                  </div>
                  <div className="package-detail">
                    <span className="package-detail-label">Трансфер</span>
                    <span className="package-detail-value">{packageDetails.transfer}</span>
                  </div>
                  <div className="package-detail">
                    <span className="package-detail-label">Питание</span>
                    <span className="package-detail-value">{packageDetails.food}</span>
                  </div>
                  <div className="package-detail package-detail--services">
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
              </div>
            </div>
          ) : (
            <div>Загрузка информации о турпакете...</div>
          )}
        </div>
        {/* История платежей */}
        <div className="history__list">
          {sortedDates.length === 0 ? (
            <div className="history__empty">
              История платежей для этой цели пуста
            </div>
          ) : (
            sortedDates.map(date => (
              <div className="history__date-group" key={date}>
                <div className="history__date-title">{formatDate(date)}</div>
                {grouped[date].map(item => (
                  <HistoryItem key={item.id} {...item} />
                ))}
              </div>
            ))
          )}
        </div>
        {sortedDates.length > 0 && (
          <div className="history__button">
            <Link
              to={goal.relativeId && goal.relative?.iin ? `/history?iin=${goal.relative.iin}` : `/history?iin=${currentUser?.iin || ''}`}
              className="history__buttons"
            >
              Посмотреть все транзакции
            </Link>
          </div>
        )}
        <FAQ />
      </div>
    
    </div>
  );
};

export default GoalDetail; 