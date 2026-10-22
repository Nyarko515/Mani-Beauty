'use client'

import { Link, useRouter } from '../../../src/router'
import { useEffect, useState } from 'react'
import { ArrowLeft, Save, Loader, Plus, Trash2, Edit2, X, Image as ImageIcon } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../lib/supabase/client'
import { getCsrfTokenFromBrowser } from '../../../lib/csrf-client'
import styles from './page.module.css'
import { apiFetch } from '../../../lib/api-client'
import { defaultExtensions } from '../../../data/extensions'

const toneOptions = [
  { value: 'pink', label: 'Pink' },
  { value: 'orange', label: 'Orange' },
  { value: 'green', label: 'Green' },
  { value: 'pinkDark', label: 'Pink Dark' },
]

function cloneCatalog(data) {
  return JSON.parse(JSON.stringify(data))
}

function formatProductName(imagePath) {
  const fileName = String(imagePath || '')
    .split('/')
    .pop()
    .replace(/\.[^.]+$/, '')

  return fileName
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim()
}

function priceNumber(value) {
  return String(value || '').replace(/[^0-9.]/g, '')
}

export default function AdminCatalogPage() {
  const router = useRouter()
  const [supabase] = useState(() => createSupabaseBrowserClient())
  const [catalog, setCatalog] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [editingItem, setEditingItem] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  useEffect(() => {
    const bootstrap = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data?.user) {
        router.push('/admin/login')
        return
      }

      await loadCatalog()
    }

    bootstrap()
  }, [router, supabase])

  const loadCatalog = async () => {
    try {
      const response = await apiFetch('/api/catalog')
      if (!response.ok) {
        throw new Error('Could not load catalog')
      }

      const data = await response.json()
      setCatalog({
        ...data,
        extensions: Array.isArray(data.extensions) && data.extensions.length > 0
          ? data.extensions
          : cloneCatalog(defaultExtensions),
      })
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    }
  }

  const handleEditServiceItem = (categoryIdx, itemIdx) => {
    const item = catalog.services[categoryIdx].items[itemIdx]
    setEditingItem({ type: 'service', categoryIdx, itemIdx })
    setEditFormData({
      ...item,
      priceInput: Array.isArray(item.price) ? item.price.join('\n') : String(item.price || ''),
    })
    setIsAddingNew(false)
  }

  const handleAddServiceItem = (categoryIdx) => {
    setEditingItem({ type: 'service', categoryIdx, itemIdx: null })
    setEditFormData({
      name: '',
      priceInput: 'From GH₵',
      duration: '',
      popular: false,
      image: '',
    })
    setIsAddingNew(true)
  }

  const handleEditProductItem = (productIdx) => {
    const item = catalog.products[productIdx] || {}
    setEditingItem({ type: 'product', productIdx })
    setEditFormData({
      id: item.id || `product-${Date.now()}-${productIdx}`,
      name: item.name || '',
      price: priceNumber(item.price),
      image: item.image || '',
    })
    setIsAddingNew(false)
  }

  const handleAddProductItem = () => {
    setEditingItem({ type: 'product', productIdx: null })
    setEditFormData({
      id: `product-${Date.now()}`,
      name: '',
      price: '',
      image: '',
    })
    setIsAddingNew(true)
  }

  const handleEditExtensionItem = (extensionIdx) => {
    const item = catalog.extensions[extensionIdx] || {}
    const numericPrice = typeof item.price === 'string' && /[0-9]/.test(item.price) ? priceNumber(item.price) : ''
    setEditingItem({ type: 'extension', extensionIdx })
    setEditFormData({ id: item.id || `extension-${extensionIdx}`, name: item.name || '', price: numericPrice, details: item.details || '', image: item.image || '', requiresQuote: item.requiresQuote !== false })
    setIsAddingNew(false)
  }

  const handleAddExtensionItem = () => {
    setEditingItem({ type: 'extension', extensionIdx: null })
    setEditFormData({ name: '', price: '', details: '', image: '', requiresQuote: true })
    setIsAddingNew(true)
  }

  const handleDeleteExtensionItem = (extensionIdx) => {
    if (window.confirm('Delete this hair extension?')) {
      const newCatalog = cloneCatalog(catalog)
      newCatalog.extensions.splice(extensionIdx, 1)
      setCatalog(newCatalog)
    }
  }

  const handleDeleteProductItem = (productIdx) => {
    if (window.confirm('Delete this product?')) {
      const newCatalog = cloneCatalog(catalog)
      newCatalog.products.splice(productIdx, 1)
      setCatalog(newCatalog)
    }
  }

  const handleAddCategory = () => {
    const newCatalog = cloneCatalog(catalog)
    const newIndex = newCatalog.services.length

    newCatalog.services.push({
      category: `NEW CATEGORY ${newIndex + 1}`,
      tone: 'pink',
      note: '',
      items: [],
    })

    setCatalog(newCatalog)
    setActiveTab(newIndex)
    setStatus('')
    setError('')
  }

  const handleDeleteCategory = (categoryIdx) => {
    if (catalog.services.length <= 1) {
      setError('At least one service category must remain.')
      return
    }

    if (window.confirm('Delete this entire category and all its items?')) {
      const newCatalog = cloneCatalog(catalog)
      newCatalog.services.splice(categoryIdx, 1)
      setCatalog(newCatalog)
      setActiveTab((current) => Math.max(0, Math.min(current, newCatalog.services.length - 1)))
      setError('')
      setStatus('')
    }
  }

  const updateCurrentCategoryField = (field, value) => {
    const newCatalog = cloneCatalog(catalog)
    newCatalog.services[activeTab][field] = value
    setCatalog(newCatalog)
  }

  const handleDeleteItem = (categoryIdx, itemIdx) => {
    if (window.confirm('Delete this item?')) {
      const newCatalog = cloneCatalog(catalog)
      newCatalog.services[categoryIdx].items.splice(itemIdx, 1)
      setCatalog(newCatalog)
    }
  }

  const handleSaveItem = () => {
    const newCatalog = cloneCatalog(catalog)

    if (editingItem?.type === 'service') {
      if (!editFormData.name || !editFormData.priceInput || !editFormData.duration) {
        setError('Please fill in all service fields (Name, Price, Duration)')
        return
      }

      const parsedPrices = String(editFormData.priceInput)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      const normalizedPrice = parsedPrices.length > 1 ? parsedPrices : parsedPrices[0] || ''
      const payload = {
        name: String(editFormData.name || '').trim(),
        price: normalizedPrice,
        duration: String(editFormData.duration || '').trim(),
        popular: Boolean(editFormData.popular),
        image: String(editFormData.image || '').trim(),
      }

      const { categoryIdx, itemIdx } = editingItem

      if (itemIdx !== null) {
        newCatalog.services[categoryIdx].items[itemIdx] = payload
      } else {
        newCatalog.services[categoryIdx].items.push(payload)
      }
    }

    if (editingItem?.type === 'product') {
      if (!editFormData.name || !editFormData.price || !editFormData.image) {
        setError('Please fill in product fields (Name, Price, Image URL)')
        return
      }

      const payload = {
        id: editFormData.id || `product-${Date.now()}`,
        name: String(editFormData.name || '').trim(),
        price: `GH₵${priceNumber(editFormData.price)}`,
        image: String(editFormData.image || '').trim(),
      }

      if (editingItem.productIdx !== null) {
        newCatalog.products[editingItem.productIdx] = payload
      } else {
        newCatalog.products.push(payload)
      }
    }

    if (editingItem?.type === 'extension') {
      if (!editFormData.name || !editFormData.image) {
        setError('Please fill in the hair extension name and image.')
        return
      }

      const rawPrice = String(editFormData.price || '').trim()
      const numericPrice = rawPrice ? `GH₵${priceNumber(rawPrice)}` : 'Price on request'
      const payload = {
        id: editFormData.id || `extension-${Date.now()}`,
        name: String(editFormData.name).trim(),
        price: numericPrice,
        details: String(editFormData.details || '').trim(),
        image: String(editFormData.image).trim(),
        requiresQuote: !rawPrice || !/[0-9]/.test(rawPrice),
      }
      if (editingItem.extensionIdx !== null) newCatalog.extensions[editingItem.extensionIdx] = payload
      else newCatalog.extensions.push(payload)
    }

    setCatalog(newCatalog)
    setEditingItem(null)
    setEditFormData({})
    setError('')
  }

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      event.target.value = ''
      return
    }

    setError('')
    setIsUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiFetch('/api/admin/uploads', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': getCsrfTokenFromBrowser(),
        },
        body: formData,
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Image upload failed')
      }

      setEditFormData((prev) => ({ ...prev, image: payload.url }))
      setStatus('Image uploaded successfully. Save changes to publish it.')
    } catch (uploadError) {
      setError(uploadError.message || 'Failed to upload image')
    } finally {
      setIsUploadingImage(false)
      event.target.value = ''
    }
  }

  const handleSaveCatalog = async () => {
    setError('')
    setStatus('')
    setIsSaving(true)

    try {
      const response = await apiFetch('/api/catalog', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromBrowser(),
        },
        body: JSON.stringify(catalog),
      })

      if (!response.ok) {
        throw new Error('Save failed')
      }

      setStatus('Catalog saved successfully. Refresh Services and Booking pages to see updates.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!catalog) {
    return (
      <div className={styles.page}>
        <div className={`container ${styles.wrap}`}>
          <p>Loading catalog...</p>
        </div>
      </div>
    )
  }

  const currentService = catalog.services[activeTab]

  return (
    <div className={styles.page}>
      <div className={`container ${styles.wrap}`}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Catalog Manager</h1>
            <p className={styles.subTitle}>Edit services and products visually.</p>
          </div>
          <Link href="/admin/dashboard" className={styles.backLink}>
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {status && <p className={styles.success}>{status}</p>}

        {/* Tabs */}
        <div className={styles.toolbarRow}>
          <div className={styles.tabs}>
            {catalog.services.map((service, idx) => (
              <button
                key={idx}
                className={`${styles.tab} ${activeTab === idx ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(idx)}
              >
                {service.category}
              </button>
            ))}
          </div>
          <button className={styles.addButton} onClick={handleAddCategory} disabled={editingItem !== null}>
            <Plus size={18} /> Add Category
          </button>
        </div>

        {/* Category Info */}
        <div className={styles.categoryInfo}>
          <div className={styles.categoryGrid}>
            <div>
              <label>Category Name</label>
              <input
                type="text"
                value={currentService.category}
                onChange={(e) => updateCurrentCategoryField('category', e.target.value)}
                className={styles.input}
              />
            </div>

            <div>
              <label>Accent Tone</label>
              <select
                value={currentService.tone || 'pink'}
                onChange={(e) => updateCurrentCategoryField('tone', e.target.value)}
                className={styles.input}
              >
                {toneOptions.map((tone) => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fullWidth}>
              <label>Category Note</label>
              <input
                type="text"
                value={currentService.note || ''}
                onChange={(e) => updateCurrentCategoryField('note', e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.fullWidth}>
              <button className={styles.deleteCategoryButton} onClick={() => handleDeleteCategory(activeTab)}>
                <Trash2 size={16} /> Delete This Category
              </button>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className={styles.tableContainer}>
          {currentService.items.length === 0 ? (
            <p className={styles.noItems}>No items in this category</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Service Name</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Popular</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentService.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className={styles.thumb} />
                      ) : (
                        <div className={styles.thumbFallback}><ImageIcon size={14} /></div>
                      )}
                    </td>
                    <td>{item.name}</td>
                    <td>{Array.isArray(item.price) ? item.price.join(', ') : item.price}</td>
                    <td>{item.duration}</td>
                    <td className={styles.centerCell}>
                      <input
                        type="checkbox"
                        checked={item.popular || false}
                        onChange={(e) => {
                          const newCatalog = JSON.parse(JSON.stringify(catalog))
                          newCatalog.services[activeTab].items[idx].popular = e.target.checked
                          setCatalog(newCatalog)
                        }}
                      />
                    </td>
                    <td className={styles.actions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleEditServiceItem(activeTab, idx)}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteItem(activeTab, idx)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add New Item Button */}
        <button
          className={styles.addButton}
          onClick={() => handleAddServiceItem(activeTab)}
          disabled={editingItem !== null}
        >
          <Plus size={18} /> Add Service to {currentService.category}
        </button>

        {/* Products Manager */}
        <div className={styles.productsSection}>
          <div className={styles.productsHeader}>
            <h2 className={styles.productsTitle}>Products Manager</h2>
            <button className={styles.addButton} onClick={handleAddProductItem} disabled={editingItem !== null}>
              <Plus size={18} /> Add Product
            </button>
          </div>

          <div className={styles.tableContainer}>
            {catalog.products.length === 0 ? (
              <p className={styles.noItems}>No products yet</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.products.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        {item.image ? (
                          <img src={encodeURI(item.image)} alt={item.name || `Product ${idx + 1}`} className={styles.thumb} />
                        ) : (
                          <div className={styles.thumbFallback}><ImageIcon size={14} /></div>
                        )}
                      </td>
                      <td>{item.name || formatProductName(item.image) || `Product ${idx + 1}`}</td>
                      <td>{item.price || '-'}</td>
                      <td className={styles.actions}>
                        <button className={styles.editBtn} onClick={() => handleEditProductItem(idx)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className={styles.deleteBtn} onClick={() => handleDeleteProductItem(idx)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className={styles.productsSection}>
          <div className={styles.productsHeader}>
            <div>
              <h2 className={styles.productsTitle}>Hair Extensions Manager</h2>
              <p className={styles.helperText}>Images display in the same 4:5 portrait shape used on the Hair Extensions page.</p>
            </div>
            <button className={styles.addButton} onClick={handleAddExtensionItem} disabled={editingItem !== null}><Plus size={18} /> Add Hair Extension</button>
          </div>
          <div className={styles.tableContainer}>
            {catalog.extensions.length === 0 ? <p className={styles.noItems}>No admin-managed hair extensions yet</p> : (
              <table className={styles.table}><thead><tr><th>Photo</th><th>Name</th><th>Price</th><th>Actions</th></tr></thead><tbody>
                {catalog.extensions.map((item, idx) => <tr key={`${item.name}-${idx}`}><td>{item.image ? <img src={encodeURI(item.image)} alt={item.name} className={`${styles.thumb} ${styles.extensionThumb}`} /> : <div className={styles.thumbFallback}><ImageIcon size={14} /></div>}</td><td>{item.name}</td><td>{item.price || 'Price on request'}</td><td className={styles.actions}><button className={styles.editBtn} onClick={() => handleEditExtensionItem(idx)} title="Edit"><Edit2 size={16} /></button><button className={styles.deleteBtn} onClick={() => handleDeleteExtensionItem(idx)} title="Delete"><Trash2 size={16} /></button></td></tr>)}
              </tbody></table>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {editingItem !== null && (
          <div className={styles.modal}>
            <div
              key={`${editingItem.type}-${editingItem.extensionIdx ?? editingItem.productIdx ?? editingItem.itemIdx ?? 'new'}`}
              className={styles.modalContent}
            >
              <div className={styles.modalHeader}>
                <h2>
                  {editingItem.type === 'service' ? (isAddingNew ? 'Add New Service' : 'Edit Service') : editingItem.type === 'extension' ? (isAddingNew ? 'Add Hair Extension' : 'Edit Hair Extension') : (isAddingNew ? 'Add New Product' : 'Edit Product')}
                </h2>
                <button className={styles.closeBtn} onClick={() => setEditingItem(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className={styles.formGroup}>
                <label>{editingItem.type === 'service' ? 'Service Name *' : editingItem.type === 'extension' ? 'Hair Extension Name *' : 'Product Name *'}</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className={styles.input}
                  placeholder={editingItem.type === 'service' ? 'e.g., Knotless Braids (6 Rows)' : editingItem.type === 'extension' ? 'e.g., Body Wave' : 'e.g., Leave-in Conditioner'}
                />
              </div>

              {editingItem.type !== 'extension' && <div className={styles.formGroup}>
                <label>Price *</label>
                {editingItem.type === 'service' ? (
                  <textarea
                    value={editFormData.priceInput || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, priceInput: e.target.value })}
                    className={`${styles.input} ${styles.textarea}`}
                    placeholder={'Use one line for single price or multiple lines for tiered prices'}
                  />
                ) : (
                  <div className={styles.priceInputWrap}><span>GH₵</span><input type="text" inputMode="decimal" value={editFormData.price || ''} onChange={(e) => setEditFormData({ ...editFormData, price: priceNumber(e.target.value) })} className={styles.priceInput} placeholder="120" /></div>
                )}
              </div>}

              {editingItem.type === 'extension' && (
                <div className={styles.formGroup}>
                  <label>Price</label>
                  <div className={styles.priceInputWrap}>
                    <span>GH₵</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editFormData.price || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, price: priceNumber(e.target.value) })}
                      className={styles.priceInput}
                      placeholder="120"
                    />
                  </div>
                  <p className={styles.helperText}>Leave blank to keep it as “Price on request”.</p>
                </div>
              )}

              {editingItem.type === 'service' && (
                <div className={styles.formGroup}>
                  <label>Duration *</label>
                  <input
                    type="text"
                    value={editFormData.duration || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                    className={styles.input}
                    placeholder="e.g., 3.5 hrs"
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Image URL</label>
                <input
                  type="text"
                  value={editFormData.image || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, image: e.target.value })}
                  className={styles.input}
                  placeholder="/images/services/..."
                />
                <div className={styles.uploadRow}>
                  <label className={styles.uploadLabel} htmlFor="imageUploadInput">
                    <ImageIcon size={16} />
                    {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                  </label>
                  <input
                    id="imageUploadInput"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleUploadImage}
                    disabled={isUploadingImage}
                    className={styles.hiddenFileInput}
                  />
                  <p className={styles.helperText}>JPG, PNG or WEBP up to 8MB. The preview below shows the exact crop used on the website.</p>
                </div>
                {editFormData.image && <div className={`${styles.imagePreview} ${editingItem.type === 'product' ? styles.productPreview : editingItem.type === 'service' && catalog.services[editingItem.categoryIdx]?.category === 'BRAIDING' ? styles.braidingPreview : styles.portraitPreview}`}><img src={encodeURI(editFormData.image)} alt="Display preview" /></div>}
                <p className={styles.helperText}>{editingItem.type === 'product' ? 'Preview matches the product card.' : 'Preview matches the portrait card used on the website.'}</p>
              </div>

              {editingItem.type === 'service' && (
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="popularCheckbox"
                    checked={editFormData.popular || false}
                    onChange={(e) => setEditFormData({ ...editFormData, popular: e.target.checked })}
                  />
                  <label htmlFor="popularCheckbox">Mark as Popular</label>
                </div>
              )}

              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setEditingItem(null)}>
                  Cancel
                </button>
                <button className={styles.saveBtn} onClick={handleSaveItem}>
                  {isAddingNew ? 'Add Item' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save All Button */}
        <button type="button" onClick={handleSaveCatalog} disabled={isSaving} className={styles.saveButton}>
          {isSaving ? <Loader size={18} className="loading" /> : <Save size={18} />}
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  )
}
