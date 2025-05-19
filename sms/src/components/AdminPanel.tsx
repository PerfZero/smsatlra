import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import './AdminPanel.css';
import Modal from './Modal/Modal';
import './Modal/Modal.css';

interface User {
  id: string;
  name?: string;
  phone?: string;
  createdAt: string;
  role: string;
  iin?: string;
}

interface MonitorStatus {
  active: boolean;
  intervalSeconds?: number;
}

interface MonitorStatusResponse {
  success: boolean;
  status: MonitorStatus;
  message?: string;
}

interface SimpleResponse {
  success: boolean;
  message?: string;
}

interface TourPackage {
  id: number;
  name: string;
  price: number;
  description: string;
  type: 'Hajj' | 'Umrah';
  images: string[];
  duration: string;
  flight: string;
  hotelMeccaName: string;
  hotelMeccaDistance: string;
  hotelMedinaName: string;
  hotelMedinaDistance: string;
  transfer: string;
  food: string;
  additionalServices: string;
}

interface UserDetails {
  balance: { amount: number; bonusAmount: number } | null;
  goals: Array<{ id: number; type: string; targetAmount: number; currentAmount: number; monthlyTarget: number; relative?: { fullName: string; iin: string } }>;
  transactions: Array<{ id: number; transactionNumber: string; amount: number; type: string; status: string; description: string; date: string }>;
}

const TABS = [
  { label: 'Юзеры', value: 'users' },
  { label: 'Пакеты', value: 'packages' },
];

const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<'users' | 'packages'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [monitorStatus, setMonitorStatus] = useState<MonitorStatus | null>(null);
  const [interval, setInterval] = useState(5);
  const [statusLoading, setStatusLoading] = useState(false);
  const [checkStatus, setCheckStatus] = useState<string | null>(null);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [pkgForm, setPkgForm] = useState({
    name: '',
    price: 0,
    description: '',
    type: 'Hajj' as 'Hajj' | 'Umrah',
    images: [''],
    details: {
      duration: '',
      flight: '',
      hotelMecca: { name: '', distance: '' },
      hotelMedina: { name: '', distance: '' },
      transfer: '',
      food: '',
      additionalServices: ''
    }
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [pkgError, setPkgError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'packages') fetchPackages();
    // eslint-disable-next-line
  }, [tab]);

  useEffect(() => {
    if (isUserModalOpen && selectedUser) {
      setLoadingDetails(true);
      api.get<UserDetails>(`/admin/users/${selectedUser.id}/details`)
        .then(res => {
          setUserDetails(res.data);
          setLoadingDetails(false);
        })
        .catch((_err: any) => {
          setUserDetails(null);
          setLoadingDetails(false);
        });
    } else {
      setUserDetails(null);
    }
  }, [isUserModalOpen, selectedUser]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get<User[]>('/admin/users');
      setUsers(res.data || []);
    } catch (e) {
      setUsers([]);
    }
    setLoadingUsers(false);
  };

  const fetchMonitorStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await api.get<MonitorStatusResponse>('/admin/email-monitor/status');
      if (res.data.success) {
        setMonitorStatus(res.data.status);
        setInterval(res.data.status.intervalSeconds || 5);
      }
    } catch (e) {}
    setStatusLoading(false);
  };

  const fetchPackages = async () => {
    setLoadingPackages(true);
    try {
      const res = await api.get<TourPackage[]>('/packages');
      setPackages(res.data || []);
    } catch (e) {
      setPackages([]);
    }
    setLoadingPackages(false);
  };

  const handleCheckNow = async () => {
    setCheckStatus('Проверка почты...');
    try {
      const res = await api.post<SimpleResponse>('/admin/email-monitor/run-now');
      setCheckStatus(res.data.success ? 'Проверка успешно выполнена! ' + res.data.message : 'Ошибка: ' + res.data.message);
    } catch (e: any) {
      setCheckStatus('Ошибка: ' + (e?.message || ''));
    }
  };

  const handleStart = async () => {
    try {
      const res = await api.post<SimpleResponse>('/admin/email-monitor/start', { intervalSeconds: interval });
      alert(res.data.success ? 'Мониторинг запущен!' : 'Ошибка: ' + res.data.message);
      fetchMonitorStatus();
    } catch (e: any) {
      alert('Ошибка: ' + (e?.message || ''));
    }
  };

  const handleStop = async () => {
    try {
      const res = await api.post<SimpleResponse>('/admin/email-monitor/stop');
      alert(res.data.success ? 'Мониторинг остановлен!' : 'Ошибка: ' + res.data.message);
      fetchMonitorStatus();
    } catch (e: any) {
      alert('Ошибка: ' + (e?.message || ''));
    }
  };

  const handleChangeInterval = async () => {
    try {
      const res = await api.post<SimpleResponse>('/admin/email-monitor/change-interval', { intervalSeconds: interval });
      alert(res.data.success ? 'Интервал изменен!' : 'Ошибка: ' + res.data.message);
      fetchMonitorStatus();
    } catch (e: any) {
      alert('Ошибка: ' + (e?.message || ''));
    }
  };

  const handlePkgImageChange = async (idx: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setPkgForm(prev => ({
          ...prev,
          images: prev.images.map((img, i) => (i === idx ? data.url : img))
        }));
      }
    } catch (e) {
      alert('Ошибка загрузки файла');
    }
  };

  const handlePkgInput = (field: string, value: any) => {
    setPkgForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePkgDetailsInput = (field: string, value: any) => {
    setPkgForm(prev => ({ ...prev, details: { ...prev.details, [field]: value } }));
  };

  const handlePkgHotelInput = (hotel: 'hotelMecca' | 'hotelMedina', field: string, value: any) => {
    setPkgForm(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [hotel]: { ...prev.details[hotel], [field]: value }
      }
    }));
  };

  const handleAddImage = () => {
    setPkgForm(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const handleRemoveImage = (idx: number) => {
    setPkgForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const resetPkgForm = () => {
    setPkgForm({
      name: '',
      price: 0,
      description: '',
      type: 'Hajj' as 'Hajj' | 'Umrah',
      images: [''],
      details: {
        duration: '',
        flight: '',
        hotelMecca: { name: '', distance: '' },
        hotelMedina: { name: '', distance: '' },
        transfer: '',
        food: '',
        additionalServices: ''
      }
    });
    setEditId(null);
    setPkgError(null);
  };

  const validatePkg = () => {
    const f = pkgForm;
    if (!f.name || !f.price || !f.description || !f.type || !f.details.duration || !f.details.flight || !f.details.hotelMecca.name || !f.details.hotelMecca.distance || !f.details.hotelMedina.name || !f.details.hotelMedina.distance || !f.details.transfer || !f.details.food || !f.details.additionalServices || f.images.some(img => !img)) {
      setPkgError('Заполните все поля и добавьте хотя бы одну картинку');
      return false;
    }
    setPkgError(null);
    return true;
  };

  const handlePkgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePkg()) return;
    try {
      if (editId) {
        await api.put(`/packages/${editId}`, mapPkgFormToApi(pkgForm));
      } else {
        await api.post('/packages', mapPkgFormToApi(pkgForm));
      }
      resetPkgForm();
      fetchPackages();
    } catch (e: any) {
      setPkgError('Ошибка при сохранении пакета: ' + (e?.message || ''));
    }
  };

  const handlePkgEdit = (pkg: TourPackage) => {
    setEditId(pkg.id);
    setPkgForm({
      name: pkg.name,
      price: pkg.price,
      description: pkg.description,
      type: pkg.type,
      images: pkg.images,
      details: {
        duration: pkg.duration,
        flight: pkg.flight,
        hotelMecca: { name: pkg.hotelMeccaName, distance: pkg.hotelMeccaDistance },
        hotelMedina: { name: pkg.hotelMedinaName, distance: pkg.hotelMedinaDistance },
        transfer: pkg.transfer,
        food: pkg.food,
        additionalServices: pkg.additionalServices
      }
    });
    setPkgError(null);
  };

  const handlePkgDelete = async (id: number) => {
    try {
      await api.delete(`/packages/${id}`);
      if (editId === id) resetPkgForm();
      fetchPackages();
    } catch (e: any) {
      setPkgError('Ошибка при удалении пакета: ' + (e?.message || ''));
    }
  };

  function mapPkgFormToApi(form: typeof pkgForm) {
    return {
      name: form.name,
      price: form.price,
      description: form.description,
      type: form.type,
      images: form.images,
      duration: form.details.duration,
      flight: form.details.flight,
      hotelMeccaName: form.details.hotelMecca.name,
      hotelMeccaDistance: form.details.hotelMecca.distance,
      hotelMedinaName: form.details.hotelMedina.name,
      hotelMedinaDistance: form.details.hotelMedina.distance,
      transfer: form.details.transfer,
      food: form.details.food,
      additionalServices: form.details.additionalServices,
    };
  }

  const handleUserDelete = async (id: string) => {
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (e: any) {
      setPkgError('Ошибка при удалении пользователя: ' + (e?.message || ''));
    }
  };

  const handleMakeAdmin = async (id: string) => {
    try {
      await api.post(`/admin/users/${id}/make-admin`);
      fetchUsers();
    } catch (e: any) {
      setPkgError('Ошибка при назначении пользователя админом: ' + (e?.message || ''));
    }
  };

  const handleMakeUser = async (id: string) => {
    try {
      await api.post(`/admin/users/${id}/make-user`);
      fetchUsers();
    } catch (e: any) {
      setPkgError('Ошибка при смене роли пользователя: ' + (e?.message || ''));
    }
  };

  return (
    <div className="admin-panel">
      <h1 className="admin-panel-header">Админ-панель</h1>
      <div className="admin-panel-tabs">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value as 'users' | 'packages')}
            className={tab === t.value ? 'admin-btn admin-btn-primary' : 'admin-btn'}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="admin-panel-content">
          <h2>Пользователи</h2>
          <input
            type="text"
            placeholder="Поиск пользователя"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="admin-form-group"
          />
          {loadingUsers ? (
            <div>Загрузка...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Телефон</th>
                  <th>ИИН</th>
                  <th>Дата регистрации</th>
                  <th>Роль</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(user =>
                  user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                  user.phone?.toLowerCase().includes(userSearch.toLowerCase()) ||
                  user.iin?.toLowerCase().includes(userSearch.toLowerCase())
                ).map((user) => (
                  <tr key={user.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedUser(user); setIsUserModalOpen(true); }}>
                    <td>{user.id}</td>
                    <td>{user.name || '-'}</td>
                    <td>{user.phone || '-'}</td>
                    <td>{user.iin || '-'}</td>
                    <td>{new Date(user.createdAt).toLocaleString()}</td>
                    <td>{user.role}</td>
                    <td className="admin-pkg-actions" onClick={e => e.stopPropagation()}>
                      <button type="button" onClick={() => handleUserDelete(user.id)} className="admin-btn admin-btn-danger">Удалить</button>
                      {user.role === 'ADMIN' ? (
                        <button type="button" onClick={() => handleMakeUser(user.id)} className="admin-btn admin-btn-primary">Сделать обычным</button>
                      ) : (
                        <button type="button" onClick={() => handleMakeAdmin(user.id)} className="admin-btn admin-btn-primary">Назначить админом</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'packages' && (
        <div className="admin-panel-content">
          <h2>{editId ? 'Редактировать пакет' : 'Создать пакет'}</h2>
          <form onSubmit={handlePkgSubmit} className="admin-form">
            <div className="admin-form-group">
              <label>Название:</label>
              <input type="text" placeholder="Название" value={pkgForm.name} onChange={e => handlePkgInput('name', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Цена:</label>
              <input type="number" placeholder="Цена" value={pkgForm.price} onChange={e => handlePkgInput('price', Number(e.target.value))} min={0} />
            </div>
            <div className="admin-form-group">
              <label>Описание:</label>
              <textarea placeholder="Описание" value={pkgForm.description} onChange={e => handlePkgInput('description', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Тип:</label><br />
              <select value={pkgForm.type} onChange={e => handlePkgInput('type', e.target.value as 'Hajj' | 'Umrah')}>
                <option value="Hajj">Хадж</option>
                <option value="Umrah">Умра</option>
              </select>
            </div>
            <div className="admin-pkg-images">
              <label>Картинки:</label>
              {pkgForm.images.map((img, idx) => (
                <div key={idx} className="admin-pkg-image-row">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) handlePkgImageChange(idx, e.target.files[0]);
                    }}
                  />
                  {img && (
                    <img src={img} alt="preview" className="admin-pkg-image" />
                  )}
                  {pkgForm.images.length > 1 && (
                    <button type="button" onClick={() => handleRemoveImage(idx)} className="admin-btn admin-btn-danger" title="Удалить">✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="admin-pkg-add-image admin-btn admin-btn-primary" onClick={handleAddImage}>Добавить картинку</button>
            </div>
            <div className="admin-form-group">
              <label>Длительность тура:</label>
              <input type="text" placeholder="Длительность тура" value={pkgForm.details.duration} onChange={e => handlePkgDetailsInput('duration', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Рейс:</label>
              <input type="text" placeholder="Рейс" value={pkgForm.details.flight} onChange={e => handlePkgDetailsInput('flight', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Отель в Мекке:</label>
              <input type="text" placeholder="Отель в Мекке" value={pkgForm.details.hotelMecca.name} onChange={e => handlePkgHotelInput('hotelMecca', 'name', e.target.value)} className="admin-form-group" style={{ width: '49%', marginRight: '2%' }} />
              <input type="text" placeholder="До Каабы (Мекка)" value={pkgForm.details.hotelMecca.distance} onChange={e => handlePkgHotelInput('hotelMecca', 'distance', e.target.value)} className="admin-form-group" style={{ width: '49%' }} />
            </div>
            <div className="admin-form-group">
              <label>Отель в Медине:</label>
              <input type="text" placeholder="Отель в Медине" value={pkgForm.details.hotelMedina.name} onChange={e => handlePkgHotelInput('hotelMedina', 'name', e.target.value)} className="admin-form-group" style={{ width: '49%', marginRight: '2%' }} />
              <input type="text" placeholder="До мечети (Медина)" value={pkgForm.details.hotelMedina.distance} onChange={e => handlePkgHotelInput('hotelMedina', 'distance', e.target.value)} className="admin-form-group" style={{ width: '49%' }} />
            </div>
            <div className="admin-form-group">
              <label>Трансфер:</label>
              <input type="text" placeholder="Трансфер" value={pkgForm.details.transfer} onChange={e => handlePkgDetailsInput('transfer', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Питание:</label>
              <input type="text" placeholder="Питание" value={pkgForm.details.food} onChange={e => handlePkgDetailsInput('food', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Доп. услуги:</label>
              <input type="text" placeholder="Доп. услуги" value={pkgForm.details.additionalServices} onChange={e => handlePkgDetailsInput('additionalServices', e.target.value)} />
            </div>
            {pkgError && <div className="admin-form-group admin-error">{pkgError}</div>}
            <button type="submit" className="admin-btn admin-btn-primary">{editId ? 'Сохранить' : 'Создать пакет'}</button>
            {editId && <button type="button" className="admin-btn admin-btn-danger admin-pkg-cancel" onClick={resetPkgForm}>Отмена</button>}
          </form>
          <h3>Список пакетов</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Тип</th>
                <th>Цена</th>
                <th>Длительность</th>
                <th>Отель Мекка</th>
                <th>Отель Медина</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(pkg => (
                <tr key={pkg.id}>
                  <td>{pkg.name}</td>
                  <td>{pkg.type}</td>
                  <td>{pkg.price.toLocaleString()}</td>
                  <td>{pkg.duration}</td>
                  <td>{pkg.hotelMeccaName}</td>
                  <td>{pkg.hotelMedinaName}</td>
                  <td className="admin-pkg-actions">
                    <button type="button" onClick={() => handlePkgEdit(pkg)} className="admin-btn admin-btn-primary">Редактировать</button>
                    <button type="button" onClick={() => handlePkgDelete(pkg.id)} className="admin-btn admin-btn-danger">Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)}>
        {selectedUser && (
          <div className="admin-user-modal-wide">
            <h2>Пользователь: {selectedUser.name || selectedUser.phone || selectedUser.iin}</h2>
            <div className="admin-user-info">
              <div className="admin-user-info-row"><span className="admin-user-info-label">ID:</span> <span className="admin-user-info-value">{selectedUser.id}</span></div>
              <div className="admin-user-info-row"><span className="admin-user-info-label">Телефон:</span> <span className="admin-user-info-value">{selectedUser.phone}</span></div>
              <div className="admin-user-info-row"><span className="admin-user-info-label">ИИН:</span> <span className="admin-user-info-value">{selectedUser.iin}</span></div>
              <div className="admin-user-info-row"><span className="admin-user-info-label">Роль:</span> <span className="admin-user-info-value">{selectedUser.role}</span></div>
              <div className="admin-user-info-row"><span className="admin-user-info-label">Дата регистрации:</span> <span className="admin-user-info-value">{new Date(selectedUser.createdAt).toLocaleString()}</span></div>
            </div>
            <hr />
            {loadingDetails ? <div>Загрузка...</div> : userDetails && (
              <>
                <div className="admin-user-section">
                  <div className="admin-user-section-title">Баланс</div>
                  <div className="admin-user-info">
                    <div className="admin-user-info-row"><span className="admin-user-info-label">Основной:</span> <span className="admin-user-info-value">{userDetails.balance?.amount ?? 0} ₸</span></div>
                    <div className="admin-user-info-row"><span className="admin-user-info-label">Бонусный:</span> <span className="admin-user-info-value">{userDetails.balance?.bonusAmount ?? 0} ₸</span></div>
                  </div>
                </div>
                <div className="admin-user-section">
                  <div className="admin-user-section-title">Цели</div>
                  {userDetails.goals.length === 0 ? <div>Нет целей</div> : (
                    <ul>
                      {userDetails.goals.map(goal => (
                        <li key={goal.id}>
                          {goal.type} — {goal.currentAmount} / {goal.targetAmount} ₸
                          {goal.relative && (
                            <span> (Родственник: {goal.relative.fullName}, ИИН: {goal.relative.iin})</span>
                          )}
                          <div>Ежемесячно: {goal.monthlyTarget} ₸</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="admin-user-section">
                  <div className="admin-user-section-title">История пополнений</div>
                  {userDetails.transactions.length === 0 ? <div>Нет транзакций</div> : (
                    <div className="admin-user-history-table-wrap">
                      <table className="admin-user-history-table">
                        <thead>
                          <tr>
                            <th style={{width: '90px'}}>№</th>
                            <th style={{width: '100px'}}>Сумма</th>
                            <th style={{width: '100px'}}>Тип</th>
                            <th style={{width: '100px'}}>Статус</th>
                            <th style={{minWidth: '180px'}}>Описание</th>
                            <th style={{width: '110px'}}>Дата</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userDetails.transactions.map((tx, idx) => (
                            <tr key={tx.id} className={idx % 2 === 0 ? 'zebra' : ''}>
                              <td style={{textAlign: 'center'}}>{tx.transactionNumber}</td>
                              <td style={{textAlign: 'center'}}>{tx.amount}</td>
                              <td style={{textAlign: 'center'}}>{tx.type}</td>
                              <td style={{textAlign: 'center'}}>{tx.status}</td>
                              <td>{tx.description}</td>
                              <td style={{textAlign: 'center'}}>{tx.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminPanel; 