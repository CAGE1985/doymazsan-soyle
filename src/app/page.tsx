'use client'

import { useState, useEffect } from 'react'
import { supabase, Product, Option, Brand, CartItem } from '@/lib/supabase'
import { testSupabaseConnection, loadInitialData } from '@/lib/supabase-test'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

export default function Home() {
  console.log('🏠 Home bileşeni render ediliyor')
  const [products, setProducts] = useState<Product[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [showProductModal, setShowProductModal] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({ name: '', address: '', note: '' })
  const [showCheckout, setShowCheckout] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCartNotification, setShowCartNotification] = useState(false)


  console.log('🔄 useEffect tanımlanıyor...')
  
  useEffect(() => {
    console.log('🔄 useEffect çalıştı! - TEST')
    fetchData()
  }, [])
  
  console.log('🔄 useEffect tanımlandı')

  const fetchData = async () => {
    console.log('🚀 fetchData başlatıldı')
    try {
      // Supabase bağlantısını test et
      const connectionTest = await testSupabaseConnection()
      console.log('🔍 Supabase bağlantı durumu:', connectionTest)
      console.log('🔍 Supabase client durumu:', supabase ? 'VAR' : 'YOK')
      
      // Demo veriler - gerçek projede Supabase'den çekilecek
      if (!supabase) {
        console.error('❌ Supabase bağlantısı bulunamadı! Lütfen .env dosyasını kontrol edin.')
        setLoading(false)
        return
      } else {
        // Veri yükleme testini çalıştır
        const dataTest = await loadInitialData()
        console.log('🔍 Veri yükleme testi:', dataTest)
        
        console.log('🔍 Supabase sorgularını başlatıyor...')
        const [productsRes, optionsRes, brandsRes] = await Promise.all([
          supabase.from('products').select('*').order('order_index', { ascending: true, nullsFirst: false }),
          supabase.from('options').select('*'),
          supabase.from('brands').select('*')
        ])
        console.log('🔍 Supabase sorguları tamamlandı')

        console.log('🔍 Supabase Responses:', {
          productsRes: { data: productsRes.data?.length, error: productsRes.error },
          optionsRes: { data: optionsRes.data?.length, error: optionsRes.error },
          brandsRes: { data: brandsRes.data?.length, error: brandsRes.error }
        })

        if (productsRes.data && productsRes.data.length > 0) {
          setProducts(productsRes.data)
        } else {
          // Eğer veritabanında ürün yoksa boş array set et
          console.log('⚠️ Ürün bulunamadı.')
          setProducts([])
        }

        if (optionsRes.data && optionsRes.data.length > 0) {
          setOptions(optionsRes.data)
        } else {
          setOptions([])
        }

        if (brandsRes.data && brandsRes.data.length > 0) {
          setBrands(brandsRes.data)
        } else {
          setBrands([])
        }
        
        console.log('✅ Veriler yüklendi:', {
          products: productsRes.data?.length || 0,
          options: optionsRes.data?.length || 0,
          brands: brandsRes.data?.length || 0
        })

      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }



  const openProductModal = (product: Product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }



  const addSingleOptionToCart = (option: Option) => {
    if (!selectedProduct) return

    const totalPrice = option.option_price
    
    setCart(prev => {
      // Aynı ürün ve seçenek kombinasyonu var mı kontrol et
      const existingItemIndex = prev.findIndex(item => 
        item.product.id === selectedProduct.id && 
        item.selectedOptions.length === 1 &&
        item.selectedOptions[0].id === option.id
      )
      
      if (existingItemIndex !== -1) {
        // Varsa miktarı artır
        const updatedCart = [...prev]
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + 1,
          totalPrice: (updatedCart[existingItemIndex].quantity + 1) * totalPrice
        }
        return updatedCart
      } else {
        // Yoksa yeni öğe ekle
        const cartItem: CartItem = {
          product: selectedProduct,
          selectedOptions: [option],
          quantity: 1,
          totalPrice
        }
        return [...prev, cartItem]
      }
    })
    
    // Sepete eklendi uyarısını göster
    setShowCartNotification(true)
    setTimeout(() => setShowCartNotification(false), 3000)
  }

  const addToCart = () => {
    if (!selectedProduct) return

    const totalPrice = selectedProduct.base_price
    
    setCart(prev => {
      // Aynı ürün (seçeneksiz) var mı kontrol et
      const existingItemIndex = prev.findIndex(item => 
        item.product.id === selectedProduct.id && 
        item.selectedOptions.length === 0
      )
      
      if (existingItemIndex !== -1) {
        // Varsa miktarı artır
        const updatedCart = [...prev]
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + 1,
          totalPrice: (updatedCart[existingItemIndex].quantity + 1) * totalPrice
        }
        return updatedCart
      } else {
        // Yoksa yeni öğe ekle
        const cartItem: CartItem = {
          product: selectedProduct,
          selectedOptions: [],
          quantity: 1,
          totalPrice
        }
        return [...prev, cartItem]
      }
    })
    
    // Sepete eklendi uyarısını göster
    setShowCartNotification(true)
    setTimeout(() => setShowCartNotification(false), 3000)
    
    // Modal'ı kapatmıyoruz - kullanıcı başka ürün ekleyebilsin
    // setShowProductModal(false)
    // setSelectedProduct(null)
  }

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index)
      return
    }
    
    setCart(prev => {
      const updatedCart = [...prev]
      const item = updatedCart[index]
      const unitPrice = item.totalPrice / item.quantity
      updatedCart[index] = {
        ...item,
        quantity: newQuantity,
        totalPrice: unitPrice * newQuantity
      }
      return updatedCart
    })
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const sendWhatsAppOrder = () => {
    const orderText = `Yeni Sipariş 🛎️\n\n👤 İsim Soyisim: ${customerInfo.name}\n📍 Adres: ${customerInfo.address}\n\n📝 Siparişler:\n${cart.map(item => {
      const optionsText = item.selectedOptions.length > 0 ? ` (${item.selectedOptions.map(opt => opt.option_name).join(', ')})` : ''
      return `- ${item.quantity} adet ${item.product.name}${optionsText} - ${Math.round(item.totalPrice)}₺`
    }).join('\n')}\n\n----------------------\n📋 Müşteri Notu: ${customerInfo.note || 'Yok'}\n\n💰 Toplam Tutar: ${Math.round(getTotalPrice())}₺`
    
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '905307710760'
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderText)}`
    
    window.open(whatsappUrl, '_blank')
  }

  console.log('🔍 Render Debug:', { loading, productsCount: products.length, optionsCount: options.length })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Menü yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100">
      {/* Header */}
      <header className="bg-orange-600/90 backdrop-blur-md shadow-lg sticky top-0 z-40 border-b border-orange-300/30">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <Image 
                src="/doymazsansoylelogo.png" 
                alt="Doymazsan Söyle Logo" 
                width={64}
                height={64}
                className="h-16 w-auto"
              />
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-md">Doymazsan Söyle</h1>
                <p className="text-white/90 text-base">Premium Lezzet Deneyimi</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-3">
              {cart.length > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <button 
                    onClick={() => setShowCheckout(true)}
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 text-orange-900 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-white/20"
                  >
                    🛒
                    <span className="absolute -top-2 -right-2 bg-yellow-500 text-orange-900 text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                      {cart.length}
                    </span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 text-white">
        <div className="absolute inset-0 bg-orange-900/20"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-3 drop-shadow-lg">Lezzet Dolu Anlar</h2>
            <p className="text-base md:text-lg mb-4 text-orange-100 font-medium">Taze malzemelerle özel lezzetler</p>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 max-w-2xl lg:max-w-4xl mx-auto text-xs md:text-sm lg:text-base"
            >
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 lg:px-6 lg:py-3 rounded-full border border-orange-300/30 text-center font-medium min-h-[40px] lg:min-h-[50px] flex items-center justify-center">🚀 Hızlı Teslimat</span>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 lg:px-6 lg:py-3 rounded-full border border-orange-300/30 text-center font-medium min-h-[40px] lg:min-h-[50px] flex items-center justify-center">⭐ Premium Kalite</span>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 lg:px-6 lg:py-3 rounded-full border border-orange-300/30 text-center font-medium min-h-[40px] lg:min-h-[50px] flex items-center justify-center whitespace-nowrap">💯 Müşteri Memnuniyeti</span>
            </motion.div>
          </motion.div>
        </div>
      </section>



      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-24 pt-4">
        {/* Products Grid */}
        <div className="mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-center mb-8">
              <h3 className="inline-block text-4xl font-bold text-black px-8 py-4 bg-gradient-to-r from-orange-100 via-yellow-50 to-orange-100 rounded-2xl border-2 border-orange-300 shadow-lg backdrop-blur-sm relative overflow-hidden">
                 <span className="absolute inset-0 bg-gradient-to-r from-orange-200/30 via-yellow-100/30 to-orange-200/30 rounded-2xl"></span>
                 <span className="relative z-10">🍽️ Menümüz 🍽️</span>
               </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => {
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="group cursor-pointer"
                    onClick={() => openProductModal(product)}
                  >
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group-hover:scale-105 border-2 border-orange-200 hover:border-orange-400">
                      <div className="relative overflow-hidden">
                        <div className="aspect-[4/3] bg-gradient-to-br from-orange-50 to-yellow-50">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              width={400}
                              height={300}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-orange-400 text-4xl">
                              🍽️
                            </div>
                          )}
                        </div>
                        
                        {/* Seçenekli Butonu - Sadece seçeneği olan ürünlerde göster */}
                        {options.filter(option => option.product_id === product.id).length > 0 && (
                          <div className="absolute top-3 left-3">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                openProductModal(product)
                              }}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full px-4 py-2 text-sm font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-xl border-2 border-white/70 transform hover:scale-110 backdrop-blur-sm"
                            >
                              ⚡ Seçenekli
                            </button>
                          </div>
                        )}

                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-xl text-orange-900 group-hover:text-orange-700 transition-colors flex-1">{product.name}</h3>
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-orange-900 rounded-full px-3 py-1 text-sm font-bold border border-orange-200 ml-3 shadow-sm">
                            {Math.round(product.base_price)}₺
                          </div>
                        </div>
                        <div className="bg-orange-50/50 rounded-lg p-3 border-l-4 border-orange-300 mb-4 h-16 overflow-hidden">
                          <p className="text-orange-800/70 text-sm line-clamp-2 leading-relaxed font-medium">{product.description}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-400">⭐</span>
                            <span className="text-sm text-orange-700">4.8</span>
                          </div>
                          <button className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold hover:from-orange-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 border border-orange-300">
                            Sepete Ekle
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Brands Section - Auto Sliding */}
        {brands.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-orange-400/30 to-yellow-400/30 rounded-3xl p-8 mb-12"
          >
            <h2 className="text-2xl font-bold text-orange-900 text-center mb-8 drop-shadow-md">Güvenilir Markalarımız</h2>
            <div className="relative overflow-hidden">
              <div className="flex animate-slide-left space-x-6">
                {/* İlk set */}
                {brands.map((brand) => (
                   <div key={`first-${brand.id}`} className="flex-shrink-0 group cursor-pointer">
                     <div className="relative overflow-hidden rounded-2xl border-2 border-gradient-to-r from-orange-300 to-yellow-300 bg-gradient-to-r from-orange-300 to-yellow-300 hover:from-orange-400 hover:to-yellow-400 transition-all duration-300">
                       <div className="bg-white rounded-xl w-40 h-28 flex items-center justify-center p-1">
                         {brand.logo_url ? (
                           <Image
                             src={brand.logo_url}
                             alt={brand.name}
                             width={150}
                             height={100}
                             className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300 filter drop-shadow-sm"
                           />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-orange-900 text-sm font-semibold">
                             {brand.name}
                           </div>
                         )}
                       </div>
                     </div>
                     <p className="text-orange-800 text-sm text-center mt-3 font-bold group-hover:text-orange-700 transition-colors">{brand.name}</p>
                   </div>
                 ))}
                {/* İkinci set - seamless loop için */}
                 {brands.map((brand) => (
                   <div key={`second-${brand.id}`} className="flex-shrink-0 group cursor-pointer">
                     <div className="relative overflow-hidden rounded-2xl border-2 border-gradient-to-r from-orange-300 to-yellow-300 bg-gradient-to-r from-orange-300 to-yellow-300 hover:from-orange-400 hover:to-yellow-400 transition-all duration-300">
                       <div className="bg-white rounded-xl w-40 h-28 flex items-center justify-center p-1">
                         {brand.logo_url ? (
                           <Image
                             src={brand.logo_url}
                             alt={brand.name}
                             width={150}
                             height={100}
                             className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300 filter drop-shadow-sm"
                           />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-orange-900 text-sm font-semibold">
                             {brand.name}
                           </div>
                         )}
                       </div>
                     </div>
                     <p className="text-orange-800 text-sm text-center mt-3 font-bold group-hover:text-orange-700 transition-colors">{brand.name}</p>
                   </div>
                 ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Kampanya Banner - Güvenilir Markalarımız Altında */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-12 relative overflow-hidden rounded-3xl shadow-2xl"
        >
          <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-500 p-8 text-white relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative">
              {/* Üst Kısım - Ana Başlık */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full p-4 mb-4">
                  <span className="text-4xl">🛵</span>
                </div>
                <h4 className="text-3xl font-bold mb-2">Tüm Gel Al Siparişlerde</h4>
                <p className="text-white/90 text-lg">Hızlı teslimat garantisi</p>
              </div>
              
              {/* Orta Kısım - Özellik Butonları */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 mb-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 lg:p-8 text-center border border-white/30 hover:bg-white/30 transition-all duration-300 min-h-[140px] lg:min-h-[160px] flex flex-col justify-center">
                  <div className="text-3xl lg:text-4xl mb-3">🚀</div>
                  <div className="font-bold text-lg lg:text-xl mb-2">Hızlı Teslimat</div>
                  <div className="text-white/80 text-sm lg:text-base">30 dk içinde</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 lg:p-8 text-center border border-white/30 hover:bg-white/30 transition-all duration-300 min-h-[140px] lg:min-h-[160px] flex flex-col justify-center">
                  <div className="text-3xl lg:text-4xl mb-3">⭐</div>
                  <div className="font-bold text-lg lg:text-xl mb-2">Premium Kalite</div>
                  <div className="text-white/80 text-sm lg:text-base">Taze malzemeler</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 lg:p-8 text-center border border-white/30 hover:bg-white/30 transition-all duration-300 min-h-[140px] lg:min-h-[160px] flex flex-col justify-center">
                  <div className="text-3xl lg:text-4xl mb-3">💯</div>
                  <div className="font-bold text-lg lg:text-xl mb-2 leading-tight">Müşteri<br className="sm:hidden" /> Memnuniyeti</div>
                  <div className="text-white/80 text-sm lg:text-base">%100 garanti</div>
                </div>
              </div>
              
              {/* Alt Kısım - İndirim ve İletişim */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white text-red-600 rounded-2xl p-6 text-center shadow-xl">
                  <div className="text-4xl font-bold mb-2">10% İNDİRİM</div>
                  <div className="text-red-500 text-sm font-medium">Tüm siparişlerde geçerli</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/30">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <span className="text-green-400 text-2xl">📞</span>
                    <span className="text-2xl font-bold">530 771 0760</span>
                  </div>
                  <div className="text-white/80 text-sm">Hemen ara, sipariş ver!</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Cart Summary - Fixed Bottom */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-orange-200 p-4 z-50 shadow-2xl"
          >
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">🛒</span>
                  </div>
                  <div>
                    <span className="font-bold text-orange-900 text-lg">
                      Sepet ({cart.length} ürün)
                    </span>
                    <p className="text-sm text-orange-700">Siparişinizi tamamlayın</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-2xl bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                    {Math.round(getTotalPrice())}₺
                  </span>
                  <p className="text-xs text-orange-600">Toplam tutar</p>
                </div>
              </div>
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-orange-700 hover:to-yellow-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
              >
                Siparişi Tamamla 🚀
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sepete Eklendi Uyarısı */}
      <AnimatePresence>
        {showCartNotification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] pointer-events-none"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl border-2 border-green-300/50 backdrop-blur-md">
              <div className="flex items-center space-x-2">
                <span className="text-lg">✅</span>
                <span className="font-bold text-sm">Sepete Eklendi!</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowProductModal(false)}
          >
            <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                className="bg-white/95 backdrop-blur-md w-full max-w-sm mx-4 rounded-2xl overflow-hidden shadow-2xl border-2 border-orange-200 max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-orange-50 to-yellow-50">
                  {selectedProduct.image_url ? (
                    <Image
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      width={500}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-orange-400 text-6xl">
                      🍽️
                    </div>
                  )}
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="absolute top-4 right-4 w-10 h-10 bg-orange-600/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-orange-700 transition-all duration-300"
                  >
                    ✕
                  </button>
                </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-orange-900 mb-1 drop-shadow-sm">{selectedProduct.name}</h2>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-sm text-orange-700">4.8</span>
                      </div>
                      <span className="text-orange-300">•</span>
                      <span className="text-sm text-orange-700">250+ sipariş</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                      {Math.round(selectedProduct.base_price)}₺
                    </span>

                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 mb-4 border border-orange-200">
                  <p className="text-orange-800 leading-relaxed text-sm font-medium">{selectedProduct.description}</p>
                </div>
                
                {/* Seçenekler */}
                {options.filter(option => option.product_id === selectedProduct.id).length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-orange-900 mb-3">Seçenekler</h3>
                    <div className="space-y-2">
                      {options.filter(option => option.product_id === selectedProduct.id).map((option) => (
                        <div key={option.id} className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-orange-200 hover:border-orange-300 transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-orange-900">{option.option_name}</span>
                                {option.option_price > 0 && (
                                  <span className="text-sm font-semibold text-green-600">+{Math.round(option.option_price)}₺</span>
                                )}
                              </div>

                            </div>
                            <button 
                               onClick={(e) => {
                                 e.stopPropagation()
                                 addSingleOptionToCart(option)
                               }}
                               className="ml-3 w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full flex items-center justify-center hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-110 shadow-lg border-2 border-white/30"
                             >
                               <span className="text-sm font-bold">🛒</span>
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-3 mb-4 border border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-orange-900">Temel Fiyat:</span>
                    <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                      {Math.round(selectedProduct.base_price)}₺
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-orange-200">
                    <p className="text-xs text-orange-700 text-center">
                      💡 Her seçeneği ayrı ayrı sepete ekleyebilirsiniz
                    </p>
                  </div>
                </div>
                
                {/* Ana Sepete Ekle Butonu - Sadece seçeneksiz ürünlerde göster */}
                {options.filter(option => option.product_id === selectedProduct.id).length === 0 && (
                  <button
                    onClick={addToCart}
                    className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-3 rounded-xl font-bold text-base hover:from-orange-700 hover:to-yellow-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                  >
                    Sepete Ekle 🛒
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/95 backdrop-blur-md rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-orange-200"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm">Sipariş Bilgileri</h2>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="w-10 h-10 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center transition-colors border border-orange-300"
                  >
                    <span className="text-orange-600 text-xl">✕</span>
                  </button>
                </div>
                
                {/* Kampanya Uyarısı */}
                <div className="mb-6 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-500 rounded-2xl p-4 text-white shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                      <span className="text-2xl">🛵</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">Tüm Gel Al Siparişlerde %10 İndirim!</h4>
                      <p className="text-white/90 text-sm">📞 530 771 0760 - Hızlı teslimat garantisi</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">Sepetiniz 🛒</h3>
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 space-y-3 border border-orange-200">
                    {cart.map((item, index) => (
                      <div key={index} className="flex justify-between items-start py-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">{item.product.name}</span>
                          {item.selectedOptions.length > 0 && (
                            <div className="text-sm text-orange-600 mt-1">
                            <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs border border-orange-300">
                              {item.selectedOptions.map(opt => opt.option_name).join(', ')}
                            </span>
                          </div>
                          )}
                          
                          {/* Miktar Kontrolü */}
                          <div className="flex items-center mt-2 space-x-2">
                            <button
                              onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                              className="w-7 h-7 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-full flex items-center justify-center transition-colors border border-orange-300"
                            >
                              <span className="text-sm font-bold">−</span>
                            </button>
                            <span className="text-sm font-semibold text-gray-700 min-w-[2rem] text-center">
                              {item.quantity} adet
                            </span>
                            <button
                              onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                              className="w-7 h-7 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-full flex items-center justify-center transition-colors border border-orange-300"
                            >
                              <span className="text-sm font-bold">+</span>
                            </button>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <span className="font-bold text-orange-600">{Math.round(item.totalPrice)}₺</span>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="block text-xs text-orange-500 hover:text-orange-700 mt-1 transition-colors"
                          >
                            Kaldır
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 border-t-2 border-orange-200">
                      <span className="text-lg font-bold text-orange-900">Toplam Tutar:</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">{Math.round(getTotalPrice())}₺</span>
                    </div>
                    
                    {/* Sepeti Temizle Butonu */}
                    <div className="pt-3 border-t border-orange-200 mt-3">
                      <button
                        onClick={clearCart}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg font-medium text-sm hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-[1.02] shadow-md"
                      >
                        🗑️ Sepeti Temizle
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-orange-900 mb-2">
                      👤 İsim Soyisim
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border-2 border-orange-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      placeholder="Adınızı ve soyadınızı girin"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-orange-900 mb-2">
                      📍 Teslimat Adresi
                    </label>
                    <textarea
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full border-2 border-orange-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                      rows={3}
                      placeholder="Teslimat adresinizi detaylı olarak girin"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-orange-900 mb-2">
                      📝 Özel İstekler (Opsiyonel)
                    </label>
                    <textarea
                      value={customerInfo.note}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, note: e.target.value }))}
                      className="w-full border-2 border-orange-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                      rows={2}
                      placeholder="Özel isteklerinizi buraya yazabilirsiniz"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 bg-orange-100 text-orange-800 py-3 rounded-xl font-medium hover:bg-orange-200 transition-colors border border-orange-300"
                  >
                    İptal
                  </button>
                  <button
                    onClick={sendWhatsAppOrder}
                    disabled={!customerInfo.name || !customerInfo.address}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>📱</span>
                    <span>WhatsApp ile Sipariş Ver</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 text-white py-12 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* İşletme Bilgileri */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center md:text-left"
            >
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <Image 
                  src="/doymazsansoylelogo.png" 
                  alt="Doymazsan Söyle Logo" 
                  width={48}
                  height={48}
                  className="h-12 w-auto"
                />
                <div>
                  <h3 className="text-xl font-bold text-orange-300">Doymazsan Söyle</h3>
                  <p className="text-gray-300 text-sm">Patso Tost</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Premium lezzet deneyimi ile en taze malzemelerden hazırlanan özel lezzetler.
              </p>
            </motion.div>

            {/* İletişim Bilgileri */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center md:text-left"
            >
              <h4 className="text-lg font-semibold text-orange-300 mb-4">İletişim</h4>
              <div className="space-y-3">
                <div className="flex items-start justify-center md:justify-start space-x-3">
                  <span className="text-orange-400 text-lg">📍</span>
                  <div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Şirinyalı, Sinanoğlu Cd.<br/>
                      Çağ Sitesi A Blok No: 48<br/>
                      Muratpaşa/Antalya
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-3">
                  <span className="text-orange-400 text-lg">📞</span>
                  <a href="tel:05307710760" className="text-gray-300 hover:text-orange-300 transition-colors text-sm">
                    0530 771 07 60
                  </a>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-3">
                  <span className="text-orange-400 text-lg">🗺️</span>
                  <a 
                    href="https://maps.app.goo.gl/sBF3dUVXUchCfMZZ8" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-orange-300 transition-colors text-sm"
                  >
                    Haritada Görüntüle
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Sosyal Medya ve Çalışma Saatleri */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center md:text-left"
            >
              <h4 className="text-lg font-semibold text-orange-300 mb-4">Takip Edin</h4>
              <div className="space-y-4">
                <a 
                  href="https://www.instagram.com/doymazsan_soyle" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <span className="text-lg">📷</span>
                  <span className="text-sm font-medium">Instagram</span>
                </a>
                <div className="mt-4">
                   <h5 className="text-orange-300 font-medium mb-2 text-sm">Çalışma Saatleri</h5>
                   <p className="text-gray-300 text-xs leading-relaxed">
                     Pazartesi - Cumartesi<br/>
                     09:30 - 16:00<br/>
                     <span className="text-orange-400">Pazar Kapalı</span>
                   </p>
                 </div>
                 
                 {/* Sipariş Platformları */}
                  <div className="mt-6">
                    <h5 className="text-orange-300 font-medium mb-3 text-sm">Online Sipariş</h5>
                    <div className="space-y-2">
                      <a 
                        href="https://www.yemeksepeti.com/restaurant/ajs2/doymazsan-soyle" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 text-xs font-medium w-full justify-center"
                      >
                        <span className="text-sm">🍽️</span>
                        <span>Yemeksepeti</span>
                      </a>
                    </div>
                  </div>
              </div>
            </motion.div>
          </div>

          {/* Alt Bölüm */}
           <div className="border-t border-gray-700 pt-6">
             <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
               <div className="text-center md:text-left">
                 <p className="text-gray-400 text-xs mb-2">
                   © Doymazsan Söyle. Tüm Hakları Saklıdır.
                 </p>
                 <div className="flex items-center justify-center md:justify-start space-x-2">
                   <span className="text-gray-400 text-xs">Tasarım & Kodlama:</span>
                   <a 
                     href="https://wa.me/905416311158" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-orange-300 hover:text-orange-400 transition-colors text-xs font-medium border border-orange-400/30 px-2 py-1 rounded bg-orange-900/20 hover:bg-orange-900/40"
                   >
                     Murat KOCATAŞ
                   </a>
                 </div>
               </div>
               <motion.div 
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.4 }}
               >
                 <button 
                   onClick={() => window.location.href = '/admin/login'}
                   className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-orange-400/30 text-sm font-medium"
                 >
                   🔐 Yönetici Girişi
                 </button>
               </motion.div>
             </div>
           </div>
        </div>
      </footer>
    </div>
  )
}
