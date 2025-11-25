import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { api } from './api';

function parseManualArray(input) {
  return input
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((value) => {
      const asNumber = Number(value);
      if (!Number.isFinite(asNumber)) {
        throw new Error(`"${value}" is not a valid number`);
      }
      return Math.trunc(asNumber);
    });
}

function generateRandomArray({ length, min, max }) {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  const result = [];
  for (let i = 0; i < length; i += 1) {
    result.push(Math.floor(Math.random() * (upper - lower + 1)) + lower);
  }
  return result;
}

function Notification({ status }) {
  if (!status) return null;
  return (
    <div className={`notification ${status.type}`}>
      <strong>{status.type === 'error' ? 'Ошибка:' : 'Статус:'}</strong> {status.message}
    </div>
  );
}

function SavedArrays({ items, isLoading, onRefresh, onDelete }) {
  return (
    <section className="card">
      <div className="section-header">
        <h2>Сохранённые массивы</h2>
        <button type="button" onClick={onRefresh} className="secondary">
          Обновить
        </button>
      </div>
      {isLoading ? (
        <p>Загрузка...</p>
      ) : items.length === 0 ? (
        <p>Сохранённых массивов пока нет.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Метка</th>
                <th>Оригинал</th>
                <th>Отсортирован</th>
                <th>Сохранено</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.label || 'Без названия'}</td>
                  <td>{item.save_original ? item.original_data.join(', ') : '—'}</td>
                  <td>{item.save_sorted ? item.sorted_data.join(', ') : '—'}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                  <td>
                    <button type="button" className="link" onClick={() => onDelete(item.id)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ArrayWorkbench({
  disabled,
  processArray,
  lastProcessing,
}) {
  const [mode, setMode] = useState('manual');
  const [manualInput, setManualInput] = useState('9, 3, 7, 1, 8');
  const [randomOptions, setRandomOptions] = useState({ length: 10, min: 0, max: 100 });
  const [saveOriginal, setSaveOriginal] = useState(true);
  const [saveSorted, setSaveSorted] = useState(true);
  const [label, setLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const preview = useMemo(() => {
    try {
      if (mode === 'manual') {
        return parseManualArray(manualInput);
      }
      return generateRandomArray(randomOptions);
    } catch (error) {
      return [];
    }
  }, [manualInput, mode, randomOptions]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (disabled) return;
    try {
      setIsSubmitting(true);
      const numbers = mode === 'manual' ? parseManualArray(manualInput) : generateRandomArray(randomOptions);
      await processArray({ numbers, label, saveOriginal, saveSorted });
      if (mode === 'manual') {
        setManualInput(numbers.join(', '));
      }
    } catch (error) {
      // ошибки обрабатываются выше
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card">
      <h2>Работа с массивами</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="field-group">
          <label>Способ ввода</label>
          <div className="segmented">
            <button type="button" className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}>
              Клавиатура
            </button>
            <button type="button" className={mode === 'random' ? 'active' : ''} onClick={() => setMode('random')}>
              Случайно
            </button>
          </div>
        </div>

        {mode === 'manual' ? (
          <label className="field-group">
            Массив через запятую
            <textarea
              value={manualInput}
              onChange={(event) => setManualInput(event.target.value)}
              placeholder="Например: 9, 3, 7"
              rows={4}
              required
            />
          </label>
        ) : (
          <div className="random-options">
            <label>
              Кол-во элементов
              <input
                type="number"
                min="1"
                max="1000"
                value={randomOptions.length}
                onChange={(event) =>
                  setRandomOptions((prev) => ({ ...prev, length: Number(event.target.value) || 1 }))
                }
              />
            </label>
            <label>
              Минимум
              <input
                type="number"
                value={randomOptions.min}
                onChange={(event) =>
                  setRandomOptions((prev) => ({ ...prev, min: Number(event.target.value) || 0 }))
                }
              />
            </label>
            <label>
              Максимум
              <input
                type="number"
                value={randomOptions.max}
                onChange={(event) =>
                  setRandomOptions((prev) => ({ ...prev, max: Number(event.target.value) || 0 }))
                }
              />
            </label>
          </div>
        )}

        <label className="field-group">
          Подпись результата (опционально)
          <input type="text" value={label} onChange={(event) => setLabel(event.target.value)} maxLength={120} />
        </label>

        <div className="checkboxes">
          <label>
            <input type="checkbox" checked={saveOriginal} onChange={(event) => setSaveOriginal(event.target.checked)} />
            Сохранить исходный массив
          </label>
          <label>
            <input type="checkbox" checked={saveSorted} onChange={(event) => setSaveSorted(event.target.checked)} />
            Сохранить отсортированный массив
          </label>
        </div>

        <div className="summary-panel">
          <p>
            <strong>Предпросмотр:</strong> {preview.slice(0, 20).join(', ')}
            {preview.length > 20 && ' …'}
          </p>
          <button type="submit" disabled={disabled || isSubmitting}>
            {isSubmitting ? 'Обработка…' : 'Отсортировать и сохранить'}
          </button>
        </div>
      </form>

      {lastProcessing && (
        <div className="result-panel">
          <h3>Последний результат</h3>
          <p>
            <strong>Оригинал:</strong> {lastProcessing.original.join(', ')}
          </p>
          <p>
            <strong>Отсортирован:</strong> {lastProcessing.sorted.join(', ')}
          </p>
          {lastProcessing.saved && <p className="success">Массив был сохранён в базе данных.</p>}
        </div>
      )}
    </section>
  );
}

function AuthPanel({ mode, setMode, credentials, setCredentials, onSubmit, disabled }) {
  return (
    <section className="card auth-panel">
      <h2>{mode === 'login' ? 'Авторизация' : 'Регистрация'}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="form-grid"
      >
        <label>
          Логин
          <input
            type="text"
            value={credentials.username}
            onChange={(event) => setCredentials((prev) => ({ ...prev, username: event.target.value }))}
            required
            minLength={3}
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={credentials.password}
            onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
            required
            minLength={6}
          />
        </label>
        <button type="submit" disabled={disabled}>
          {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>
      <p>
        {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
        <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Зарегистрируйтесь' : 'Авторизуйтесь'}
        </button>
      </p>
    </section>
  );
}

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);
  const [isAuthLoading, setAuthLoading] = useState(false);
  const [lastProcessing, setLastProcessing] = useState(null);
  const [arrays, setArrays] = useState([]);
  const [isLoadingArrays, setIsLoadingArrays] = useState(false);

  useEffect(() => {
    if (!status) return undefined;
    const timer = setTimeout(() => setStatus(null), 5000);
    return () => clearTimeout(timer);
  }, [status]);

  const loadArrays = async () => {
    if (!token) return;
    setIsLoadingArrays(true);
    try {
      const data = await api.fetchArrays(token, { limit: 10 });
      setArrays(data.items);
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsLoadingArrays(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let ignore = false;
    api
      .profile(token)
      .then((data) => {
        if (!ignore) {
          setUser(data.user);
          setStatus({ type: 'success', message: `Добро пожаловать, ${data.user.username}` });
          loadArrays();
        }
      })
      .catch((error) => {
        console.error(error);
        if (!ignore) {
          handleLogout();
          setStatus({ type: 'error', message: 'Сессия устарела, авторизуйтесь снова' });
        }
      });
    return () => {
      ignore = true;
    };
  }, [token]);

  const handleAuth = async () => {
    try {
      setAuthLoading(true);
      const payload = {
        username: credentials.username.trim().toLowerCase(),
        password: credentials.password,
      };
      const data = await api[authMode](payload);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setStatus({ type: 'success', message: authMode === 'login' ? 'Вход выполнен' : 'Регистрация успешна' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setArrays([]);
  };

  const handleProcessArray = async ({ numbers, label, saveOriginal, saveSorted }) => {
    if (!token) {
      setStatus({ type: 'error', message: 'Сначала авторизуйтесь' });
      throw new Error('Нет токена');
    }
    if (!saveOriginal && !saveSorted) {
      const message = 'Выберите хотя бы один вариант сохранения';
      setStatus({ type: 'error', message });
      throw new Error(message);
    }
    setStatus({ type: 'info', message: 'Проводится сортировка массива...' });
    try {
      const result = await api.processArray(token, {
        numbers,
        label,
        saveOriginal,
        saveSorted,
      });
      setLastProcessing({ original: numbers, sorted: result.sorted, saved: result.saved });
      setStatus({ type: 'success', message: 'Массив успешно обработан' });
      if (result.saved) {
        loadArrays();
      }
      return result;
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
      throw error;
    }
  };

  const handleDeleteArray = async (id) => {
    if (!token) return;
    try {
      await api.deleteArray(token, id);
      await loadArrays();
      setStatus({ type: 'success', message: 'Запись удалена' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  return (
    <div className="app">
      <header>
        <div>
          <h1>Lab 3: массивы и сортировка</h1>
          <p>Графический интерфейс + БД + алгоритм сортировки второго задания</p>
        </div>
        {user && (
          <div className="user-info">
            <span>👤 {user.username}</span>
            <button type="button" onClick={handleLogout} className="secondary">
              Выйти
            </button>
          </div>
        )}
      </header>

      <Notification status={status} />

      {!user ? (
        <div className="grid">
          <AuthPanel
            mode={authMode}
            setMode={setAuthMode}
            credentials={credentials}
            setCredentials={setCredentials}
            onSubmit={handleAuth}
            disabled={isAuthLoading}
          />
        </div>
      ) : (
        <div className="grid">
          <ArrayWorkbench disabled={!user} processArray={handleProcessArray} lastProcessing={lastProcessing} />

          <SavedArrays items={arrays} isLoading={isLoadingArrays} onRefresh={loadArrays} onDelete={handleDeleteArray} />
        </div>
      )}
    </div>
  );
}

export default App;
