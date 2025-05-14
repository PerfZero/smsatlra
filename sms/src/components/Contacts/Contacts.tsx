import React from 'react';
import './Contacts.css';

const Contacts: React.FC = () => {
  const phoneNumber = '+77021510000';
  const whatsappLink = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`;

  return (
    <div className="profile">
    <div className="profile__header">
    <img src="/images/logos.svg" alt="Atlas Save" className="profile__logo" />
  </div>
  <h2 className="profile__page-title">Контакты поддержки</h2>
      <div className="contacts__content">
        <div className="contacts__section">
          <h3 className="contacts__section-title">Свяжитесь с нами. Мы Вам обязательно поможем.</h3>
          <h3 className="contacts__section-titles">Общая информация</h3> 

          <div className="contacts__info-card">
            <div className="contacts__info-item">
              <span className="contacts__info-label">Адрес</span>
              <span className="contacts__info-value">г. Алматы, пр. Сейфуллина, 533 блок 2</span>
            </div>
            <div className="contacts__info-item">
              <span className="contacts__info-label">Сайт</span>
              <a href="https://www.atlas.kz" target="_blank" rel="noopener noreferrer" className="contacts__info-value contacts__info-value--link">
                www.atlas.kz
              </a>
            </div>
            <div className="contacts__info-item">
              <span className="contacts__info-label">Instagram</span>
              <a href="https://www.instagram.com/atlastourism" target="_blank" rel="noopener noreferrer" className="contacts__info-value contacts__info-value--link">
                @atlastourism
              </a>
            </div>
            <div className="contacts__info-item">
              <span className="contacts__info-label">График работы</span>
              <span className="contacts__info-value">Ежедневно 10:00 - 19:00</span>
            </div>
            <div className="contacts__info-item">
              <span className="contacts__info-label">Call center</span>
              <a href="tel:+77021510000" className="contacts__info-value contacts__info-value--link">
                +7 702 151 0000
              </a>
            </div>
          </div>
        </div>

        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="contacts__whatsapp-button">
         
          Написать на WhatsApp
        </a>
      </div>
    </div>
  );
};

export default Contacts; 