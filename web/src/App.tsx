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
type PaymentStatus = 'Не оплачено' | 'Оплачено'

type Role =
  | 'platformAdmin'
  | 'admin'
  | 'manager'
  | 'plantBoss'
  | 'client'
  | 'driver'
  | 'operator'

type User = {
  id: string
  login: string
  password: string
  name: string
  role: Role
  enterpriseId?: string
  plantIds?: string[]
  active?: boolean
}

type PlantType = 'concrete' | 'asphalt'

type Plant = {
  id: string
  name: string
  type: PlantType
  city: string
  active: boolean
}

type Enterprise = {
  id: string
  name: string
  shortName: string
  logoUrl: string
  active: boolean
  plants: Plant[]
  createdAt: string
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
  paymentStatus?: PaymentStatus
  comment: string
  urgent: boolean
  weekend: boolean
  total: number
  status: Status
  driver: string
  driverId?: string
  vehicleId?: string
  vehicleNumber?: string
  createdAt: string
  clientId?: string
  plantId?: string
  loadedAt?: string
  departedAt?: string
  arrivedAt?: string
  unloadedAt?: string
  returnedAt?: string
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
  | 'plantBoss'
  | 'plantBossOrder'
  | 'operator'
  | 'production'
  | 'materials'
  | 'recipes'
  | 'vehicles'
  | 'reports'
  | 'driver'
  | 'driverOrderDetail'
  | 'settings'
  | 'adminUsers'
  | 'platformAdmin'
  | 'enterpriseAdmin'

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

const defaultEnterprises: Enterprise[] = [
  {
    id: 'ent-demo',
    name: 'Демонстрационное предприятие',
    shortName: 'Демо',
    logoUrl: '',
    active: true,
    createdAt: new Date().toISOString(),
    plants: [
      {
        id: 'plant-maikop',
        name: 'Майкоп — бетон',
        type: 'concrete',
        city: 'Майкоп',
        active: true,
      },
      {
        id: 'plant-kashekhabl-concrete',
        name: 'Кошехабль — бетон',
        type: 'concrete',
        city: 'Кошехабль',
        active: true,
      },
      {
        id: 'plant-kashekhabl-asphalt',
        name: 'Кошехабль — асфальт',
        type: 'asphalt',
        city: 'Кошехабль',
        active: true,
      },
    ],
  },
]

const defaultUsers: User[] = [
  {
    id: 'u-admin',
    login: 'admin',
    password: 'admin123',
    name: 'Центральный администратор SIVIOT',
    role: 'platformAdmin',
    active: true,
  },
  {
    id: 'u-manager',
    login: 'manager',
    password: 'manager123',
    name: 'Руководитель',
    role: 'manager',
    enterpriseId: 'ent-demo',
    plantIds: ['plant-maikop', 'plant-kashekhabl-concrete', 'plant-kashekhabl-asphalt'],
    active: true,
  },
  {
    id: 'u-plantboss',
    login: 'boss',
    password: 'boss123',
    name: 'Начальник Майкопского завода',
    role: 'plantBoss',
    enterpriseId: 'ent-demo',
    plantIds: ['plant-maikop'],
    active: true,
  },
  {
    id: 'u-operator',
    login: 'operator',
    password: 'operator123',
    name: 'Тестовый оператор Майкопского завода',
    role: 'operator',
    enterpriseId: 'ent-demo',
    plantIds: ['plant-maikop'],
    active: true,
  },
  {
    id: 'u-client',
    login: 'client',
    password: 'client123',
    name: 'Тестовый клиент',
    role: 'client',
    enterpriseId: 'ent-demo',
    active: true,
  },
  {
    id: 'u-driver',
    login: 'driver',
    password: 'driver123',
    name: 'Тестовый водитель',
    role: 'driver',
    enterpriseId: 'ent-demo',
    plantIds: ['plant-maikop'],
    active: true,
  },
]

function roleName(role: Role) {
  switch (role) {
    case 'platformAdmin':
      return 'Центральный администратор SIVIOT'
    case 'admin':
      return 'Администратор предприятия'
    case 'manager':
      return 'Руководитель'
    case 'plantBoss':
      return 'Начальник завода'
    case 'client':
      return 'Клиент'
    case 'driver':
      return 'Водитель'
    case 'operator':
      return 'Оператор'
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

  const [enterprises, setEnterprises] = useState<Enterprise[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('siviotEnterprises') || 'null')
      return Array.isArray(saved) && saved.length ? saved : defaultEnterprises
    } catch {
      return defaultEnterprises
    }
  })

  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string | null>(null)

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
    localStorage.setItem('siviotEnterprises', JSON.stringify(enterprises))
  }, [enterprises])

  useEffect(() => {
    const savedId = localStorage.getItem('concreteCurrentUser')
    if (savedId) {
      const savedUser = users.find((u) => u.id === savedId)
      if (savedUser) {
        setCurrentUser(savedUser)
        setPage(savedUser.role === 'platformAdmin' ? 'platformAdmin' : 'home')
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
      (u) =>
        u.login === loginValue.trim() &&
        u.password === passwordValue &&
        u.active !== false,
    )

    if (!found) {
      return false
    }

    if (
      found.role !== 'platformAdmin' &&
      found.enterpriseId &&
      !enterprises.some((enterprise) => enterprise.id === found.enterpriseId && enterprise.active)
    ) {
      return false
    }

    setCurrentUser(found)
    localStorage.setItem('concreteCurrentUser', found.id)
    setPage(found.role === 'platformAdmin' ? 'platformAdmin' : 'home')
    return true
  }

  function logout() {
    localStorage.removeItem('concreteCurrentUser')
    setCurrentUser(null)
    setSelectedOrderId(null)
    setSelectedEnterpriseId(null)
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
      paymentStatus: 'Не оплачено',
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
      {page === 'platformAdmin' && currentUser.role === 'platformAdmin' && (
        <PlatformAdmin
          enterprises={enterprises}
          users={users}
          onAddEnterprise={(enterprise) =>
            setEnterprises((prev) => [...prev, enterprise])
          }
          onUpdateEnterprise={(id, changes) =>
            setEnterprises((prev) =>
              prev.map((enterprise) =>
                enterprise.id === id ? { ...enterprise, ...changes } : enterprise,
              ),
            )
          }
          onManageEnterprise={(id) => {
            setSelectedEnterpriseId(id)
            setPage('enterpriseAdmin')
          }}
          onLogout={logout}
        />
      )}

      {page === 'enterpriseAdmin' &&
        currentUser.role === 'platformAdmin' &&
        selectedEnterpriseId && (
          <EnterpriseAdmin
            enterprise={enterprises.find((item) => item.id === selectedEnterpriseId)!}
            users={users.filter((user) => user.enterpriseId === selectedEnterpriseId)}
            onBack={() => setPage('platformAdmin')}
            onUpdateEnterprise={(changes) =>
              setEnterprises((prev) =>
                prev.map((item) =>
                  item.id === selectedEnterpriseId
                    ? { ...item, ...changes }
                    : item,
                ),
              )
            }
            onAddUser={(user) => setUsers((prev) => [...prev, user])}
            onUpdateUser={(id, changes) =>
              setUsers((prev) =>
                prev.map((user) =>
                  user.id === id ? { ...user, ...changes } : user,
                ),
              )
            }
            onDeleteUser={(id) =>
              setUsers((prev) => prev.filter((user) => user.id !== id))
            }
          />
        )}

      {page === 'home' && (
        <Home
          user={currentUser}
          companyName={settings.companyName}
          onClient={() => setPage('client')}
          onManager={() => setPage('manager')}
          onPlantBoss={() => setPage('plantBoss')}
          onOperator={() => setPage('operator')}
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
          user={currentUser}
          enterprise={
            currentUser.enterpriseId
              ? enterprises.find((item) => item.id === currentUser.enterpriseId) || null
              : enterprises[0] || null
          }
          onHome={goHome}
          onOpen={(id) => openOrder(id, 'managerOrder')}
        />
      )}

      {page === 'managerOrder' && selectedOrder && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
        <ManagerOrder
          order={selectedOrder}
          drivers={users.filter((user) => user.role === 'driver')}
          enterprise={
            currentUser.enterpriseId
              ? enterprises.find((item) => item.id === currentUser.enterpriseId) || null
              : enterprises[0] || null
          }
          onBack={() => setPage('manager')}
          onUpdate={updateOrder}
        />
      )}

      {page === 'plantBoss' && currentUser.role === 'plantBoss' && (
        <PlantBoss
          orders={orders}
          user={currentUser}
          enterprise={
            currentUser.enterpriseId
              ? enterprises.find((item) => item.id === currentUser.enterpriseId) || null
              : null
          }
          onHome={goHome}
          onOpen={(id) => openOrder(id, 'plantBossOrder')}
          onProduction={() => setPage('production')}
          onMaterials={() => setPage('materials')}
          onRecipes={() => setPage('recipes')}
          onVehicles={() => setPage('vehicles')}
          onReports={() => setPage('reports')}
        />
      )}

      {page === 'plantBossOrder' && selectedOrder && currentUser.role === 'plantBoss' && (
        <PlantBossOrder
          order={selectedOrder}
          enterprise={
            currentUser.enterpriseId
              ? enterprises.find((item) => item.id === currentUser.enterpriseId) || null
              : null
          }
          onBack={() => setPage('plantBoss')}
          onUpdate={updateOrder}
        />
      )}

      {page === 'production' && currentUser.role === 'plantBoss' && (
        <Production
          orders={orders}
          user={currentUser}
          enterprise={
            currentUser.enterpriseId
              ? enterprises.find((item) => item.id === currentUser.enterpriseId) || null
              : null
          }
          onBack={() => setPage('plantBoss')}
          onOpen={(id) => openOrder(id, 'plantBossOrder')}
          onUpdate={updateOrder}
        />
      )}

      {page === 'materials' && currentUser.role === 'plantBoss' && (
        <Materials
          user={currentUser}
          enterprise={
            currentUser.enterpriseId
              ? enterprises.find((item) => item.id === currentUser.enterpriseId) || null
              : null
          }
          onBack={() => setPage('plantBoss')}
        />
      )}

      {page === 'recipes' && currentUser.role === 'plantBoss' && (
        <Recipes
          user={currentUser}
          enterprise={
            currentUser.enterpriseId
              ? enterprises.find((item) => item.id === currentUser.enterpriseId) || null
              : null
          }
          onBack={() => setPage('plantBoss')}
        />
      )}

      {page === 'vehicles' && currentUser.role === 'plantBoss' && (
        <Vehicles
          enterprise={
            currentUser.enterpriseId
              ? enterprises.find((item) => item.id === currentUser.enterpriseId) || null
              : null
          }
          onBack={() => setPage('plantBoss')}
        />
      )}

      {page === 'reports' && currentUser.role === 'plantBoss' && (
        <Reports
          orders={orders}
          user={currentUser}
          enterprise={
            currentUser.enterpriseId
              ? enterprises.find((item) => item.id === currentUser.enterpriseId) || null
              : null
          }
          onBack={() => setPage('plantBoss')}
        />
      )}

      {page === 'operator' && currentUser.role === 'operator' && (
        <Operator
          orders={orders}
          user={currentUser}
          enterprise={
            currentUser.enterpriseId
              ? enterprises.find((item) => item.id === currentUser.enterpriseId) || null
              : null
          }
          onHome={goHome}
          onOpen={(id) => openOrder(id, 'managerOrder')}
          onUpdate={updateOrder}
        />
      )}

      {page === 'driver' && currentUser.role === 'driver' && (
        <Driver
          orders={orders}
          driverId={currentUser.id}
          driverName={currentUser.name}
          onHome={goHome}
          onOpen={(id) => openOrder(id, 'managerOrder')}
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
  onPlantBoss,
  onOperator,
  onDriver,
  onSettings,
  onAdminUsers,
  onLogout,
}: {
  user: User
  companyName: string
  onClient: () => void
  onManager: () => void
  onPlantBoss: () => void
  onOperator: () => void
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
        <div>
          <div style={styles.heroKicker}>{companyName}</div>
          <div style={styles.heroText}>Бетон • Доставка • Контроль</div>
        </div>
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

        {user.role === 'plantBoss' && (
          <BigButton
            icon="👷"
            title="Начальник завода"
            subtitle="Заказы, производство, склад и транспорт"
            onClick={onPlantBoss}
          />
        )}

        {user.role === 'operator' && (
          <BigButton
            icon="🏗️"
            title="Оператор завода"
            subtitle="Очередь загрузки и отгрузка"
            onClick={onOperator}
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
  orderTotal,
  updateForm,
  onBack,
  onReview,
}: {
  form: typeof defaultOrder
  settings: Settings
  concretePrice: number
  concreteTotal: number
  orderTotal: number
  updateForm: (
    field: keyof typeof defaultOrder,
    value: string | number | boolean,
  ) => void
  onBack: () => void
  onReview: () => void
}) {
  const surchargeTotal =
    (form.urgent ? settings.urgentPrice : 0) +
    (form.weekend ? settings.weekendPrice : 0)

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
        <InfoRow title="Способ оплаты" value={order.payment} />
        <InfoRow title="Статус оплаты" value={order.paymentStatus || 'Не оплачено'} />
        <InfoRow title="Машина" value={order.vehicleNumber || "Не назначена"} />
        <InfoRow title="Водитель" value={order.driver || "Не назначен"} />
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
  user,
  enterprise,
  onHome,
  onOpen,
}: {
  orders: Order[]
  user: User
  enterprise: Enterprise | null
  onHome: () => void
  onOpen: (id: string) => void
}) {
  const availablePlants = useMemo(() => {
    if (!enterprise) return []
    const assignedIds =
      user.role === 'manager' && user.plantIds?.length
        ? user.plantIds
        : enterprise.plants.map((plant) => plant.id)

    return enterprise.plants.filter(
      (plant) => plant.active && assignedIds.includes(plant.id),
    )
  }, [enterprise, user])

  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>(
    availablePlants.map((plant) => plant.id),
  )
  const [filter, setFilter] = useState<'Все' | Status>('Все')

  useEffect(() => {
    setSelectedPlantIds((prev) => {
      const valid = prev.filter((id) =>
        availablePlants.some((plant) => plant.id === id),
      )
      return valid.length ? valid : availablePlants.map((plant) => plant.id)
    })
  }, [availablePlants])

  const selectedOrders = useMemo(() => {
    if (!selectedPlantIds.length) return []
    return orders.filter(
      (order) => order.plantId && selectedPlantIds.includes(order.plantId),
    )
  }, [orders, selectedPlantIds])

  const unassignedOrders = useMemo(
    () => orders.filter((order) => !order.plantId),
    [orders],
  )

  const filteredOrders = useMemo(() => {
    if (filter === 'Все') return selectedOrders
    return selectedOrders.filter((order) => order.status === filter)
  }, [selectedOrders, filter])

  const activeCount = selectedOrders.filter(
    (o) => o.status !== 'Завершён' && o.status !== 'Отменён',
  ).length

  function togglePlant(id: string) {
    setSelectedPlantIds((prev) =>
      prev.includes(id)
        ? prev.filter((plantId) => plantId !== id)
        : [...prev, id],
    )
  }

  function selectAllPlants() {
    setSelectedPlantIds(availablePlants.map((plant) => plant.id))
  }

  function clearPlants() {
    setSelectedPlantIds([])
  }

  return (
    <Page title="Руководитель" subtitle="Выбор объектов и управление заказами">
      <div style={styles.card}>
        <div style={styles.sectionLabel}>МОИ ПРОИЗВОДСТВЕННЫЕ ОБЪЕКТЫ</div>
        <p style={styles.muted}>
          Выберите один или несколько заводов. После выбора ниже отображаются
          только заказы выбранных объектов.
        </p>

        {availablePlants.length === 0 ? (
          <Empty text="Активных назначенных заводов пока нет." />
        ) : (
          <>
            <div style={styles.twoColumns}>
              <button style={styles.secondaryButton} onClick={selectAllPlants}>
                ☑️ Выбрать все
              </button>
              <button style={styles.secondaryButton} onClick={clearPlants}>
                Снять выбор
              </button>
            </div>

            <div style={styles.list}>
              {availablePlants.map((plant) => {
                const selected = selectedPlantIds.includes(plant.id)
                return (
                  <button
                    key={plant.id}
                    style={{
                      ...styles.card,
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: selected
                        ? '2px solid #2563eb'
                        : '1px solid #e2e8f0',
                      background: selected ? '#eff6ff' : '#ffffff',
                    }}
                    onClick={() => togglePlant(plant.id)}
                  >
                    <div style={styles.cardHeader}>
                      <div>
                        <strong>{plant.name}</strong>
                        <div style={styles.muted}>
                          {plant.city} •{' '}
                          {plant.type === 'concrete'
                            ? 'Бетонный завод'
                            : 'Асфальтный завод'}
                        </div>
                      </div>
                      <span style={styles.badge}>
                        {selected ? 'Выбран' : 'Не выбран'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div style={styles.stats}>
        <Stat title="Выбрано заводов" value={selectedPlantIds.length} />
        <Stat title="Заказов" value={selectedOrders.length} />
        <Stat title="Активных" value={activeCount} />
        <Stat
          title="Нераспределённых"
          value={unassignedOrders.length}
        />
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>РАБОЧАЯ ОЧЕРЕДЬ</div>

        <select
          style={styles.input}
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'Все' | Status)}
        >
          <option value="Все">Все заказы</option>
          <option value="Новый">Новые</option>
          <option value="Подтверждён">Подтверждённые</option>
          <option value="Запланирован">Запланированные</option>
          <option value="Производство">Производство</option>
          <option value="Погружен">Погружены</option>
          <option value="В пути">В пути</option>
          <option value="Доставлен">Доставлены</option>
          <option value="Оплачен">Оплаченные</option>
          <option value="Завершён">Завершённые</option>
          <option value="Отменён">Отменённые</option>
        </select>

        {!selectedPlantIds.length ? (
          <Empty text="Выберите хотя бы один завод выше." />
        ) : filteredOrders.length === 0 ? (
          <Empty text="Для выбранных заводов заказов с таким статусом пока нет." />
        ) : (
          <div style={styles.list}>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => onOpen(order.id)}
              />
            ))}
          </div>
        )}
      </div>

      {unassignedOrders.length > 0 && (
        <div style={styles.card}>
          <div style={styles.sectionLabel}>ЗАКАЗЫ БЕЗ НАЗНАЧЕННОГО ЗАВОДА</div>
          <p style={styles.muted}>
            Эти заказы ещё не привязаны к производственному объекту. Их можно
            открыть и назначить завод в карточке заказа.
          </p>
          <div style={styles.list}>
            {unassignedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => onOpen(order.id)}
              />
            ))}
          </div>
        </div>
      )}

      <BackButton onClick={onHome} text="На главную" />
    </Page>
  )
}

function ManagerOrder({
  order,
  drivers,
  enterprise,
  onBack,
  onUpdate,
}: {
  order: Order
  drivers: User[]
  enterprise: Enterprise | null
  onBack: () => void
  onUpdate: (id: string, changes: Partial<Order>) => void
}) {
  const [driverId, setDriverId] = useState(order.driverId || '')
  const [plantId, setPlantId] = useState(order.plantId || '')
  const selectedDriver = drivers.find((driver) => driver.id === driverId)

  const activePlants = enterprise?.plants.filter((plant) => plant.active) || []

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

  function assignPlant() {
    if (!plantId) {
      alert('Выберите производственный объект')
      return
    }

    onUpdate(order.id, { plantId })
    alert('Производственный объект назначен')
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
        <InfoRow title="Способ оплаты" value={order.payment} />
        <InfoRow title="Статус оплаты" value={order.paymentStatus || 'Не оплачено'} />
        <InfoRow title="Сумма" value={`${order.total.toFixed(2)} €`} />
        <InfoRow title="Водитель" value={order.driver || 'Не назначен'} />
        <InfoRow
          title="Завод"
          value={
            activePlants.find((plant) => plant.id === order.plantId)?.name ||
            'Не назначен'
          }
        />
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>НАЗНАЧЕНИЕ ПРОИЗВОДСТВА</div>

        <label style={styles.label}>
          Производственный объект
          <select
            style={styles.input}
            value={plantId}
            onChange={(e) => setPlantId(e.target.value)}
          >
            <option value="">Выберите завод</option>
            {activePlants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name} — {plant.city}
              </option>
            ))}
          </select>
        </label>

        <button style={styles.primaryButton} onClick={assignPlant}>
          🏭 Назначить завод
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>НАЗНАЧЕНИЕ ВОДИТЕЛЯ</div>

        <label style={styles.label}>
          Водитель
          <select
            style={styles.input}
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
          >
            <option value="">Выберите водителя</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>
        </label>

        <button style={styles.primaryButton} onClick={assignDriver}>
          🚚 Назначить водителя
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>ОПЛАТА</div>
        <p style={styles.muted}>Оплата не меняет этап доставки. Её можно отметить отдельно после получения платежа.</p>
        {order.paymentStatus === 'Оплачено' ? (
          <div style={styles.successBox}>Оплата отмечена: оплачено</div>
        ) : (
          <button
            style={styles.primaryButton}
            onClick={() => onUpdate(order.id, { paymentStatus: 'Оплачено' })}
          >
            💳 ОТМЕТИТЬ КАК ОПЛАЧЕНО
          </button>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>СТАТУС ЗАКАЗА</div>

        <div style={styles.list}>
          {nextStatuses.map((status) => (
            <button
              key={status}
              style={
                order.status === status
                  ? styles.primaryButton
                  : styles.secondaryButton
              }
              onClick={() => changeStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <BackButton onClick={onBack} text="Назад к руководству" />
    </Page>
  )
}


/* =========================
   PLANT BOSS
========================= */

function PlantBoss({
  orders,
  user,
  enterprise,
  onHome,
  onOpen,
  onProduction,
  onMaterials,
  onRecipes,
  onVehicles,
  onReports,
}: {
  orders: Order[]
  user: User
  enterprise: Enterprise | null
  onHome: () => void
  onOpen: (id: string) => void
  onProduction: () => void
  onMaterials: () => void
  onRecipes: () => void
  onVehicles: () => void
  onReports: () => void
}) {
  const plants = enterprise?.plants.filter(
    (plant) => plant.active && (user.plantIds || []).includes(plant.id),
  ) || []
  const [plantId, setPlantId] = useState(plants[0]?.id || '')
  useEffect(() => {
    if (!plants.some((plant) => plant.id === plantId)) setPlantId(plants[0]?.id || '')
  }, [plants, plantId])

  const plantOrders = orders.filter((order) => order.plantId === plantId)
  const active = plantOrders.filter((o) => !['Завершён', 'Отменён'].includes(o.status))
  const newOrders = plantOrders.filter((o) => o.status === 'Новый')
  const productionOrders = plantOrders.filter((o) =>
    ['Подтверждён', 'Запланирован', 'Производство'].includes(o.status),
  )
  const delivered = plantOrders.filter((o) => ['Доставлен', 'Оплачен', 'Завершён'].includes(o.status))

  const selectedPlant = plants.find((plant) => plant.id === plantId)

  return (
    <Page
      title="Начальник завода"
      subtitle={selectedPlant ? `${selectedPlant.name} • ${selectedPlant.city}` : 'Выберите производственный объект'}
    >
      {plants.length === 0 ? (
        <Empty text="Вам не назначен активный завод." />
      ) : (
        <>
          <div style={styles.card}>
            <div style={styles.sectionLabel}>МОЙ ЗАВОД</div>
            <select
              style={styles.input}
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
            >
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name} — {plant.type === 'concrete' ? 'бетон' : 'асфальт'}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.stats}>
            <Stat title="Активных заказов" value={active.length} />
            <Stat title="Новых" value={newOrders.length} />
            <Stat title="В производстве" value={productionOrders.length} />
            <Stat title="Завершено" value={delivered.length} />
          </div>

          <div style={styles.grid}>
            <BigButton icon="📋" title="Заказы" subtitle={`${plantOrders.length} заказов по заводу`} onClick={() => {}} />
            <BigButton icon="🏗️" title="Производство" subtitle="Очередь сегодняшней загрузки" onClick={onProduction} />
            <BigButton icon="📦" title="Склад" subtitle="Материалы, приход и расход" onClick={onMaterials} />
            {selectedPlant?.type === 'concrete' && (
              <BigButton icon="🧪" title="Рецептуры" subtitle="Составы бетона и нормы расхода" onClick={onRecipes} />
            )}
            <BigButton icon="🚚" title="Машины" subtitle="Автомобили и водители" onClick={onVehicles} />
            <BigButton icon="📊" title="Отчёты" subtitle="Производство, отгрузка и остатки" onClick={onReports} />
          </div>

          <div style={styles.card}>
            <div style={styles.sectionLabel}>НОВЫЕ ЗАКАЗЫ</div>
            {newOrders.length === 0 ? (
              <Empty text="Новых заказов для этого завода нет." />
            ) : (
              <div style={styles.list}>
                {newOrders.slice(0, 6).map((order) => (
                  <OrderCard key={order.id} order={order} onClick={() => onOpen(order.id)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <BackButton onClick={onHome} text="На главную" />
    </Page>
  )
}

function PlantBossOrder({
  order,
  enterprise,
  onBack,
  onUpdate,
}: {
  order: Order
  enterprise: Enterprise | null
  onBack: () => void
  onUpdate: (id: string, changes: Partial<Order>) => void
}) {
  const [deliveryCost, setDeliveryCost] = useState(order.deliveryCost)
  const [vehicleId, setVehicleId] = useState(order.vehicleId || '')
  const activePlants = enterprise?.plants.filter((plant) => plant.active) || []
  const [vehicles] = useState<{ id: string; number: string; model: string; driver: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`siviotVehicles:${enterprise?.id || 'none'}`) || '[]')
    } catch {
      return []
    }
  })
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId)

  function save() {
    const nextDelivery = Math.max(0, Number(deliveryCost) || 0)
    onUpdate(order.id, {
      deliveryCost: nextDelivery,
      total: Math.max(0, order.total - order.deliveryCost + nextDelivery),
      vehicleId: selectedVehicle?.id,
      vehicleNumber: selectedVehicle?.number,
      driver: selectedVehicle?.driver || order.driver,
      status: order.status === 'Новый' ? 'Подтверждён' : order.status,
    })
    alert('Заказ подтверждён и сохранён')
  }

  return (
    <Page title={order.id} subtitle="Управление заказом начальником завода">
      <div style={styles.card}>
        <StatusBadge status={order.status} />
        <InfoRow title="Материал / марка" value={order.grade} />
        <InfoRow title="Объём" value={`${order.volume} м³`} />
        <InfoRow title="Адрес" value={order.address} />
        <InfoRow title="Дата и время" value={`${order.date} • ${order.time}`} />
        <InfoRow title="Водитель" value={order.driver || 'Не назначен'} />
        <InfoRow title="Стоимость заказа" value={`${order.total.toFixed(2)} €`} />
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>ПЛАНИРОВАНИЕ</div>
        <label style={styles.label}>
          Завод
          <select style={styles.input} value={order.plantId || ''} disabled>
            <option value="">Не назначен</option>
            {activePlants.map((plant) => (
              <option key={plant.id} value={plant.id}>{plant.name}</option>
            ))}
          </select>
        </label>

        <label style={styles.label}>
          Стоимость доставки, €
          <input
            style={styles.input}
            type="number"
            min="0"
            value={deliveryCost}
            onChange={(e) => setDeliveryCost(Number(e.target.value))}
          />
        </label>

        <label style={styles.label}>
          Машина
          <select
            style={styles.input}
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">Не назначена</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.number} {vehicle.model ? `• ${vehicle.model}` : ''} {vehicle.driver ? `• ${vehicle.driver}` : ''}
              </option>
            ))}
          </select>
        </label>

        <button style={styles.primaryButton} onClick={save}>
          ✅ Подтвердить и сохранить
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>СТАТУС ПРОИЗВОДСТВА</div>
        <div style={styles.list}>
          {(['Новый', 'Подтверждён', 'Запланирован', 'Производство'] as Status[]).map((status) => (
            <button
              key={status}
              style={order.status === status ? styles.primaryButton : styles.secondaryButton}
              onClick={() => onUpdate(order.id, { status })}
            >
              {status}
            </button>
          ))}
          <div style={styles.muted}>
            Факт загрузки подтверждает оператор завода. Начальник только принимает заказ, назначает завод, машину и водителя, а затем контролирует результат.
          </div>
        </div>
      </div>

      <BackButton onClick={onBack} text="Назад к заводу" />
    </Page>
  )
}

function Production({
  orders,
  user,
  enterprise,
  onBack,
  onOpen,
  onUpdate,
}: {
  orders: Order[]
  user: User
  enterprise: Enterprise | null
  onBack: () => void
  onOpen: (id: string) => void
  onUpdate: (id: string, changes: Partial<Order>) => void
}) {
  const plantIds = new Set((user.plantIds || []).filter((id) => enterprise?.plants.some((p) => p.id === id && p.active)))
  const queue = orders
    .filter((order) => order.plantId && plantIds.has(order.plantId))
    .filter((order) => ['Подтверждён', 'Запланирован', 'Производство', 'Погружен'].includes(order.status))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))

  return (
    <Page title="Производственная очередь" subtitle="Загрузка и отгрузка по назначенным заводам">
      {queue.length === 0 ? (
        <Empty text="В производственной очереди пока нет заказов." />
      ) : (
        <div style={styles.list}>
          {queue.map((order) => (
            <div key={order.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <strong>{order.id}</strong>
                <StatusBadge status={order.status} />
              </div>
              <InfoRow title="Материал" value={`${order.grade}, ${order.volume} м³`} />
              <InfoRow title="Время" value={`${order.date} • ${order.time}`} />
              <InfoRow title="Адрес" value={order.address} />
              <InfoRow title="Машина / водитель" value={order.driver || 'Не назначен'} />

              {order.status === 'Подтверждён' || order.status === 'Запланирован' ? (
                <button
                  style={styles.primaryButton}
                  onClick={() => onUpdate(order.id, { status: 'Производство' })}
                >
                  ▶️ Начать загрузку
                </button>
              ) : null}

              <div style={styles.muted}>
                Загрузка выполняется оператором завода.
              </div>

              <button style={styles.secondaryButton} onClick={() => onOpen(order.id)}>
                Подробнее
              </button>
            </div>
          ))}
        </div>
      )}
      <BackButton onClick={onBack} text="Назад к заводу" />
    </Page>
  )
}

function Operator({
  orders,
  user,
  enterprise,
  onHome,
  onOpen,
  onUpdate,
}: {
  orders: Order[]
  user: User
  enterprise: Enterprise | null
  onHome: () => void
  onOpen: (id: string) => void
  onUpdate: (id: string, changes: Partial<Order>) => void
}) {
  const plantIds = new Set(
    (user.plantIds || []).filter((id) =>
      enterprise?.plants.some((plant) => plant.id === id && plant.active),
    ),
  )

  const queue = orders
    .filter((order) => !!order.plantId && plantIds.has(order.plantId))
    .filter((order) =>
      ['Подтверждён', 'Запланирован', 'Производство'].includes(order.status),
    )
    .sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
    )

  const loaded = orders
    .filter((order) => !!order.plantId && plantIds.has(order.plantId))
    .filter((order) => order.status === 'Погружен')
    .sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
    )

  const plantNames = Array.from(plantIds)
    .map((id) => enterprise?.plants.find((plant) => plant.id === id)?.name)
    .filter(Boolean)
    .join(', ')

  return (
    <Page
      title="Оператор завода"
      subtitle={plantNames || 'Производственный объект не назначен'}
    >
      <div style={styles.stats}>
        <Stat title="В очереди" value={queue.length} />
        <Stat title="На загрузке" value={queue.filter((o) => o.status === 'Производство').length} />
        <Stat title="Загружено" value={loaded.length} />
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>ОЧЕРЕДЬ НА ЗАГРУЗКУ</div>
        <p style={styles.muted}>
          Здесь оператор видит только заказы своего завода. Начальник завода
          заранее назначает объект и машину; оператор выполняет фактическую загрузку.
        </p>

        {queue.length === 0 ? (
          <Empty text="Заказов на загрузку пока нет." />
        ) : (
          <div style={styles.list}>
            {queue.map((order) => (
              <div key={order.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <strong>{order.id}</strong>
                    <div style={styles.muted}>
                      {order.date} • {order.time}
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <InfoRow title="Материал" value={`${order.grade}, ${order.volume} м³`} />
                <InfoRow title="Заказчик / адрес" value={order.address} />
                <InfoRow title="Машина / водитель" value={order.vehicleNumber ? `${order.vehicleNumber} • ${order.driver || "Водитель не назначен"}` : (order.driver || "Машина не назначена")} />

                {order.status === 'Подтверждён' || order.status === 'Запланирован' ? (
                  <button
                    style={styles.primaryButton}
                    onClick={() => onUpdate(order.id, { status: 'Производство' })}
                  >
                    ▶️ НАЧАТЬ ЗАГРУЗКУ
                  </button>
                ) : null}

                {order.status === 'Производство' ? (
                  <button
                    style={styles.primaryButton}
                    onClick={() => {
                      onUpdate(order.id, {
                        status: 'Погружен',
                        loadedAt: new Date().toISOString(),
                      })
                      alert(`Заказ ${order.id} загружен. Начальник увидит факт загрузки, после чего водитель сможет выехать.`)
                    }}
                  >
                    ✅ ЗАГРУЖЕНО
                  </button>
                ) : null}

                <button
                  style={styles.secondaryButton}
                  onClick={() => onOpen(order.id)}
                >
                  Подробнее
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>УЖЕ ЗАГРУЖЕНЫ</div>
        {loaded.length === 0 ? (
          <Empty text="Сегодня загруженных заказов пока нет." />
        ) : (
          <div style={styles.list}>
            {loaded.slice(0, 10).map((order) => (
              <div key={order.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <strong>{order.id}</strong>
                  <StatusBadge status={order.status} />
                </div>
                <InfoRow title="Материал" value={`${order.grade}, ${order.volume} м³`} />
                <InfoRow title="Машина / водитель" value={order.vehicleNumber ? `${order.vehicleNumber} • ${order.driver || "Водитель не назначен"}` : (order.driver || "Машина не назначена")} />
                <InfoRow title="Адрес" value={order.address} />
              </div>
            ))}
          </div>
        )}
      </div>

      <BackButton onClick={onHome} text="На главную" />
    </Page>
  )
}

function Materials({
  user,
  enterprise,
  onBack,
}: {
  user: User
  enterprise: Enterprise | null
  onBack: () => void
}) {
  const plantIds = (user.plantIds || []).filter((id: string) => enterprise?.plants.some((p) => p.id === id && p.active))
  const storageKey = `siviotMaterials:${enterprise?.id || 'none'}:${plantIds[0] || 'none'}`
  const [items, setItems] = useState<{ id: string; name: string; unit: string; balance: number }[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
      return Array.isArray(saved) ? saved : [
        { id: 'cement', name: 'Цемент', unit: 'т', balance: 0 },
        { id: 'sand', name: 'Песок', unit: 'т', balance: 0 },
        { id: 'stone', name: 'Щебень', unit: 'т', balance: 0 },
      ]
    } catch {
      return []
    }
  })
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('т')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items))
  }, [storageKey, items])

  function addMaterial() {
    if (!name.trim()) return
    setItems((prev) => [...prev, { id: `m-${Date.now()}`, name: name.trim(), unit, balance: 0 }])
    setName('')
  }

  function changeBalance(id: string, delta: number) {
    setItems((prev) => prev.map((item) => item.id === id
      ? { ...item, balance: Math.max(0, item.balance + delta) }
      : item))
  }

  return (
    <Page title="Склад материалов" subtitle="Остатки завода">
      <div style={styles.card}>
        <div style={styles.sectionLabel}>ДОБАВИТЬ МАТЕРИАЛ</div>
        <div style={styles.twoColumns}>
          <label style={styles.label}>
            Материал
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Добавка" />
          </label>
          <label style={styles.label}>
            Единица
            <select style={styles.input} value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option>т</option>
              <option>кг</option>
              <option>м³</option>
              <option>л</option>
            </select>
          </label>
        </div>
        <button style={styles.primaryButton} onClick={addMaterial}>➕ Добавить материал</button>
      </div>

      <div style={styles.list}>
        {items.map((item) => (
          <div key={item.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <strong>{item.name}</strong>
              <span style={styles.badge}>{item.balance.toFixed(2)} {item.unit}</span>
            </div>
            <div style={styles.twoColumns}>
              <label style={styles.label}>
                Количество
                <input style={styles.input} type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </label>
              <div>
                <button style={styles.secondaryButton} onClick={() => changeBalance(item.id, Number(amount) || 0)}>➕ Приход</button>
                <button style={styles.dangerButton} onClick={() => changeBalance(item.id, -(Number(amount) || 0))}>➖ Расход</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BackButton onClick={onBack} text="Назад к заводу" />
    </Page>
  )
}

function Recipes({
  user,
  enterprise,
  onBack,
}: {
  user: User
  enterprise: Enterprise | null
  onBack: () => void
}) {
  const plant = enterprise?.plants.find((p) => p.id === user.plantIds?.find((id: string) => p.id === id && p.active))
  const [recipes, setRecipes] = useState<{ id: string; grade: string; name: string; notes: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`siviotRecipes:${plant?.id || 'none'}`) || '[]')
    } catch { return [] }
  })
  const [grade, setGrade] = useState('М300')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    localStorage.setItem(`siviotRecipes:${plant?.id || 'none'}`, JSON.stringify(recipes))
  }, [plant?.id, recipes])

  function addRecipe() {
    if (!name.trim()) return
    setRecipes((prev) => [...prev, { id: `r-${Date.now()}`, grade, name: name.trim(), notes: notes.trim() }])
    setName('')
    setNotes('')
  }

  return (
    <Page title="Рецептуры" subtitle={plant ? plant.name : 'Рецептуры бетона'}>
      <div style={styles.card}>
        <div style={styles.sectionLabel}>НОВАЯ РЕЦЕПТУРА</div>
        <label style={styles.label}>
          Марка
          <select style={styles.input} value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option>М200</option><option>М250</option><option>М300</option><option>М350</option><option>М400</option>
          </select>
        </label>
        <label style={styles.label}>
          Название
          <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: М300 стандарт" />
        </label>
        <label style={styles.label}>
          Состав / примечание
          <textarea style={{ ...styles.input, minHeight: 100 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Цемент, песок, щебень, добавки..." />
        </label>
        <button style={styles.primaryButton} onClick={addRecipe}>➕ Сохранить рецептуру</button>
      </div>

      {recipes.length === 0 ? <Empty text="Рецептур пока нет." /> : (
        <div style={styles.list}>
          {recipes.map((recipe) => (
            <div key={recipe.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <strong>{recipe.name}</strong>
                <span style={styles.badge}>{recipe.grade}</span>
              </div>
              <p style={styles.muted}>{recipe.notes || 'Состав не указан.'}</p>
            </div>
          ))}
        </div>
      )}
      <BackButton onClick={onBack} text="Назад к заводу" />
    </Page>
  )
}

function Vehicles({
  enterprise,
  onBack,
}: {
  enterprise: Enterprise | null
  onBack: () => void
}) {
  const [vehicles, setVehicles] = useState<{ id: string; number: string; model: string; driver: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`siviotVehicles:${enterprise?.id || 'none'}`) || '[]')
    } catch { return [] }
  })
  const [number, setNumber] = useState('')
  const [model, setModel] = useState('')
  const [driver, setDriver] = useState('')

  useEffect(() => {
    localStorage.setItem(`siviotVehicles:${enterprise?.id || 'none'}`, JSON.stringify(vehicles))
  }, [enterprise?.id, vehicles])

  function addVehicle() {
    if (!number.trim()) return
    setVehicles((prev) => [...prev, { id: `v-${Date.now()}`, number: number.trim(), model: model.trim(), driver: driver.trim() }])
    setNumber('')
    setModel('')
    setDriver('')
  }

  return (
    <Page title="Машины" subtitle="Транспорт и водители">
      <div style={styles.card}>
        <div style={styles.sectionLabel}>ДОБАВИТЬ АВТОМОБИЛЬ</div>
        <label style={styles.label}>
          Госномер
          <input style={styles.input} value={number} onChange={(e) => setNumber(e.target.value)} placeholder="А000АА 01" />
        </label>
        <label style={styles.label}>
          Модель
          <input style={styles.input} value={model} onChange={(e) => setModel(e.target.value)} placeholder="КАМАЗ" />
        </label>
        <label style={styles.label}>
          Водитель
          <input style={styles.input} value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="ФИО водителя" />
        </label>
        <button style={styles.primaryButton} onClick={addVehicle}>➕ Добавить машину</button>
      </div>

      {vehicles.length === 0 ? <Empty text="Машины пока не добавлены." /> : (
        <div style={styles.list}>
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <strong>{vehicle.number}</strong>
                <span style={styles.badge}>Активна</span>
              </div>
              <InfoRow title="Модель" value={vehicle.model || '—'} />
              <InfoRow title="Водитель" value={vehicle.driver || 'Не назначен'} />
            </div>
          ))}
        </div>
      )}
      <BackButton onClick={onBack} text="Назад к заводу" />
    </Page>
  )
}

function Reports({
  orders,
  user,
  enterprise,
  onBack,
}: {
  orders: Order[]
  user: User
  enterprise: Enterprise | null
  onBack: () => void
}) {
  const plantIds = new Set((user.plantIds || []).filter((id) => enterprise?.plants.some((p) => p.id === id && p.active)))
  const plantOrders = orders.filter((order) => !!order.plantId && plantIds.has(order.plantId))
  const volume = plantOrders.reduce((sum, order) => sum + order.volume, 0)
  const revenue = plantOrders.filter((o) => !['Отменён'].includes(o.status)).reduce((sum, order) => sum + order.total, 0)
  const shipped = plantOrders.filter((o) => ['Погружен', 'В пути', 'Доставлен', 'Оплачен', 'Завершён'].includes(o.status))
  const completed = plantOrders.filter((o) => ['Доставлен', 'Оплачен', 'Завершён'].includes(o.status))

  return (
    <Page title="Отчёты" subtitle="Сводка по назначенным заводам">
      <div style={styles.stats}>
        <Stat title="Заказов" value={plantOrders.length} />
        <Stat title="Объём, м³" value={Number(volume.toFixed(1))} />
        <Stat title="Отгружено" value={shipped.length} />
        <Stat title="Завершено" value={completed.length} />
      </div>
      <div style={styles.card}>
        <div style={styles.sectionLabel}>ВЫРУЧКА</div>
        <strong style={styles.total}>{revenue.toFixed(2)} €</strong>
        <p style={styles.muted}>Расчёт по текущим карточкам заказов. Детальная финансовая аналитика будет расширена отдельно.</p>
      </div>
      <div style={styles.card}>
        <div style={styles.sectionLabel}>СТАТУСЫ</div>
        {(['Новый','Подтверждён','Запланирован','Производство','Погружен','В пути','Доставлен','Оплачен','Завершён','Отменён'] as Status[]).map((status) => {
          const count = plantOrders.filter((o) => o.status === status).length
          return <InfoRow key={status} title={status} value={String(count)} />
        })}
      </div>
      <BackButton onClick={onBack} text="Назад к заводу" />
    </Page>
  )
}

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

              <InfoRow
                title="Машина"
                value={order.vehicleNumber || 'Не назначена'}
              />

              {order.loadedAt && (
                <InfoRow title="Загружен" value={new Date(order.loadedAt).toLocaleString('ru-RU')} />
              )}
              {order.departedAt && (
                <InfoRow title="Выехал" value={new Date(order.departedAt).toLocaleString('ru-RU')} />
              )}
              {order.arrivedAt && (
                <InfoRow title="Прибыл" value={new Date(order.arrivedAt).toLocaleString('ru-RU')} />
              )}
              {order.unloadedAt && (
                <InfoRow title="Разгрузил" value={new Date(order.unloadedAt).toLocaleString('ru-RU')} />
              )}
              {order.returnedAt && (
                <InfoRow title="Вернулся" value={new Date(order.returnedAt).toLocaleString('ru-RU')} />
              )}

              <div style={styles.driverButtons}>
                {order.status === 'Погружен' && (
                  <button
                    style={styles.primaryButton}
                    onClick={() =>
                      onUpdate(order.id, {
                        status: 'В пути',
                        departedAt: new Date().toISOString(),
                      })
                    }
                  >
                    🚚 ВЫЕХАЛ
                  </button>
                )}

                {order.status === 'В пути' && (
                  <button
                    style={styles.primaryButton}
                    onClick={() =>
                      onUpdate(order.id, {
                        status: 'Доставлен',
                        arrivedAt: new Date().toISOString(),
                      })
                    }
                  >
                    📍 ПРИБЫЛ
                  </button>
                )}

                {order.status === 'Доставлен' && (
                  <button
                    style={styles.primaryButton}
                    onClick={() =>
                      onUpdate(order.id, {
                        status: 'Доставлен',
                        unloadedAt: new Date().toISOString(),
                      })
                    }
                  >
                    🏗️ РАЗГРУЗИЛ
                  </button>
                )}

                {order.status === 'Доставлен' && order.unloadedAt && (
                  <button
                    style={styles.primaryButton}
                    onClick={() =>
                      onUpdate(order.id, {
                        status: 'Завершён',
                        returnedAt: new Date().toISOString(),
                      })
                    }
                  >
                    🔄 ВЕРНУЛСЯ
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
   PLATFORM ADMIN
========================= */

function PlatformAdmin({
  enterprises,
  users,
  onAddEnterprise,
  onUpdateEnterprise,
  onManageEnterprise,
  onLogout,
}: {
  enterprises: Enterprise[]
  users: User[]
  onAddEnterprise: (enterprise: Enterprise) => void
  onUpdateEnterprise: (id: string, changes: Partial<Enterprise>) => void
  onManageEnterprise: (id: string) => void
  onLogout: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  function createEnterprise() {
    if (!name.trim() || !shortName.trim()) {
      alert('Укажите полное и короткое название предприятия')
      return
    }

    const id = `ent-${Date.now()}`
    onAddEnterprise({
      id,
      name: name.trim(),
      shortName: shortName.trim(),
      logoUrl: logoUrl.trim(),
      active: true,
      createdAt: new Date().toISOString(),
      plants: [],
    })
    setName('')
    setShortName('')
    setLogoUrl('')
    setShowForm(false)
    alert('Предприятие создано')
  }

  const activeCount = enterprises.filter((item) => item.active).length
  const blockedCount = enterprises.length - activeCount
  const activeConcretePlants = enterprises.reduce(
    (sum, enterprise) =>
      sum +
      enterprise.plants.filter(
        (plant) => plant.active && plant.type === 'concrete',
      ).length,
    0,
  )
  const activeAsphaltPlants = enterprises.reduce(
    (sum, enterprise) =>
      sum +
      enterprise.plants.filter(
        (plant) => plant.active && plant.type === 'asphalt',
      ).length,
    0,
  )

  return (
    <Page title="Центральная администрация SIVIOT" subtitle="Предприятия, заводы и доступ">
      <div style={styles.stats}>
        <Stat title="Всего предприятий" value={enterprises.length} />
        <Stat title="Активных" value={activeCount} />
        <Stat title="Заблокированных" value={blockedCount} />
        <Stat title="Бетонных заводов" value={activeConcretePlants} />
        <Stat title="Асфальтных заводов" value={activeAsphaltPlants} />
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>ЦЕНТРАЛЬНОЕ УПРАВЛЕНИЕ</div>
        <h2 style={{ margin: '7px 0 8px' }}>Предприятия SIVIOT</h2>
        <p style={styles.muted}>
          Здесь находится только административная информация. Заказы, производство,
          склады и финансовая операционка предприятий сюда не выводятся.
        </p>
        <button style={styles.primaryButton} onClick={() => setShowForm((value) => !value)}>
          ➕ Добавить предприятие
        </button>
      </div>

      {showForm && (
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Новое предприятие</h3>
          <label style={styles.label}>
            Полное название
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: ООО «Бетон-Сервис»"
            />
          </label>
          <label style={styles.label}>
            Короткое название
            <input
              style={styles.input}
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="Например: Бетон-Сервис"
            />
          </label>
          <label style={styles.label}>
            Логотип предприятия — URL
            <input
              style={styles.input}
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>
          <button style={styles.primaryButton} onClick={createEnterprise}>
            Создать предприятие
          </button>
          <button style={styles.secondaryButton} onClick={() => setShowForm(false)}>
            Отмена
          </button>
        </div>
      )}

      <div style={styles.list}>
        {enterprises.map((enterprise) => {
          const enterpriseUsers = users.filter((user) => user.enterpriseId === enterprise.id)
          return (
            <div key={enterprise.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {enterprise.logoUrl ? (
                    <img
                      src={enterprise.logoUrl}
                      alt=""
                      style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 12 }}
                    />
                  ) : (
                    <div style={styles.bigIcon}>🏢</div>
                  )}
                  <div>
                    <strong>{enterprise.name}</strong>
                    <div style={styles.muted}>{enterprise.shortName}</div>
                  </div>
                </div>
                <span style={styles.badge}>
                  {enterprise.active ? 'Активно' : 'Заблокировано'}
                </span>
              </div>

              <InfoRow
                title="Заводы"
                value={`${enterprise.plants.filter((plant) => plant.active).length} активных / ${enterprise.plants.length} всего`}
              />
              <InfoRow title="Пользователи" value={String(enterpriseUsers.length)} />
              <button
                style={styles.primaryButton}
                onClick={() => onManageEnterprise(enterprise.id)}
              >
                ⚙️ Управление предприятием
              </button>

              <button
                style={enterprise.active ? styles.dangerButton : styles.secondaryButton}
                onClick={() =>
                  onUpdateEnterprise(enterprise.id, { active: !enterprise.active })
                }
              >
                {enterprise.active ? '⛔ Заблокировать предприятие' : '✅ Разблокировать предприятие'}
              </button>
            </div>
          )
        })}
      </div>

      <button style={styles.dangerButton} onClick={onLogout}>
        🚪 Выйти из центральной администрации
      </button>
    </Page>
  )
}

/* =========================
   ENTERPRISE ADMIN
========================= */

function EnterpriseAdmin({
  enterprise,
  users,
  onBack,
  onUpdateEnterprise,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}: {
  enterprise: Enterprise
  users: User[]
  onBack: () => void
  onUpdateEnterprise: (changes: Partial<Enterprise>) => void
  onAddUser: (user: User) => void
  onUpdateUser: (id: string, changes: Partial<User>) => void
  onDeleteUser: (id: string) => void
}) {
  const [newName, setNewName] = useState('')
  const [newLogin, setNewLogin] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<Role>('manager')
  const [newPlantIds, setNewPlantIds] = useState<string[]>([])

  function addUser() {
    if (!newName.trim() || !newLogin.trim() || !newPassword) {
      alert('Заполните имя, логин и пароль')
      return
    }
    if (users.some((user) => user.login === newLogin.trim())) {
      alert('Такой логин уже существует в предприятии')
      return
    }

    onAddUser({
      id: `u-${Date.now()}`,
      name: newName.trim(),
      login: newLogin.trim(),
      password: newPassword,
      role: newRole,
      enterpriseId: enterprise.id,
      plantIds: newRole === 'manager' || newRole === 'admin' ? [...newPlantIds] : [...newPlantIds],
      active: true,
    })

    setNewName('')
    setNewLogin('')
    setNewPassword('')
    setNewRole('manager')
    setNewPlantIds([])
    alert('Пользователь создан')
  }

  function togglePlant(id: string) {
    setNewPlantIds((prev) =>
      prev.includes(id) ? prev.filter((plantId) => plantId !== id) : [...prev, id],
    )
  }

  const [newPlantName, setNewPlantName] = useState('')
  const [newPlantCity, setNewPlantCity] = useState('')
  const [newPlantType, setNewPlantType] = useState<PlantType>('concrete')

  function addPlant() {
    if (!newPlantName.trim()) {
      alert('Укажите название завода')
      return
    }

    const plant: Plant = {
      id: `plant-${Date.now()}`,
      name: newPlantName.trim(),
      type: newPlantType,
      city: newPlantCity.trim(),
      active: true,
    }

    onUpdateEnterprise({ plants: [...enterprise.plants, plant] })
    setNewPlantName('')
    setNewPlantCity('')
    setNewPlantType('concrete')
  }

  function removePlant(id: string) {
    const plant = enterprise.plants.find((item) => item.id === id)
    if (!plant) return

    if (
      !confirm(
        `Удалить завод «${plant.name}»? Это действие уберёт его из предприятия. Историю заказов лучше сохранять, поэтому для временной остановки используйте «Приостановить».`,
      )
    ) {
      return
    }

    onUpdateEnterprise({
      plants: enterprise.plants.filter((item) => item.id !== id),
    })
  }

  return (
    <Page title={enterprise.name} subtitle="Администрирование предприятия">
      <div style={styles.card}>
        <div style={styles.sectionLabel}>ДАННЫЕ ПРЕДПРИЯТИЯ</div>
        <label style={styles.label}>
          Полное название
          <input
            style={styles.input}
            value={enterprise.name}
            onChange={(e) => onUpdateEnterprise({ name: e.target.value })}
          />
        </label>
        <label style={styles.label}>
          Короткое название
          <input
            style={styles.input}
            value={enterprise.shortName}
            onChange={(e) => onUpdateEnterprise({ shortName: e.target.value })}
          />
        </label>
        <label style={styles.label}>
          Логотип — URL
          <input
            style={styles.input}
            value={enterprise.logoUrl}
            onChange={(e) => onUpdateEnterprise({ logoUrl: e.target.value })}
            placeholder="https://..."
          />
        </label>
        <p style={styles.muted}>
          Подписка и её стоимость в SIVIOT не отображаются. Центральный администратор
          управляет только подключением предприятия и отдельных заводов.
        </p>
        <button
          style={enterprise.active ? styles.dangerButton : styles.primaryButton}
          onClick={() => onUpdateEnterprise({ active: !enterprise.active })}
        >
          {enterprise.active ? '⛔ Заблокировать предприятие' : '✅ Разблокировать предприятие'}
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>ОБЪЕКТЫ / ЗАВОДЫ</div>
        <p style={styles.muted}>
          Центральный администратор определяет, какие производственные объекты существуют
          у предприятия и к каким из них привязываются сотрудники.
        </p>

        {enterprise.plants.length === 0 ? (
          <Empty text="Заводов пока нет." />
        ) : (
          <div style={styles.list}>
            {enterprise.plants.map((plant) => (
              <div key={plant.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <strong>{plant.name}</strong>
                    <div style={styles.muted}>
                      {plant.city || 'Город не указан'} •{' '}
                      {plant.type === 'concrete' ? 'Бетонный завод' : 'Асфальтный завод'}
                    </div>
                  </div>
                  <span
                    style={{
                      ...styles.badge,
                      ...(plant.active
                        ? { background: '#dcfce7', color: '#166534' }
                        : { background: '#e5e7eb', color: '#475569' }),
                    }}
                  >
                    {plant.active ? 'Активен' : 'Приостановлен'}
                  </span>
                </div>

                <div style={styles.muted}>
                  {plant.active
                    ? 'Учитывается как подключённый завод.'
                    : 'Временно отключён: не участвует в текущем подключении, данные сохранены.'}
                </div>

                <div style={styles.twoColumns}>
                  <button
                    style={plant.active ? styles.dangerButton : styles.primaryButton}
                    onClick={() =>
                      onUpdateEnterprise({
                        plants: enterprise.plants.map((item) =>
                          item.id === plant.id ? { ...item, active: !item.active } : item,
                        ),
                      })
                    }
                  >
                    {plant.active ? '⏸ Приостановить' : '▶ Включить'}
                  </button>

                  <button
                    style={styles.secondaryButton}
                    onClick={() => removePlant(plant.id)}
                  >
                    🗑 Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ ...styles.card, background: '#f8fafc' }}>
          <h3 style={{ marginTop: 0 }}>Добавить завод</h3>
          <label style={styles.label}>
            Название завода
            <input
              style={styles.input}
              value={newPlantName}
              onChange={(e) => setNewPlantName(e.target.value)}
              placeholder="Например: Майкоп — бетон"
            />
          </label>

          <label style={styles.label}>
            Город / населённый пункт
            <input
              style={styles.input}
              value={newPlantCity}
              onChange={(e) => setNewPlantCity(e.target.value)}
              placeholder="Майкоп"
            />
          </label>

          <label style={styles.label}>
            Тип завода
            <select
              style={styles.input}
              value={newPlantType}
              onChange={(e) => setNewPlantType(e.target.value as PlantType)}
            >
              <option value="concrete">Бетонный</option>
              <option value="asphalt">Асфальтный</option>
            </select>
          </label>

          <button style={styles.primaryButton} onClick={addPlant}>
            ➕ Подключить завод
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionLabel}>ПОЛЬЗОВАТЕЛИ</div>
        <h3 style={{ marginTop: 6 }}>Добавить сотрудника</h3>

        <label style={styles.label}>
          Имя
          <input
            style={styles.input}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Иван Петров"
          />
        </label>
        <label style={styles.label}>
          Логин
          <input
            style={styles.input}
            value={newLogin}
            onChange={(e) => setNewLogin(e.target.value)}
            placeholder="login"
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
          Роль
          <select
            style={styles.input}
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
          >
            <option value="manager">Руководитель</option>
            <option value="plantBoss">Начальник завода</option>
            <option value="admin">Администратор предприятия</option>
            <option value="operator">Оператор</option>
            <option value="driver">Водитель</option>
            <option value="client">Клиент</option>
          </select>
        </label>

        <div style={styles.plantSelector}>
          <div style={styles.muted}>Привязать к объектам:</div>
          {enterprise.plants.map((plant) => (
            <label key={plant.id} style={styles.checkRow}>
              <input
                type="checkbox"
                checked={newPlantIds.includes(plant.id)}
                onChange={() => togglePlant(plant.id)}
              />
              <span>{plant.name}</span>
            </label>
          ))}
        </div>

        <button style={styles.primaryButton} onClick={addUser}>
          ➕ Создать пользователя
        </button>
      </div>

      <div style={styles.list}>
        {users.map((user) => (
          <div key={user.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <strong>{user.name}</strong>
                <div style={styles.muted}>{user.login}</div>
              </div>
              <span style={styles.badge}>{roleName(user.role)}</span>
            </div>

            <InfoRow
              title="Объекты"
              value={
                user.plantIds?.length
                  ? user.plantIds
                      .map((id) => enterprise.plants.find((plant) => plant.id === id)?.name || id)
                      .join(', ')
                  : 'Не назначены'
              }
            />

            <label style={styles.label}>
              Роль
              <select
                style={styles.input}
                value={user.role}
                onChange={(e) => onUpdateUser(user.id, { role: e.target.value as Role })}
              >
                <option value="manager">Руководитель</option>
                <option value="admin">Администратор предприятия</option>
                <option value="operator">Оператор</option>
                <option value="driver">Водитель</option>
                <option value="client">Клиент</option>
              </select>
            </label>

            <button
              style={user.active === false ? styles.primaryButton : styles.secondaryButton}
              onClick={() => onUpdateUser(user.id, { active: user.active === false })}
            >
              {user.active === false ? 'Разрешить вход' : 'Запретить вход'}
            </button>

            <button
              style={styles.dangerButton}
              onClick={() => {
                if (confirm(`Удалить пользователя «${user.name}»?`)) {
                  onDeleteUser(user.id)
                }
              }}
            >
              🗑️ Удалить пользователя
            </button>
          </div>
        ))}
      </div>

      <BackButton onClick={onBack} text="Назад к предприятиям" />
    </Page>
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
            <option value="manager">Руководитель</option>
            <option value="operator">Оператор</option>
            <option value="driver">Водитель</option>
            <option value="admin">Администратор предприятия</option>
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
    >
      <span style={styles.bigIcon}>{icon}</span>

      <span>
        <strong style={styles.bigTitle}>
          {title}
        </strong>

        <small style={styles.bigSubtitle}>
          {subtitle}
        </small>
      </span>
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
  return (
    <div style={styles.stat}>
      <strong>{value}</strong>
      <span>{title}</span>
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
      'linear-gradient(180deg, #eef4f8 0%, #f7fafc 42%, #eef3f7 100%)',
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
      'linear-gradient(135deg, #08152b 0%, #12325f 58%, #1d4ed8 150%)',
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
    border: '1px solid #e2e8f0',
    background: 'rgba(255,255,255,0.96)',
    borderRadius: 22,
    padding: 22,
    display: 'flex',
    alignItems: 'center',
    gap: 17,
    cursor: 'pointer',
    textAlign: 'left',
    boxShadow: '0 10px 28px rgba(15,23,42,0.06)',
    minHeight: 122,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },

  bigIcon: {
    width: 54,
    height: 54,
    flex: '0 0 54px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    background: '#eff6ff',
    fontSize: 29,
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
    background: 'rgba(255,255,255,0.96)',
    padding: 24,
    borderRadius: 24,
    border: '1px solid #e2e8f0',
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
    boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.03)',
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

  plantSelector: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
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
    boxShadow: '0 10px 20px rgba(37,99,235,0.20)',
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
    background: 'rgba(255,255,255,0.96)',
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
    background: 'rgba(255,255,255,0.97)',
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
    background: 'rgba(255,255,255,0.97)',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 18,
    textAlign: 'center',
    boxShadow: '0 7px 22px rgba(15,23,42,0.045)',
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
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
  },

  statusButtonActive: {
    background: '#0f172a',
    color: 'white',
    borderColor: '#0f172a',
  },

  driverButtons: {
    marginTop: 15,
  },

  successBox: {
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#065f46',
    borderRadius: 14,
    padding: 14,
    fontWeight: 750,
    marginBottom: 12,
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