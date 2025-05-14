import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer__links">
        <a href="/offer" className="footer__link">Договор офферты</a>
        <a href="/privacy" className="footer__link">Политика конфиденциальности</a>
      </div>
      <div className="footer__copyright">
        © Atlas Tourism 2025. Все права защищены
      </div>
    </footer>
  );
};

export default Footer; 