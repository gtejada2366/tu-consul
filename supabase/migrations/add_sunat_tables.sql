-- ============================================================
-- SUNAT Electronic Invoicing Tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable pgcrypto for credential encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLA: clinic_sunat_config
-- ============================================================
CREATE TABLE clinic_sunat_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) NOT NULL UNIQUE,
  -- SUNAT identity
  ruc TEXT NOT NULL,
  razon_social TEXT NOT NULL,
  nombre_comercial TEXT,
  direccion_fiscal TEXT,
  ubigeo TEXT,
  -- Clave SOL credentials (encrypted)
  sol_user TEXT NOT NULL,
  sol_password TEXT NOT NULL,
  -- Certificate
  certificate_path TEXT,
  certificate_password TEXT,
  -- Series
  serie_boleta TEXT DEFAULT 'B001',
  serie_factura TEXT DEFAULT 'F001',
  serie_nota_credito_b TEXT DEFAULT 'BC01',
  serie_nota_credito_f TEXT DEFAULT 'FC01',
  -- Counters
  next_boleta INT DEFAULT 1,
  next_factura INT DEFAULT 1,
  next_nc_boleta INT DEFAULT 1,
  next_nc_factura INT DEFAULT 1,
  -- Environment
  is_production BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: comprobantes_electronicos
-- ============================================================
CREATE TABLE comprobantes_electronicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  invoice_id UUID REFERENCES invoices(id),
  -- Document identity
  tipo_comprobante TEXT NOT NULL CHECK (tipo_comprobante IN ('01', '03', '07', '08')),
  serie TEXT NOT NULL,
  correlativo INT NOT NULL,
  -- Dates
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE,
  -- Client
  cliente_tipo_doc TEXT NOT NULL,
  cliente_numero_doc TEXT NOT NULL,
  cliente_razon_social TEXT NOT NULL,
  cliente_direccion TEXT,
  -- Amounts
  total_gravada DECIMAL(12,2) DEFAULT 0,
  total_exonerada DECIMAL(12,2) DEFAULT 0,
  total_inafecta DECIMAL(12,2) DEFAULT 0,
  total_igv DECIMAL(12,2) DEFAULT 0,
  total_venta DECIMAL(12,2) NOT NULL,
  moneda TEXT DEFAULT 'PEN',
  -- Nota de Credito reference
  doc_referencia_tipo TEXT,
  doc_referencia_serie TEXT,
  doc_referencia_correlativo INT,
  motivo_nota TEXT,
  codigo_motivo_nota TEXT,
  -- SUNAT status
  sunat_status TEXT DEFAULT 'pending' CHECK (sunat_status IN (
    'pending', 'sent', 'accepted', 'accepted_with_observations', 'rejected', 'error', 'voided'
  )),
  sunat_response_code TEXT,
  sunat_description TEXT,
  -- Resumen diario (boletas)
  resumen_ticket TEXT,
  -- File paths
  xml_signed_path TEXT,
  cdr_path TEXT,
  pdf_path TEXT,
  -- Hash
  hash_cpe TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, serie, correlativo)
);

CREATE INDEX idx_comprobantes_clinic ON comprobantes_electronicos(clinic_id);
CREATE INDEX idx_comprobantes_fecha ON comprobantes_electronicos(clinic_id, fecha_emision DESC);
CREATE INDEX idx_comprobantes_status ON comprobantes_electronicos(clinic_id, sunat_status);
CREATE INDEX idx_comprobantes_invoice ON comprobantes_electronicos(invoice_id);

-- ============================================================
-- TABLA: comprobante_items
-- ============================================================
CREATE TABLE comprobante_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comprobante_id UUID REFERENCES comprobantes_electronicos(id) ON DELETE CASCADE NOT NULL,
  cantidad DECIMAL(10,3) NOT NULL DEFAULT 1,
  unidad TEXT DEFAULT 'ZZ',
  descripcion TEXT NOT NULL,
  valor_unitario DECIMAL(12,2) NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  igv DECIMAL(12,2) NOT NULL DEFAULT 0,
  tipo_afectacion TEXT DEFAULT '10',
  total DECIMAL(12,2) NOT NULL
);

CREATE INDEX idx_comprobante_items ON comprobante_items(comprobante_id);

-- ============================================================
-- FUNCIÓN: next_correlativo
-- ============================================================
CREATE OR REPLACE FUNCTION next_correlativo(
  p_clinic_id UUID, p_tipo TEXT
) RETURNS INT AS $$
DECLARE
  v_next INT;
  v_col TEXT;
BEGIN
  v_col := CASE p_tipo
    WHEN '03' THEN 'next_boleta'
    WHEN '01' THEN 'next_factura'
    WHEN '07B' THEN 'next_nc_boleta'
    WHEN '07F' THEN 'next_nc_factura'
  END;

  EXECUTE format(
    'UPDATE clinic_sunat_config SET %I = %I + 1, updated_at = NOW() WHERE clinic_id = $1 RETURNING %I - 1',
    v_col, v_col, v_col
  ) INTO v_next USING p_clinic_id;

  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PERMISOS
-- ============================================================
GRANT ALL ON clinic_sunat_config TO anon;
GRANT ALL ON clinic_sunat_config TO authenticated;
GRANT ALL ON comprobantes_electronicos TO anon;
GRANT ALL ON comprobantes_electronicos TO authenticated;
GRANT ALL ON comprobante_items TO anon;
GRANT ALL ON comprobante_items TO authenticated;
GRANT EXECUTE ON FUNCTION next_correlativo TO anon;
GRANT EXECUTE ON FUNCTION next_correlativo TO authenticated;
