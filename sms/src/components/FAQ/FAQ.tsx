import React, { useState } from 'react';
import './FAQ.css';

const FAQ: React.FC = () => {
  const [openFaqItem, setOpenFaqItem] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    if (openFaqItem === index) {
      setOpenFaqItem(null);
    } else {
      setOpenFaqItem(index);
    }
  };

  return (
    <div className="profile">
        <div className="profile__header">
        <img src="/images/logos.svg" alt="Atlas Save" className="profile__logo" />
      </div>
      <h2 className="profile__page-title">Часто задаваемые вопросы</h2>


      <div className="faq__content">
        <div className="faq__list">
          <div className="faq__item">
            <h3 className="faq__question" onClick={() => toggleFaq(0)}>Что такое Atlas Save?</h3>
            {openFaqItem === 0 && (
              <p className="faq__answer">
                Atlas Save — это инновационный сервис для планомерного накопления средств на совершение Умры или Хаджа. Наша платформа помогает мусульманам осуществить одно из важнейших религиозных путешествий.
              </p>
            )}
          </div>
          <div className="faq__item">
            <h3 className="faq__question" onClick={() => toggleFaq(1)}>Это исламский банк?</h3>
            {openFaqItem === 1 && (
              <p className="faq__answer">
                Нет, Atlas Save не является банком. Мы инновационный финтех-сервис, который помогает накапливать средства на паломничество в соответствии с принципами шариата. Мы не предоставляем банковские услуги, а являемся платформой для целевых накоплений.
              </p>
            )}
          </div>
          <div className="faq__item">
            <h3 className="faq__question" onClick={() => toggleFaq(2)}>Как работает накопление?</h3>
            {openFaqItem === 2 && (
              <p className="faq__answer">
                Вы определяете цель накопления (Умра или Хадж), выбираете пакет услуг и сроки. Мы рассчитываем необходимую сумму и помогаем составить план накоплений. Вы пополняете счет в удобном для вас режиме. Система показывает прогресс и напоминает о необходимости внесения средств.
              </p>
            )}
          </div>
          <div className="faq__item">
            <h3 className="faq__question" onClick={() => toggleFaq(3)}>Деньги хранятся у вас?</h3>
            {openFaqItem === 3 && (
              <p className="faq__answer">
                Нет, все средства хранятся на специальном счете в банке-партнере под вашим именем. Мы только помогаем вам отслеживать прогресс накопления и планировать взносы.
              </p>
            )}
          </div>
          <div className="faq__item">
            <h3 className="faq__question" onClick={() => toggleFaq(4)}>Обязательно сразу выбрать тур?</h3>
            {openFaqItem === 4 && (
              <p className="faq__answer">
                Нет, не обязательно. Вы можете начать накопление, указав приблизительные сроки и пакет услуг. Конкретный тур можно будет выбрать позже, когда вы приблизитесь к целевой сумме. Мы поможем вам с выбором оптимального варианта.
              </p>
            )}
          </div>
          <div className="faq__item">
            <h3 className="faq__question" onClick={() => toggleFaq(5)}>Могу ли я копить за другого человека?</h3>
            {openFaqItem === 5 && (
              <p className="faq__answer">Да. Просто выберите "коплю за близкого" и укажите его имя, ИИН и номер. Всё просто.</p>
            )}
          </div>
          <div className="faq__item">
            <h3 className="faq__question" onClick={() => toggleFaq(6)}>Что будет после того, как накоплю?</h3>
            {openFaqItem === 6 && (
              <p className="faq__answer">
                Когда вы достигнете целевой суммы, вам будет предложено несколько вариантов туров в соответствии с вашими предпочтениями. После выбора тура наши специалисты помогут с оформлением всех необходимых документов и организацией поездки.
              </p>
            )}
          </div>
          <div className="faq__item">
            <h3 className="faq__question" onClick={() => toggleFaq(7)}>Сколько нужно вносить в месяц?</h3>
            {openFaqItem === 7 && (
              <p className="faq__answer">
                Сумма ежемесячного взноса рассчитывается индивидуально в зависимости от выбранного пакета услуг и срока накопления. Вы можете вносить средства по удобному для вас графику — ежемесячно, еженедельно или нерегулярно, главное достигнуть целевой суммы к запланированной дате.
              </p>
            )}
          </div>
          <div className="faq__item">
            <h3 className="faq__question" onClick={() => toggleFaq(8)}>Где я могу посмотреть свой прогресс?</h3>
            {openFaqItem === 8 && (
              <p className="faq__answer">
                Весь прогресс накоплений отображается в вашем личном кабинете. Вы в любой момент можете увидеть текущую сумму, процент выполнения цели, историю пополнений и расчет оставшейся суммы. Также доступна информация по накоплениям за ваших близких.
              </p>
            )}
          </div>
          <div className="faq__item">
            <h3 className="faq__question" onClick={() => toggleFaq(9)}>А если я не накоплю? Деньги вернутся?</h3>
            {openFaqItem === 9 && (
              <p className="faq__answer">
                Да, вы можете вернуть накопленные средства в любой момент. Мы не взимаем комиссию за досрочное прекращение накопления. Деньги будут возвращены на указанный вами счет в течение 3-5 рабочих дней после подачи заявки.
              </p>
            )}
          </div>
          <div className="faq__item">
            <h3 className="faq__question" onClick={() => toggleFaq(10)}>А если я потеряю телефон?</h3>
            {openFaqItem === 10 && (
              <p className="faq__answer">
                Доступ к вашему аккаунту можно восстановить через процедуру сброса пароля. Ваши данные и накопления надежно защищены и привязаны к вашему ИИН, а не к устройству. В случае утери телефона свяжитесь с нашей службой поддержки, и мы поможем восстановить доступ.
              </p>
            )}
          </div>
          <div className="faq__item">
            <h3 className="faq__question" onClick={() => toggleFaq(11)}>Это всё безопасно?</h3>
            {openFaqItem === 11 && (
              <p className="faq__answer">
                Да, мы используем современные технологии шифрования и защиты данных. Все финансовые операции проходят через лицензированных партнеров под надзором регулирующих органов. Ваши личные данные и средства надежно защищены в соответствии с законодательством.
              </p>
            )}
          </div>
          <div className="faq__item">
            <h3 className="faq__question" onClick={() => toggleFaq(12)}>Это халяль?</h3>
            {openFaqItem === 12 && (
              <p className="faq__answer">
                Да, наш сервис полностью соответствует принципам шариата. Мы не используем процентные начисления и работаем только с халяльными финансовыми инструментами.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ; 