<template>
  <div class="admin-users">
    <div class="page-header">
      <h1 class="page-title">Gesti&oacute;n de Usuarios</h1>
      <div class="header-actions">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar por email o nombre..."
          class="search-input"
        />
        <select v-model="filterRole" class="filter-select">
          <option value="">Todos los roles</option>
          <option value="owner">Propietarios</option>
          <option value="admin">Administradores</option>
          <option value="guest">Hu&eacute;spedes</option>
        </select>
        <button @click="showCreateModal = true" class="btn-primary">
          + Nuevo Usuario
        </button>
      </div>
    </div>

    <div class="card">
      <div v-if="!adminStore.users.length" class="empty-state">
        <p>Cargando usuarios...</p>
      </div>
      <div v-else class="users-table">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Suscripci&oacute;n</th>
              <th>Propiedades</th>
              <th>Estado</th>
              <th>Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.uid">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ user.email?.charAt(0).toUpperCase() }}</div>
                  <div class="user-info">
                    <div class="user-name">{{ user.displayName || 'Sin nombre' }}</div>
                    <div class="user-id">ID: {{ user.uid.substring(0, 8) }}...</div>
                  </div>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <select 
                  :value="user.role" 
                  @change="updateRole(user.uid, $event.target.value)"
                  class="role-select"
                >
                  <option value="guest">Hu&eacute;sped</option>
                  <option value="owner">Propietario</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <div class="subscription-cell">
                  <select 
                    :value="user.subscription?.planId || ''" 
                    @change="changeUserPlan(user.uid, $event.target.value)"
                    class="plan-select"
                  >
                    <option value="">Sin plan</option>
                    <option v-for="plan in adminStore.subscriptionPlans" :key="plan.id" :value="plan.id">
                      {{ plan.name }}
                    </option>
                  </select>
                  <span 
                    v-if="user.subscription" 
                    class="sub-status"
                    :class="user.subscription.status"
                  >
                    {{ user.subscription.status === 'active' ? 'Activo' : user.subscription.status }}
                  </span>
                </div>
              </td>
              <td class="text-center">{{ user.stats?.properties || 0 }}</td>
              <td>
                <span class="status-badge" :class="user.isActive ? 'active' : 'inactive'">
                  {{ user.isActive ? 'Activo' : 'Suspendido' }}
                </span>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <div class="action-buttons">
                  <button 
                    @click="toggleStatus(user.uid, !user.isActive)"
                    :class="user.isActive ? 'btn-warning' : 'btn-success'"
                    class="btn-sm"
                    :title="user.isActive ? 'Suspender' : 'Activar'"
                  >
                    {{ user.isActive ? '🔒' : '🔓' }}
                  </button>
                  <button 
                    @click="resetPassword(user.uid)"
                    class="btn-sm btn-reset-pass"
                    title="Blanquear contrase&ntilde;a"
                  >
                    🔑
                  </button>
                  <button 
                    v-if="user.subscription?.status === 'active' || user.subscription?.status === 'paused'"
                    @click="setSubStatus(user.uid, user.subscription.status === 'paused' ? 'active' : 'paused')"
                    class="btn-sm"
                    :class="user.subscription.status === 'paused' ? 'btn-success' : 'btn-warning'"
                    :title="user.subscription.status === 'paused' ? 'Reanudar suscripci&oacute;n' : 'Suspender suscripci&oacute;n'"
                  >
                    {{ user.subscription.status === 'paused' ? '▶' : '⏸' }}
                  </button>
                  <button 
                    v-if="user.subscription?.status === 'active' || user.subscription?.status === 'paused'"
                    @click="setSubStatus(user.uid, 'canceled')"
                    class="btn-sm btn-danger"
                    title="Cancelar suscripci&oacute;n"
                  >
                    ⏹
                  </button>
                  <button 
                    @click="viewUserDetails(user)"
                    class="btn-info btn-sm"
                    title="Ver detalles"
                  >
                    👁️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredUsers.length === 0 && adminStore.users.length" class="empty-state">
          <p>No se encontraron usuarios con esos filtros</p>
        </div>
      </div>
    </div>

    <!-- Create User Modal -->
    <teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Crear Nuevo Usuario</h2>
            <button @click="showCreateModal = false" class="close-btn">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nombre completo</label>
              <input v-model="newUserForm.displayName" type="text" class="form-input" placeholder="Ej: Juan Pérez" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="newUserForm.email" type="email" class="form-input" placeholder="ejemplo@correo.com" />
            </div>
            <div class="form-group">
              <label>Contrase&ntilde;a <span class="field-optional">(opcional &mdash; se genera una autom&aacute;tica si se deja vac&iacute;a)</span></label>
              <input v-model="newUserForm.password" type="text" class="form-input" placeholder="Dejar vac&iacute;o para generar autom&aacute;ticamente" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Rol</label>
                <select v-model="newUserForm.role" class="form-input">
                  <option value="owner">Propietario</option>
                  <option value="guest">Hu&eacute;sped</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div class="form-group">
                <label>Plan de suscripci&oacute;n</label>
                <select v-model="newUserForm.planId" class="form-input">
                  <option value="">Sin plan</option>
                  <option v-for="plan in adminStore.subscriptionPlans" :key="plan.id" :value="plan.id">
                    {{ plan.name }} (${{ plan.price.toLocaleString('es-AR') }}/mes)
                  </option>
                </select>
              </div>
            </div>
            <div v-if="creating" class="form-info">Creando usuario...</div>
            <div class="form-actions">
              <button @click="showCreateModal = false" class="btn-cancel">Cancelar</button>
              <button @click="createUser" class="btn-primary" :disabled="creating || !newUserForm.email || !newUserForm.displayName">
                {{ creating ? 'Creando...' : 'Crear Usuario' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- User Details Modal -->
    <teleport to="body">
      <div v-if="selectedUser" class="modal-overlay" @click="selectedUser = null">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Detalles del Usuario</h2>
            <button @click="selectedUser = null" class="close-btn">✕</button>
          </div>
          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <label>Nombre</label>
                <p>{{ selectedUser.displayName || 'Sin nombre' }}</p>
              </div>
              <div class="detail-item">
                <label>Email</label>
                <p>{{ selectedUser.email }}</p>
              </div>
              <div class="detail-item">
                <label>ID de Usuario</label>
                <p class="mono">{{ selectedUser.uid }}</p>
              </div>
              <div class="detail-item">
                <label>Rol</label>
                <p>{{ selectedUser.role }}</p>
              </div>
              <div class="detail-item">
                <label>Estado</label>
                <p>{{ selectedUser.isActive ? 'Activo' : 'Suspendido' }}</p>
              </div>
              <div class="detail-item">
                <label>Fecha de Registro</label>
                <p>{{ formatDateTime(selectedUser.createdAt) }}</p>
              </div>
              <div class="detail-item">
                <label>Plan de Suscripci&oacute;n</label>
                <p>{{ selectedUser.subscription ? getPlanName(selectedUser.subscription.planId) : 'Sin plan' }}</p>
              </div>
              <div class="detail-item">
                <label>Estado de Suscripci&oacute;n</label>
                <p>{{ selectedUser.subscription?.status || '-' }}</p>
              </div>
              <div class="detail-item">
                <label>Propiedades Publicadas</label>
                <p>{{ selectedUser.stats?.properties || 0 }}</p>
              </div>
              <div class="detail-item">
                <label>Total de Reservas</label>
                <p>{{ selectedUser.stats?.bookings || 0 }}</p>
              </div>
              <div class="detail-item">
                <label>Ingresos Generados</label>
                <p>${{ selectedUser.stats?.revenue || 0 }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { useToast } from '@/composables/useToast'

const adminStore = useAdminStore()
const { show } = useToast()

const searchQuery = ref('')
const filterRole = ref('')
const selectedUser = ref(null)
const showCreateModal = ref(false)
const creating = ref(false)
const newUserForm = ref({
  displayName: '',
  email: '',
  role: 'owner',
  planId: '',
  password: ''
})

const filteredUsers = computed(() => {
  let users = adminStore.users
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    users = users.filter(u => 
      u.email?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q)
    )
  }
  if (filterRole.value) {
    users = users.filter(u => u.role === filterRole.value)
  }
  return users
})

const getPlanName = (planId) => {
  if (!planId) return 'Sin plan'
  const plan = adminStore.subscriptionPlans.find(p => p.id === planId)
  return plan ? plan.name : planId
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const createUser = async () => {
  if (!newUserForm.value.email || !newUserForm.value.displayName) return
  creating.value = true
  const result = await adminStore.createUser({ ...newUserForm.value })
  creating.value = false
  if (result.success) {
    show(result.message || 'Usuario creado correctamente', 'success', 8000)
    showCreateModal.value = false
    newUserForm.value = { displayName: '', email: '', role: 'owner', planId: '', password: '' }
  } else {
    show(result.error || 'Error al crear usuario', 'error')
  }
}

const updateRole = async (userId, newRole) => {
  const result = await adminStore.updateUserRole(userId, newRole)
  show(result.success ? 'Rol actualizado correctamente' : 'Error: ' + result.error, result.success ? 'success' : 'error')
}

const toggleStatus = async (userId, newStatus) => {
  const action = newStatus ? 'activar' : 'suspender'
  const result = await adminStore.toggleUserStatus(userId, newStatus)
  show(result.success ? `Usuario ${action}do correctamente` : 'Error: ' + result.error, result.success ? 'success' : 'error')
}

const changeUserPlan = async (userId, planId) => {
  const result = await adminStore.updateUserSubscription(userId, planId || null, planId ? 'active' : null)
  show(result.success ? 'Plan de suscripción actualizado' : 'Error: ' + result.error, result.success ? 'success' : 'error')
}

const resetPassword = async (userId) => {
  const result = await adminStore.resetUserPassword(userId)
  if (result.success) {
    show(result.message, 'info', 10000)
  } else {
    show('Error: ' + result.error, 'error')
  }
}

const setSubStatus = async (userId, status) => {
  const labels = { canceled: 'cancelada', paused: 'suspendida', active: 'reanudada' }
  const result = await adminStore.setUserSubscriptionStatus(userId, status)
  show(result.success ? `Suscripción ${labels[status] || status} correctamente` : 'Error: ' + result.error, result.success ? 'success' : 'error')
}

const viewUserDetails = (user) => {
  selectedUser.value = user
}

onMounted(() => {
  if (adminStore.users.length === 0) {
    adminStore.fetchUsers()
  }
})
</script>

<style scoped>
.admin-users {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: var(--spacing-lg);
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

.search-input {
  flex: 1;
  max-width: 400px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.filter-select {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.btn-primary {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.users-table {
  overflow-x: auto;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  text-align: left;
  padding: var(--spacing-md);
  border-bottom: 2px solid var(--gray-200);
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.875rem;
  white-space: nowrap;
}

.users-table td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--gray-200);
  font-size: 0.875rem;
}

.text-center {
  text-align: center;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: var(--gray-900);
}

.user-id {
  font-size: 0.75rem;
  color: var(--gray-500);
  font-family: monospace;
}

.role-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  background: white;
}

.subscription-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.plan-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  background: white;
  max-width: 130px;
}

.sub-status {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 600;
  white-space: nowrap;
}

.sub-status.active {
  background: #d1fae5;
  color: #065f46;
}

.sub-status.past_due,
.sub-status.canceled {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.action-buttons {
  display: flex;
  gap: var(--spacing-xs);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn-warning {
  background: #fef3c7;
  color: #92400e;
}

.btn-warning:hover {
  background: #fde68a;
}

.btn-success {
  background: #d1fae5;
  color: #065f46;
}

.btn-success:hover {
  background: #a7f3d0;
}

.btn-info {
  background: #dbeafe;
  color: #1e40af;
}

.btn-info:hover {
  background: #bfdbfe;
}

.btn-reset-pass {
  background: #f3e8ff;
  color: #6b21a8;
}

.btn-reset-pass:hover {
  background: #e9d5ff;
}

.btn-danger {
  background: #fee2e2;
  color: #991b1b;
}

.btn-danger:hover {
  background: #fecaca;
}

.empty-state {
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--gray-500);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: var(--spacing-lg);
}

.modal-content {
  background: white;
  border-radius: var(--radius-lg);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--gray-100);
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.25rem;
  color: var(--gray-600);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--gray-200);
}

.modal-body {
  padding: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
  margin-bottom: var(--spacing-xs);
}

.field-optional {
  font-weight: 400;
  font-size: 0.75rem;
  color: var(--gray-500);
}

.form-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  box-sizing: border-box;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.form-info {
  padding: var(--spacing-sm);
  color: var(--gray-600);
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.detail-item label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-xs);
}

.detail-item p {
  font-size: 0.875rem;
  color: var(--gray-900);
  margin: 0;
}

.mono {
  font-family: monospace;
  background: var(--gray-50);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

@media (max-width: 768px) {
  .admin-users {
    padding: var(--spacing-md);
  }

  .header-actions {
    flex-direction: column;
  }

  .search-input {
    max-width: 100%;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
