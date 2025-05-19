import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { goalService, type Goal } from '../../services/api';
import { cardColors } from '../../utils/goalColors';
import { SemiCircleProgress } from 'react-semicircle-progressbar';
import ProgressBar from '../ProgressBar/ProgressBar';
import LinearProgress from '../LinearProgress/LinearProgress';

import './Goals.css';

const Goals: React.FC = () => {
  const location = useLocation();
  const currentUser = useSelector((state: any) => state.user.currentUser);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [personalGoal, setPersonalGoal] = useState<Goal | null>(null);
  const [familyGoals, setFamilyGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openFaqItem, setOpenFaqItem] = useState<number | null>(null);

  useEffect(() => {
    goalService.getAllGoals().then(data => {
      const allGoals = Array.isArray(data) ? data : [];
      const personal = allGoals.find(g => !g.relativeId) || null;
      const relatives = allGoals.filter(g => g.relativeId);
      // Сортировка как в Home.tsx
      const sortedRelatives = relatives.sort((a, b) => {
        if (a.relative && b.relative) {
          const nameCompare = a.relative.fullName.localeCompare(b.relative.fullName);
          if (nameCompare !== 0) return nameCompare;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
      setGoals(allGoals);
      setPersonalGoal(personal);
      setFamilyGoals(sortedRelatives);
      setIsLoading(false);
    });
  }, []);

  const toggleFaq = (index: number) => {
    if (openFaqItem === index) {
      setOpenFaqItem(null);
    } else {
      setOpenFaqItem(index);
    }
  };

  return (
    <div className="goals">
      <div className="profile__header">
        <img src="/images/logos.svg" alt="Atlas Save" className="profile__logo" />
      </div>
      <h2 className="profile__page-title">Цели</h2>
      <div className="goals__content">
        {isLoading ? (
          <div className="goals__empty-state">Загрузка...</div>
        ) : !personalGoal && familyGoals.length === 0 ? (
          <div className="goals__empty-state">
            <h2 className="goals__empty-title">Цель не выбрана</h2>
            <p className="goals__empty-description">
              Укажите, за кого копите, тип паломничества и желаемый пакет — так вы будете видеть сумму, прогресс и путь.
            </p>
            <div className="goals__actions">
              <Link to="/family" className="goals__button goals__button--primary">
                Начать копить на близкого
              </Link>
              <Link to="/self-goal-steps" className="goals__button goals__button--secondary">
                Начать копить на себя
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Моя цель */}
            {personalGoal && (
              <div className="home__balance-section home__balance-section--active">
                <div className="home__balance-card home__balance-card--active">
                  <div className="home__balance-label-container">
                    <span className="home__balance-label--active">Ваша цель</span>
                  </div>
                  <div className="home__balance-amount">
                    <span className="home__balance-currency">₸</span> {personalGoal.currentAmount.toLocaleString()}
                  </div>
                  <div className="home__balance-dollar-amount">
                    ≈ ${Math.round(personalGoal.currentAmount / 450)}
                  </div>
                  <div className="home__goal-section">
                    <span className="home__balance-label--active">Ваша цель</span>
                    <div className="home__goal-details">
                      <img src="/images/homes.svg" alt="Goal icon" className="home__goal-icon" />
                      <span className="home__goal-name">{personalGoal.type === 'UMRAH' ? 'Умра' : 'Хадж'}</span>
                      {personalGoal.packageType && (
                        <>
                          <span className="home__goal-separator">|</span>
                          <span className="home__goal-package">{personalGoal.packageType.charAt(0).toUpperCase() + personalGoal.packageType.slice(1)}</span>
                        </>
                      )}
                      <Link to={`/goal/${personalGoal.id}`} className="home__relative-navigate">
                        <span>Подробнее</span>
                        <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 1L5.83482 5.35134C5.9231 5.43079 5.9231 5.56921 5.83482 5.64866L1 10" stroke="white" strokeLinecap="round" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                  <div className="home__progress-section">
                    <div className="home__progress-section-circle">
                      <SemiCircleProgress
                        percentage={Math.round((personalGoal.currentAmount / personalGoal.targetAmount) * 100)}
                        size={{ width: 400, height: 300 }}
                        hasBackground={true}
                        bgStrokeColor="#ffffff50"
                        strokeWidth={10}
                        fontStyle={{
                          fontSize: '24px',
                          fontFamily: 'SF Pro Display',
                          fontWeight: 'bold',
                          fill: '#fff',
                        }}
                        strokeColor="#fff"
                        strokeLinecap="round"
                      />
                    </div>
                    <div className="home__remaining-section">
                      <span className="home__remaining-label">Осталось накопить</span>
                      <div className="home__remaining-amount">
                        {(personalGoal.targetAmount - personalGoal.currentAmount).toLocaleString()} ₸
                        <span className="home__remaining-percentage">
                          ({Math.round((personalGoal.currentAmount / personalGoal.targetAmount) * 100)}%)
                        </span>
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
              </div>
            )}
            {/* Цели за кого коплю */}
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
                          <Link to={`/goal/${familyGoal.id}?colorIndex=${index}`} className="home__relative-navigate">
                            <span>Перейти</span>
                            <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 1L5.83482 5.35134C5.9231 5.43079 5.9231 5.56921 5.83482 5.64866L1 10" stroke="white" strokeLinecap="round" />
                            </svg>
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
                        <div className="home__relative-target-label">Осталось до цели</div>
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
                        <LinearProgress percentage={(familyGoal.currentAmount / familyGoal.targetAmount) * 100} />
                      </div>
                      <a
                        href="https://kaspi.kz/pay/_gate?action=service_with_subservice&service_id=3468&subservice_id=22892&region_id=18"
                        className="home__button home__button--primary white"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Пополнить счет
                        <img src="/images/kaspy.svg" alt="Add" />
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
            {/* FAQ */}
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
          </>
        )}
      </div>
    </div>
  );
};

export default Goals; 