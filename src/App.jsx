import { useEffect, useState } from 'react'
import { createItem, deleteItem, getItems, patchItem } from './api'
import './App.css'

const tabs = [
  { id: 'appointments', label: 'Appointments' },
  { id: 'services', label: 'Services' },
  { id: 'branches', label: 'Branches' },
  { id: 'barbers', label: 'Barber Staff' },
]

const initialForms = {
  services: { name: '', price: '', duration: '', gender: 'male', isActive: true },
  branches: { legacyId: '', name: '', city: '', address: '', phone: '', hours: '', image: '', isActive: true },
  barbers: { name: '', role: '', experience: '', image: '', branchId: '', isActive: true },
}

function App() {
  const [activeTab, setActiveTab] = useState('appointments')
  const [services, setServices] = useState([])
  const [branches, setBranches] = useState([])
  const [barbers, setBarbers] = useState([])
  const [bookings, setBookings] = useState([])
  const [formState, setFormState] = useState(initialForms)
  const [status, setStatus] = useState({ message: '', type: '' })
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [serviceData, branchData, barberData, bookingData] = await Promise.all([
        getItems('services'),
        getItems('branches'),
        getItems('barbers'),
        getItems('bookings'),
      ])
      setServices(serviceData)
      setBranches(branchData)
      setBarbers(barberData)
      setBookings(bookingData)
    } catch (error) {
      setStatus({ message: error.message || 'Unable to load data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(section, field, value) {
    setFormState((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  function handleFileChange(section, file) {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      handleInputChange(section, 'image', reader.result)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setStatus({ message: '', type: '' })

    const section = activeTab
    const payload = { ...formState[section] }

    if (section === 'services') {
      payload.price = Number(payload.price)
      payload.duration = Number(payload.duration)
    }
    if (section === 'branches') {
      payload.legacyId = Number(payload.legacyId)
    }

    try {
      await createItem(section, payload)
      await fetchData()
      setFormState((prev) => ({ ...prev, [section]: initialForms[section] }))
      setStatus({ message: `${tabs.find((tab) => tab.id === section).label} added successfully`, type: 'success' })
    } catch (error) {
      setStatus({ message: error.message || 'Error saving item', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(section, item) {
    const label = item.name || 'this item'
    const confirmed = window.confirm(`Delete ${label}? This cannot be undone.`)
    if (!confirmed) return

    setDeletingId(item._id)
    setStatus({ message: '', type: '' })

    try {
      await deleteItem(`${section}/${item._id}`)
      await fetchData()
      setStatus({ message: `${label} deleted successfully`, type: 'success' })
    } catch (error) {
      setStatus({ message: error.message || 'Error deleting item', type: 'error' })
    } finally {
      setDeletingId('')
    }
  }

  function DeleteButton({ section, item }) {
    const isDeleting = deletingId === item._id

    return (
      <button
        type="button"
        className="button-danger"
        disabled={loading || isDeleting}
        onClick={() => handleDelete(section, item)}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    )
  }

  async function handleStatusUpdate(bookingId, newStatus) {
    setUpdatingId(bookingId)
    setStatus({ message: '', type: '' })
    try {
      await patchItem(`bookings/${bookingId}/status`, { status: newStatus })
      await fetchData()
      setStatus({ message: `Appointment ${newStatus} successfully`, type: 'success' })
    } catch (error) {
      setStatus({ message: error.message || 'Error updating status', type: 'error' })
    } finally {
      setUpdatingId('')
    }
  }

  function getStatusBadge(s) {
    const map = {
      pending: 'badge-pending',
      confirmed: 'badge-confirmed',
      cancelled: 'badge-cancelled',
      completed: 'badge-completed',
    }
    return map[s] || ''
  }

  function getFilteredBookings() {
    const sorted = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (statusFilter === 'all') return sorted
    return sorted.filter((b) => b.status === statusFilter)
  }

  function renderForm() {
    if (activeTab === 'services') {
      const data = formState.services
      return (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label">Name</span>
              <input required value={data.name} onChange={(e) => handleInputChange('services', 'name', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">Price</span>
              <input required type="number" min="0" value={data.price} onChange={(e) => handleInputChange('services', 'price', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">Duration (minutes)</span>
              <input required type="number" min="0" value={data.duration} onChange={(e) => handleInputChange('services', 'duration', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">Gender</span>
              <select required value={data.gender} onChange={(e) => handleInputChange('services', 'gender', e.target.value)} className="input">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
          </div>
          <button type="submit" className="button" disabled={loading}>{loading ? 'Saving…' : 'Add Service'}</button>
        </form>
      )
    }

    if (activeTab === 'branches') {
      const data = formState.branches
      return (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label">Legacy ID</span>
              <input required type="number" min="0" value={data.legacyId} onChange={(e) => handleInputChange('branches', 'legacyId', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">Name</span>
              <input required value={data.name} onChange={(e) => handleInputChange('branches', 'name', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">City</span>
              <input required value={data.city} onChange={(e) => handleInputChange('branches', 'city', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">Address</span>
              <input value={data.address} onChange={(e) => handleInputChange('branches', 'address', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">Phone</span>
              <input value={data.phone} onChange={(e) => handleInputChange('branches', 'phone', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">Hours</span>
              <input value={data.hours} onChange={(e) => handleInputChange('branches', 'hours', e.target.value)} className="input" />
            </label>
            <label className="block md:col-span-2">
              <span className="label">Branch Image</span>
              <div className="flex items-center gap-3">
                <label className="button cursor-pointer" htmlFor="branch-image-input">Choose image</label>
                <span className="text-sm text-slate-600">{data.image ? 'Image selected' : 'No image selected'}</span>
              </div>
              <input
                id="branch-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange('branches', e.target.files?.[0])}
              />
              {data.image && (
                <img src={data.image} alt="Branch preview" className="mt-3 h-28 w-full max-w-[280px] rounded-2xl object-cover border border-slate-200" />
              )}
            </label>
          </div>
          <button type="submit" className="button" disabled={loading}>{loading ? 'Saving…' : 'Add Branch'}</button>
        </form>
      )
    }

    if (activeTab === 'barbers') {
      const data = formState.barbers
      return (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label">Name</span>
              <input required value={data.name} onChange={(e) => handleInputChange('barbers', 'name', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">Role</span>
              <input value={data.role} onChange={(e) => handleInputChange('barbers', 'role', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">Experience</span>
              <input value={data.experience} onChange={(e) => handleInputChange('barbers', 'experience', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">Branch</span>
              <select required value={data.branchId} onChange={(e) => handleInputChange('barbers', 'branchId', e.target.value)} className="input">
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>{`${branch.name} — ${branch.city}`}</option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="label">Barber Image</span>
              <div className="flex items-center gap-3">
                <label className="button cursor-pointer" htmlFor="barber-image-input">Choose image</label>
                <span className="text-sm text-slate-600">{data.image ? 'Image selected' : 'No image selected'}</span>
              </div>
              <input
                id="barber-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange('barbers', e.target.files?.[0])}
              />
              {data.image && (
                <img src={data.image} alt="Barber preview" className="mt-3 h-28 w-full max-w-[280px] rounded-2xl object-cover border border-slate-200" />
              )}
            </label>
          </div>
          <button type="submit" className="button" disabled={loading}>{loading ? 'Saving…' : 'Add Barber'}</button>
        </form>
      )
    }

    return null
  }

  function renderAppointments() {
    const filtered = getFilteredBookings()
    const counts = {
      all: bookings.length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`filter-btn ${statusFilter === f ? 'filter-btn-active' : ''}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="filter-count">{counts[f]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No {statusFilter === 'all' ? '' : statusFilter} appointments found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((booking) => {
              const isUpdating = updatingId === booking._id
              return (
                <div key={booking._id} className={`appointment-card appointment-card-${booking.status}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{booking.customer?.name}</h3>
                      <p className="text-sm text-slate-500">{booking.customer?.email}</p>
                      <p className="text-sm text-slate-500">{booking.customer?.phone}</p>
                    </div>
                    <span className={`badge ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="icon-text">📅</span>
                      <span className="font-medium">{booking.date}</span>
                      <span className="text-slate-400">|</span>
                      <span>{booking.startTime} – {booking.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="icon-text">💇</span>
                      <span>{booking.barber?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="icon-text">🏪</span>
                      <span>{booking.branch?.name || 'N/A'}{booking.branch?.city ? ` — ${booking.branch.city}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="icon-text">✂️</span>
                      <span>{booking.services?.map((s) => s.name).join(', ') || 'N/A'}</span>
                    </div>
                    {booking.totalPrice != null && (
                      <div className="flex items-center gap-2">
                        <span className="icon-text">💰</span>
                        <span className="font-semibold text-emerald-700">${booking.totalPrice}</span>
                        <span className="text-slate-400">({booking.totalDuration} min)</span>
                      </div>
                    )}
                    {booking.notes && (
                      <div className="flex items-start gap-2">
                        <span className="icon-text">📝</span>
                        <span className="italic text-slate-500">{booking.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                    {booking.status === 'pending' && (
                      <>
                        <button className="button-accept" disabled={isUpdating} onClick={() => handleStatusUpdate(booking._id, 'confirmed')}>
                          {isUpdating ? '...' : '✓ Accept'}
                        </button>
                        <button className="button-reject" disabled={isUpdating} onClick={() => handleStatusUpdate(booking._id, 'cancelled')}>
                          {isUpdating ? '...' : '✗ Reject'}
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <>
                        <button className="button-complete" disabled={isUpdating} onClick={() => handleStatusUpdate(booking._id, 'completed')}>
                          {isUpdating ? '...' : '✓ Complete'}
                        </button>
                        <button className="button-reject" disabled={isUpdating} onClick={() => handleStatusUpdate(booking._id, 'cancelled')}>
                          {isUpdating ? '...' : '✗ Cancel'}
                        </button>
                      </>
                    )}
                    {(booking.status === 'cancelled' || booking.status === 'completed') && (
                      <span className="text-xs text-slate-400 italic">No actions available</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  function renderTable() {
    if (activeTab === 'services') {
      return (
        <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-900">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((item) => (
                <tr key={item._id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">${item.price}</td>
                  <td className="px-4 py-3">{item.duration} min</td>
                  <td className="px-4 py-3 capitalize">{item.gender}</td>
                  <td className="px-4 py-3">{item.isActive ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton section="services" item={item} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (activeTab === 'branches') {
      return (
        <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-900">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((item) => (
                <tr key={item._id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.city}</td>
                  <td className="px-4 py-3">{item.address || '—'}</td>
                  <td className="px-4 py-3">{item.phone || '—'}</td>
                  <td className="px-4 py-3">{item.hours || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton section="branches" item={item} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (activeTab === 'barbers') {
      return (
        <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-900">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {barbers.map((item) => (
                <tr key={item._id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.role || '—'}</td>
                  <td className="px-4 py-3">{item.branchId?.name || '—'}</td>
                  <td className="px-4 py-3">{item.experience || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton section="barbers" item={item} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 px-6 py-6 text-white shadow-xl shadow-slate-200/5 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Admin Panel</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Barber Shop Management</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Add services, branches, and barber staff directly to MongoDB Atlas.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {status.message && (
            <div className={`mt-6 rounded-2xl px-4 py-3 text-sm ${status.type === 'success' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
              {status.message}
            </div>
          )}

          {activeTab === 'appointments' ? (
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Booking Appointments</h2>
                  <p className="text-sm text-slate-600">Manage appointments booked from the frontend.</p>
                </div>
                {loading && <span className="rounded-full bg-slate-200 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-700">Loading</span>}
              </div>
              {renderAppointments()}
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Add {tabs.find((tab) => tab.id === activeTab).label}</h2>
                <p className="mt-2 text-sm text-slate-600">Use this form to create new items in the database.</p>
                <div className="mt-6">{renderForm()}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Existing {tabs.find((tab) => tab.id === activeTab).label}</h2>
                    <p className="text-sm text-slate-600">Loaded from the backend.</p>
                  </div>
                  {loading && <span className="rounded-full bg-slate-200 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-700">Loading</span>}
                </div>
                {renderTable()}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default App
