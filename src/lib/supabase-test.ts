// Supabase Bağlantı Test Utility
import { supabase } from './supabase'

export async function testSupabaseConnection() {
  console.log('🔍 Supabase bağlantısı test ediliyor...')
  
  if (!supabase) {
    console.log('⚠️  Demo modunda çalışıyor - Environment variables ayarlanmamış')
    return {
      success: false,
      mode: 'demo',
      message: 'Environment variables ayarlanmamış, demo modunda çalışıyor'
    }
  }

  try {
    // Basit bir bağlantı testi
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase bağlantı hatası:', error.message)
      return {
        success: false,
        mode: 'error',
        message: `Bağlantı hatası: ${error.message}`
      }
    }

    console.log('✅ Supabase bağlantısı başarılı!')
    return {
      success: true,
      mode: 'connected',
      message: 'Supabase bağlantısı başarılı'
    }
  } catch (error) {
    console.error('❌ Beklenmeyen hata:', error)
    return {
      success: false,
      mode: 'error',
      message: `Beklenmeyen hata: ${error}`
    }
  }
}

export async function loadInitialData() {
  console.log('📊 Başlangıç verileri yükleniyor...')
  
  if (!supabase) {
    console.log('⚠️  Demo modunda - gerçek veri yüklenemez')
    return { success: false, message: 'Demo modunda çalışıyor' }
  }

  try {
    // Tabloların varlığını kontrol et
    const [productsRes, optionsRes, brandsRes] = await Promise.all([
      supabase.from('products').select('*').limit(1),
      supabase.from('options').select('*').limit(1),
      supabase.from('brands').select('*').limit(1)
    ])

    if (productsRes.error) {
      console.error('❌ Products tablosu hatası:', productsRes.error.message)
      return { success: false, message: `Products tablosu hatası: ${productsRes.error.message}` }
    }

    if (optionsRes.error) {
      console.error('❌ Options tablosu hatası:', optionsRes.error.message)
      return { success: false, message: `Options tablosu hatası: ${optionsRes.error.message}` }
    }

    if (brandsRes.error) {
      console.error('❌ Brands tablosu hatası:', brandsRes.error.message)
      return { success: false, message: `Brands tablosu hatası: ${brandsRes.error.message}` }
    }

    console.log('✅ Tüm tablolar başarıyla erişilebilir!')
    console.log(`📊 Mevcut veriler:`, {
      products: productsRes.data?.length || 0,
      options: optionsRes.data?.length || 0,
      brands: brandsRes.data?.length || 0
    })

    return {
      success: true,
      message: 'Tüm tablolar erişilebilir',
      data: {
        products: productsRes.data?.length || 0,
        options: optionsRes.data?.length || 0,
        brands: brandsRes.data?.length || 0
      }
    }
  } catch (error) {
    console.error('❌ Veri yükleme hatası:', error)
    return { success: false, message: `Veri yükleme hatası: ${error}` }
  }
}

// Development ortamında otomatik test
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Sayfa yüklendiğinde otomatik test
  setTimeout(() => {
    testSupabaseConnection().then(result => {
      console.log('🔧 Supabase Test Sonucu:', result)
    })
  }, 1000)
}