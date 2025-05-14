import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import { logout } from '../../store/slices/userSlice'; 
import './Profile.css';

const Profile: React.FC = () => {
  const { currentUser } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/onboarding');
  };

  // Заглушка для имени пользователя, если оно не предоставлено
  const userName = currentUser?.name || 'Нұралы Жеңісбекұлы'; 
  const userPhoneNumber = currentUser?.phoneNumber || '+7 777 253 9319';
  const userIin = currentUser?.iin || '980919300267';

  return (
    <div className="profile">
      <div className="profile__header">
        <img src="/images/logos.svg" alt="Atlas Save" className="profile__logo" />
      </div>
      <h2 className="profile__page-title">Аккаунт Atlas</h2>

      <div className="profile__content">
        <div className="profile__avatar-section">
          <div className="profile__avatar">
            
          </div>
          <button className="profile__edit-avatar">Изменить</button>
        </div>

        <div className="profile__section">
          <h3 className="profile__section-title">ЛИЧНАЯ ИНФОРМАЦИЯ</h3>
          <div className="profile__info-card">
            <div className="profile__info-item">
              <span className="profile__info-label">Имя</span>
              <span className="profile__info-value">{userName}</span>
            </div>
            <div className="profile__info-item">
              <span className="profile__info-label">Номер телефона</span>
              <span className="profile__info-value profile__info-value--link">{userPhoneNumber}</span>
            </div>
            <div className="profile__info-item">
              <span className="profile__info-label">ИИН</span>
              <span className="profile__info-value">{userIin}</span>
            </div>
          </div>
        </div>

        <div className="profile__section">
          <h3 className="profile__section-title">ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ</h3>
          <div className="profile__links-card">
            <button className="profile__link-item" onClick={() => navigate('/')}>
              <span>О сервисе</span>
              <img src="/images/arrow.svg" alt=">" />
            </button>
            <button className="profile__link-item" onClick={() => navigate('/faq')}>
              <span>Часто задаваемые вопросы</span>
              <img src="/images/arrow.svg" alt=">" />
            </button>
            <button className="profile__link-item" onClick={() => navigate('/contacts')}>
              <span>Контакты поддержки</span>
              <img src="/images/arrow.svg" alt=">" />
            </button>
          </div>
        </div>

        <button className="profile__logout-button" onClick={handleLogout}>
          Выйти
        </button>
      </div>
    </div>
  );
};

export default Profile; 