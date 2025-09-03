'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Product, Option, Brand } from '@/lib/supabase'
import Image from 'next/image'
import crypto from 'crypto'

export default function AdminPanel() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [activeTab, setActiveTab] = useState<'products' | 'brands' | 'settings'>('products')
  const [showProductForm, setShowProductForm] = useState(false)
  const [showBrandForm, setShowBrandForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingBrand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Settings state
  const [currentUsername, setCurrentUsername] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState('')
  const [settingsError, setSettingsError] = useState('')

  // Kimlik doğrulama kontrolü
  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('admin_token')
      const loginTime = sessionStorage.getItem('admin_login_time')
      
      if (!token || !loginTime) {
        router.push('/admin/login')
        return
      }
      
      // Token 24 saat geçerli
      const now = Date.now()
      const loginTimestamp = parseInt(loginTime)
      const twentyFourHours = 24 * 60 * 60 * 1000
      
      if (now - loginTimestamp > twentyFourHours) {
        sessionStorage.removeItem('admin_token')
        sessionStorage.removeItem('admin_login_time')
        sessionStorage.removeItem('admin_user_id')
        router.push('/admin/login')
        return
      }
      
      setIsAuthenticated(true)
      setAuthLoading(false)
    }
    
    checkAuth()
  }, [])

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    image_url: '',
    base_price: 0,
    description: ''
  })

  const [imagePreview, setImagePreview] = useState<string>('')

  const [brandForm, setBrandForm] = useState({
    name: '',
    logo_url: ''
  })

  const [brandImagePreview, setBrandImagePreview] = useState<string>('')

  const [productOptions, setProductOptions] = useState<{ option_name: string; option_price: number }[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Demo veriler - gerçek projede Supabase'den çekilecek
      if (!supabase) {
        // Demo data
        const demoProducts: Product[] = [
          {
            id: 1,
            name: 'Karışık Tost',
            image_url: '',
            base_price: 25.00,
            description: 'Kaşar, sucuk, domates, salatalık'
          },
          {
            id: 2,
            name: 'Kaşarlı Tost',
            image_url: '',
            base_price: 20.00,
            description: 'Kaşar peyniri, domates'
          },
          {
            id: 3,
            name: 'Ayran',
            image_url: '',
            base_price: 8.00,
            description: 'Soğuk ayran'
          },
          {
            id: 4,
            name: 'Sandwich',
            image_url: '',
            base_price: 30.00,
            description: 'Tavuk, marul, domates, mayonez'
          }
        ]
        
        const demoOptions: Option[] = [
          { id: 1, product_id: 1, option_name: 'Küçük Boy', option_price: 0.00 },
          { id: 2, product_id: 1, option_name: 'Büyük Boy', option_price: 5.00 },
          { id: 3, product_id: 2, option_name: 'Küçük Boy', option_price: 0.00 },
          { id: 4, product_id: 2, option_name: 'Büyük Boy', option_price: 5.00 },
          { id: 5, product_id: 4, option_name: 'Tavuklu', option_price: 0.00 },
          { id: 6, product_id: 4, option_name: 'Etli', option_price: 8.00 }
        ]
        
        const demoBrands: Brand[] = [
          { id: 1, name: 'Coca Cola', logo_url: '' },
          { id: 2, name: 'Ülker', logo_url: '' },
          { id: 3, name: 'Eti', logo_url: '' }
        ]
        
        setProducts(demoProducts)
        setOptions(demoOptions)
        setBrands(demoBrands)
      } else {
        const [productsRes, optionsRes, brandsRes] = await Promise.all([
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('options').select('*'),
          supabase.from('brands').select('*').order('created_at', { ascending: false })
        ])

        if (productsRes.data) setProducts(productsRes.data)
        if (optionsRes.data) setOptions(optionsRes.data)
        if (brandsRes.data) setBrands(brandsRes.data)
      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProductOptions = (productId: number) => {
    return options.filter(option => option.product_id === productId)
  }

  const resetProductForm = () => {
    setProductForm({ name: '', image_url: '', base_price: 0, description: '' })
    setProductOptions([])
    setEditingProduct(null)
    setShowProductForm(false)
    setImagePreview('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Dosya boyutu kontrolü (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır.')
        return
      }

      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        alert('Lütfen sadece resim dosyası seçin.')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
        setProductForm(prev => ({ ...prev, image_url: base64String }))
        setImagePreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetBrandForm = () => {
    setBrandForm({ name: '', logo_url: '' })
    setBrand(null)
    setShowBrandForm(false)
    setBrandImagePreview('')
  }

  // Hash fonksiyonları
  const simpleHash = (str: string): string => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32bit integer'a dönüştür
    }
    return hash.toString()
  }

  const hashPassword = (password: string): string => {
    return crypto.createHash('sha256').update(password).digest('hex')
  }

  // Kullanıcı bilgilerini yükle
  const loadCurrentUser = async () => {
    if (!supabase) return
    
    const userId = sessionStorage.getItem('admin_user_id')
    if (!userId) return

    try {
      const { data: user, error } = await supabase
        .from('admin_users')
        .select('username')
        .eq('id', userId)
        .single()

      if (user && !error) {
        setCurrentUsername(user.username)
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri yüklenirken hata:', error)
    }
  }

  // Kullanıcı adını güncelle
  const updateUsername = async () => {
    if (!supabase || !newUsername.trim()) {
      setSettingsError('Yeni kullanıcı adı boş olamaz')
      return
    }

    setSettingsLoading(true)
    setSettingsError('')
    setSettingsMessage('')

    try {
      const userId = sessionStorage.getItem('admin_user_id')
      if (!userId) {
        setSettingsError('Kullanıcı ID bulunamadı')
        return
      }

      const { error } = await supabase
        .from('admin_users')
        .update({ 
          username: newUsername.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        setSettingsError('Kullanıcı adı güncellenirken hata oluştu: ' + error.message)
      } else {
        setCurrentUsername(newUsername.trim())
        setNewUsername('')
        setSettingsMessage('Kullanıcı adı başarıyla güncellendi')
      }
    } catch (error) {
      setSettingsError('Beklenmeyen hata oluştu')
      console.error('Username update error:', error)
    } finally {
      setSettingsLoading(false)
    }
  }

  // Şifreyi güncelle
  const updatePassword = async () => {
    if (!supabase || !currentPassword || !newPassword || !confirmPassword) {
      setSettingsError('Tüm şifre alanları doldurulmalıdır')
      return
    }

    if (newPassword !== confirmPassword) {
      setSettingsError('Yeni şifreler eşleşmiyor')
      return
    }

    if (newPassword.length < 6) {
      setSettingsError('Yeni şifre en az 6 karakter olmalıdır')
      return
    }

    setSettingsLoading(true)
    setSettingsError('')
    setSettingsMessage('')

    try {
      const userId = sessionStorage.getItem('admin_user_id')
      if (!userId) {
        setSettingsError('Kullanıcı ID bulunamadı')
        return
      }

      // Mevcut şifreyi kontrol et
      const { data: user, error: fetchError } = await supabase
        .from('admin_users')
        .select('password_hash')
        .eq('id', userId)
        .single()

      if (fetchError || !user) {
        setSettingsError('Kullanıcı bilgileri alınamadı')
        return
      }

      // Mevcut şifre kontrolü - hem eski hem yeni hash ile
      const oldPasswordHash = simpleHash(currentPassword)
      const newCurrentPasswordHash = hashPassword(currentPassword)
      
      const isCurrentPasswordValid = user.password_hash === oldPasswordHash || 
                                   user.password_hash === newCurrentPasswordHash

      if (!isCurrentPasswordValid) {
        setSettingsError('Mevcut şifre yanlış')
        return
      }

      // Yeni şifreyi hash'le ve güncelle
      const newPasswordHash = hashPassword(newPassword)
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ 
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        setSettingsError('Şifre güncellenirken hata oluştu: ' + updateError.message)
      } else {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setSettingsMessage('Şifre başarıyla güncellendi')
      }
    } catch (error) {
      setSettingsError('Beklenmeyen hata oluştu')
      console.error('Password update error:', error)
    } finally {
      setSettingsLoading(false)
    }
  }

  // Ayarlar sekmesi açıldığında kullanıcı bilgilerini yükle
  useEffect(() => {
    if (activeTab === 'settings' && isAuthenticated) {
      loadCurrentUser()
    }
  }, [activeTab, isAuthenticated])

  const handleBrandFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Dosya boyutu kontrolü (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır.')
        return
      }

      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        alert('Lütfen sadece resim dosyası seçin.')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
        setBrandForm(prev => ({ ...prev, logo_url: base64String }))
        setBrandImagePreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!supabase) {
        // Demo modunda ürün ekleme/güncelleme simülasyonu
        if (editingProduct) {
          const updatedProducts = products.map(p => 
            p.id === editingProduct.id 
              ? { ...p, ...productForm }
              : p
          )
          setProducts(updatedProducts)
        } else {
          const newId = Math.max(...products.map(p => p.id)) + 1
          const newProduct: Product = {
            id: newId,
            ...productForm
          }
          setProducts([...products, newProduct])
        }
        resetProductForm()
        alert(editingProduct ? 'Ürün güncellendi! (Demo modu)' : 'Ürün eklendi! (Demo modu)')
        return
      }

      let productResult
      
      if (editingProduct) {
        // Update existing product
        productResult = await supabase
          .from('products')
          .update(productForm)
          .eq('id', editingProduct.id)
          .select()
      } else {
        // Create new product
        productResult = await supabase
          .from('products')
          .insert([productForm])
          .select()
      }

      if (productResult.error) throw productResult.error

      // Handle options
      if (productResult.data && productResult.data.length > 0) {
        const productId = productResult.data[0].id
        
        // Delete existing options if editing
        if (editingProduct) {
          await supabase.from('options').delete().eq('product_id', productId)
        }
        
        // Insert new options
        if (productOptions.length > 0) {
          const optionsToInsert = productOptions.map(opt => ({
            product_id: productId,
            option_name: opt.option_name,
            option_price: opt.option_price
          }))
          
          await supabase.from('options').insert(optionsToInsert)
        }
      }

      await fetchData()
      resetProductForm()
      alert(editingProduct ? 'Ürün güncellendi!' : 'Ürün eklendi!')
    } catch (error) {
      console.error('Ürün kaydedilirken hata:', error)
      console.error('Hata detayı:', JSON.stringify(error, null, 2))
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Hata oluştu: ${errorMessage}`)
    }
  }

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!supabase) {
        // Demo modunda marka ekleme/güncelleme simülasyonu
        if (editingBrand) {
          const updatedBrands = brands.map(b => 
            b.id === editingBrand.id 
              ? { ...b, ...brandForm }
              : b
          )
          setBrands(updatedBrands)
        } else {
          const newId = Math.max(...brands.map(b => b.id)) + 1
          const newBrand: Brand = {
            id: newId,
            ...brandForm
          }
          setBrands([...brands, newBrand])
        }
        resetBrandForm()
        alert(editingBrand ? 'Marka güncellendi! (Demo modu)' : 'Marka eklendi! (Demo modu)')
        return
      }

      if (editingBrand) {
        const { error } = await supabase
          .from('brands')
          .update(brandForm)
          .eq('id', editingBrand.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('brands')
          .insert([brandForm])
        
        if (error) throw error
      }

      await fetchData()
      resetBrandForm()
      alert(editingBrand ? 'Marka güncellendi!' : 'Marka eklendi!')
    } catch (error) {
      console.error('Marka kaydedilirken hata:', error)
      console.error('Hata detayı:', JSON.stringify(error, null, 2))
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Hata oluştu: ${errorMessage}`)
    }
  }

  const deleteProduct = async (id: number) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return
    
    try {
      if (!supabase) {
        // Demo modunda ürün silme simülasyonu
        const filteredProducts = products.filter(p => p.id !== id)
        setProducts(filteredProducts)
        alert('Ürün silindi! (Demo modu)')
        return
      }

      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      
      await fetchData()
      alert('Ürün silindi!')
    } catch (error) {
      console.error('Ürün silinirken hata:', error)
      alert('Hata oluştu!')
    }
  }

  const deleteBrand = async (id: number) => {
    if (!confirm('Bu markayı silmek istediğinizden emin misiniz?')) return
    
    try {
      if (!supabase) {
        // Demo modunda marka silme simülasyonu
        const filteredBrands = brands.filter(b => b.id !== id)
        setBrands(filteredBrands)
        alert('Marka silindi! (Demo modu)')
        return
      }

      const { error } = await supabase.from('brands').delete().eq('id', id)
      if (error) throw error
      
      await fetchData()
      alert('Marka silindi!')
    } catch (error) {
      console.error('Marka silinirken hata:', error)
      alert('Hata oluştu!')
    }
  }

  const editProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      image_url: product.image_url || '',
      base_price: product.base_price,
      description: product.description || ''
    })
    
    // Görsel önizlemesini ayarla
    if (product.image_url) {
      setImagePreview(product.image_url)
    }
    
    const existingOptions = getProductOptions(product.id)
    setProductOptions(existingOptions.map(opt => ({
      option_name: opt.option_name,
      option_price: opt.option_price
    })))
    
    setShowProductForm(true)
  }

  const editBrand = (brand: Brand) => {
    setBrand(brand)
    setBrandForm({
      name: brand.name,
      logo_url: brand.logo_url || ''
    })
    
    // Logo önizlemesini ayarla
    if (brand.logo_url) {
      setBrandImagePreview(brand.logo_url)
    }
    
    setShowBrandForm(true)
  }

  const addOption = () => {
    setProductOptions(prev => [...prev, { option_name: '', option_price: 0 }])
  }

  const removeOption = (index: number) => {
    setProductOptions(prev => prev.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, field: 'option_name' | 'option_price', value: string | number) => {
    setProductOptions(prev => prev.map((opt, i) => 
      i === index ? { ...opt, [field]: value } : opt
    ))
  }

  // Authentication loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Kimlik doğrulanıyor...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('settings' as any)}
                className="text-gray-600 hover:text-gray-800 font-medium flex items-center space-x-1"
              >
                <span>⚙️</span>
                <span>Ayarlar</span>
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem('admin_token')
                  sessionStorage.removeItem('admin_login_time')
                  router.push('/admin/login')
                }}
                className="text-red-600 hover:text-red-800 font-medium flex items-center space-x-1"
              >
                <span>🚪</span>
                <span>Çıkış</span>
              </button>
              <a
                href="/"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Ana Sayfa
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Ürünler ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('brands')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'brands'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Markalar ({brands.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⚙️ Ayarlar
              </button>
            </nav>
          </div>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Ürün Yönetimi</h2>
              <button
                onClick={() => setShowProductForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Yeni Ürün
              </button>
            </div>

            <div className="grid gap-4">
              {products.map((product) => {
                const productOpts = getProductOptions(product.id)
                return (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                              🍽️
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                          <p className="text-lg font-bold text-green-600">{product.base_price.toFixed(2)} ₺</p>
                          {productOpts.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Seçenekler:</p>
                              <div className="flex flex-wrap gap-1">
                                {productOpts.map((opt) => (
                                  <span key={opt.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {opt.option_name} (+{opt.option_price.toFixed(2)} ₺)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editProduct(product)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Brands Tab */}
        {activeTab === 'brands' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Marka Yönetimi</h2>
              <button
                onClick={() => setShowBrandForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Yeni Marka
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand) => (
                <div key={brand.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-center">
                    <div className="w-20 h-16 bg-gray-200 rounded-lg mx-auto mb-3">
                      {brand.logo_url ? (
                        <Image
                          src={brand.logo_url}
                          alt={brand.name}
                          width={80}
                          height={64}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {brand.name}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-3">{brand.name}</h3>
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => editBrand(brand)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => deleteBrand(brand.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Yönetici Ayarları</h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Mesaj ve Hata Gösterimi */}
                {settingsMessage && (
                  <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    {settingsMessage}
                  </div>
                )}
                {settingsError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {settingsError}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Kullanıcı Adı Değiştirme */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Kullanıcı Adı Değiştir</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mevcut Kullanıcı Adı
                        </label>
                        <input
                          type="text"
                          value={currentUsername}
                          disabled
                          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Yeni Kullanıcı Adı
                        </label>
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="Yeni kullanıcı adını girin"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button 
                        onClick={updateUsername}
                        disabled={settingsLoading || !newUsername.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {settingsLoading ? 'Güncelleniyor...' : 'Kullanıcı Adını Güncelle'}
                      </button>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Şifre Değiştirme */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Şifre Değiştir</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mevcut Şifre
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Mevcut şifrenizi girin"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Yeni Şifre
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Yeni şifrenizi girin (en az 6 karakter)"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Yeni Şifre Tekrar
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Yeni şifrenizi tekrar girin"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button 
                        onClick={updatePassword}
                        disabled={settingsLoading || !currentPassword || !newPassword || !confirmPassword}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {settingsLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                      </button>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Güvenlik Bilgileri */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Güvenlik Bilgileri</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-blue-600 text-xl">🔒</div>
                        <div>
                          <h4 className="font-medium text-blue-900">Güvenlik Önerileri</h4>
                          <ul className="text-sm text-blue-800 mt-2 space-y-1">
                            <li>• Güçlü bir şifre kullanın (en az 8 karakter)</li>
                            <li>• Şifrenizi düzenli olarak değiştirin</li>
                            <li>• Şifrenizi kimseyle paylaşmayın</li>
                            <li>• Oturumunuzu kapattıktan sonra tarayıcıyı kapatın</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleProductSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
                </h2>
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Görseli
                  </label>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Önizleme:</p>
                      <div className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                        <Image
                          src={imagePreview}
                          alt="Önizleme"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temel Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.base_price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Ürün içerikleri ve açıklaması"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Seçenekler
                    </label>
                    <button
                      type="button"
                      onClick={addOption}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Seçenek Ekle
                    </button>
                  </div>
                  
                  {productOptions.map((option, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        placeholder="Seçenek adı (ör: Büyük Boy)"
                        value={option.option_name}
                        onChange={(e) => updateOption(index, 'option_name', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Ek fiyat"
                        value={option.option_price}
                        onChange={(e) => updateOption(index, 'option_price', parseFloat(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProduct ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Form Modal */}
      {showBrandForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <form onSubmit={handleBrandSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingBrand ? 'Marka Düzenle' : 'Yeni Marka Ekle'}
                </h2>
                <button
                  type="button"
                  onClick={resetBrandForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marka Adı *
                  </label>
                  <input
                    type="text"
                    value={brandForm.name}
                    onChange={(e) => setBrandForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marka Logosu
                  </label>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBrandFileUpload}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />

                  {/* Logo Preview */}
                  {brandImagePreview && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Önizleme:</p>
                      <div className="relative w-24 h-24 border border-gray-300 rounded-lg overflow-hidden">
                        <Image
                          src={brandImagePreview}
                          alt="Logo Önizleme"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetBrandForm}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingBrand ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}