import { useEffect, useState } from 'react'
import { createItem, getItems } from './api'
import './App.css'

const tabs = [
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
  const [activeTab, setActiveTab] = useState('services')
  const [services, setServices] = useState([])
  const [branches, setBranches] = useState([])
  const [barbers, setBarbers] = useState([])
  const [formState, setFormState] = useState(initialForms)
  const [status, setStatus] = useState({ message: '', type: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [serviceData, branchData, barberData] = await Promise.all([
        getItems('services'),
        getItems('branches'),
        getItems('barbers'),
      ])
      setServices(serviceData)
      setBranches(branchData)
      setBarbers(barberData)
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
              </tr>
            </thead>
            <tbody>
              {barbers.map((item) => (
                <tr key={item._id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.role || '—'}</td>
                  <td className="px-4 py-3">{item.branchId?.name || '—'}</td>
                  <td className="px-4 py-3">{item.experience || '—'}</td>
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
        </section>
      </div>
    </div>
  )
}

export default App
