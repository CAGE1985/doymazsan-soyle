-- RLS Policy'lerini düzeltme scripti
-- Önce mevcut policy'leri drop et
DROP POLICY IF EXISTS "Public write access for products" ON products;
DROP POLICY IF EXISTS "Public write access for options" ON options;
DROP POLICY IF EXISTS "Public write access for brands" ON brands;
DROP POLICY IF EXISTS "Admin access for products" ON products;
DROP POLICY IF EXISTS "Admin access for options" ON options;
DROP POLICY IF EXISTS "Admin access for brands" ON brands;

-- Yeni policy'leri oluştur
-- Public write access for admin operations (geçici olarak - production'da authentication eklenecek)
CREATE POLICY "Public write access for products" ON products FOR ALL USING (true);
CREATE POLICY "Public write access for options" ON options FOR ALL USING (true);
CREATE POLICY "Public write access for brands" ON brands FOR ALL USING (true);

-- Admin access policies (authenticated users can manage all data)
CREATE POLICY "Admin access for products" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin access for options" ON options FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin access for brands" ON brands FOR ALL USING (auth.role() = 'authenticated');