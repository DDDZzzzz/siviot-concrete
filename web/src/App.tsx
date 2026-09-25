import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Status =
  | 'Новый'
  | 'Подтверждён'
  | 'Запланирован'
  | 'Производство'
  | 'Погружен'
  | 'В пути'
  | 'Доставлен'
  | 'Оплачен'
  | 'Завершён'
  | 'Отменён'

type Payment = 'Наличные' | 'Карта' | 'Перевод'

type Role = 'admin' | 'manager' | 'client' | 'driver'

type User = {
  id: string
  login: string
  password: string
  name: string
  role: Role
}

type Order = {
  id: string
  grade: string
  volume: number
  deliveryCost: number
  address: string
  date: string
  time: string
  phone: string
  payment: Payment
  comment: string
  urgent: boolean
  weekend: boolean
  total: number
  status: Status
  driver: string
  driverId?: string
  createdAt: string
  clientId?: string
}

type Settings = {
  companyName: string
  prices: Record<string, number>
  urgentPrice: number
  weekendPrice: number
}

type Page =
  | 'login'
  | 'home'
  | 'client'
  | 'order'
  | 'review'
  | 'success'
  | 'orders'
  | 'orderDetail'
  | 'manager'
  | 'managerOrder'
  | 'driver'
  | 'driverOrderDetail'
  | 'settings'
  | 'adminUsers'

const defaultSettings: Settings = {
  companyName: 'СИВИОТ',
  prices: {
    М200: 80,
    М250: 90,
    М300: 100,
    М350: 115,
    М400: 130,
  },
  urgentPrice: 50,
  weekendPrice: 40,
}

const CompanyContext = createContext('СИВИОТ')

const defaultUsers: User[] = [
  {
    id: 'u-admin',
    login: 'admin',
    password: 'admin123',
    name: 'Главный администратор',
    role: 'admin',
  },
  {
    id: 'u-manager',
    login: 'manager',
    password: 'manager123',
    name: 'Руководитель',
    role: 'manager',
  },
  {
    id: 'u-client',
    login: 'client',
    password: 'client123',
    name: 'Тестовый клиент',
    role: 'client',
  },
  {
    id: 'u-driver',
    login: 'driver',
    password: 'driver123',
    name: 'Тестовый водитель',
    role: 'driver',
  },
]

function roleName(role: Role) {
  switch (role) {
    case 'admin':
      return 'Администратор'
    case 'manager':
      return 'Руководство'
    case 'client':
      return 'Клиент'
    case 'driver':
      return 'Водитель'
  }
}

const defaultOrder: Omit<
  Order,
  'id' | 'total' | 'status' | 'driver' | 'createdAt'
> = {
  grade: 'М300',
  volume: 1,
  deliveryCost: 0,
  address: '',
  date: '',
  time: '',
  phone: '',
  payment: 'Перевод',
  comment: '',
  urgent: false,
  weekend: false,
}

function App() {
  const [page, setPage] = useState<Page>('login')

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('concreteUsers') || 'null')
      return Array.isArray(saved) && saved.length ? saved : defaultUsers
    } catch {
      return defaultUsers
    }
  })

  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('concreteOrders') || '[]')
    } catch {
      return []
    }
  })

  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('concreteSettings') || 'null',
      )

      if (!saved || typeof saved !== 'object') {
        return defaultSettings
      }

      return {
        ...defaultSettings,
        ...saved,
        companyName:
          typeof saved.companyName === 'string' && saved.companyName.trim()
            ? saved.companyName.trim()
            : defaultSettings.companyName,
        prices: {
          ...defaultSettings.prices,
          ...(saved.prices && typeof saved.prices === 'object'
            ? saved.prices
            : {}),
        },
        urgentPrice:
          Number.isFinite(Number(saved.urgentPrice))
            ? Math.max(0, Number(saved.urgentPrice))
            : defaultSettings.urgentPrice,
        weekendPrice:
          Number.isFinite(Number(saved.weekendPrice))
            ? Math.max(0, Number(saved.weekendPrice))
            : defaultSettings.weekendPrice,
      }
    } catch {
      return defaultSettings
    }
  })

  const [form, setForm] = useState(defaultOrder)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null)

  useEffect(() => {
    localStorage.setItem('concreteOrders', JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem('concreteSettings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem('concreteUsers', JSON.stringify(users))
  }, [users])

  useEffect(() => {
    const savedId = localStorage.getItem('concreteCurrentUser')
    if (savedId) {
      const savedUser = users.find((u) => u.id === savedId)
      if (savedUser) {
        setCurrentUser(savedUser)
        setPage('home')
      }
    }
  }, [])

  useEffect(() => {
    if (!currentUser) return

    const freshUser = users.find((u) => u.id === currentUser.id)

    if (!freshUser) {
      localStorage.removeItem('concreteCurrentUser')
      setCurrentUser(null)
      setPage('login')
      return
    }

    if (freshUser !== currentUser) {
      setCurrentUser(freshUser)
    }
  }, [users])

  function login(loginValue: string, passwordValue: string): boolean {
    const found = users.find(
      (u) => u.login === loginValue.trim() && u.password === passwordValue,
    )

    if (!found) {
      return false
    }

    setCurrentUser(found)
    localStorage.setItem('concreteCurrentUser', found.id)
    setPage('home')
    return true
  }

  function logout() {
    localStorage.removeItem('concreteCurrentUser')
    setCurrentUser(null)
    setSelectedOrderId(null)
    setPage('login')
  }

  const selectedOrder = orders.find((o) => o.id === selectedOrderId)

  const concretePrice = settings.prices[form.grade] || 0
  const concreteTotal = concretePrice * Number(form.volume || 0)

  const surchargeTotal =
    (form.urgent ? settings.urgentPrice : 0) +
    (form.weekend ? settings.weekendPrice : 0)

  const orderTotal =
    concreteTotal + Number(form.deliveryCost || 0) + surchargeTotal

  function updateForm(
    field: keyof typeof form,
    value: string | number | boolean,
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function resetForm() {
    setForm(defaultOrder)
  }

  function generateOrderNumber() {
    let id = ''

    do {
      id = `ЗАК-${Math.floor(100000 + Math.random() * 900000)}`
    } while (orders.some((order) => order.id === id))

    return id
  }

  function createOrder() {
    if (!currentUser || currentUser.role !== 'client') {
      return
    }

    const newOrder: Order = {
      ...form,
      id: generateOrderNumber(),
      volume: Number(form.volume),
      deliveryCost: Number(form.deliveryCost),
      total: orderTotal,
      status: 'Новый',
      driver: '',
      createdAt: new Date().toISOString(),
      clientId: currentUser?.id,
    }

    const newOrders = [newOrder, ...orders]

    setOrders(newOrders)
    setLastCreatedOrder(newOrder)
    resetForm()
    setPage('success')
  }

  function openOrder(id: string, target: Page = 'orderDetail') {
    setSelectedOrderId(id)
    setPage(target)
  }

  function updateOrder(id: string, changes: Partial<Order>) {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              ...changes,
            }
          : order,
      ),
    )
  }

  function deleteOrder(id: string) {
    if (!confirm('Отменить этот заказ?')) return

    updateOrder(id, {
      status: 'Отменён',
    })
  }

  function saveSettings() {
    setSettings((prev) => ({
      ...prev,
      companyName: prev.companyName.trim() || defaultSettings.companyName,
      prices: Object.fromEntries(
        Object.entries(prev.prices).map(([grade, price]) => [
          grade,
          Math.max(0, Number(price) || 0),
        ]),
      ),
      urgentPrice: Math.max(0, Number(prev.urgentPrice) || 0),
      weekendPrice: Math.max(0, Number(prev.weekendPrice) || 0),
    }))
    alert('Настройки сохранены')
    setPage('home')
  }

  function goHome() {
    setPage('home')
    setSelectedOrderId(null)
  }

  if (!currentUser) {
    return <Login onLogin={login} companyName={settings.companyName} />
  }

  return (
    <CompanyContext.Provider value={settings.companyName}>
      <>
      {page === 'home' && (
        <Home
          user={currentUser}
          companyName={settings.companyName}
          onClient={() => setPage('client')}
          onManager={() => setPage('manager')}
          onDriver={() => setPage('driver')}
          onSettings={() => setPage('settings')}
          onAdminUsers={() => setPage('adminUsers')}
          onLogout={logout}
        />
      )}

      {page === 'client' && (
        <Client
          orders={orders.filter((order) => order.clientId === currentUser.id)}
          onCreate={() => {
            resetForm()
            setPage('order')
          }}
          onOrders={() => setPage('orders')}
          onHome={goHome}
        />
      )}

      {page === 'order' && (
        <OrderForm
          form={form}
          settings={settings}
          concretePrice={concretePrice}
          concreteTotal={concreteTotal}
          surchargeTotal={surchargeTotal}
          orderTotal={orderTotal}
          updateForm={updateForm}
          onBack={() => setPage('client')}
          onReview={() => setPage('review')}
        />
      )}

      {page === 'review' && (
        <Review
          form={form}
          concreteTotal={concreteTotal}
          orderTotal={orderTotal}
          settings={settings}
          onBack={() => setPage('order')}
          onConfirm={createOrder}
        />
      )}

      {page === 'success' && lastCreatedOrder && (
        <Success
          order={lastCreatedOrder}
          onOrders={() => setPage('orders')}
          onHome={goHome}
        />
      )}

      {page === 'orders' && (
        <Orders
          orders={orders.filter((order) => order.clientId === currentUser.id)}
          onHome={() => setPage('client')}
          onOpen={(id) => openOrder(id, 'orderDetail')}
        />
      )}

      {page === 'orderDetail' && selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onBack={() => setPage('orders')}
          onCancel={() => deleteOrder(selectedOrder.id)}
        />
      )}

      {page === 'manager' && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
        <Manager
          orders={orders}
          onHome={goHome}
          onOpen={(id) => openOrder(id, 'managerOrder')}
        />
      )}

      {page === 'managerOrder' && selectedOrder && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
        <ManagerOrder
          order={selectedOrder}
          drivers={users.filter((user) => user.role === 'driver')}
          onBack={() => setPage('manager')}
          onUpdate={updateOrder}
        />
      )}

      {page === 'driver' && currentUser.role === 'driver' && (
        <Driver
          orders={orders}
          driverId={currentUser.id}
          driverName={currentUser.name}
          onHome={goHome}
          onOpen={(id) => openOrder(id, 'driverOrderDetail')}
          onUpdate={updateOrder}
        />
      )}

      {page === 'driverOrderDetail' && selectedOrder && currentUser.role === 'driver' && (
        <DriverOrderDetail
          order={selectedOrder}
          onBack={() => setPage('driver')}
          onUpdate={updateOrder}
        />
      )}
      {page === 'adminUsers' && currentUser.role === 'admin' && (
        <AdminUsers
          users={users}
          setUsers={setUsers}
          onBack={() => setPage('home')}
        />
      )}

      {page === 'settings' && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
        <SettingsPage
          settings={settings}
          setSettings={setSettings}
          isAdmin={currentUser.role === 'admin'}
          onBack={goHome}
          onSave={saveSettings}
        />
      )}
      </>
    </CompanyContext.Provider>
  )
}

/* =========================
   HOME
========================= */

function Home({
  user,
  companyName,
  onClient,
  onManager,
  onDriver,
  onSettings,
  onAdminUsers,
  onLogout,
}: {
  user: User
  companyName: string
  onClient: () => void
  onManager: () => void
  onDriver: () => void
  onSettings: () => void
  onAdminUsers: () => void
  onLogout: () => void
}) {
  return (
    <Page
      title={companyName}
      subtitle={`Вы вошли как: ${user.name} • ${roleName(user.role)}`}
    >
      <div style={styles.hero}>
        <BrandLogo size={78} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={styles.heroKicker}>{companyName}</div>
          <div style={styles.heroText}>Бетон • Доставка • Контроль</div>
        </div>
        <div style={styles.heroGlow} />
      </div>

      <div style={styles.grid}>
        {user.role === 'client' && (
          <BigButton
            icon="👤"
            title="Клиент"
            subtitle="Создание и просмотр заказов"
            onClick={onClient}
          />
        )}

        {(user.role === 'admin' || user.role === 'manager') && (
          <BigButton
            icon="🏭"
            title="Руководство"
            subtitle="Управление заказами и производством"
            onClick={onManager}
          />
        )}

        {user.role === 'driver' && (
          <BigButton
            icon="🚚"
            title="Водитель"
            subtitle="Мои доставки и статусы"
            onClick={onDriver}
          />
        )}

        {(user.role === 'admin' || user.role === 'manager') && (
          <BigButton
            icon="⚙️"
            title="Настройки"
            subtitle="Цены и тарифы"
            onClick={onSettings}
          />
        )}

        {user.role === 'admin' && (
          <BigButton
            icon="👥"
            title="Пользователи"
            subtitle="Логины, пароли и права доступа"
            onClick={onAdminUsers}
          />
        )}
      </div>

      <button style={styles.dangerButton} onClick={onLogout}>
        🚪 Выйти из аккаунта
      </button>
    </Page>
  )
}

/* =========================
   CLIENT
========================= */

function Client({
  orders,
  onCreate,
  onOrders,
  onHome,
}: {
  orders: Order[]
  onCreate: () => void
  onOrders: () => void
  onHome: () => void
}) {
  return (
    <Page title="Клиент" subtitle="Управление вашими заказами">
      <div style={styles.grid}>
        <BigButton
          icon="➕"
          title="Создать заказ"
          subtitle="Оформить новый заказ бетона"
          onClick={onCreate}
        />

        <BigButton
          icon="📋"
          title="Мои заказы"
          subtitle={`Всего заказов: ${orders.length}`}
          onClick={onOrders}
        />
      </div>

      <BackButton onClick={onHome} text="На главную" />
    </Page>
  )
}

/* =========================
   ORDER FORM
========================= */

function OrderForm({
  form,
  settings,
  concreteTotal,
  surchargeTotal,
  orderTotal,
  updateForm,
  onBack,
  onReview,
}: {
  form: typeof defaultOrder
  settings: Settings
  concretePrice: number
  concreteTotal: number
  surchargeTotal: number
  orderTotal: number
  updateForm: (
    field: keyof typeof defaultOrder,
    value: string | number | boolean,
  ) => void
  onBack: () => void
  onReview: () => void
}) {
  const canContinue =
    form.grade &&
    Number(form.volume) > 0 &&
    form.address.trim() &&
    form.date &&
    form.time &&
    form.phone.trim()

  return (
    <Page title="Новый заказ" subtitle="Заполните данные заказа">
      <div style={styles.form}>
        <label style={styles.label}>
          Марка бетона

          <select
            style={styles.input}
            value={form.grade}
            onChange={(e) => updateForm('grade', e.target.value)}
          >
            {Object.entries(settings.prices).map(([grade, price]) => (
              <option key={grade} value={grade}>
                {grade} — {price} €/м³
              </option>
            ))}
          </select>
        </label>

        <label style={styles.label}>
          Объём, м³

          <input
            style={styles.input}
            type="number"
            min="1"
            value={form.volume}
            onChange={(e) => updateForm('volume', Number(e.target.value))}
          />
        </label>

        <label style={styles.label}>
          Стоимость доставки, €

          <input
            style={styles.input}
            type="number"
            min="0"
            value={form.deliveryCost}
            onChange={(e) =>
              updateForm('deliveryCost', Number(e.target.value))
            }
          />
        </label>

        <label style={styles.label}>
          Адрес доставки

          <input
            style={styles.input}
            placeholder="Введите адрес"
            value={form.address}
            onChange={(e) => updateForm('address', e.target.value)}
          />
        </label>

        <div style={styles.twoColumns}>
          <label style={styles.label}>
            Дата

            <input
              style={styles.input}
              type="date"
              value={form.date}
              onChange={(e) => updateForm('date', e.target.value)}
            />
          </label>

          <label style={styles.label}>
            Время

            <input
              style={styles.input}
              type="time"
              value={form.time}
              onChange={(e) => updateForm('time', e.target.value)}
            />
          </label>
        </div>

        <label style={styles.label}>
          Телефон

          <input
            style={styles.input}
            placeholder="+49..."
            value={form.phone}
            onChange={(e) => updateForm('phone', e.target.value)}
          />
        </label>

        <label style={styles.label}>
          Способ оплаты

          <select
            style={styles.input}
            value={form.payment}
            onChange={(e) =>
              updateForm('payment', e.target.value as Payment)
            }
          >
            <option value="Перевод">Перевод</option>
            <option value="Карта">Карта</option>
            <option value="Наличные">Наличные</option>
          </select>
        </label>

        <label style={styles.checkRow}>
          <input
            type="checkbox"
            checked={form.urgent}
            onChange={(e) => updateForm('urgent', e.target.checked)}
          />

          <span>
            Срочная доставка (+{settings.urgentPrice} €)
          </span>
        </label>

        <label style={styles.checkRow}>
          <input
            type="checkbox"
            checked={form.weekend}
            onChange={(e) => updateForm('weekend', e.target.checked)}
          />

          <span>
            Выходной / праздничный день (+{settings.weekendPrice} €)
          </span>
        </label>

        <label style={styles.label}>
          Комментарий

          <textarea
            style={{ ...styles.input, minHeight: 100 }}
            placeholder="Дополнительная информация"
            value={form.comment}
            onChange={(e) => updateForm('comment', e.target.value)}
          />
        </label>

        <div style={styles.priceBox}>
          <div>
            Бетон: {concreteTotal.toFixed(2)} €
          </div>

          <div>
            Доставка: {Number(form.deliveryCost).toFixed(2)} €
          </div>

          <div>
            Доплаты: {surchargeTotal.toFixed(2)} €
          </div>

          <strong style={styles.total}>
            Итого: {orderTotal.toFixed(2)} €
          </strong>
        </div>

        <button
          style={{
            ...styles.primaryButton,
            opacity: canContinue ? 1 : 0.5,
          }}
          disabled={!canContinue}
          onClick={onReview}
        >
          Проверить и подтвердить заказ
        </button>

        <BackButton onClick={onBack} text="Назад" />
      </div>
    </Page>
  )
}

/* =========================
   REVIEW
========================= */

function Review({
  form,
  concreteTotal,
  orderTotal,
  settings,
  onBack,
  onConfirm,
}: {
  form: typeof defaultOrder
  concreteTotal: number
  orderTotal: number
  settings: Settings
  onBack: () => void
  onConfirm: () => void
}) {
  return (
    <Page title="Проверка заказа" subtitle="Проверьте данные перед созданием">
      <div style={styles.card}>
        <InfoRow title="Марка бетона" value={form.grade} />
        <InfoRow title="Объём" value={`${form.volume} м³`} />
        <InfoRow title="Адрес" value={form.address} />
        <InfoRow title="Дата" value={form.date} />
        <InfoRow title="Время" value={form.time} />
        <InfoRow title="Телефон" value={form.phone} />
        <InfoRow title="Оплата" value={form.payment} />

        <hr />

        <InfoRow
          title="Бетон"
          value={`${concreteTotal.toFixed(2)} €`}
        />

        <InfoRow
          title="Доставка"
          value={`${Number(form.deliveryCost).toFixed(2)} €`}
        />

        {form.urgent && (
          <InfoRow
            title="Срочная доставка"
            value={`+${settings.urgentPrice} €`}
          />
        )}

        {form.weekend && (
          <InfoRow
            title="Выходной / праздник"
            value={`+${settings.weekendPrice} €`}
          />
        )}

        <div style={styles.totalRow}>
          <span>ИТОГО</span>
          <strong>{orderTotal.toFixed(2)} €</strong>
        </div>
      </div>

      <div style={styles.warning}>
        После подтверждения заказ будет отправлен начальнику / оператору
        со статусом «Новый».
      </div>

      <button style={styles.primaryButton} onClick={onConfirm}>
        ✅ Подтвердить и создать заказ
      </button>

      <BackButton onClick={onBack} text="Изменить заказ" />
    </Page>
  )
}

/* =========================
   SUCCESS
========================= */

function Success({
  order,
  onOrders,
  onHome,
}: {
  order: Order
  onOrders: () => void
  onHome: () => void
}) {
  return (
    <Page title="Заказ создан" subtitle="Заказ успешно зарегистрирован">
      <div style={styles.success}>
        <div style={styles.successIcon}>✅</div>

        <h2>{order.id}</h2>

        <p>Статус: {order.status}</p>

        <p>
          Сумма заказа:{' '}
          <strong>{order.total.toFixed(2)} €</strong>
        </p>

        <button style={styles.primaryButton} onClick={onOrders}>
          📋 Мои заказы
        </button>

        <button style={styles.secondaryButton} onClick={onHome}>
          На главную
        </button>
      </div>
    </Page>
  )
}

/* =========================
   ORDERS
========================= */

function Orders({
  orders,
  onHome,
  onOpen,
}: {
  orders: Order[]
  onHome: () => void
  onOpen: (id: string) => void
}) {
  return (
    <Page title="Мои заказы" subtitle="История заказов">
      {orders.length === 0 ? (
        <Empty text="У вас пока нет заказов." />
      ) : (
        <div style={styles.list}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => onOpen(order.id)}
            />
          ))}
        </div>
      )}

      <BackButton onClick={onHome} text="Назад" />
    </Page>
  )
}

/* =========================
   ORDER DETAIL
========================= */

function OrderDetail({
  order,
  onBack,
  onCancel,
}: {
  order: Order
  onBack: () => void
  onCancel: () => void
}) {
  return (
    <Page title={order.id} subtitle="Информация о заказе">
      <div style={styles.card}>
        <StatusBadge status={order.status} />

        <InfoRow title="Марка" value={order.grade} />
        <InfoRow title="Объём" value={`${order.volume} м³`} />
        <InfoRow title="Адрес" value={order.address} />
        <InfoRow title="Дата" value={order.date} />
        <InfoRow title="Время" value={order.time} />
        <InfoRow title="Телефон" value={order.phone} />
        <InfoRow title="Оплата" value={order.payment} />
        <InfoRow title="Водитель" value={order.driver || 'Не назначен'} />
        <InfoRow title="Комментарий" value={order.comment || '—'} />

        <div style={styles.totalRow}>
          <span>ИТОГО</span>
          <strong>{order.total.toFixed(2)} €</strong>
        </div>
      </div>

      {['Новый', 'Подтверждён', 'Запланирован'].includes(order.status) && (
          <button
            style={styles.dangerButton}
            onClick={onCancel}
          >
            ❌ Отменить заказ
          </button>
        )}

      <BackButton onClick={onBack} text="Назад" />
    </Page>
  )
}

/* =========================
   MANAGER
========================= */

function Manager({
  orders,
  onHome,
  onOpen,
}: {
  orders: Order[]
  onHome: () => void
  onOpen: (id: string) => void
}) {
  const [filter, setFilter] = useState<'Все' | Status>('Все')

  const filteredOrders = useMemo(() => {
    if (filter === 'Все') return orders

    return orders.filter(
      (order) => order.status === filter,
    )
  }, [orders, filter])

  const activeCount = orders.filter(
    (o) => o.status !== 'Завершён' && o.status !== 'Отменён',
  ).length

  return (
    <Page title="Начальник / оператор" subtitle="Управление заказами">
      <div style={styles.stats}>
        <Stat title="Всего" value={orders.length} />

        <Stat title="Активных" value={activeCount} />

        <Stat
          title="Новых"
          value={
            orders.filter(
              (o) => o.status === 'Новый',
            ).length
          }
        />
      </div>

      <select
        style={styles.input}
        value={filter}
        onChange={(e) =>
          setFilter(e.target.value as 'Все' | Status)
        }
      >
        <option value="Все">Все заказы</option>
        <option value="Новый">Новые</option>
        <option value="Подтверждён">Подтверждённые</option>
        <option value="Запланирован">Запланированные</option>
        <option value="Производство">Производство</option>
        <option value="Погружен">Погружены</option>
        <option value="В пути">В пути</option>
        <option value="Доставлен">Доставлены</option>
        <option value="Оплачен">Оплачены</option>
        <option value="Завершён">Завершённые</option>
        <option value="Отменён">Отменённые</option>
      </select>

      <div style={styles.list}>
        {filteredOrders.length === 0 ? (
          <Empty text="Заказов нет." />
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => onOpen(order.id)}
            />
          ))
        )}
      </div>

      <BackButton onClick={onHome} text="На главную" />
    </Page>
  )
}

/* =========================
   MANAGER ORDER
========================= */

function ManagerOrder({
  order,
  drivers,
  onBack,
  onUpdate,
}: {
  order: Order
  drivers: User[]
  onBack: () => void
  onUpdate: (id: string, changes: Partial<Order>) => void
}) {
  const [driverId, setDriverId] = useState(order.driverId || '')
  const selectedDriver = drivers.find((driver) => driver.id === driverId)

  const nextStatuses: Status[] = [
    'Новый',
    'Подтверждён',
    'Запланирован',
    'Производство',
    'Погружен',
    'В пути',
    'Доставлен',
    'Оплачен',
    'Завершён',
  ]

  function changeStatus(status: Status) {
    onUpdate(order.id, { status })
  }

  function assignDriver() {
    if (!selectedDriver) {
      alert('Выберите водителя')
      return
    }

    onUpdate(order.id, {
      driverId: selectedDriver.id,
      driver: selectedDriver.name,
    })

    alert('Водитель назначен')
  }

  return (
    <Page title={order.id} subtitle="Управление заказом">
      <div style={styles.card}>
        <StatusBadge status={order.status} />

        <InfoRow title="Марка" value={order.grade} />
        <InfoRow title="Объём" value={`${order.volume} м³`} />
        <InfoRow title="Адрес" value={order.address} />
        <InfoRow title="Дата" value={order.date} />
        <InfoRow title="Время" value={order.time} />
        <InfoRow title="Телефон" value={order.phone} />
        <InfoRow title="Оплата" value={order.payment} />
        <InfoRow
          title="Сумма"
          value={`${order.total.toFixed(2)} €`}
        />
        <InfoRow
          title="Комментарий"
          value={order.comment || '—'}
        />
      </div>

      <h3>Статус заказа</h3>

      <div style={styles.statusButtons}>
        {nextStatuses.map((status) => (
          <button
            key={status}
            style={{
              ...styles.statusButton,
              ...(order.status === status
                ? styles.statusButtonActive
                : {}),
            }}
            onClick={() => changeStatus(status)}
          >
            {status}
          </button>
        ))}

        <button
          style={{
            ...styles.statusButton,
            background: '#fee2e2',
          }}
          onClick={() => changeStatus('Отменён')}
        >
          Отменить
        </button>
      </div>

      <h3>Назначение водителя</h3>

      <select
        style={styles.input}
        value={driverId}
        onChange={(e) => setDriverId(e.target.value)}
      >
        <option value="">Выберите водителя</option>
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.name} — {driver.login}
          </option>
        ))}
      </select>

      <button
        style={styles.primaryButton}
        onClick={assignDriver}
      >
        Назначить водителя
      </button>

      <BackButton
        onClick={onBack}
        text="Назад к заказам"
      />
    </Page>
  )
}

/* =========================
   DRIVER
========================= */

function Driver({
  orders,
  driverId,
  driverName,
  onHome,
  onOpen,
  onUpdate,
}: {
  orders: Order[]
  driverId: string
  driverName: string
  onHome: () => void
  onOpen: (id: string) => void
  onUpdate: (id: string, changes: Partial<Order>) => void
}) {
  const driverOrders = orders.filter(
    (order) =>
      (order.driverId === driverId || order.driver === driverName) &&
      order.status !== 'Завершён' &&
      order.status !== 'Отменён',
  )

  return (
    <Page title="Водитель" subtitle="Мои доставки">
      {driverOrders.length === 0 ? (
        <Empty text="Назначенных доставок пока нет." />
      ) : (
        <div style={styles.list}>
          {driverOrders.map((order) => (
            <div key={order.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <strong>{order.id}</strong>
                <StatusBadge status={order.status} />
              </div>

              <InfoRow
                title="Адрес"
                value={order.address}
              />

              <InfoRow
                title="Дата"
                value={order.date}
              />

              <InfoRow
                title="Время"
                value={order.time}
              />

              <InfoRow
                title="Бетон"
                value={`${order.grade}, ${order.volume} м³`}
              />

              <div style={styles.driverButtons}>
                {order.status === 'Подтверждён' ||
                order.status === 'Запланирован' ? (
                  <button
                    style={styles.primaryButton}
                    onClick={() =>
                      onUpdate(order.id, {
                        status: 'В пути',
                      })
                    }
                  >
                    🚚 Начать доставку
                  </button>
                ) : null}

                {order.status === 'В пути' && (
                  <button
                    style={styles.primaryButton}
                    onClick={() =>
                      onUpdate(order.id, {
                        status: 'Доставлен',
                      })
                    }
                  >
                    ✅ Доставлено
                  </button>
                )}

                <button
                  style={styles.secondaryButton}
                  onClick={() => onOpen(order.id)}
                >
                  Подробнее
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BackButton onClick={onHome} text="На главную" />
    </Page>
  )
}

/* =========================
   DRIVER ORDER DETAIL
========================= */

function DriverOrderDetail({
  order,
  onBack,
  onUpdate,
}: {
  order: Order
  onBack: () => void
  onUpdate: (id: string, changes: Partial<Order>) => void
}) {
  return (
    <Page title={order.id} subtitle="Детали доставки">
      <div style={styles.card}>
        <div style={styles.detailTop}>
          <div>
            <div style={styles.sectionLabel}>ЗАКАЗ</div>
            <h2 style={styles.detailTitle}>{order.grade} • {order.volume} м³</h2>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <InfoRow title="Адрес доставки" value={order.address} />
        <InfoRow title="Дата" value={order.date} />
        <InfoRow title="Время" value={order.time} />
        <InfoRow title="Телефон" value={order.phone} />
        <InfoRow title="Комментарий" value={order.comment || '—'} />
      </div>

      {order.status === 'Подтверждён' || order.status === 'Запланирован' ? (
        <button
          style={styles.primaryButton}
          onClick={() => onUpdate(order.id, { status: 'В пути' })}
        >
          Начать доставку
        </button>
      ) : null}

      {order.status === 'В пути' && (
        <button
          style={styles.primaryButton}
          onClick={() => onUpdate(order.id, { status: 'Доставлен' })}
        >
          Отметить доставленным
        </button>
      )}

      <BackButton onClick={onBack} text="Назад к доставкам" />
    </Page>
  )
}

/* =========================
   SETTINGS
========================= */

function SettingsPage({
  settings,
  setSettings,
  isAdmin,
  onBack,
  onSave,
}: {
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
  isAdmin: boolean
  onBack: () => void
  onSave: () => void
}) {
  function updatePrice(
    grade: string,
    value: number,
  ) {
    setSettings((prev) => ({
      ...prev,
      prices: {
        ...prev.prices,
        [grade]: Math.max(0, Number.isFinite(value) ? value : 0),
      },
    }))
  }

  return (
    <Page
      title="Настройки"
      subtitle="Цены и дополнительные тарифы"
    >
      {isAdmin && (
        <div style={styles.card}>
          <div style={styles.sectionLabel}>БРЕНД ПРЕДПРИЯТИЯ</div>
          <h3 style={{ marginTop: 6 }}>Название предприятия</h3>
          <p style={styles.muted}>Это название будет отображаться на экране входа, главной странице и в шапке системы.</p>
          <label style={styles.label}>
            Название предприятия
            <input
              style={styles.input}
              value={settings.companyName}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, companyName: e.target.value }))
              }
              placeholder="Например: СИВИОТ"
            />
          </label>

          <div style={styles.logoPreview}>
            <BrandLogo size={58} />
            <div>
              <strong>Фирменный логотип</strong>
              <div style={styles.muted}>Угловатная синяя буква S — логотип СИВИОТ.</div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.sectionLabel}>ТАРИФЫ</div>
        <h3 style={{ marginTop: 6 }}>Цена бетона</h3>

        {Object.entries(settings.prices).map(
          ([grade, price]) => (
            <label
              key={grade}
              style={styles.label}
            >
              {grade}, €/м³

              <input
                style={styles.input}
                type="number"
                min="0"
                value={price}
                onChange={(e) =>
                  updatePrice(
                    grade,
                    Number(e.target.value),
                  )
                }
              />
            </label>
          ),
        )}

        <h3>Дополнительные тарифы</h3>

        <label style={styles.label}>
          Срочная доставка, €

          <input
            style={styles.input}
            type="number"
            min="0"
            value={settings.urgentPrice}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                urgentPrice: Number(
                  e.target.value,
                ),
              }))
            }
          />
        </label>

        <label style={styles.label}>
          Выходной / праздничный день, €

          <input
            style={styles.input}
            type="number"
            min="0"
            value={settings.weekendPrice}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                weekendPrice: Number(
                  e.target.value,
                ),
              }))
            }
          />
        </label>
      </div>

      <button
        style={styles.primaryButton}
        onClick={onSave}
      >
        💾 Сохранить настройки
      </button>

      <BackButton onClick={onBack} text="Назад" />
    </Page>
  )
}

/* =========================
   LOGIN
========================= */

function Login({
  onLogin,
  companyName,
}: {
  onLogin: (login: string, password: string) => boolean
  companyName: string
}) {
  const [loginValue, setLoginValue] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!loginValue.trim() || !passwordValue) {
      setError('Введите логин и пароль.')
      return
    }

    const success = onLogin(loginValue, passwordValue)

    if (!success) {
      setError('Неверный логин или пароль.')
    }
  }

  return (
    <div style={styles.loginPage}>
      <form style={styles.loginCard} onSubmit={submit}>
        <div style={styles.loginBrand}>
          <BrandLogo size={68} />
          <div>
            <div style={styles.loginBrandTitle}>{companyName}</div>
            <div style={styles.loginBrandSub}>Бетон • Доставка • Контроль</div>
          </div>
        </div>

        <div style={styles.loginWelcome}>Вход в систему</div>
        <p style={styles.loginIntro}>
          Введите данные своей учётной записи, чтобы продолжить.
        </p>

        <label style={styles.label}>
          Логин
          <input
            style={styles.input}
            value={loginValue}
            onChange={(e) => {
              setLoginValue(e.target.value)
              setError('')
            }}
            placeholder="Введите логин"
            autoComplete="username"
            autoFocus
          />
        </label>

        <label style={styles.label}>
          Пароль
          <input
            style={styles.input}
            type="password"
            value={passwordValue}
            onChange={(e) => {
              setPasswordValue(e.target.value)
              setError('')
            }}
            placeholder="Введите пароль"
            autoComplete="current-password"
          />
        </label>

        {error && (
          <div style={styles.loginError}>
            {error}
          </div>
        )}

        <button style={styles.primaryButton} type="submit">
          Войти в систему
        </button>

        <div style={styles.loginSecureNote}>
          Доступ к разделам системы определяется назначенной вам ролью.
        </div>
      </form>
    </div>
  )
}

/* =========================
   ADMIN USERS
========================= */

function AdminUsers({
  users,
  setUsers,
  onBack,
}: {
  users: User[]
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
  onBack: () => void
}) {
  const [newLogin, setNewLogin] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<Role>('client')

  function addUser() {
    if (!newLogin.trim() || !newPassword || !newName.trim()) {
      alert('Заполните логин, пароль и имя')
      return
    }

    if (users.some((u) => u.login === newLogin.trim())) {
      alert('Такой логин уже существует')
      return
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      login: newLogin.trim(),
      password: newPassword,
      name: newName.trim(),
      role: newRole,
    }

    setUsers((prev) => [...prev, newUser])
    setNewLogin('')
    setNewPassword('')
    setNewName('')
    setNewRole('client')
    alert('Пользователь создан')
  }

  function updateUser(id: string, changes: Partial<User>) {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, ...changes } : user,
      ),
    )
  }

  function removeUser(id: string) {
    if (id === 'u-admin') {
      alert('Главного администратора удалить нельзя')
      return
    }

    const currentId = localStorage.getItem('concreteCurrentUser')
    if (id === currentId) {
      alert('Нельзя удалить собственную учётную запись')
      return
    }

    const user = users.find((u) => u.id === id)
    if (!user) return

    if (!confirm(`Удалить пользователя «${user.name}»?`)) return

    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  return (
    <Page
      title="Пользователи"
      subtitle="Администратор управляет логинами и правами доступа"
    >
      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Добавить пользователя</h3>

        <label style={styles.label}>
          Имя
          <input
            style={styles.input}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Например: Иван Петров"
          />
        </label>

        <label style={styles.label}>
          Логин
          <input
            style={styles.input}
            value={newLogin}
            onChange={(e) => setNewLogin(e.target.value)}
            placeholder="Логин для входа"
          />
        </label>

        <label style={styles.label}>
          Пароль
          <input
            style={styles.input}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Пароль"
          />
        </label>

        <label style={styles.label}>
          Права доступа
          <select
            style={styles.input}
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
          >
            <option value="client">Клиент</option>
            <option value="manager">Руководство</option>
            <option value="driver">Водитель</option>
            <option value="admin">Администратор</option>
          </select>
        </label>

        <button style={styles.primaryButton} onClick={addUser}>
          ➕ Создать пользователя
        </button>
      </div>

      <h3>Существующие пользователи</h3>

      <div style={styles.list}>
        {users.map((user) => (
          <div key={user.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <strong>{user.name}</strong>
              <span style={styles.badge}>{roleName(user.role)}</span>
            </div>

            <InfoRow title="Логин" value={user.login} />

            <label style={styles.label}>
              Пароль
              <input
                style={styles.input}
                type="password"
                value={user.password}
                onChange={(e) =>
                  updateUser(user.id, { password: e.target.value })
                }
              />
            </label>

            <label style={styles.label}>
              Роль
              <select
                style={styles.input}
                value={user.role}
                disabled={user.id === localStorage.getItem('concreteCurrentUser')}
                onChange={(e) =>
                  updateUser(user.id, {
                    role: e.target.value as Role,
                  })
                }
              >
                <option value="client">Клиент</option>
                <option value="manager">Руководство</option>
                <option value="driver">Водитель</option>
                <option value="admin">Администратор</option>
              </select>
            </label>

            <button
              style={styles.dangerButton}
              onClick={() => removeUser(user.id)}
            >
              🗑️ Удалить пользователя
            </button>
          </div>
        ))}
      </div>

      <div style={styles.warning}>
        Сейчас это прототип: пользователи и пароли сохраняются в браузере.
        Перед запуском системы в интернете мы перенесём авторизацию на сервер
        и сделаем безопасное хранение паролей.
      </div>

      <BackButton onClick={onBack} text="На главную" />
    </Page>
  )
}

/* =========================
   COMPONENTS
========================= */

function BrandLogo({ size = 64 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, flex: '0 0 auto' }} aria-label="Логотип">
      <svg viewBox="0 0 100 100" width="100%" height="100%" role="img">
        <defs>
          <linearGradient id="siviotBlue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        <path d="M22 13h39L46 29H33l18 11-24 13H13l21-13-17-10z" fill="url(#siviotBlue)" />
        <path d="M78 87H39l15-16h13L49 60l24-13h14L66 60l17 10z" fill="url(#siviotBlue)" />
        <path d="M48 29l25 18-9 5-25-18z" fill="#1d4ed8" opacity=".9" />
        <path d="M52 71L27 53l9-5 25 18z" fill="#1d4ed8" opacity=".9" />
      </svg>
    </div>
  )
}

function Page({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  const companyName = useContext(CompanyContext)

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerBrand}>
            <BrandLogo size={48} />
            <div>
              <div style={styles.headerBrandName}>{companyName}</div>
              <div style={styles.headerBrandCaption}>Бетон • Доставка • Контроль</div>
            </div>
          </div>

          <div style={styles.headerDivider} />

          <h1 style={styles.title}>{title}</h1>

          {subtitle && (
            <p style={styles.subtitle}>
              {subtitle}
            </p>
          )}
        </header>

        <main>{children}</main>

        <footer style={styles.footer}>
          {companyName} • Управление заказами и доставкой
        </footer>
      </div>
    </div>
  )
}

function IconGlyph({ icon }: { icon: string }) {
  const common = {
    width: 25,
    height: 25,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (icon === '👤') return <svg {...common}><circle cx="12" cy="8" r="3.2" /><path d="M5.5 19c.8-3.2 3-4.8 6.5-4.8s5.7 1.6 6.5 4.8" /></svg>
  if (icon === '🏭') return <svg {...common}><path d="M4 20V9l6 3V9l5 3V7l5 3v10" /><path d="M4 20h17M8 16v4M12 16v4M16 16v4" /></svg>
  if (icon === '🚚') return <svg {...common}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>
  if (icon === '⚙️') return <svg {...common}><path d="M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z" /><path d="m19.2 13.4 1.3 1-.9 1.7-1.6-.3a7.7 7.7 0 0 1-1.4 1.4l.3 1.6-1.7.9-1-1.3a7.5 7.5 0 0 1-2 .2l-1 1.3-1.7-.9.3-1.6a7.7 7.7 0 0 1-1.4-1.4l-1.6.3-.9-1.7 1.3-1a7.5 7.5 0 0 1 0-2l-1.3-1 .9-1.7 1.6.3A7.7 7.7 0 0 1 9 7.6L8.7 6l1.7-.9 1 1.3a7.5 7.5 0 0 1 2 0l1-1.3 1.7.9-.3 1.6a7.7 7.7 0 0 1 1.4 1.4l1.6-.3.9 1.7-1.3 1a7.5 7.5 0 0 1 0 2Z" /></svg>
  if (icon === '👥') return <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3.5 19c.7-3.2 2.6-4.8 5.5-4.8s4.8 1.6 5.5 4.8M15 14.5c2.8.1 4.5 1.5 5 4.5" /></svg>
  if (icon === '➕') return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 8v8M8 12h8" /></svg>
  if (icon === '📋') return <svg {...common}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M8.5 9h7M8.5 13h7M8.5 17h4" /></svg>
  return <svg {...common}><circle cx="12" cy="12" r="8.5" /></svg>
}

function BigButton({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: string
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      style={styles.bigButton}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 16px 34px rgba(15,23,42,0.10)'
        e.currentTarget.style.borderColor = '#bfdbfe'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 10px 28px rgba(15,23,42,0.06)'
        e.currentTarget.style.borderColor = '#dbe5ef'
      }}
    >
      <span style={styles.bigIcon}>
        <IconGlyph icon={icon} />
      </span>

      <span style={{ flex: 1 }}>
        <strong style={styles.bigTitle}>
          {title}
        </strong>

        <small style={styles.bigSubtitle}>
          {subtitle}
        </small>
      </span>

      <span style={styles.cardArrow}>→</span>
    </button>
  )
}

function BackButton({
  onClick,
  text,
}: {
  onClick: () => void
  text: string
}) {
  return (
    <button
      style={styles.secondaryButton}
      onClick={onClick}
    >
      ← {text}
    </button>
  )
}

function InfoRow({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoTitle}>
        {title}
      </span>

      <span style={styles.infoValue}>
        {value}
      </span>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: Status
}) {
  return (
    <span
      style={{
        ...styles.badge,
        ...statusStyle(status),
      }}
    >
      {status}
    </span>
  )
}

function OrderCard({
  order,
  onClick,
}: {
  order: Order
  onClick: () => void
}) {
  return (
    <button
      style={styles.orderCard}
      onClick={onClick}
    >
      <div style={styles.cardHeader}>
        <strong>{order.id}</strong>

        <StatusBadge
          status={order.status}
        />
      </div>

      <div style={styles.orderMain}>
        <strong>
          {order.grade} • {order.volume} м³
        </strong>

        <span>{order.address}</span>

        <span>
          {order.date} • {order.time}
        </span>
      </div>

      <strong>
        {order.total.toFixed(2)} €
      </strong>
    </button>
  )
}

function Stat({
  title,
  value,
}: {
  title: string
  value: number
}) {
  const icon = title === 'Всего' ? '◉' : title === 'Активных' ? '↗' : '✦'

  return (
    <div style={styles.stat}>
      <div style={styles.statIcon}>{icon}</div>
      <strong style={styles.statValue}>{value}</strong>
      <span style={styles.statTitle}>{title}</span>
    </div>
  )
}

function Empty({
  text,
}: {
  text: string
}) {
  return (
    <div style={styles.empty}>
      {text}
    </div>
  )
}

function statusStyle(
  status: Status,
): React.CSSProperties {
  switch (status) {
    case 'Новый':
      return {
        background: '#dbeafe',
        color: '#1d4ed8',
      }

    case 'Подтверждён':
      return {
        background: '#dcfce7',
        color: '#15803d',
      }

    case 'Запланирован':
      return {
        background: '#fef3c7',
        color: '#92400e',
      }

    case 'Производство':
      return {
        background: '#ede9fe',
        color: '#6d28d9',
      }

    case 'Погружен':
      return {
        background: '#cffafe',
        color: '#155e75',
      }

    case 'В пути':
      return {
        background: '#e0e7ff',
        color: '#3730a3',
      }

    case 'Доставлен':
      return {
        background: '#dcfce7',
        color: '#166534',
      }

    case 'Оплачен':
      return {
        background: '#d1fae5',
        color: '#065f46',
      }

    case 'Завершён':
      return {
        background: '#e5e7eb',
        color: '#374151',
      }

    case 'Отменён':
      return {
        background: '#fee2e2',
        color: '#b91c1c',
      }

    default:
      return {}
  }
}

/* =========================
   STYLES
========================= */

const styles: Record<string, React.CSSProperties> = {
  sectionLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.12em',
    color: '#2563eb',
  },
  muted: {
    color: '#64748b',
    lineHeight: 1.5,
    fontSize: 14,
  },
  logoPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    marginTop: 12,
    borderRadius: 18,
    background: 'linear-gradient(135deg, #eff6ff, #f8fafc)',
    border: '1px solid #dbeafe',
  },
  headerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  headerBrandName: {
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: 0.5,
  },
  headerBrandCaption: {
    marginTop: 2,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  headerDivider: {
    height: 1,
    background: 'rgba(255,255,255,0.10)',
    margin: '18px 0',
  },
  loginError: {
    marginTop: -4,
    marginBottom: 10,
    padding: '11px 13px',
    borderRadius: 12,
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    color: '#be123c',
    fontSize: 13,
    fontWeight: 700,
  },
  loginSecureNote: {
    marginTop: 16,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 1.5,
  },
  detailTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 8,
  },
  detailTitle: {
    margin: '5px 0 0',
    fontSize: 23,
    color: '#0f172a',
  },
  loginPage: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at 15% 15%, rgba(37,99,235,0.24), transparent 30%), radial-gradient(circle at 85% 85%, rgba(14,165,233,0.18), transparent 35%), #07111f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    boxSizing: 'border-box',
    fontFamily: 'Inter, Arial, Helvetica, sans-serif',
  },

  loginCard: {
    width: '100%',
    maxWidth: 470,
    background: 'rgba(255,255,255,0.97)',
    border: '1px solid rgba(255,255,255,0.55)',
    borderRadius: 28,
    padding: 34,
    boxSizing: 'border-box',
    boxShadow: '0 30px 80px rgba(0,0,0,0.34)',
  },

  loginBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 32,
  },

  loginMark: {
    width: 58,
    height: 58,
    borderRadius: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
    color: 'white',
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: 1,
    boxShadow: '0 12px 25px rgba(37,99,235,0.28)',
  },

  loginBrandTitle: {
    fontSize: 23,
    fontWeight: 850,
    letterSpacing: -0.5,
    color: '#0f172a',
  },

  loginBrandSub: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
  },

  loginWelcome: {
    fontSize: 30,
    fontWeight: 850,
    letterSpacing: -0.8,
    color: '#0f172a',
    marginBottom: 7,
  },

  loginIntro: {
    margin: '0 0 26px',
    color: '#64748b',
    lineHeight: 1.55,
  },

  loginLogo: {
    fontSize: 70,
    textAlign: 'center',
    marginBottom: 10,
  },

  loginHint: {
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    color: '#64748b',
    fontSize: 12,
    lineHeight: 1.7,
  },

  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at 8% 4%, rgba(37,99,235,0.10), transparent 24%), radial-gradient(circle at 92% 10%, rgba(14,165,233,0.08), transparent 22%), linear-gradient(180deg, #eef4f8 0%, #f8fafc 46%, #edf3f8 100%)',
    fontFamily: 'Inter, Arial, Helvetica, sans-serif',
    color: '#0f172a',
    padding: '24px 18px 36px',
    boxSizing: 'border-box',
  },

  container: {
    width: '100%',
    maxWidth: 1120,
    margin: '0 auto',
  },

  header: {
    position: 'relative',
    overflow: 'hidden',
    background:
      'radial-gradient(circle at 88% 10%, rgba(56,189,248,0.22), transparent 24%), linear-gradient(135deg, #071426 0%, #102c55 58%, #1d4ed8 150%)',
    color: 'white',
    borderRadius: 26,
    padding: '27px 28px',
    marginBottom: 22,
    boxShadow: '0 18px 45px rgba(15,23,42,0.16)',
    border: '1px solid rgba(255,255,255,0.08)',
  },

  title: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.15,
    fontWeight: 850,
    letterSpacing: -0.7,
  },

  subtitle: {
    margin: '9px 0 0',
    color: 'rgba(255,255,255,0.70)',
    fontSize: 14,
    lineHeight: 1.5,
  },

  hero: {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: 'rgba(255,255,255,0.82)',
    border: '1px solid rgba(226,232,240,0.9)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    boxShadow: '0 10px 28px rgba(15,23,42,0.06)',
  },

  heroMark: {
    width: 62,
    height: 62,
    flex: '0 0 62px',
    borderRadius: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
    color: 'white',
    fontWeight: 900,
    letterSpacing: 1.5,
    boxShadow: '0 12px 24px rgba(37,99,235,0.22)',
  },

  heroKicker: {
    fontSize: 12,
    fontWeight: 850,
    letterSpacing: 1.5,
    color: '#1d4ed8',
    marginBottom: 5,
  },

  heroText: {
    fontSize: 18,
    fontWeight: 750,
    color: '#0f172a',
  },

  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: '50%',
    right: -70,
    top: -90,
    background: 'rgba(37,99,235,0.10)',
  },

  logo: {
    fontSize: 90,
    textAlign: 'center',
    marginBottom: 20,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
    gap: 16,
  },

  bigButton: {
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid #dbe5ef',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.99), rgba(248,251,255,0.97))',
    borderRadius: 22,
    padding: 22,
    display: 'flex',
    alignItems: 'center',
    gap: 17,
    cursor: 'pointer',
    textAlign: 'left',
    boxShadow: '0 10px 28px rgba(15,23,42,0.06)',
    minHeight: 122,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
  },

  bigIcon: {
    width: 54,
    height: 54,
    flex: '0 0 54px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    background: 'linear-gradient(145deg, #eff6ff, #dbeafe)',
    color: '#1d4ed8',
    fontSize: 29,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 18px rgba(37,99,235,0.12)',
  },

  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f1f5f9',
    color: '#64748b',
    fontSize: 18,
    fontWeight: 800,
  },

  bigTitle: {
    display: 'block',
    fontSize: 18,
    marginBottom: 6,
    color: '#0f172a',
  },

  bigSubtitle: {
    display: 'block',
    color: '#64748b',
    lineHeight: 1.45,
    fontSize: 13,
  },

  form: {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.99), rgba(248,251,255,0.98))',
    padding: 24,
    borderRadius: 26,
    border: '1px solid #dbe5ef',
    boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
  },

  label: {
    display: 'block',
    fontWeight: 750,
    marginBottom: 17,
    color: '#1e293b',
    fontSize: 14,
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    marginTop: 8,
    padding: '13px 14px',
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    fontSize: 16,
    background: '#ffffff',
    color: '#0f172a',
    WebkitTextFillColor: '#0f172a',
    outline: 'none',
    fontFamily: 'Inter, Arial, Helvetica, sans-serif',
    boxShadow: '0 2px 5px rgba(15,23,42,0.03), inset 0 1px 2px rgba(15,23,42,0.03)',
  },

  twoColumns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 16,
  },

  checkRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginBottom: 15,
    fontWeight: 700,
    color: '#334155',
  },

  priceBox: {
    background: 'linear-gradient(135deg, #eff6ff, #f8fafc)',
    border: '1px solid #dbeafe',
    borderRadius: 18,
    padding: 19,
    margin: '20px 0',
    lineHeight: 1.9,
    color: '#334155',
  },

  total: {
    display: 'block',
    fontSize: 27,
    marginTop: 8,
    color: '#1d4ed8',
    letterSpacing: -0.5,
  },

  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15,
    marginTop: 20,
    paddingTop: 20,
    borderTop: '1px solid #e2e8f0',
    fontSize: 21,
    fontWeight: 800,
  },

  primaryButton: {
    width: '100%',
    border: 'none',
    borderRadius: 13,
    padding: '14px 18px',
    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
    color: 'white',
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: 10,
    marginBottom: 10,
    boxShadow: '0 12px 24px rgba(37,99,235,0.22)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },

  secondaryButton: {
    width: '100%',
    border: '1px solid #cbd5e1',
    borderRadius: 13,
    padding: '13px 18px',
    background: 'rgba(255,255,255,0.92)',
    color: '#334155',
    fontSize: 15,
    fontWeight: 750,
    cursor: 'pointer',
    marginTop: 10,
    marginBottom: 10,
  },

  dangerButton: {
    width: '100%',
    border: '1px solid #fecaca',
    borderRadius: 13,
    padding: '14px 18px',
    background: '#fff1f2',
    color: '#be123c',
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: 16,
  },

  card: {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.99), rgba(248,251,255,0.97))',
    border: '1px solid #e2e8f0',
    borderRadius: 22,
    padding: 22,
    boxShadow: '0 10px 28px rgba(15,23,42,0.05)',
    marginBottom: 16,
  },

  warning: {
    background: '#fff7ed',
    color: '#9a3412',
    border: '1px solid #fed7aa',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    lineHeight: 1.5,
  },

  success: {
    background: 'rgba(255,255,255,0.97)',
    border: '1px solid #d1fae5',
    borderRadius: 24,
    padding: 30,
    textAlign: 'center',
    boxShadow: '0 14px 34px rgba(15,23,42,0.07)',
  },

  successIcon: {
    fontSize: 65,
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
  },

  orderCard: {
    width: '100%',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.99), rgba(249,251,255,0.98))',
    border: '1px solid #e2e8f0',
    borderRadius: 19,
    padding: 18,
    textAlign: 'left',
    cursor: 'pointer',
    boxShadow: '0 7px 22px rgba(15,23,42,0.05)',
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  orderMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 1.4,
  },

  badge: {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },

  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 20,
    padding: '12px 0',
    borderBottom: '1px solid #eef2f7',
  },

  infoTitle: {
    color: '#64748b',
  },

  infoValue: {
    fontWeight: 750,
    textAlign: 'right',
    color: '#1e293b',
  },

  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
    gap: 13,
    marginBottom: 18,
  },

  stat: {
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.99), rgba(247,250,255,0.97))',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 18,
    textAlign: 'left',
    boxShadow: '0 9px 25px rgba(15,23,42,0.055)',
  },

  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#eff6ff',
    color: '#2563eb',
    fontWeight: 900,
    marginBottom: 12,
  },

  statValue: {
    display: 'block',
    fontSize: 30,
    lineHeight: 1,
    letterSpacing: -1,
    color: '#0f172a',
    marginBottom: 7,
  },

  statTitle: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: 700,
  },

  statusButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 25,
  },

  statusButton: {
    border: '1px solid #cbd5e1',
    background: 'white',
    color: '#334155',
    padding: '9px 12px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 750,
    fontSize: 13,
    transition: 'all 0.15s ease',
  },

  statusButtonActive: {
    background: '#0f172a',
    color: 'white',
    borderColor: '#0f172a',
  },

  driverButtons: {
    marginTop: 15,
  },

  empty: {
    background: 'rgba(255,255,255,0.92)',
    border: '1px dashed #cbd5e1',
    borderRadius: 18,
    padding: 30,
    textAlign: 'center',
    color: '#64748b',
  },

  footer: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: '32px 0 8px',
    fontSize: 12,
    letterSpacing: 0.2,
  },
}


export default App
