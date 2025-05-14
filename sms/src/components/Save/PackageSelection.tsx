import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { selectPackage } from '../../store/slices/userSlice';
import { TourPackage } from '../../types';
import './PackageSelection.css';

const SAMPLE_PACKAGES: TourPackage[] = [
  {
    id: '1',
    name: 'Халық',
    price: 2500000,
    description: 'Базовый пакет для Хаджа',
    type: 'Hajj',
    hotel: 'Standard Hotel',
  },
  {
    id: '2',
    name: 'Courtyard',
    price: 3500000,
    description: 'Комфортный пакет для Хаджа',
    type: 'Hajj',
    hotel: 'Courtyard by Marriott',
  },
  {
    id: '3',
    name: 'Address',
    price: 4500000,
    description: 'Премиум пакет для Хаджа',
    type: 'Hajj',
    hotel: 'Address Hotel',
  },
  {
    id: '4',
    name: 'Swissotel',
    price: 5500000,
    description: 'VIP пакет для Хаджа',
    type: 'Hajj',
    hotel: 'Swissotel',
  },
];

const PackageSelection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useSelector((state: RootState) => state.user);

  const handleSelectPackage = (pkg: TourPackage) => {
    dispatch(selectPackage(pkg));
  };

  return (
    <div className="package-selection">
      <h1 className="package-selection__title">
        Выберите пакет
      </h1>
      <div className="package-selection__grid">
        {SAMPLE_PACKAGES.map((pkg) => (
          <div key={pkg.id} className="package-selection__card">
            {currentUser?.selectedPackage?.id === pkg.id && (
              <div className="package-selection__badge">
                Выбрано
              </div>
            )}
            <div className="package-selection__card-content">
              <h2 className="package-selection__package-name">
                {pkg.name}
              </h2>
              <p className="package-selection__package-price">
                {pkg.price.toLocaleString()} ₸
              </p>
              <p className="package-selection__package-description">
                {pkg.description}
              </p>
              <p className="package-selection__package-hotel">
                Отель: {pkg.hotel}
              </p>
            </div>
            <div className="package-selection__card-actions">
              <button
                className={`package-selection__button ${
                  currentUser?.selectedPackage?.id === pkg.id
                    ? 'package-selection__button--selected'
                    : ''
                }`}
                onClick={() => handleSelectPackage(pkg)}
              >
                {currentUser?.selectedPackage?.id === pkg.id
                  ? 'Выбрано'
                  : 'Выбрать пакет'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackageSelection; 