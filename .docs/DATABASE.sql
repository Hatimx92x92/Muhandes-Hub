-- ============================================================================
-- Muqawil HUB — Complete Database Schema
-- Supabase (PostgreSQL) Migration
-- Version: 1.0 | Generated: March 4, 2026
-- ============================================================================
-- Execute in Supabase SQL Editor or via psql.
-- Requires: Supabase project with Auth, Storage, and Realtime enabled.
-- ============================================================================
-- ============================================================================
-- SECTION 0: Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- SECTION 1: Custom ENUM Types
-- ============================================================================
CREATE TYPE user_role AS ENUM (
    'project_owner',
    'contractor',
    'supplier',
    'buyer'
);

CREATE TYPE profile_type AS ENUM ('company', 'personal');

CREATE TYPE verification_status AS ENUM (
    'pending_email',
    'pending_payment',
    'pending_documents',
    'pending_approval',
    'active',
    'restricted',
    'banned'
);

CREATE TYPE subscription_tier AS ENUM (
    'starter',
    'pro',
    'business',
    'enterprise'
);

CREATE TYPE post_status AS ENUM (
    'draft',
    'pending',
    'published',
    'rejected',
    'awarded',
    'completed',
    'expired',
    'closed'
);

CREATE TYPE deal_type AS ENUM ('deal_project', 'deal_product');

CREATE TYPE deal_status AS ENUM (
    'active',
    'in_progress',
    'completed',
    'cancelled',
    'disputed'
);

CREATE TYPE deal_trigger_source AS ENUM (
    'bid_award',
    'inquiry_quotation',
    'rfq_response',
    'direct_hire'
);

CREATE TYPE proof_type AS ENUM (
    'payment',
    'work',
    'supply',
    'handover'
);

CREATE TYPE proof_status AS ENUM (
    'pending',
    'confirmed',
    'rejected',
    'disputed'
);

CREATE TYPE quotation_mode AS ENUM ('inquiry_response', 'standalone');

CREATE TYPE quotation_status AS ENUM (
    'draft',
    'sent',
    'viewed',
    'accepted',
    'rejected',
    'expired'
);

CREATE TYPE contract_status AS ENUM (
    'draft',
    'sent',
    'signed',
    'archived'
);

CREATE TYPE commission_status AS ENUM (
    'pending',
    'approved',
    'paid',
    'disputed',
    'overdue'
);

CREATE TYPE notification_type AS ENUM (
    'bid_received',
    'bid_awarded',
    'bid_shortlisted',
    'bid_rejected',
    'inquiry_received',
    'quotation_received',
    'quotation_accepted',
    'deal_created',
    'deal_status_changed',
    'deal_completed',
    'payment_confirmed',
    'commission_due',
    'commission_overdue',
    'review_received',
    'subscription_expiring',
    'subscription_expired',
    'document_approved',
    'document_rejected',
    'post_approved',
    'post_rejected',
    'rfq_published',
    'rfq_response_received',
    'rfq_response_accepted',
    'rfq_response_rejected',
    'supplier_hire_request_received',
    'supplier_hire_quotation_received',
    'deal_flagged_review'
);

CREATE TYPE kanban_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TYPE crm_pipeline_stage AS ENUM (
    'lead',
    'in_negotiation',
    'active_deal',
    'completed',
    'repeat'
);

CREATE TYPE client_source AS ENUM (
    'bid_award',
    'rfq_response',
    'direct_hire',
    'product_inquiry',
    'manual_entry'
);

CREATE TYPE coupon_discount_type AS ENUM ('percentage', 'fixed');

CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'check');

CREATE TYPE bid_status AS ENUM (
    'pending',
    'shortlisted',
    'awarded',
    'rejected'
);

CREATE TYPE inquiry_status AS ENUM ('pending', 'responded', 'closed');

CREATE TYPE hire_request_status AS ENUM (
    'pending',
    'quotation_sent',
    'accepted',
    'rejected',
    'cancelled'
);

CREATE TYPE rfq_response_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TYPE pricing_model AS ENUM ('fixed', 'variant');

CREATE TYPE project_source AS ENUM ('owner', 'subcontract');

CREATE TYPE project_classification AS ENUM ('a', 'b', 'c');

CREATE TYPE document_type AS ENUM ('vat_certificate', 'commercial_license');

CREATE TYPE document_review_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled',
    'expired'
);

CREATE TYPE deal_cancel_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE deal_skip_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE milestone_status AS ENUM (
    'pending',
    'in_progress',
    'completed'
);

CREATE TYPE template_type AS ENUM (
    'construction_agreement',
    'supply_agreement',
    'custom'
);

CREATE TYPE invoice_type AS ENUM ('commission', 'subscription');

-- ============================================================================
-- SECTION 2: Utility Functions
-- ============================================================================
-- Generic updated_at trigger function
CREATE
OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $ $ BEGIN NEW.updated_at = now();

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 3: Reference Tables
-- ============================================================================
-- Saudi cities reference table
CREATE TABLE saudi_cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    region_ar TEXT NOT NULL,
    region_en TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories (hierarchical)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id) ON DELETE
    SET
        NULL,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        applies_to TEXT [] NOT NULL DEFAULT '{}',
        -- ['projects', 'products', 'rfqs']
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);

CREATE INDEX idx_categories_slug ON categories(slug);

-- ============================================================================
-- SECTION 4: User Profiles
-- ============================================================================
-- Extends Supabase auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    profile_type profile_type NOT NULL DEFAULT 'company',
    verification_status verification_status NOT NULL DEFAULT 'pending_email',
    is_admin BOOLEAN NOT NULL DEFAULT false,
    -- Personal fields
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    -- Company fields (nullable for personal profiles)
    company_name_ar TEXT,
    company_name_en TEXT,
    cr_number TEXT,
    vat_number TEXT,
    website TEXT,
    company_profile_url TEXT,
    -- PDF (Project Owner only)
    -- Location
    city_id UUID REFERENCES saudi_cities(id),
    address_ar TEXT,
    address_en TEXT,
    -- Media
    avatar_url TEXT,
    logo_url TEXT,
    -- Aggregates (updated by triggers)
    average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
    total_reviews INT NOT NULL DEFAULT 0,
    total_deals INT NOT NULL DEFAULT 0,
    -- Onboarding
    onboarding_progress JSONB NOT NULL DEFAULT '{}',
    -- Notification preferences
    notification_preferences JSONB NOT NULL DEFAULT '{}',
    -- PDPL consent
    pdpl_consent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);

CREATE INDEX idx_profiles_verification ON profiles(verification_status);

CREATE INDEX idx_profiles_city ON profiles(city_id);

CREATE INDEX idx_profiles_is_admin ON profiles(is_admin)
WHERE
    is_admin = true;

-- Trigram indexes for fallback search
CREATE INDEX idx_profiles_company_ar_trgm ON profiles USING gin (company_name_ar gin_trgm_ops);

CREATE INDEX idx_profiles_company_en_trgm ON profiles USING gin (company_name_en gin_trgm_ops);

CREATE TRIGGER set_profiles_updated_at BEFORE
UPDATE
    ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on auth.users insert
CREATE
OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $ $ BEGIN
INSERT INTO
    public.profiles (id, role, full_name, phone)
VALUES
    (
        NEW.id,
        COALESCE(
            (NEW.raw_user_meta_data ->> 'role') :: user_role,
            'buyer'
        ),
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
    );

RETURN NEW;

END;

$ $ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER
INSERT
    ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- SECTION 5: Subscriptions & Coupons
-- ============================================================================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    discount_type coupon_discount_type NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL,
    max_discount_cap NUMERIC(10, 2),
    -- For percentage coupons only
    usage_limit INT,
    per_user_limit INT NOT NULL DEFAULT 1,
    used_count INT NOT NULL DEFAULT 0,
    min_amount NUMERIC(10, 2),
    tier_restriction subscription_tier [],
    role_restriction user_role [],
    first_purchase_only BOOLEAN NOT NULL DEFAULT false,
    renewal_eligible BOOLEAN NOT NULL DEFAULT true,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupons_code ON coupons(code);

CREATE INDEX idx_coupons_active ON coupons(is_active)
WHERE
    is_active = true;

CREATE TRIGGER set_coupons_updated_at BEFORE
UPDATE
    ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL DEFAULT 'starter',
    duration_months INT NOT NULL DEFAULT 1,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    duration_discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    coupon_discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    final_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    coupon_id UUID REFERENCES coupons(id),
    payment_method payment_method,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    moyasar_payment_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

CREATE INDEX idx_subscriptions_active ON subscriptions(user_id, is_active)
WHERE
    is_active = true;

CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at);

CREATE TRIGGER set_subscriptions_updated_at BEFORE
UPDATE
    ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    previous_tier subscription_tier,
    new_tier subscription_tier NOT NULL,
    action TEXT NOT NULL,
    -- 'created', 'upgraded', 'downgraded', 'renewed', 'expired', 'cancelled'
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_history_user ON subscription_history(user_id);

CREATE TABLE coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(coupon_id, user_id)
);

CREATE INDEX idx_coupon_redemptions_user ON coupon_redemptions(user_id);

-- ============================================================================
-- SECTION 6: Verification Documents
-- ============================================================================
CREATE TABLE verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    doc_type document_type NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INT NOT NULL,
    -- bytes
    mime_type TEXT NOT NULL,
    status document_review_status NOT NULL DEFAULT 'pending',
    admin_notes_ar TEXT,
    admin_notes_en TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_docs_user ON verification_documents(user_id);

CREATE INDEX idx_verification_docs_status ON verification_documents(status)
WHERE
    status = 'pending';

CREATE TRIGGER set_verification_docs_updated_at BEFORE
UPDATE
    ON verification_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 7: Projects
-- ============================================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    budget_min NUMERIC(14, 2),
    budget_max NUMERIC(14, 2),
    timeline_start DATE,
    timeline_end DATE,
    city_id UUID REFERENCES saudi_cities(id),
    classification project_classification,
    source project_source NOT NULL DEFAULT 'owner',
    status post_status NOT NULL DEFAULT 'draft',
    rejection_reason_ar TEXT,
    rejection_reason_en TEXT,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    bid_count INT NOT NULL DEFAULT 0,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_owner ON projects(owner_id);

CREATE INDEX idx_projects_status ON projects(status);

CREATE INDEX idx_projects_category ON projects(category_id);

CREATE INDEX idx_projects_city ON projects(city_id);

CREATE INDEX idx_projects_published ON projects(status, created_at DESC)
WHERE
    status = 'published';

-- Trigram indexes for fallback search
CREATE INDEX idx_projects_title_ar_trgm ON projects USING gin (title_ar gin_trgm_ops);

CREATE INDEX idx_projects_title_en_trgm ON projects USING gin (title_en gin_trgm_ops);

CREATE INDEX idx_projects_desc_ar_trgm ON projects USING gin (description_ar gin_trgm_ops);

CREATE INDEX idx_projects_desc_en_trgm ON projects USING gin (description_en gin_trgm_ops);

CREATE TRIGGER set_projects_updated_at BEFORE
UPDATE
    ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'general',
    -- 'boq', 'drawings', 'images', 'specs', 'general'
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    -- bytes (up to 5 GB)
    mime_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_files_project ON project_files(project_id);

-- ============================================================================
-- SECTION 8: Products
-- ============================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    pricing_model pricing_model NOT NULL DEFAULT 'fixed',
    price NUMERIC(12, 2),
    -- For fixed pricing; null for variant-based
    in_stock BOOLEAN NOT NULL DEFAULT true,
    stock_quantity INT,
    -- null = unlimited / not tracked
    status post_status NOT NULL DEFAULT 'draft',
    rejection_reason_ar TEXT,
    rejection_reason_en TEXT,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_supplier ON products(supplier_id);

CREATE INDEX idx_products_status ON products(status);

CREATE INDEX idx_products_category ON products(category_id);

CREATE INDEX idx_products_published ON products(status, created_at DESC)
WHERE
    status = 'published';

-- Trigram indexes for fallback search
CREATE INDEX idx_products_name_ar_trgm ON products USING gin (name_ar gin_trgm_ops);

CREATE INDEX idx_products_name_en_trgm ON products USING gin (name_en gin_trgm_ops);

CREATE TRIGGER set_products_updated_at BEFORE
UPDATE
    ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    sku TEXT,
    price NUMERIC(12, 2) NOT NULL,
    stock_quantity INT,
    -- null = not tracked
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);

CREATE TRIGGER set_product_variants_updated_at BEFORE
UPDATE
    ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

CREATE TABLE product_spec_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_specs_product ON product_spec_sheets(product_id);

-- ============================================================================
-- SECTION 9: Bidding
-- ============================================================================
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL,
    timeline_days INT NOT NULL,
    methodology_ar TEXT,
    methodology_en TEXT,
    status bid_status NOT NULL DEFAULT 'pending',
    attachments JSONB DEFAULT '[]',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(project_id, contractor_id)
);

CREATE INDEX idx_bids_project ON bids(project_id);

CREATE INDEX idx_bids_contractor ON bids(contractor_id);

CREATE INDEX idx_bids_project_status ON bids(project_id, status);

CREATE TRIGGER set_bids_updated_at BEFORE
UPDATE
    ON bids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to increment bid count on project
CREATE
OR REPLACE FUNCTION increment_bid_count() RETURNS TRIGGER AS $ $ BEGIN
UPDATE
    projects
SET
    bid_count = bid_count + 1
WHERE
    id = NEW.project_id;

RETURN NEW;

END;

$ $ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_bid_created
AFTER
INSERT
    ON bids FOR EACH ROW EXECUTE FUNCTION increment_bid_count();

-- ============================================================================
-- SECTION 10: Inquiries
-- ============================================================================
CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quantity INT,
    timeline TEXT,
    requirements_ar TEXT,
    requirements_en TEXT,
    attachments JSONB DEFAULT '[]',
    status inquiry_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiries_product ON inquiries(product_id);

CREATE INDEX idx_inquiries_sender ON inquiries(sender_id);

CREATE INDEX idx_inquiries_status ON inquiries(status);

CREATE TRIGGER set_inquiries_updated_at BEFORE
UPDATE
    ON inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 11: RFQs
-- ============================================================================
CREATE TABLE rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poster_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    quantity INT,
    budget_min NUMERIC(14, 2),
    budget_max NUMERIC(14, 2),
    deadline TIMESTAMPTZ,
    project_id UUID REFERENCES projects(id) ON DELETE
    SET
        NULL,
        product_id UUID REFERENCES products(id) ON DELETE
    SET
        NULL,
        city_id UUID REFERENCES saudi_cities(id),
        status post_status NOT NULL DEFAULT 'draft',
        rejection_reason_ar TEXT,
        rejection_reason_en TEXT,
        approved_by UUID REFERENCES profiles(id),
        approved_at TIMESTAMPTZ,
        response_count INT NOT NULL DEFAULT 0,
        last_synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rfqs_poster ON rfqs(poster_id);

CREATE INDEX idx_rfqs_status ON rfqs(status);

CREATE INDEX idx_rfqs_category ON rfqs(category_id);

CREATE INDEX idx_rfqs_published ON rfqs(status, created_at DESC)
WHERE
    status = 'published';

CREATE INDEX idx_rfqs_deadline ON rfqs(deadline);

-- Trigram indexes for fallback search
CREATE INDEX idx_rfqs_title_ar_trgm ON rfqs USING gin (title_ar gin_trgm_ops);

CREATE INDEX idx_rfqs_title_en_trgm ON rfqs USING gin (title_en gin_trgm_ops);

CREATE TRIGGER set_rfqs_updated_at BEFORE
UPDATE
    ON rfqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE rfq_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pricing JSONB NOT NULL DEFAULT '{}',
    -- line items, totals
    delivery_terms_ar TEXT,
    delivery_terms_en TEXT,
    notes_ar TEXT,
    notes_en TEXT,
    quotation_id UUID,
    -- FK added after quotations table
    status rfq_response_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(rfq_id, supplier_id)
);

CREATE INDEX idx_rfq_responses_rfq ON rfq_responses(rfq_id);

CREATE INDEX idx_rfq_responses_supplier ON rfq_responses(supplier_id);

CREATE TRIGGER set_rfq_responses_updated_at BEFORE
UPDATE
    ON rfq_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to increment RFQ response count
CREATE
OR REPLACE FUNCTION increment_rfq_response_count() RETURNS TRIGGER AS $ $ BEGIN
UPDATE
    rfqs
SET
    response_count = response_count + 1
WHERE
    id = NEW.rfq_id;

RETURN NEW;

END;

$ $ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_rfq_response_created
AFTER
INSERT
    ON rfq_responses FOR EACH ROW EXECUTE FUNCTION increment_rfq_response_count();

-- ============================================================================
-- SECTION 12: Hire Requests
-- ============================================================================
CREATE TABLE hire_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    quantity INT,
    budget NUMERIC(14, 2),
    status hire_request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hire_requests_requester ON hire_requests(requester_id);

CREATE INDEX idx_hire_requests_supplier ON hire_requests(supplier_id);

CREATE INDEX idx_hire_requests_project ON hire_requests(project_id);

CREATE TRIGGER set_hire_requests_updated_at BEFORE
UPDATE
    ON hire_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 13: Quotations
-- ============================================================================
CREATE TABLE quotation_sequences (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    current_year INT NOT NULL DEFAULT EXTRACT(
        YEAR
        FROM
            now()
    ) :: INT,
    current_seq INT NOT NULL DEFAULT 0
);

CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE
    SET
        NULL,
        mode quotation_mode NOT NULL,
        number TEXT NOT NULL,
        -- QTN-YYYY-NNNN (auto-generated)
        -- Linked entity (one of these for inquiry_response mode)
        inquiry_id UUID REFERENCES inquiries(id) ON DELETE
    SET
        NULL,
        rfq_response_id UUID REFERENCES rfq_responses(id) ON DELETE
    SET
        NULL,
        hire_request_id UUID REFERENCES hire_requests(id) ON DELETE
    SET
        NULL,
        -- Content
        client_name TEXT,
        project_ref TEXT,
        line_items JSONB NOT NULL DEFAULT '[]',
        -- Each item: { description, quantity, unit, unit_price, total }
        subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
        vat_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
        total NUMERIC(14, 2) NOT NULL DEFAULT 0,
        validity_days INT NOT NULL DEFAULT 2,
        -- 48 hours default
        payment_terms_ar TEXT,
        payment_terms_en TEXT,
        delivery_terms_ar TEXT,
        delivery_terms_en TEXT,
        notes_ar TEXT,
        notes_en TEXT,
        status quotation_status NOT NULL DEFAULT 'draft',
        revision_count INT NOT NULL DEFAULT 0,
        accepted_at TIMESTAMPTZ,
        pdf_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotations_sender ON quotations(sender_id);

CREATE INDEX idx_quotations_recipient ON quotations(recipient_id);

CREATE INDEX idx_quotations_status ON quotations(status);

CREATE INDEX idx_quotations_inquiry ON quotations(inquiry_id);

CREATE INDEX idx_quotations_number ON quotations(number);

CREATE TRIGGER set_quotations_updated_at BEFORE
UPDATE
    ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate quotation number QTN-YYYY-NNNN
CREATE
OR REPLACE FUNCTION auto_quotation_number() RETURNS TRIGGER AS $ $ DECLARE current_yr INT;

next_seq INT;

BEGIN current_yr := EXTRACT(
    YEAR
    FROM
        now()
) :: INT;

INSERT INTO
    quotation_sequences (user_id, current_year, current_seq)
VALUES
    (NEW.sender_id, current_yr, 1) ON CONFLICT (user_id) DO
UPDATE
SET
    current_seq = CASE
        WHEN quotation_sequences.current_year = current_yr THEN quotation_sequences.current_seq + 1
        ELSE 1
    END,
    current_year = current_yr RETURNING current_seq INTO next_seq;

NEW.number := 'QTN-' || current_yr || '-' || LPAD(next_seq :: TEXT, 4, '0');

RETURN NEW;

END;

$ $ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_quotation_number BEFORE
INSERT
    ON quotations FOR EACH ROW EXECUTE FUNCTION auto_quotation_number();

-- Add FK from rfq_responses to quotations now that quotations table exists
ALTER TABLE
    rfq_responses
ADD
    CONSTRAINT fk_rfq_responses_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE
SET
    NULL;

-- Quotation clause library (reusable per user)
CREATE TABLE quotation_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    content_en TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    -- 'payment', 'delivery', 'warranty', 'general'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotation_clauses_user ON quotation_clauses(user_id);

CREATE TRIGGER set_quotation_clauses_updated_at BEFORE
UPDATE
    ON quotation_clauses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 14: Deals
-- ============================================================================
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_slug TEXT NOT NULL,
    deal_type deal_type NOT NULL,
    trigger_source deal_trigger_source NOT NULL,
    -- Source references (one will be set based on trigger)
    bid_id UUID UNIQUE REFERENCES bids(id) ON DELETE
    SET
        NULL,
        quotation_id UUID REFERENCES quotations(id) ON DELETE
    SET
        NULL,
        rfq_response_id UUID REFERENCES rfq_responses(id) ON DELETE
    SET
        NULL,
        hire_request_id UUID REFERENCES hire_requests(id) ON DELETE
    SET
        NULL,
        project_id UUID REFERENCES projects(id) ON DELETE
    SET
        NULL,
        -- Parties
        seller_id UUID NOT NULL REFERENCES profiles(id),
        buyer_id UUID NOT NULL REFERENCES profiles(id),
        value NUMERIC(14, 2) NOT NULL DEFAULT 0,
        -- Commission
        commission_rate NUMERIC(4, 2) NOT NULL DEFAULT 0,
        commission_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
        commission_vat NUMERIC(14, 2) NOT NULL DEFAULT 0,
        -- Status and progress
        status deal_status NOT NULL DEFAULT 'active',
        seller_progress INT NOT NULL DEFAULT 0 CHECK (
            seller_progress >= 0
            AND seller_progress <= 100
        ),
        buyer_progress INT NOT NULL DEFAULT 0 CHECK (
            buyer_progress >= 0
            AND buyer_progress <= 100
        ),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_seller ON deals(seller_id);

CREATE INDEX idx_deals_buyer ON deals(buyer_id);

CREATE INDEX idx_deals_project ON deals(project_id);

CREATE INDEX idx_deals_status ON deals(status);

CREATE INDEX idx_deals_bid ON deals(bid_id);

CREATE TRIGGER set_deals_updated_at BEFORE
UPDATE
    ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate commission at deal creation
CREATE
OR REPLACE FUNCTION auto_commission() RETURNS TRIGGER AS $ $ DECLARE seller_tier subscription_tier;

rate NUMERIC(4, 2);

BEGIN -- Get seller's current subscription tier
SELECT
    s.tier INTO seller_tier
FROM
    subscriptions s
WHERE
    s.user_id = NEW.seller_id
    AND s.is_active = true
ORDER BY
    s.expires_at DESC
LIMIT
    1;

-- Default to starter if no active subscription
IF seller_tier IS NULL THEN seller_tier := 'starter';

END IF;

-- Commission rates: starter 2%, pro 1%, business/enterprise 0%
CASE
    seller_tier
    WHEN 'starter' THEN rate := 2.00;

WHEN 'pro' THEN rate := 1.00;

WHEN 'business' THEN rate := 0.00;

WHEN 'enterprise' THEN rate := 0.00;

ELSE rate := 2.00;

END CASE
;

NEW.commission_rate := rate;

NEW.commission_amount := ROUND(NEW.value * rate / 100, 2);

NEW.commission_vat := ROUND(NEW.commission_amount * 0.15, 2);

-- 15% VAT
RETURN NEW;

END;

$ $ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_deal_commission BEFORE
INSERT
    ON deals FOR EACH ROW EXECUTE FUNCTION auto_commission();

-- Deal completion check
CREATE
OR REPLACE FUNCTION deal_completion_check() RETURNS TRIGGER AS $ $ BEGIN IF NEW.seller_progress = 100
AND NEW.buyer_progress = 100
AND OLD.status IN ('active', 'in_progress')
AND NEW.status NOT IN ('completed', 'cancelled', 'disputed') THEN NEW.status := 'completed';

NEW.completed_at := now();

END IF;

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER check_deal_completion BEFORE
UPDATE
    ON deals FOR EACH ROW EXECUTE FUNCTION deal_completion_check();

-- ============================================================================
-- SECTION 15: Deal Milestones
-- ============================================================================
CREATE TABLE deal_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    due_date DATE,
    payment_amount NUMERIC(14, 2) DEFAULT 0,
    status milestone_status NOT NULL DEFAULT 'pending',
    sort_order INT NOT NULL DEFAULT 0,
    progress INT NOT NULL DEFAULT 0 CHECK (
        progress >= 0
        AND progress <= 100
    ),
    -- Suggestion system
    suggested_by UUID REFERENCES profiles(id),
    is_suggestion BOOLEAN NOT NULL DEFAULT false,
    suggestion_approved BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_milestones_deal ON deal_milestones(deal_id);

CREATE TRIGGER set_deal_milestones_updated_at BEFORE
UPDATE
    ON deal_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 16: Deal Proofs
-- ============================================================================
CREATE TABLE deal_proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES deal_milestones(id) ON DELETE
    SET
        NULL,
        submitter_id UUID NOT NULL REFERENCES profiles(id),
        proof_type proof_type NOT NULL,
        description TEXT NOT NULL,
        percentage_claim INT NOT NULL DEFAULT 0 CHECK (
            percentage_claim >= 0
            AND percentage_claim <= 100
        ),
        file_urls JSONB NOT NULL DEFAULT '[]',
        status proof_status NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        -- Predefined: 'incomplete_work', 'poor_quality', 'wrong_scope', 'missing_documentation'
        rejection_text TEXT,
        -- Free-text additional detail
        confirmed_by UUID REFERENCES profiles(id),
        confirmed_at TIMESTAMPTZ,
        rejection_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_proofs_deal ON deal_proofs(deal_id);

CREATE INDEX idx_deal_proofs_milestone ON deal_proofs(milestone_id);

CREATE INDEX idx_deal_proofs_status ON deal_proofs(status);

CREATE TRIGGER set_deal_proofs_updated_at BEFORE
UPDATE
    ON deal_proofs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 17: Deal Activity Log
-- ============================================================================
CREATE TABLE deal_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_activity_deal ON deal_activity_log(deal_id);

CREATE INDEX idx_deal_activity_created ON deal_activity_log(deal_id, created_at DESC);

-- ============================================================================
-- SECTION 18: Deal Skip & Cancel Requests
-- ============================================================================
CREATE TABLE deal_skip_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES profiles(id),
    reason TEXT,
    status deal_skip_status NOT NULL DEFAULT 'pending',
    responded_by UUID REFERENCES profiles(id),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_skip_deal ON deal_skip_requests(deal_id);

CREATE TABLE deal_cancel_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES profiles(id),
    reason TEXT NOT NULL,
    status deal_cancel_status NOT NULL DEFAULT 'pending',
    responded_by UUID REFERENCES profiles(id),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_cancel_deal ON deal_cancel_requests(deal_id);

-- ============================================================================
-- SECTION 19: Kanban Board
-- ============================================================================
CREATE TABLE kanban_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kanban_columns_deal ON kanban_columns(deal_id);

CREATE TRIGGER set_kanban_columns_updated_at BEFORE
UPDATE
    ON kanban_columns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE kanban_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES profiles(id),
    due_date DATE,
    priority kanban_priority NOT NULL DEFAULT 'medium',
    file_urls JSONB DEFAULT '[]',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kanban_cards_column ON kanban_cards(column_id);

CREATE INDEX idx_kanban_cards_deal ON kanban_cards(deal_id);

CREATE TRIGGER set_kanban_cards_updated_at BEFORE
UPDATE
    ON kanban_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 20: Daily Site Logs
-- ============================================================================
CREATE TABLE daily_site_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id),
    log_date DATE NOT NULL,
    weather TEXT,
    workers_on_site INT,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    issues TEXT,
    safety_notes TEXT,
    photo_urls JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(deal_id, log_date)
);

CREATE INDEX idx_daily_logs_deal ON daily_site_logs(deal_id);

CREATE INDEX idx_daily_logs_date ON daily_site_logs(deal_id, log_date DESC);

CREATE TRIGGER set_daily_logs_updated_at BEFORE
UPDATE
    ON daily_site_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 21: Document Vault
-- ============================================================================
CREATE TABLE deal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES profiles(id),
    category TEXT NOT NULL DEFAULT 'general',
    -- 'contracts', 'drawings', 'specs', 'permits', 'invoices', 'correspondence', 'general'
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INT NOT NULL,
    mime_type TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_documents_deal ON deal_documents(deal_id);

CREATE INDEX idx_deal_documents_category ON deal_documents(deal_id, category);

-- ============================================================================
-- SECTION 22: Contracts
-- ============================================================================
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE
    SET
        NULL,
        template_type template_type NOT NULL DEFAULT 'custom',
        -- Parties (JSONB for flexibility)
        party_a JSONB NOT NULL DEFAULT '{}',
        -- { name, company_name_ar, company_name_en, cr_number, vat_number, address, phone, email }
        party_b JSONB NOT NULL DEFAULT '{}',
        -- Contract content
        scope_ar TEXT,
        scope_en TEXT,
        payment_terms_ar TEXT,
        payment_terms_en TEXT,
        timeline TEXT,
        penalties_ar TEXT,
        penalties_en TEXT,
        warranty_ar TEXT,
        warranty_en TEXT,
        governing_law TEXT DEFAULT 'Saudi Arabian Law',
        additional_clauses JSONB DEFAULT '[]',
        status contract_status NOT NULL DEFAULT 'draft',
        pdf_url TEXT,
        qr_uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_creator ON contracts(creator_id);

CREATE INDEX idx_contracts_deal ON contracts(deal_id);

CREATE INDEX idx_contracts_qr ON contracts(qr_uuid);

CREATE INDEX idx_contracts_status ON contracts(status);

CREATE TRIGGER set_contracts_updated_at BEFORE
UPDATE
    ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE contract_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address INET,
    UNIQUE(contract_id, user_id)
);

CREATE INDEX idx_contract_signatures_contract ON contract_signatures(contract_id);

-- Contract clause library (reusable per user)
CREATE TABLE contract_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    content_en TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    -- 'warranty', 'penalty', 'payment', 'delivery', 'general'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contract_clauses_user ON contract_clauses(user_id);

CREATE TRIGGER set_contract_clauses_updated_at BEFORE
UPDATE
    ON contract_clauses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 23: CRM
-- ============================================================================
CREATE TABLE crm_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(owner_id, name)
);

CREATE INDEX idx_crm_tags_owner ON crm_tags(owner_id);

CREATE TABLE crm_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    linked_user_id UUID REFERENCES profiles(id),
    -- If client is also a platform user
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT,
    city_id UUID REFERENCES saudi_cities(id),
    source client_source NOT NULL DEFAULT 'manual_entry',
    pipeline_stage crm_pipeline_stage NOT NULL DEFAULT 'lead',
    score INT NOT NULL DEFAULT 0 CHECK (
        score >= 0
        AND score <= 100
    ),
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    last_interaction_at TIMESTAMPTZ DEFAULT now(),
    total_deal_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_deals INT NOT NULL DEFAULT 0,
    average_deal_size NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_clients_owner ON crm_clients(owner_id);

CREATE INDEX idx_crm_clients_pipeline ON crm_clients(owner_id, pipeline_stage);

CREATE INDEX idx_crm_clients_archived ON crm_clients(owner_id, is_archived);

CREATE INDEX idx_crm_clients_score ON crm_clients(owner_id, score DESC);

CREATE INDEX idx_crm_clients_favorite ON crm_clients(owner_id, is_favorite)
WHERE
    is_favorite = true;

CREATE TRIGGER set_crm_clients_updated_at BEFORE
UPDATE
    ON crm_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE crm_client_tags (
    client_id UUID NOT NULL REFERENCES crm_clients(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES crm_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (client_id, tag_id)
);

CREATE INDEX idx_crm_client_tags_tag ON crm_client_tags(tag_id);

CREATE TABLE crm_client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES crm_clients(id) ON DELETE CASCADE,
    content_ar TEXT,
    content_en TEXT,
    linked_entity_type TEXT,
    -- 'deal', 'contract', 'project', 'quotation'
    linked_entity_id UUID,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_notes_client ON crm_client_notes(client_id);

CREATE INDEX idx_crm_notes_pinned ON crm_client_notes(client_id, is_pinned)
WHERE
    is_pinned = true;

CREATE TABLE crm_follow_up_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES crm_clients(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    note TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_reminders_owner ON crm_follow_up_reminders(owner_id);

CREATE INDEX idx_crm_reminders_date ON crm_follow_up_reminders(owner_id, reminder_date)
WHERE
    is_completed = false;

CREATE TRIGGER set_crm_reminders_updated_at BEFORE
UPDATE
    ON crm_follow_up_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 24: Messaging
-- ============================================================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE
    SET
        NULL,
        product_id UUID REFERENCES products(id) ON DELETE
    SET
        NULL,
        deal_id UUID REFERENCES deals(id) ON DELETE
    SET
        NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        -- At least one context must be set
        CONSTRAINT conversation_has_context CHECK (
            project_id IS NOT NULL
            OR product_id IS NOT NULL
            OR deal_id IS NOT NULL
        )
);

CREATE INDEX idx_conversations_project ON conversations(project_id);

CREATE INDEX idx_conversations_product ON conversations(product_id);

CREATE INDEX idx_conversations_deal ON conversations(deal_id);

CREATE TRIGGER set_conversations_updated_at BEFORE
UPDATE
    ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    unread_count INT NOT NULL DEFAULT 0,
    last_read_at TIMESTAMPTZ,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);

CREATE INDEX idx_conversation_participants_conv ON conversation_participants(conversation_id);

CREATE INDEX idx_conversation_participants_unread ON conversation_participants(user_id, unread_count)
WHERE
    unread_count > 0;

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    file_size INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

CREATE INDEX idx_messages_sender ON messages(sender_id);

CREATE TABLE quick_reply_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_ar TEXT NOT NULL,
    content_en TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quick_replies_user ON quick_reply_templates(user_id);

CREATE TRIGGER set_quick_replies_updated_at BEFORE
UPDATE
    ON quick_reply_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 25: Notifications
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    body_ar TEXT,
    body_en TEXT,
    link TEXT,
    -- Dashboard path to navigate to
    is_read BOOLEAN NOT NULL DEFAULT false,
    entity_type TEXT,
    -- 'deal', 'bid', 'project', 'quotation', etc.
    entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read)
WHERE
    is_read = false;

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(user_id, notification_type)
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- ============================================================================
-- SECTION 26: Reviews
-- ============================================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id),
    reviewee_id UUID NOT NULL REFERENCES profiles(id),
    overall_rating INT NOT NULL CHECK (
        overall_rating >= 1
        AND overall_rating <= 5
    ),
    quality_rating INT CHECK (
        quality_rating >= 1
        AND quality_rating <= 5
    ),
    timeliness_rating INT CHECK (
        timeliness_rating >= 1
        AND timeliness_rating <= 5
    ),
    communication_rating INT CHECK (
        communication_rating >= 1
        AND communication_rating <= 5
    ),
    would_recommend BOOLEAN NOT NULL DEFAULT true,
    comment_ar TEXT,
    comment_en TEXT,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    -- Admin moderation
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(deal_id, reviewer_id)
);

CREATE INDEX idx_reviews_deal ON reviews(deal_id);

CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);

CREATE INDEX idx_reviews_visible ON reviews(reviewee_id, is_hidden)
WHERE
    is_hidden = false;

CREATE TRIGGER set_reviews_updated_at BEFORE
UPDATE
    ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update profile rating/review aggregates
CREATE
OR REPLACE FUNCTION update_review_aggregates() RETURNS TRIGGER AS $ $ BEGIN
UPDATE
    profiles
SET
    average_rating = COALESCE(
        (
            SELECT
                ROUND(AVG(overall_rating) :: NUMERIC, 2)
            FROM
                reviews
            WHERE
                reviewee_id = COALESCE(NEW.reviewee_id, OLD.reviewee_id)
                AND is_hidden = false
        ),
        0
    ),
    total_reviews = (
        SELECT
            COUNT(*)
        FROM
            reviews
        WHERE
            reviewee_id = COALESCE(NEW.reviewee_id, OLD.reviewee_id)
            AND is_hidden = false
    )
WHERE
    id = COALESCE(NEW.reviewee_id, OLD.reviewee_id);

RETURN COALESCE(NEW, OLD);

END;

$ $ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_change
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_review_aggregates();

-- ============================================================================
-- SECTION 27: Commissions
-- ============================================================================
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL UNIQUE REFERENCES deals(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id),
    deal_value NUMERIC(14, 2) NOT NULL,
    rate NUMERIC(4, 2) NOT NULL,
    -- e.g. 2.00, 1.00, 0.00
    amount NUMERIC(14, 2) NOT NULL,
    vat_amount NUMERIC(14, 2) NOT NULL,
    total NUMERIC(14, 2) NOT NULL,
    -- amount + vat
    status commission_status NOT NULL DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    -- 14 days from deal completion
    paid_at TIMESTAMPTZ,
    payment_method payment_method,
    payment_receipt_url TEXT,
    moyasar_payment_id TEXT,
    invoice_url TEXT,
    dispute_reason TEXT,
    dispute_raised_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_commissions_seller ON commissions(seller_id);

CREATE INDEX idx_commissions_status ON commissions(status);

CREATE INDEX idx_commissions_due ON commissions(due_date)
WHERE
    status IN ('pending', 'overdue');

CREATE TRIGGER set_commissions_updated_at BEFORE
UPDATE
    ON commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 28: Invoices
-- ============================================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type invoice_type NOT NULL,
    reference_id UUID NOT NULL,
    -- commission_id or subscription_id
    subtotal NUMERIC(14, 2) NOT NULL,
    vat NUMERIC(14, 2) NOT NULL,
    total NUMERIC(14, 2) NOT NULL,
    pdf_url TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);

CREATE INDEX idx_invoices_type ON invoices(type);

-- ============================================================================
-- SECTION 29: Admin
-- ============================================================================
CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES profiles(id),
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    -- 'user', 'project', 'product', 'rfq', 'deal', 'commission', 'review', 'coupon'
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_admin ON admin_audit_log(admin_id);

CREATE INDEX idx_admin_audit_target ON admin_audit_log(target_type, target_id);

CREATE INDEX idx_admin_audit_created ON admin_audit_log(created_at DESC);

CREATE TABLE platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION 30: Contact Form Submissions
-- ============================================================================
CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    message TEXT NOT NULL,
    role_interest TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_submissions_unread ON contact_submissions(is_read)
WHERE
    is_read = false;

-- ============================================================================
-- SECTION 31: Row Level Security (RLS)
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE
    profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    saudi_cities ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    coupons ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    subscription_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    coupon_redemptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    verification_documents ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    projects ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    project_files ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    products ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    product_variants ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    product_images ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    product_spec_sheets ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    bids ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    inquiries ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    rfqs ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    rfq_responses ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    hire_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    quotation_sequences ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    quotations ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    quotation_clauses ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    deals ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    deal_milestones ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    deal_proofs ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    deal_activity_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    deal_skip_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    deal_cancel_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    kanban_columns ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    kanban_cards ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    daily_site_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    deal_documents ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    contracts ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    contract_signatures ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    contract_clauses ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    crm_tags ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    crm_clients ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    crm_client_tags ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    crm_client_notes ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    crm_follow_up_reminders ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    conversations ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    conversation_participants ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    quick_reply_templates ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    notification_preferences ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    commissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    invoices ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    admin_audit_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    platform_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    contact_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies: Reference Tables (public read)
-- ============================================================================
CREATE POLICY "Anyone can read saudi_cities" ON saudi_cities FOR
SELECT
    USING (true);

CREATE POLICY "Anyone can read categories" ON categories FOR
SELECT
    USING (true);

-- ============================================================================
-- RLS Policies: Profiles
-- ============================================================================
CREATE POLICY "Users can read any profile" ON profiles FOR
SELECT
    USING (true);

CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================================
-- RLS Policies: Subscriptions
-- ============================================================================
CREATE POLICY "Users can read own subscriptions" ON subscriptions FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR
INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own subscription history" ON subscription_history FOR
SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies: Coupons (public read for active)
-- ============================================================================
CREATE POLICY "Anyone can read active coupons" ON coupons FOR
SELECT
    USING (is_active = true);

CREATE POLICY "Users can read own coupon redemptions" ON coupon_redemptions FOR
SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies: Verification Documents
-- ============================================================================
CREATE POLICY "Users can read own documents" ON verification_documents FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON verification_documents FOR
INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies: Projects
-- ============================================================================
CREATE POLICY "Anyone can read published projects" ON projects FOR
SELECT
    USING (
        status = 'published'
        OR owner_id = auth.uid()
    );

CREATE POLICY "Owners can insert projects" ON projects FOR
INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own projects" ON projects FOR
UPDATE
    USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own draft projects" ON projects FOR DELETE USING (
    auth.uid() = owner_id
    AND status = 'draft'
);

-- Project Files follow project access
CREATE POLICY "Read project files" ON project_files FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                projects
            WHERE
                projects.id = project_files.project_id
                AND (
                    projects.status = 'published'
                    OR projects.owner_id = auth.uid()
                )
        )
    );

CREATE POLICY "Owners can manage project files" ON project_files FOR
INSERT
    WITH CHECK (
        EXISTS (
            SELECT
                1
            FROM
                projects
            WHERE
                projects.id = project_files.project_id
                AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can delete project files" ON project_files FOR DELETE USING (
    EXISTS (
        SELECT
            1
        FROM
            projects
        WHERE
            projects.id = project_files.project_id
            AND projects.owner_id = auth.uid()
    )
);

-- ============================================================================
-- RLS Policies: Products
-- ============================================================================
CREATE POLICY "Anyone can read published products" ON products FOR
SELECT
    USING (
        status = 'published'
        OR supplier_id = auth.uid()
    );

CREATE POLICY "Suppliers can insert products" ON products FOR
INSERT
    WITH CHECK (auth.uid() = supplier_id);

CREATE POLICY "Suppliers can update own products" ON products FOR
UPDATE
    USING (auth.uid() = supplier_id) WITH CHECK (auth.uid() = supplier_id);

CREATE POLICY "Suppliers can delete own draft products" ON products FOR DELETE USING (
    auth.uid() = supplier_id
    AND status = 'draft'
);

-- Product sub-tables follow product access
CREATE POLICY "Read product variants" ON product_variants FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                products
            WHERE
                products.id = product_variants.product_id
                AND (
                    products.status = 'published'
                    OR products.supplier_id = auth.uid()
                )
        )
    );

CREATE POLICY "Suppliers manage product variants" ON product_variants FOR ALL USING (
    EXISTS (
        SELECT
            1
        FROM
            products
        WHERE
            products.id = product_variants.product_id
            AND products.supplier_id = auth.uid()
    )
);

CREATE POLICY "Read product images" ON product_images FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                products
            WHERE
                products.id = product_images.product_id
                AND (
                    products.status = 'published'
                    OR products.supplier_id = auth.uid()
                )
        )
    );

CREATE POLICY "Suppliers manage product images" ON product_images FOR ALL USING (
    EXISTS (
        SELECT
            1
        FROM
            products
        WHERE
            products.id = product_images.product_id
            AND products.supplier_id = auth.uid()
    )
);

CREATE POLICY "Read product spec sheets" ON product_spec_sheets FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                products
            WHERE
                products.id = product_spec_sheets.product_id
                AND (
                    products.status = 'published'
                    OR products.supplier_id = auth.uid()
                )
        )
    );

CREATE POLICY "Suppliers manage product spec sheets" ON product_spec_sheets FOR ALL USING (
    EXISTS (
        SELECT
            1
        FROM
            products
        WHERE
            products.id = product_spec_sheets.product_id
            AND products.supplier_id = auth.uid()
    )
);

-- ============================================================================
-- RLS Policies: Bids
-- ============================================================================
CREATE POLICY "Project owners and bidders can read bids" ON bids FOR
SELECT
    USING (
        contractor_id = auth.uid()
        OR EXISTS (
            SELECT
                1
            FROM
                projects
            WHERE
                projects.id = bids.project_id
                AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Contractors can insert bids" ON bids FOR
INSERT
    WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can update own pending bids" ON bids FOR
UPDATE
    USING (
        auth.uid() = contractor_id
        AND status = 'pending'
    ) WITH CHECK (auth.uid() = contractor_id);

-- ============================================================================
-- RLS Policies: Inquiries
-- ============================================================================
CREATE POLICY "Senders and product owners can read inquiries" ON inquiries FOR
SELECT
    USING (
        sender_id = auth.uid()
        OR EXISTS (
            SELECT
                1
            FROM
                products
            WHERE
                products.id = inquiries.product_id
                AND products.supplier_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert inquiries" ON inquiries FOR
INSERT
    WITH CHECK (auth.uid() = sender_id);

-- ============================================================================
-- RLS Policies: RFQs
-- ============================================================================
CREATE POLICY "Read published RFQs or own" ON rfqs FOR
SELECT
    USING (
        status = 'published'
        OR poster_id = auth.uid()
    );

CREATE POLICY "Users can insert RFQs" ON rfqs FOR
INSERT
    WITH CHECK (auth.uid() = poster_id);

CREATE POLICY "Users can update own RFQs" ON rfqs FOR
UPDATE
    USING (auth.uid() = poster_id) WITH CHECK (auth.uid() = poster_id);

-- RFQ Responses
CREATE POLICY "RFQ poster and responder can read responses" ON rfq_responses FOR
SELECT
    USING (
        supplier_id = auth.uid()
        OR EXISTS (
            SELECT
                1
            FROM
                rfqs
            WHERE
                rfqs.id = rfq_responses.rfq_id
                AND rfqs.poster_id = auth.uid()
        )
    );

CREATE POLICY "Suppliers can insert RFQ responses" ON rfq_responses FOR
INSERT
    WITH CHECK (auth.uid() = supplier_id);

CREATE POLICY "Suppliers can update own responses" ON rfq_responses FOR
UPDATE
    USING (auth.uid() = supplier_id) WITH CHECK (auth.uid() = supplier_id);

-- ============================================================================
-- RLS Policies: Hire Requests
-- ============================================================================
CREATE POLICY "Requester and supplier can read hire requests" ON hire_requests FOR
SELECT
    USING (
        requester_id = auth.uid()
        OR supplier_id = auth.uid()
    );

CREATE POLICY "Users can insert hire requests" ON hire_requests FOR
INSERT
    WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own hire requests" ON hire_requests FOR
UPDATE
    USING (
        requester_id = auth.uid()
        OR supplier_id = auth.uid()
    );

-- ============================================================================
-- RLS Policies: Quotations
-- ============================================================================
CREATE POLICY "Sender and recipient can read quotations" ON quotations FOR
SELECT
    USING (
        sender_id = auth.uid()
        OR recipient_id = auth.uid()
    );

CREATE POLICY "Users can insert quotations" ON quotations FOR
INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Senders can update own quotations" ON quotations FOR
UPDATE
    USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users manage own quotation sequences" ON quotation_sequences FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own quotation clauses" ON quotation_clauses FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies: Deals
-- ============================================================================
CREATE POLICY "Deal participants can read deals" ON deals FOR
SELECT
    USING (
        seller_id = auth.uid()
        OR buyer_id = auth.uid()
    );

CREATE POLICY "Deal participants can update deals" ON deals FOR
UPDATE
    USING (
        seller_id = auth.uid()
        OR buyer_id = auth.uid()
    );

-- Deal sub-tables: milestones, proofs, activity, skip/cancel, documents
CREATE POLICY "Deal participants can read milestones" ON deal_milestones FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                deals
            WHERE
                deals.id = deal_milestones.deal_id
                AND (
                    deals.seller_id = auth.uid()
                    OR deals.buyer_id = auth.uid()
                )
        )
    );

CREATE POLICY "Deal participants can manage milestones" ON deal_milestones FOR ALL USING (
    EXISTS (
        SELECT
            1
        FROM
            deals
        WHERE
            deals.id = deal_milestones.deal_id
            AND (
                deals.seller_id = auth.uid()
                OR deals.buyer_id = auth.uid()
            )
    )
);

CREATE POLICY "Deal participants can read proofs" ON deal_proofs FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                deals
            WHERE
                deals.id = deal_proofs.deal_id
                AND (
                    deals.seller_id = auth.uid()
                    OR deals.buyer_id = auth.uid()
                )
        )
    );

CREATE POLICY "Deal participants can insert proofs" ON deal_proofs FOR
INSERT
    WITH CHECK (
        auth.uid() = submitter_id
        AND EXISTS (
            SELECT
                1
            FROM
                deals
            WHERE
                deals.id = deal_proofs.deal_id
                AND (
                    deals.seller_id = auth.uid()
                    OR deals.buyer_id = auth.uid()
                )
        )
    );

CREATE POLICY "Deal participants can update proofs" ON deal_proofs FOR
UPDATE
    USING (
        EXISTS (
            SELECT
                1
            FROM
                deals
            WHERE
                deals.id = deal_proofs.deal_id
                AND (
                    deals.seller_id = auth.uid()
                    OR deals.buyer_id = auth.uid()
                )
        )
    );

CREATE POLICY "Deal participants can read activity log" ON deal_activity_log FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                deals
            WHERE
                deals.id = deal_activity_log.deal_id
                AND (
                    deals.seller_id = auth.uid()
                    OR deals.buyer_id = auth.uid()
                )
        )
    );

CREATE POLICY "Deal participants can read skip requests" ON deal_skip_requests FOR ALL USING (
    EXISTS (
        SELECT
            1
        FROM
            deals
        WHERE
            deals.id = deal_skip_requests.deal_id
            AND (
                deals.seller_id = auth.uid()
                OR deals.buyer_id = auth.uid()
            )
    )
);

CREATE POLICY "Deal participants can manage cancel requests" ON deal_cancel_requests FOR ALL USING (
    EXISTS (
        SELECT
            1
        FROM
            deals
        WHERE
            deals.id = deal_cancel_requests.deal_id
            AND (
                deals.seller_id = auth.uid()
                OR deals.buyer_id = auth.uid()
            )
    )
);

CREATE POLICY "Deal participants can read deal documents" ON deal_documents FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                deals
            WHERE
                deals.id = deal_documents.deal_id
                AND (
                    deals.seller_id = auth.uid()
                    OR deals.buyer_id = auth.uid()
                )
        )
    );

CREATE POLICY "Deal participants can upload deal documents" ON deal_documents FOR
INSERT
    WITH CHECK (
        auth.uid() = uploader_id
        AND EXISTS (
            SELECT
                1
            FROM
                deals
            WHERE
                deals.id = deal_documents.deal_id
                AND (
                    deals.seller_id = auth.uid()
                    OR deals.buyer_id = auth.uid()
                )
        )
    );

-- ============================================================================
-- RLS Policies: Kanban
-- ============================================================================
CREATE POLICY "Deal participants can read kanban columns" ON kanban_columns FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                deals
            WHERE
                deals.id = kanban_columns.deal_id
                AND (
                    deals.seller_id = auth.uid()
                    OR deals.buyer_id = auth.uid()
                )
        )
    );

CREATE POLICY "Deal seller can manage kanban columns" ON kanban_columns FOR ALL USING (
    EXISTS (
        SELECT
            1
        FROM
            deals
        WHERE
            deals.id = kanban_columns.deal_id
            AND deals.seller_id = auth.uid()
    )
);

CREATE POLICY "Deal participants can read kanban cards" ON kanban_cards FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                deals
            WHERE
                deals.id = kanban_cards.deal_id
                AND (
                    deals.seller_id = auth.uid()
                    OR deals.buyer_id = auth.uid()
                )
        )
    );

CREATE POLICY "Deal seller can manage kanban cards" ON kanban_cards FOR ALL USING (
    EXISTS (
        SELECT
            1
        FROM
            deals
        WHERE
            deals.id = kanban_cards.deal_id
            AND deals.seller_id = auth.uid()
    )
);

-- ============================================================================
-- RLS Policies: Daily Site Logs
-- ============================================================================
CREATE POLICY "Deal participants can read daily logs" ON daily_site_logs FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                deals
            WHERE
                deals.id = daily_site_logs.deal_id
                AND (
                    deals.seller_id = auth.uid()
                    OR deals.buyer_id = auth.uid()
                )
        )
    );

CREATE POLICY "Authors can manage daily logs" ON daily_site_logs FOR ALL USING (auth.uid() = author_id);

-- ============================================================================
-- RLS Policies: Contracts
-- ============================================================================
CREATE POLICY "Contract participants can read contracts" ON contracts FOR
SELECT
    USING (
        creator_id = auth.uid()
        OR (
            deal_id IS NOT NULL
            AND EXISTS (
                SELECT
                    1
                FROM
                    deals
                WHERE
                    deals.id = contracts.deal_id
                    AND (
                        deals.seller_id = auth.uid()
                        OR deals.buyer_id = auth.uid()
                    )
            )
        )
    );

CREATE POLICY "Users can insert contracts" ON contracts FOR
INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own contracts" ON contracts FOR
UPDATE
    USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Read contract signatures" ON contract_signatures FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                contracts
            WHERE
                contracts.id = contract_signatures.contract_id
                AND (
                    contracts.creator_id = auth.uid()
                    OR (
                        contracts.deal_id IS NOT NULL
                        AND EXISTS (
                            SELECT
                                1
                            FROM
                                deals
                            WHERE
                                deals.id = contracts.deal_id
                                AND (
                                    deals.seller_id = auth.uid()
                                    OR deals.buyer_id = auth.uid()
                                )
                        )
                    )
                )
        )
    );

CREATE POLICY "Users can sign contracts" ON contract_signatures FOR
INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own contract clauses" ON contract_clauses FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies: CRM (private to owner)
-- ============================================================================
CREATE POLICY "Users manage own CRM tags" ON crm_tags FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users manage own CRM clients" ON crm_clients FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users manage own CRM client tags" ON crm_client_tags FOR ALL USING (
    EXISTS (
        SELECT
            1
        FROM
            crm_clients
        WHERE
            crm_clients.id = crm_client_tags.client_id
            AND crm_clients.owner_id = auth.uid()
    )
);

CREATE POLICY "Users manage own CRM notes" ON crm_client_notes FOR ALL USING (
    EXISTS (
        SELECT
            1
        FROM
            crm_clients
        WHERE
            crm_clients.id = crm_client_notes.client_id
            AND crm_clients.owner_id = auth.uid()
    )
);

CREATE POLICY "Users manage own CRM reminders" ON crm_follow_up_reminders FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- RLS Policies: Messaging
-- ============================================================================
CREATE POLICY "Participants can read conversations" ON conversations FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                conversation_participants
            WHERE
                conversation_participants.conversation_id = conversations.id
                AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Users manage own participation" ON conversation_participants FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users update own participation" ON conversation_participants FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Participants can read messages" ON messages FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                conversation_participants
            WHERE
                conversation_participants.conversation_id = messages.conversation_id
                AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can send messages" ON messages FOR
INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT
                1
            FROM
                conversation_participants
            WHERE
                conversation_participants.conversation_id = messages.conversation_id
                AND conversation_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Users manage own quick replies" ON quick_reply_templates FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies: Notifications (private to user)
-- ============================================================================
CREATE POLICY "Users read own notifications" ON notifications FOR
SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON notifications FOR
UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage own notification preferences" ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies: Reviews (public read for visible)
-- ============================================================================
CREATE POLICY "Anyone can read visible reviews" ON reviews FOR
SELECT
    USING (
        is_hidden = false
        OR reviewer_id = auth.uid()
    );

CREATE POLICY "Users can insert reviews" ON reviews FOR
INSERT
    WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update own reviews within 48h" ON reviews FOR
UPDATE
    USING (
        auth.uid() = reviewer_id
        AND created_at > now() - INTERVAL '48 hours'
    );

-- ============================================================================
-- RLS Policies: Commissions
-- ============================================================================
CREATE POLICY "Sellers can read own commissions" ON commissions FOR
SELECT
    USING (seller_id = auth.uid());

CREATE POLICY "Sellers can update own commissions" ON commissions FOR
UPDATE
    USING (seller_id = auth.uid());

-- ============================================================================
-- RLS Policies: Invoices
-- ============================================================================
CREATE POLICY "Users read own invoices" ON invoices FOR
SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies: Admin tables
-- ============================================================================
CREATE POLICY "Admins can read audit log" ON admin_audit_log FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                profiles
            WHERE
                profiles.id = auth.uid()
                AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can insert audit log" ON admin_audit_log FOR
INSERT
    WITH CHECK (
        EXISTS (
            SELECT
                1
            FROM
                profiles
            WHERE
                profiles.id = auth.uid()
                AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can manage platform settings" ON platform_settings FOR ALL USING (
    EXISTS (
        SELECT
            1
        FROM
            profiles
        WHERE
            profiles.id = auth.uid()
            AND profiles.is_admin = true
    )
);

-- Contact submissions: anyone can insert, admins can read
CREATE POLICY "Anyone can submit contact form" ON contact_submissions FOR
INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can read contact submissions" ON contact_submissions FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                profiles
            WHERE
                profiles.id = auth.uid()
                AND profiles.is_admin = true
        )
    );

-- ============================================================================
-- SECTION 32: Seed Data — Saudi Cities
-- ============================================================================
INSERT INTO
    saudi_cities (name_ar, name_en, region_ar, region_en)
VALUES
    (
        'الرياض',
        'Riyadh',
        'منطقة الرياض',
        'Riyadh Region'
    ),
    (
        'جدة',
        'Jeddah',
        'منطقة مكة المكرمة',
        'Makkah Region'
    ),
    (
        'مكة المكرمة',
        'Makkah',
        'منطقة مكة المكرمة',
        'Makkah Region'
    ),
    (
        'المدينة المنورة',
        'Madinah',
        'منطقة المدينة المنورة',
        'Madinah Region'
    ),
    (
        'الدمام',
        'Dammam',
        'المنطقة الشرقية',
        'Eastern Province'
    ),
    (
        'الخبر',
        'Khobar',
        'المنطقة الشرقية',
        'Eastern Province'
    ),
    (
        'الظهران',
        'Dhahran',
        'المنطقة الشرقية',
        'Eastern Province'
    ),
    (
        'الطائف',
        'Taif',
        'منطقة مكة المكرمة',
        'Makkah Region'
    ),
    ('تبوك', 'Tabuk', 'منطقة تبوك', 'Tabuk Region'),
    (
        'بريدة',
        'Buraydah',
        'منطقة القصيم',
        'Qassim Region'
    ),
    (
        'خميس مشيط',
        'Khamis Mushait',
        'منطقة عسير',
        'Asir Region'
    ),
    ('أبها', 'Abha', 'منطقة عسير', 'Asir Region'),
    ('حائل', 'Hail', 'منطقة حائل', 'Hail Region'),
    (
        'نجران',
        'Najran',
        'منطقة نجران',
        'Najran Region'
    ),
    ('جازان', 'Jazan', 'منطقة جازان', 'Jazan Region'),
    (
        'ينبع',
        'Yanbu',
        'منطقة المدينة المنورة',
        'Madinah Region'
    ),
    (
        'الجبيل',
        'Jubail',
        'المنطقة الشرقية',
        'Eastern Province'
    ),
    (
        'الأحساء',
        'Al Ahsa',
        'المنطقة الشرقية',
        'Eastern Province'
    ),
    (
        'القطيف',
        'Qatif',
        'المنطقة الشرقية',
        'Eastern Province'
    ),
    (
        'سكاكا',
        'Sakaka',
        'منطقة الجوف',
        'Al Jawf Region'
    ),
    (
        'عرعر',
        'Arar',
        'منطقة الحدود الشمالية',
        'Northern Borders Region'
    ),
    (
        'الباحة',
        'Al Baha',
        'منطقة الباحة',
        'Al Baha Region'
    ),
    ('بيشة', 'Bisha', 'منطقة عسير', 'Asir Region'),
    (
        'القريات',
        'Qurayyat',
        'منطقة الجوف',
        'Al Jawf Region'
    ),
    (
        'رابغ',
        'Rabigh',
        'منطقة مكة المكرمة',
        'Makkah Region'
    ),
    (
        'الخرج',
        'Al Kharj',
        'منطقة الرياض',
        'Riyadh Region'
    ),
    (
        'عنيزة',
        'Unayzah',
        'منطقة القصيم',
        'Qassim Region'
    ),
    (
        'الرس',
        'Ar Rass',
        'منطقة القصيم',
        'Qassim Region'
    ),
    (
        'وادي الدواسر',
        'Wadi ad-Dawasir',
        'منطقة الرياض',
        'Riyadh Region'
    ),
    (
        'الدوادمي',
        'Dawadmi',
        'منطقة الرياض',
        'Riyadh Region'
    ),
    (
        'المجمعة',
        'Al Majmaah',
        'منطقة الرياض',
        'Riyadh Region'
    ),
    (
        'شقراء',
        'Shaqra',
        'منطقة الرياض',
        'Riyadh Region'
    ),
    (
        'الزلفي',
        'Az Zulfi',
        'منطقة الرياض',
        'Riyadh Region'
    ),
    (
        'الدرعية',
        'Diriyah',
        'منطقة الرياض',
        'Riyadh Region'
    ),
    ('نيوم', 'NEOM', 'منطقة تبوك', 'Tabuk Region');

-- ============================================================================
-- SECTION 33: Realtime Configuration
-- Enable Supabase Realtime for tables that need live updates
-- ============================================================================
-- Note: Run these in Supabase Dashboard → Database → Replication
-- or use the Supabase Management API. Listed here for documentation:
--
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE deals;
-- ALTER PUBLICATION supabase_realtime ADD TABLE deal_milestones;
-- ALTER PUBLICATION supabase_realtime ADD TABLE deal_proofs;
-- ALTER PUBLICATION supabase_realtime ADD TABLE kanban_columns;
-- ALTER PUBLICATION supabase_realtime ADD TABLE kanban_cards;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
-- ============================================================================
-- SECTION 34: Storage Buckets (documentation)
-- Create via Supabase Dashboard or Management API
-- ============================================================================
-- Bucket: avatars          | Public  | {user_id}/avatar.{ext}
-- Bucket: company-logos    | Public  | {user_id}/logo.{ext}
-- Bucket: company-profiles | Public  | {user_id}/{uuid}.pdf
-- Bucket: project-files    | Private | {project_id}/{category}/{uuid}.{ext}
-- Bucket: product-images   | Public  | {product_id}/{uuid}.{ext}
-- Bucket: product-specs    | Public  | {product_id}/specs/{uuid}.pdf
-- Bucket: verification-docs| Private | {user_id}/{doc_type}/{uuid}.{ext}
-- Bucket: deal-proofs      | Private | {deal_id}/proofs/{proof_id}/{uuid}.{ext}
-- Bucket: deal-documents   | Private | {deal_id}/documents/{category}/{uuid}.{ext}
-- Bucket: deal-daily-logs  | Private | {deal_id}/daily-logs/{date}/{uuid}.{ext}
-- Bucket: contracts        | Private | {user_id}/contracts/{contract_id}/{uuid}.pdf
-- Bucket: chat-attachments | Private | {conversation_id}/{message_id}/{uuid}.{ext}
-- Bucket: bulk-imports     | Private | {user_id}/imports/{uuid}.csv
-- Bucket: invoices         | Private | {user_id}/invoices/{invoice_id}.pdf
-- ============================================================================
-- END OF SCHEMA
-- ============================================================================