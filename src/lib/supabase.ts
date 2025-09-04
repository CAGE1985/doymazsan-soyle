import { createClient } from '@supabase/supabase-js'

// Geçici demo değerleri - gerçek projede Supabase URL ve key kullanın
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key'

// Debug: Environment değişkenlerini kontrol et
console.log('🔍 Environment Debug:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  keyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseUrl,
  supabaseAnonKey: supabaseAnonKey.substring(0, 20) + '...'
})

// Supabase client oluştur
// Eğer environment değişkenleri yoksa veya demo değerleri varsa null döndür
export const supabase = (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') || 
  supabaseAnonKey === 'demo-key') ? null : createClient(supabaseUrl, supabaseAnonKey)

console.log('🔗 Supabase Client:', supabase ? 'CREATED' : 'NULL (Demo mode)')

// Database Types
export interface Product {
  id: number
  name: string
  image_url: string
  base_price: number
  description: string
  order_index?: number
  created_at?: string
}

export interface Option {
  id: number
  product_id: number
  option_name: string
  option_price: number
  created_at?: string
}

export interface Brand {
  id: number
  name: string
  logo_url: string
  created_at?: string
}

export interface Order {
  id: number
  customer_name: string
  customer_address: string
  note?: string
  total_price: number
  created_at: string
}

export interface CartItem {
  product: Product
  selectedOptions: Option[]
  quantity: number
  totalPrice: number
}