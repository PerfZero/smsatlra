import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, Link } from 'react-router-dom';
import { balanceService, goalService, type Goal, notificationService } from '../../services/api';
import { SemiCircleProgress } from 'react-semicircle-progressbar';
import { RelativesList } from '../Relatives/RelativesList';
import LinearProgress from '../LinearProgress/LinearProgress';
import DepositModal from '../DepositModal/DepositModal';
import './Home.css';
// Assuming you have a progress bar component or will create one
// import ProgressBar from '../ProgressBar/ProgressBar'; 

interface Balance {
  amount: number;
  bonusAmount: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description: string;
  iin: string;
  name: string;
  date: string;
  time: string;
  payerName: string;
  payerIin: string;
  paymentId: string;
  recipientIin: string;
  phoneNumber: string;
  goalId?: number;
  goal?: {
    currentAmount: number;
    targetAmount: number;
    relativeName: string | null;
    relativeIin: string | null;
  };
  bonus?: number;
  isFirstDeposit?: boolean;
}

const Home: React.FC = () => {
  const location = useLocation();
  const currentUser = useSelector((state: any) => state.user.currentUser);
  const [showBalance, setShowBalance] = useState(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [familyGoals, setFamilyGoals] = useState<Goal[]>([]);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [openFaqItem, setOpenFaqItem] = useState<number | null>(null);

  const cardColors = [
    '#FF3B30', '#FF9500', '#FFCC00', '#00C7BE', '#30B0C7',
    '#32ADE6', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E'
  ];

  const fetchData = async () => {
    try {
      const [balanceData, goalsData] = await Promise.all([
        balanceService.getBalance(),
        goalService.getAllGoals()
      ]);
      
      setBalance(balanceData as Balance);
      // Разделяем цели на личные и семейные
      const personalGoal = goalsData.find(g => !g.relativeId);
      const relativesGoals = goalsData.filter(g => g.relativeId);
      
      // Сортируем цели родственников по имени и дате создания
      const sortedRelativesGoals = relativesGoals.sort((a, b) => {
        if (a.relative && b.relative) {
          // Сначала сортируем по имени
          const nameCompare = a.relative.fullName.localeCompare(b.relative.fullName);
          if (nameCompare !== 0) return nameCompare;
          // Если имена одинаковые, сортируем по дате создания (сначала новые)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
      
      setGoal(personalGoal || null);
      setFamilyGoals(sortedRelativesGoals);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Проверяем наличие параметра deposit в URL
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('deposit') === 'true') {
      setIsDepositModalOpen(true);
      // Очищаем URL от параметра
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location]);

  // Подписка на уведомления
  useEffect(() => {
    // Только если пользователь авторизован
    if (!currentUser) return;
    
    // Подписываемся на уведомления о транзакциях
    const subscription = notificationService.subscribe((data) => {
      if (data.type === 'TRANSACTION') {
        // Получили уведомление о новой транзакции
        console.log('Получено уведомление о транзакции:', data.transaction);
        setLastTransaction(data.transaction);
        // Обновляем данные о балансе
        fetchData();
      }
    });
    
    // Отписываемся при размонтировании компонента
    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser]);

  const toggleBalance = () => setShowBalance(!showBalance);

  const currentBalance = balance?.amount || 0;
  const currentBonus = balance?.bonusAmount || 0;
  const dollarAmount = (currentBalance / 450).toFixed(2); // Примерный курс тенге к доллару

  // Вычисляем прогресс и оставшуюся сумму
  const progressPercentage = goal ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remainingAmount = goal ? goal.targetAmount - goal.currentAmount : 0;

  const handleDepositClick = (goalId?: number) => {
    setSelectedGoalId(goalId || null);
    setLastTransaction(null);
    setIsDepositModalOpen(true);
  };

  const handleDepositClose = (transaction?: Transaction) => {
    setIsDepositModalOpen(false);
    setSelectedGoalId(null);
    if (transaction) {
      setLastTransaction(transaction);
    }
    fetchData();
  };

  const handleCloseTransaction = () => {
    setLastTransaction(null);
  };

  const toggleFaq = (index: number) => {
    if (openFaqItem === index) {
      setOpenFaqItem(null);
    } else {
      setOpenFaqItem(index);
    }
  };

  return (
    <div className="home">
      <div className="home__header">
        <img src="/images/logos.svg" alt="Atlas Save" className="home__logo" />
      </div>
      
      <div className="home__content">
        {currentBalance > 0 ? (
          // --- Блок когда есть баланс (как на скрине) ---
          <div className="home__balance-section home__balance-section--active">
             <div className="home__greeting">
               Ассаляму Алейкум, <br />
               <strong>{currentUser?.name || 'Пользователь'}!</strong> 
             </div>
             
             <div className={`home__balance-card home__balance-card--active ${lastTransaction ? 'home__balance-card--success' : ''}`}>
               {lastTransaction ? (
                 <div className="home__transaction-success">
                   <div className="home__transaction-header">
                    <img src="/dones.svg" alt="Успешное пополнение" />
                     <h3 className="home__transaction-title">Успешное <br /> пополнение!</h3>
                     <button className="home__balance-toggle" onClick={handleCloseTransaction}>
                       <img src="/close.svg" alt="Закрыть" />
                     </button>
                   </div>
                   <p className="home__transaction-subtitle">
                     {lastTransaction.goal 
                       ? `Вы пополнили счёт для ${lastTransaction.goal.relativeName}`
                       : 'Вы пополнили свой счёт'}
                   </p>
                   <div className="home__transaction-amount">+ {lastTransaction.amount.toLocaleString()} ₸</div>
                   
                   {(lastTransaction.bonus ?? 0) > 0 && lastTransaction.isFirstDeposit && (
                     <div className="home__transaction-bonus">
                       <div className="home__transaction-bonus-header">
                         <img src="/images/gift.svg" alt="Бонус" />
                         <h4>Бонус за первое пополнение!</h4>
                       </div>
                       <div className="home__transaction-bonus-amount">+ {(lastTransaction.bonus ?? 0).toLocaleString()} Б</div>
                     </div>
                   )}
                   <div className="home__transaction-details">
                     <div className="home__transaction-row">
                       <span className="home__transaction-label">ИИН плательщика</span>
                       <span className="home__transaction-value">{lastTransaction.iin || currentUser?.iin || 'Не указан'}</span>
                     </div>
                     <div className="home__transaction-row">
                       <span className="home__transaction-label">ФИО плательщика</span>
                       <span className="home__transaction-value">{lastTransaction.name || currentUser?.name || 'Не указано'}</span>
                     </div>
                     <div className="home__transaction-row">
                       <span className="home__transaction-label">№ транзакции</span>
                       <span className="home__transaction-value">{lastTransaction.id}</span>
                     </div>
                     <div className="home__transaction-row">
                       <span className="home__transaction-label">Дата и время</span>
                       <span className="home__transaction-value">
                         {new Date(lastTransaction.date).toLocaleString('ru-RU')}
                       </span>
                     </div>
                   </div>
                 </div>
               ) : (
                 <>
                   <div className="home__balance-label-container">
                     <span className="home__balance-label--active">Ваш баланс</span>
                     
                     <button className="home__balance-toggle" onClick={toggleBalance}>
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

                   {balance && balance.amount > 0 && !goal && (
                     <div className="home__goal-wrapper">
                       <div className="home__goal-prompt">
                        <img className="home__goal-prompt-icon" src="/znak.svg" alt="" />
                         <div className="home__goal-prompt-text">
                           Вы начали копить деньги, но не выбрали цель - Умра или Хадж.
                           <br /><br />
                           <span className="home__goal-prompt-text-small">Укажите цель — Вы будете знать, сколько нужно накопить, свой прогресс и в нужный момент получите напоминание, чтобы не упустить важные шаги.</span>
                         </div>
                       </div>
                       <div className="home__goal-prompt-button">
                         <button className="home__button home__button--primary" onClick={() => window.location.href = '/self-goal-steps'}>
                           Указать цель накопления
                         </button>
                       </div>
                     </div>
                   )}

                   {goal && (
                     <>
                       <div className="home__goal-section">
                         <span className="home__balance-label--active">Ваша цель</span>
                         <div className="home__goal-details">
                           <img src="/images/homes.svg" alt="Goal icon" className="home__goal-icon" />
                           <span className="home__goal-name">{goal.type === 'UMRAH' ? 'Умра' : 'Хадж'}</span>
                           {goal.packageType && (
                             <>
                               <span className="home__goal-separator">|</span>
                               <span className="home__goal-package">{goal.packageType.charAt(0).toUpperCase() + goal.packageType.slice(1)}</span>
                             </>
                           )}
                           <Link to={`/goal/${goal.id}`} className="home__relative-navigate">
                            <span>Подробнее</span>
                            <img src="/images/arrow-right.svg" alt=">" />
                           </Link>
                         </div>
                       </div>

                       <div className="home__progress-section">
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
                        <div className="home__remaining-section">
                          <span className="home__remaining-label">Осталось накопить</span>
                          <div className="home__remaining-amount">
                            {remainingAmount.toLocaleString()} ₸
                            <span className="home__remaining-percentage">
                              из {goal?.targetAmount.toLocaleString()} ₸
                            </span>
                          </div>
                        </div>
                      </div>
                     </>
                   )}
                 </>
               )}
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
        ) : (
          // --- Блок когда баланс пустой ---
          <div className="home__balance-section">
            <h2 className="home__title">Ваш баланс пока пустой.</h2>
            <p className="home__subtitle">Начните копить деньги на Умру или Хадж уже сегодня!</p>
            
            <div className="home__balance-card">
              {/* Содержимое карточки для пустого баланса остается как было, */}
              {/* или можно упростить, если нужно */}
               <div className="home__balance-header">
                 <span>Текущий баланс</span>
                 {/* Кнопка скрытия тут не нужна, если баланс 0 */}
               </div>
               <div className="home__balance-amount">
                 0 <span className="home__balance-dollar">₸</span>
               </div>
               <div className="home__balance-dollar-amount">
                 ~ $0
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
        )}

        {/* --- Раздел "Мои близкие" --- */}
        <div className="home__section">
          <h2 className="home__section-title">Ваши родные и близкие</h2>
          {familyGoals.length > 0 ? (
            <div className="home__relatives-wrapper">
              {familyGoals.map((familyGoal, index) => (
                <div 
                  key={familyGoal.id} 
                  className="home__relatives-card"
                  style={{ backgroundColor: cardColors[index % cardColors.length] }}
                >
                  <div className="home__relative-header">
                    <div className="home__relative-relation">
                      {familyGoal.type === 'UMRAH' ? (
                        <img src="/images/umra.svg" alt="Умра" className="home__relative-icon" />
                      ) : (
                        <img src="/images/hadj.svg" alt="Хадж" className="home__relative-icon" />
                      )}
                      <span className="home__relative-separator">|</span>
                      {familyGoal.relative?.fullName}, на {familyGoal.type === 'UMRAH' ? 'Умру' : 'Хадж'}
                      
                      <Link to={`/goal/${familyGoal.id}`} className="home__relative-navigate">
                        <span>Перейти</span>
                        <img src="/images/arrow-right.svg" alt=">" />
                      </Link>
                    </div>
                  </div>
                  
                  <div className="home__relative-balance">
                    <div className="home__relative-balance-label">Баланс</div>
                    <div className="home__relative-amount">
                      <span className="home__relative-currency">₸</span> {familyGoal.currentAmount.toLocaleString()}
                    </div>
                    <div className="home__relative-dollar">
                      ~ ${Math.round(familyGoal.currentAmount / 450).toLocaleString()}
                    </div>
                  </div>

                  

                  <div className="home__relative-target">
                    <div className="home__relative-target-label">
                      Осталось до цели
                    </div>
                    <div className="home__relative-target-amount">
                      ₸ {(familyGoal.targetAmount - familyGoal.currentAmount).toLocaleString()}
                    </div>
                    <div className="home__relative-target-dollar">
                      ~ ${Math.round((familyGoal.targetAmount - familyGoal.currentAmount) / 450).toLocaleString()}
                    </div>
                  </div>
                  <div className="home__relative-progress">
                    <div className="home__relative-percentage">
                      {Math.round((familyGoal.currentAmount / familyGoal.targetAmount) * 100)}%
                    </div>
                    <LinearProgress 
                      percentage={(familyGoal.currentAmount / familyGoal.targetAmount) * 100} 
                    />
                  </div>

                  <a
                    href="https://kaspi.kz/pay/_gate?action=service_with_subservice&service_id=3468&subservice_id=22892&region_id=18"
                    className="home__button home__button--primary white"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Пополнить счет
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5.17288 21.7672C6.4252 16.572 4.93858 16.3943 4.93858 13.8735C4.93858 13.0332 5.6011 11.0214 5.69805 10.0438C5.92428 7.79773 5.36679 8.39561 7.00693 6.73124L7.10388 4.42051C7.92799 3.62872 8.34004 2.91772 9.34998 3.16819C9.96402 4.99415 8.80057 4.42051 8.68746 6.55349C9.37422 7.46647 9.83475 7.55535 10.3518 8.70263C11.0063 10.1569 10.5377 10.1408 11.7738 11.3608C13.5917 11.5709 14.6905 11.5789 15.9913 10.2701C16.1287 8.8723 15.3207 8.9935 16.1448 7.70886C16.7104 6.82819 17.2679 6.3515 18.3263 6.707C18.6737 8.08051 17.1144 8.3633 17.5991 9.89032C19.6917 10.1004 20.1765 7.21601 21.7762 7.07058C21.7762 10.1489 18.5606 10.5528 18.4879 13.0575C18.4394 14.6249 19.8291 18.9393 21.2349 19.8604C22.4711 17.9617 23.8042 15.8934 23.9577 13.5988C25.0323 -2.05924 4.31646 -4.91129 0.38175 8.79959C0.179763 9.5025 0.0585705 10.2135 0.00201416 10.9245V12.7424C0.349432 17.2507 3.12877 21.2097 5.17288 21.7672Z" fill="#F14635" />
  <path d="M11.2325 23.8681C16.8315 24.5306 16.2417 22.8016 15.1349 16.4269C14.6986 13.9142 14.1896 12.5891 11.2082 12.8234C9.34994 15.0291 10.2872 19.3274 10.3518 21.2099C10.4003 22.6966 10.1498 22.7935 11.2325 23.8681ZM17.6718 22.333C18.609 22.2199 18.7706 22.026 19.5301 21.42C19.6513 20.1354 18.7706 18.067 17.3971 17.655C16.7507 18.8992 16.9366 21.113 17.6718 22.333ZM8.44504 23.3995C8.44504 21.8321 8.63895 18.5922 7.831 17.4772C6.75643 17.7923 7.08769 18.7134 7.07961 20.6767C7.07153 22.1148 6.80491 23.2541 8.44504 23.3995Z" fill="#F14635" />
</svg>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="home__relatives-card emds">
              <div className="home__relatives-empty">
                <p>Вы пока никого не добавили...</p>
                <div className="home__balance-amounts">0%</div>
                <LinearProgress percentage={0} />
              </div>
            </div>
          )}
          
          <a
            href="https://kaspi.kz/pay/_gate?action=service_with_subservice&service_id=3468&subservice_id=22892&region_id=18"
            className="home__button home__button--secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Начать копить за близкого человека
          </a>
        </div>

        {/* --- Раздел "Часто задаваемые вопросы" --- */}
        <div className="home__section">
          <h2 className="home__section-title">Часто задаваемые вопросы</h2>
          <div className="home__faq">
            <div className="home__faq-item">
              <h3 className="home__faq-question" onClick={() => toggleFaq(0)}>Что такое Atlas Save?</h3>
              {openFaqItem === 0 && (
                <p className="home__faq-answer">
                  Atlas Save — это инновационный сервис для планомерного накопления средств на совершение Умры или Хаджа. Наша платформа помогает мусульманам осуществить одно из важнейших религиозных путешествий.
                </p>
              )}
            </div>
            <div className="home__faq-item">
              <h3 className="home__faq-question" onClick={() => toggleFaq(1)}>Это исламский банк?</h3>
              {openFaqItem === 1 && (
                <p className="home__faq-answer">
                  Нет, Atlas Save не является банком. Мы инновационный финтех-сервис, который помогает накапливать средства на паломничество в соответствии с принципами шариата. Мы не предоставляем банковские услуги, а являемся платформой для целевых накоплений.
                </p>
              )}
            </div>
            <div className="home__faq-item">
              <h3 className="home__faq-question" onClick={() => toggleFaq(2)}>Как работает накопление?</h3>
              {openFaqItem === 2 && (
                <p className="home__faq-answer">
                  Вы определяете цель накопления (Умра или Хадж), выбираете пакет услуг и сроки. Мы рассчитываем необходимую сумму и помогаем составить план накоплений. Вы пополняете счет в удобном для вас режиме. Система показывает прогресс и напоминает о необходимости внесения средств.
                </p>
              )}
            </div>
            <div className="home__faq-item">
              <h3 className="home__faq-question" onClick={() => toggleFaq(3)}>Деньги хранятся у вас?</h3>
              {openFaqItem === 3 && (
                <p className="home__faq-answer">
                  Ваши средства хранятся на специальных счетах нашего партнера — лицензированной финансовой организации, которая обеспечивает безопасность и сохранность ваших денег в соответствии с законодательством Казахстана и принципами шариата.
                </p>
              )}
            </div>
            <div className="home__faq-item">
              <h3 className="home__faq-question" onClick={() => toggleFaq(4)}>Обязательно сразу выбрать тур?</h3>
              {openFaqItem === 4 && (
                <p className="home__faq-answer">
                  Нет, не обязательно. Вы можете начать накопление, указав приблизительные сроки и пакет услуг. Конкретный тур можно будет выбрать позже, когда вы приблизитесь к целевой сумме. Мы поможем вам с выбором оптимального варианта.
                </p>
              )}
            </div>
            <div className="home__faq-item">
              <h3 className="home__faq-question" onClick={() => toggleFaq(5)}>Могу ли я копить за другого человека?</h3>
              {openFaqItem === 5 && (
                <p className="home__faq-answer">Да. Просто выберите "коплю за близкого" и укажите его имя, ИИН и номер. Всё просто.</p>
              )}
            </div>
            <div className="home__faq-item">
              <h3 className="home__faq-question" onClick={() => toggleFaq(6)}>Что будет после того, как накоплю?</h3>
              {openFaqItem === 6 && (
                <p className="home__faq-answer">
                  Когда вы достигнете целевой суммы, вам будет предложено несколько вариантов туров в соответствии с вашими предпочтениями. После выбора тура наши специалисты помогут с оформлением всех необходимых документов и организацией поездки.
                </p>
              )}
            </div>
            <div className="home__faq-item">
              <h3 className="home__faq-question" onClick={() => toggleFaq(7)}>Сколько нужно вносить в месяц?</h3>
              {openFaqItem === 7 && (
                <p className="home__faq-answer">
                  Сумма ежемесячного взноса рассчитывается индивидуально в зависимости от выбранного пакета услуг и срока накопления. Вы можете вносить средства по удобному для вас графику — ежемесячно, еженедельно или нерегулярно, главное достигнуть целевой суммы к запланированной дате.
                </p>
              )}
            </div>
            <div className="home__faq-item">
              <h3 className="home__faq-question" onClick={() => toggleFaq(8)}>Где я могу посмотреть свой прогресс?</h3>
              {openFaqItem === 8 && (
                <p className="home__faq-answer">
                  Весь прогресс накоплений отображается в вашем личном кабинете. Вы в любой момент можете увидеть текущую сумму, процент выполнения цели, историю пополнений и расчет оставшейся суммы. Также доступна информация по накоплениям за ваших близких.
                </p>
              )}
            </div>
            <div className="home__faq-item">
              <h3 className="home__faq-question" onClick={() => toggleFaq(9)}>А если я не накоплю? Деньги вернутся?</h3>
              {openFaqItem === 9 && (
                <p className="home__faq-answer">
                  Да, вы можете вернуть накопленные средства в любой момент. Мы не взимаем комиссию за досрочное прекращение накопления. Деньги будут возвращены на указанный вами счет в течение 3-5 рабочих дней после подачи заявки.
                </p>
              )}
            </div>
            <div className="home__faq-item">
              <h3 className="home__faq-question" onClick={() => toggleFaq(10)}>А если я потеряю телефон?</h3>
              {openFaqItem === 10 && (
                <p className="home__faq-answer">
                  Доступ к вашему аккаунту можно восстановить через процедуру сброса пароля. Ваши данные и накопления надежно защищены и привязаны к вашему ИИН, а не к устройству. В случае утери телефона свяжитесь с нашей службой поддержки, и мы поможем восстановить доступ.
                </p>
              )}
            </div>
            <div className="home__faq-item">
              <h3 className="home__faq-question" onClick={() => toggleFaq(11)}>Это всё безопасно?</h3>
              {openFaqItem === 11 && (
                <p className="home__faq-answer">
                  Да, мы используем современные технологии шифрования и защиты данных. Все финансовые операции проходят через лицензированных партнеров под надзором регулирующих органов. Ваши личные данные и средства надежно защищены в соответствии с законодательством.
                </p>
              )}
            </div>
            <div className="home__faq-item">
              <h3 className="home__faq-question" onClick={() => toggleFaq(12)}>Это халяль?</h3>
              {openFaqItem === 12 && (
                <p className="home__faq-answer">
                  Да, наш сервис полностью соответствует принципам шариата. Мы не взимаем и не выплачиваем процентов (риба), не инвестируем в запрещенные исламом сферы. Наша деятельность регулярно проверяется и одобряется шариатским советом, который следит за соблюдением исламских принципов.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <DepositModal 
        isOpen={isDepositModalOpen}
        onClose={handleDepositClose}
        goalId={selectedGoalId}
      />
    </div>
  );
};

export default Home; 