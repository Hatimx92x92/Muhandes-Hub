export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          attachments: Json | null
          contractor_id: string
          id: string
          methodology_ar: string | null
          methodology_en: string | null
          project_id: string
          status: Database["public"]["Enums"]["bid_status"]
          submitted_at: string
          timeline_days: number
          updated_at: string
        }
        Insert: {
          amount: number
          attachments?: Json | null
          contractor_id: string
          id?: string
          methodology_ar?: string | null
          methodology_en?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["bid_status"]
          submitted_at?: string
          timeline_days: number
          updated_at?: string
        }
        Update: {
          amount?: number
          attachments?: Json | null
          contractor_id?: string
          id?: string
          methodology_ar?: string | null
          methodology_en?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["bid_status"]
          submitted_at?: string
          timeline_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          applies_to: string[]
          created_at: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          applies_to?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          applies_to?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          deal_id: string
          deal_value: number
          dispute_raised_at: string | null
          dispute_reason: string | null
          due_date: string | null
          id: string
          invoice_url: string | null
          moyasar_payment_id: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_receipt_url: string | null
          rate: number
          resolved_at: string | null
          resolved_by: string | null
          seller_id: string
          status: Database["public"]["Enums"]["commission_status"]
          total: number
          updated_at: string
          vat_amount: number
        }
        Insert: {
          amount: number
          created_at?: string
          deal_id: string
          deal_value: number
          dispute_raised_at?: string | null
          dispute_reason?: string | null
          due_date?: string | null
          id?: string
          invoice_url?: string | null
          moyasar_payment_id?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_receipt_url?: string | null
          rate: number
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["commission_status"]
          total: number
          updated_at?: string
          vat_amount: number
        }
        Update: {
          amount?: number
          created_at?: string
          deal_id?: string
          deal_value?: number
          dispute_raised_at?: string | null
          dispute_reason?: string | null
          due_date?: string | null
          id?: string
          invoice_url?: string | null
          moyasar_payment_id?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_receipt_url?: string | null
          rate?: number
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["commission_status"]
          total?: number
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "commissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          role_interest: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          role_interest?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          role_interest?: string | null
        }
        Relationships: []
      }
      contract_clauses: {
        Row: {
          category: string
          content_ar: string
          content_en: string
          created_at: string
          id: string
          title_ar: string
          title_en: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content_ar: string
          content_en: string
          created_at?: string
          id?: string
          title_ar: string
          title_en: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content_ar?: string
          content_en?: string
          created_at?: string
          id?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_clauses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signatures: {
        Row: {
          contract_id: string
          id: string
          ip_address: unknown
          name: string
          signed_at: string
          title: string
          user_id: string
        }
        Insert: {
          contract_id: string
          id?: string
          ip_address?: unknown
          name: string
          signed_at?: string
          title: string
          user_id: string
        }
        Update: {
          contract_id?: string
          id?: string
          ip_address?: unknown
          name?: string
          signed_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          additional_clauses: Json | null
          created_at: string
          creator_id: string
          deal_id: string | null
          governing_law: string | null
          id: string
          party_a: Json
          party_b: Json
          payment_terms_ar: string | null
          payment_terms_en: string | null
          pdf_url: string | null
          penalties_ar: string | null
          penalties_en: string | null
          qr_uuid: string
          scope_ar: string | null
          scope_en: string | null
          status: Database["public"]["Enums"]["contract_status"]
          template_type: Database["public"]["Enums"]["template_type"]
          timeline: string | null
          updated_at: string
          warranty_ar: string | null
          warranty_en: string | null
        }
        Insert: {
          additional_clauses?: Json | null
          created_at?: string
          creator_id: string
          deal_id?: string | null
          governing_law?: string | null
          id?: string
          party_a?: Json
          party_b?: Json
          payment_terms_ar?: string | null
          payment_terms_en?: string | null
          pdf_url?: string | null
          penalties_ar?: string | null
          penalties_en?: string | null
          qr_uuid?: string
          scope_ar?: string | null
          scope_en?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          template_type?: Database["public"]["Enums"]["template_type"]
          timeline?: string | null
          updated_at?: string
          warranty_ar?: string | null
          warranty_en?: string | null
        }
        Update: {
          additional_clauses?: Json | null
          created_at?: string
          creator_id?: string
          deal_id?: string | null
          governing_law?: string | null
          id?: string
          party_a?: Json
          party_b?: Json
          payment_terms_ar?: string | null
          payment_terms_en?: string | null
          pdf_url?: string | null
          penalties_ar?: string | null
          penalties_en?: string | null
          qr_uuid?: string
          scope_ar?: string | null
          scope_en?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          template_type?: Database["public"]["Enums"]["template_type"]
          timeline?: string | null
          updated_at?: string
          warranty_ar?: string | null
          warranty_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_visible: boolean
          joined_at: string
          last_read_at: string | null
          unread_count: number
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_visible?: boolean
          joined_at?: string
          last_read_at?: string | null
          unread_count?: number
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_visible?: boolean
          joined_at?: string
          last_read_at?: string | null
          unread_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          deal_id: string | null
          id: string
          product_id: string | null
          project_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          id?: string
          product_id?: string | null
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          id?: string
          product_id?: string | null
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          id: string
          redeemed_at: string
          subscription_id: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          redeemed_at?: string
          subscription_id: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          redeemed_at?: string
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          first_purchase_only: boolean
          id: string
          is_active: boolean
          max_discount_cap: number | null
          min_amount: number | null
          per_user_limit: number
          renewal_eligible: boolean
          role_restriction: Database["public"]["Enums"]["user_role"][] | null
          tier_restriction:
            | Database["public"]["Enums"]["subscription_tier"][]
            | null
          updated_at: string
          usage_limit: number | null
          used_count: number
          valid_from: string
          valid_to: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          first_purchase_only?: boolean
          id?: string
          is_active?: boolean
          max_discount_cap?: number | null
          min_amount?: number | null
          per_user_limit?: number
          renewal_eligible?: boolean
          role_restriction?: Database["public"]["Enums"]["user_role"][] | null
          tier_restriction?:
            | Database["public"]["Enums"]["subscription_tier"][]
            | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from: string
          valid_to: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          first_purchase_only?: boolean
          id?: string
          is_active?: boolean
          max_discount_cap?: number | null
          min_amount?: number | null
          per_user_limit?: number
          renewal_eligible?: boolean
          role_restriction?: Database["public"]["Enums"]["user_role"][] | null
          tier_restriction?:
            | Database["public"]["Enums"]["subscription_tier"][]
            | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string
          valid_to?: string
        }
        Relationships: []
      }
      crm_client_notes: {
        Row: {
          client_id: string
          content_ar: string | null
          content_en: string | null
          created_at: string
          id: string
          is_pinned: boolean
          linked_entity_id: string | null
          linked_entity_type: string | null
        }
        Insert: {
          client_id: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          linked_entity_id?: string | null
          linked_entity_type?: string | null
        }
        Update: {
          client_id?: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          linked_entity_id?: string | null
          linked_entity_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_client_tags: {
        Row: {
          client_id: string
          tag_id: string
        }
        Insert: {
          client_id: string
          tag_id: string
        }
        Update: {
          client_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_client_tags_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_client_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_clients: {
        Row: {
          average_deal_size: number
          city_id: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          is_archived: boolean
          is_favorite: boolean
          last_interaction_at: string | null
          linked_user_id: string | null
          name: string
          owner_id: string
          phone: string | null
          pipeline_stage: Database["public"]["Enums"]["crm_pipeline_stage"]
          score: number
          source: Database["public"]["Enums"]["client_source"]
          total_deal_value: number
          total_deals: number
          updated_at: string
        }
        Insert: {
          average_deal_size?: number
          city_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          last_interaction_at?: string | null
          linked_user_id?: string | null
          name: string
          owner_id: string
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["crm_pipeline_stage"]
          score?: number
          source?: Database["public"]["Enums"]["client_source"]
          total_deal_value?: number
          total_deals?: number
          updated_at?: string
        }
        Update: {
          average_deal_size?: number
          city_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          last_interaction_at?: string | null
          linked_user_id?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["crm_pipeline_stage"]
          score?: number
          source?: Database["public"]["Enums"]["client_source"]
          total_deal_value?: number
          total_deals?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_clients_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "saudi_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_clients_linked_user_id_fkey"
            columns: ["linked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_clients_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_follow_up_reminders: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_completed: boolean
          note: string | null
          owner_id: string
          reminder_date: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_completed?: boolean
          note?: string | null
          owner_id: string
          reminder_date: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          note?: string | null
          owner_id?: string
          reminder_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_follow_up_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_follow_up_reminders_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tags_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_site_logs: {
        Row: {
          author_id: string
          created_at: string
          deal_id: string
          description_ar: string
          description_en: string
          id: string
          issues: string | null
          log_date: string
          photo_urls: Json | null
          safety_notes: string | null
          updated_at: string
          weather: string | null
          workers_on_site: number | null
        }
        Insert: {
          author_id: string
          created_at?: string
          deal_id: string
          description_ar: string
          description_en: string
          id?: string
          issues?: string | null
          log_date: string
          photo_urls?: Json | null
          safety_notes?: string | null
          updated_at?: string
          weather?: string | null
          workers_on_site?: number | null
        }
        Update: {
          author_id?: string
          created_at?: string
          deal_id?: string
          description_ar?: string
          description_en?: string
          id?: string
          issues?: string | null
          log_date?: string
          photo_urls?: Json | null
          safety_notes?: string | null
          updated_at?: string
          weather?: string | null
          workers_on_site?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_site_logs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_site_logs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          deal_id: string
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          deal_id: string
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          deal_id?: string
          details?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_activity_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_cancel_requests: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          reason: string
          requester_id: string
          responded_at: string | null
          responded_by: string | null
          status: Database["public"]["Enums"]["deal_cancel_status"]
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          reason: string
          requester_id: string
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["deal_cancel_status"]
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          reason?: string
          requester_id?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["deal_cancel_status"]
        }
        Relationships: [
          {
            foreignKeyName: "deal_cancel_requests_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_cancel_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_cancel_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_documents: {
        Row: {
          category: string
          created_at: string
          deal_id: string
          file_name: string
          file_size: number
          file_url: string
          id: string
          mime_type: string
          notes: string | null
          uploader_id: string
          version: number
        }
        Insert: {
          category?: string
          created_at?: string
          deal_id: string
          file_name: string
          file_size: number
          file_url: string
          id?: string
          mime_type: string
          notes?: string | null
          uploader_id: string
          version?: number
        }
        Update: {
          category?: string
          created_at?: string
          deal_id?: string
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          mime_type?: string
          notes?: string | null
          uploader_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_documents_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_milestones: {
        Row: {
          created_at: string
          deal_id: string
          description_ar: string | null
          description_en: string | null
          due_date: string | null
          id: string
          is_suggestion: boolean
          payment_amount: number | null
          progress: number
          sort_order: number
          status: Database["public"]["Enums"]["milestone_status"]
          suggested_by: string | null
          suggestion_approved: boolean | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          description_ar?: string | null
          description_en?: string | null
          due_date?: string | null
          id?: string
          is_suggestion?: boolean
          payment_amount?: number | null
          progress?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["milestone_status"]
          suggested_by?: string | null
          suggestion_approved?: boolean | null
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          description_ar?: string | null
          description_en?: string | null
          due_date?: string | null
          id?: string
          is_suggestion?: boolean
          payment_amount?: number | null
          progress?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["milestone_status"]
          suggested_by?: string | null
          suggestion_approved?: boolean | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_milestones_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_milestones_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_proofs: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          deal_id: string
          description: string
          file_urls: Json
          id: string
          milestone_id: string | null
          percentage_claim: number
          proof_type: Database["public"]["Enums"]["proof_type"]
          rejection_count: number
          rejection_reason: string | null
          rejection_text: string | null
          status: Database["public"]["Enums"]["proof_status"]
          submitter_id: string
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          deal_id: string
          description: string
          file_urls?: Json
          id?: string
          milestone_id?: string | null
          percentage_claim?: number
          proof_type: Database["public"]["Enums"]["proof_type"]
          rejection_count?: number
          rejection_reason?: string | null
          rejection_text?: string | null
          status?: Database["public"]["Enums"]["proof_status"]
          submitter_id: string
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          deal_id?: string
          description?: string
          file_urls?: Json
          id?: string
          milestone_id?: string | null
          percentage_claim?: number
          proof_type?: Database["public"]["Enums"]["proof_type"]
          rejection_count?: number
          rejection_reason?: string | null
          rejection_text?: string | null
          status?: Database["public"]["Enums"]["proof_status"]
          submitter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_proofs_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_proofs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_proofs_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "deal_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_proofs_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_skip_requests: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          reason: string | null
          requester_id: string
          responded_at: string | null
          responded_by: string | null
          status: Database["public"]["Enums"]["deal_skip_status"]
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          reason?: string | null
          requester_id: string
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["deal_skip_status"]
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          reason?: string | null
          requester_id?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: Database["public"]["Enums"]["deal_skip_status"]
        }
        Relationships: [
          {
            foreignKeyName: "deal_skip_requests_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_skip_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_skip_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          bid_id: string | null
          buyer_id: string
          buyer_progress: number
          commission_amount: number
          commission_rate: number
          commission_vat: number
          completed_at: string | null
          created_at: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          hire_request_id: string | null
          id: string
          project_id: string | null
          quotation_id: string | null
          rfq_response_id: string | null
          seller_id: string
          seller_progress: number
          started_at: string | null
          status: Database["public"]["Enums"]["deal_status"]
          title_slug: string
          trigger_source: Database["public"]["Enums"]["deal_trigger_source"]
          updated_at: string
          value: number
        }
        Insert: {
          bid_id?: string | null
          buyer_id: string
          buyer_progress?: number
          commission_amount?: number
          commission_rate?: number
          commission_vat?: number
          completed_at?: string | null
          created_at?: string
          deal_type: Database["public"]["Enums"]["deal_type"]
          hire_request_id?: string | null
          id?: string
          project_id?: string | null
          quotation_id?: string | null
          rfq_response_id?: string | null
          seller_id: string
          seller_progress?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          title_slug: string
          trigger_source: Database["public"]["Enums"]["deal_trigger_source"]
          updated_at?: string
          value?: number
        }
        Update: {
          bid_id?: string | null
          buyer_id?: string
          buyer_progress?: number
          commission_amount?: number
          commission_rate?: number
          commission_vat?: number
          completed_at?: string | null
          created_at?: string
          deal_type?: Database["public"]["Enums"]["deal_type"]
          hire_request_id?: string | null
          id?: string
          project_id?: string | null
          quotation_id?: string | null
          rfq_response_id?: string | null
          seller_id?: string
          seller_progress?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          title_slug?: string
          trigger_source?: Database["public"]["Enums"]["deal_trigger_source"]
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: true
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_hire_request_id_fkey"
            columns: ["hire_request_id"]
            isOneToOne: false
            referencedRelation: "hire_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_rfq_response_id_fkey"
            columns: ["rfq_response_id"]
            isOneToOne: false
            referencedRelation: "rfq_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hire_requests: {
        Row: {
          budget: number | null
          created_at: string
          description_ar: string
          description_en: string
          id: string
          project_id: string
          quantity: number | null
          requester_id: string
          status: Database["public"]["Enums"]["hire_request_status"]
          supplier_id: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          description_ar: string
          description_en: string
          id?: string
          project_id: string
          quantity?: number | null
          requester_id: string
          status?: Database["public"]["Enums"]["hire_request_status"]
          supplier_id: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          description_ar?: string
          description_en?: string
          id?: string
          project_id?: string
          quantity?: number | null
          requester_id?: string
          status?: Database["public"]["Enums"]["hire_request_status"]
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hire_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          product_id: string
          quantity: number | null
          requirements_ar: string | null
          requirements_en: string | null
          sender_id: string
          status: Database["public"]["Enums"]["inquiry_status"]
          timeline: string | null
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          product_id: string
          quantity?: number | null
          requirements_ar?: string | null
          requirements_en?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number | null
          requirements_ar?: string | null
          requirements_en?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          timeline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          id: string
          issued_at: string
          pdf_url: string | null
          reference_id: string
          subtotal: number
          total: number
          type: Database["public"]["Enums"]["invoice_type"]
          user_id: string
          vat: number
        }
        Insert: {
          created_at?: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          reference_id: string
          subtotal: number
          total: number
          type: Database["public"]["Enums"]["invoice_type"]
          user_id: string
          vat: number
        }
        Update: {
          created_at?: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          reference_id?: string
          subtotal?: number
          total?: number
          type?: Database["public"]["Enums"]["invoice_type"]
          user_id?: string
          vat?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_cards: {
        Row: {
          assignee_id: string | null
          column_id: string
          created_at: string
          deal_id: string
          description: string | null
          due_date: string | null
          file_urls: Json | null
          id: string
          priority: Database["public"]["Enums"]["kanban_priority"]
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          column_id: string
          created_at?: string
          deal_id: string
          description?: string | null
          due_date?: string | null
          file_urls?: Json | null
          id?: string
          priority?: Database["public"]["Enums"]["kanban_priority"]
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          column_id?: string
          created_at?: string
          deal_id?: string
          description?: string | null
          due_date?: string | null
          file_urls?: Json | null
          id?: string
          priority?: Database["public"]["Enums"]["kanban_priority"]
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_cards_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "kanban_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_cards_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_columns: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_columns_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email_enabled: boolean
          id: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          email_enabled?: boolean
          id?: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          email_enabled?: boolean
          id?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body_ar: string | null
          body_en: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          link: string | null
          title_ar: string
          title_en: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          title_ar: string
          title_en: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          title_ar?: string
          title_en?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_primary: boolean
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_primary?: boolean
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_primary?: boolean
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_spec_sheets: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_url: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_url: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_spec_sheets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string
          price: number
          product_id: string
          sku: string | null
          sort_order: number
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          price: number
          product_id: string
          sku?: string | null
          sort_order?: number
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          price?: number
          product_id?: string
          sku?: string | null
          sort_order?: number
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          created_at: string
          description_ar: string
          description_en: string
          id: string
          in_stock: boolean
          last_synced_at: string | null
          name_ar: string
          name_en: string
          price: number | null
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          rejection_reason_ar: string | null
          rejection_reason_en: string | null
          status: Database["public"]["Enums"]["post_status"]
          stock_quantity: number | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          description_ar: string
          description_en: string
          id?: string
          in_stock?: boolean
          last_synced_at?: string | null
          name_ar: string
          name_en: string
          price?: number | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          rejection_reason_ar?: string | null
          rejection_reason_en?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          stock_quantity?: number | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          description_ar?: string
          description_en?: string
          id?: string
          in_stock?: boolean
          last_synced_at?: string | null
          name_ar?: string
          name_en?: string
          price?: number | null
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          rejection_reason_ar?: string | null
          rejection_reason_en?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          stock_quantity?: number | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_ar: string | null
          address_en: string | null
          avatar_url: string | null
          average_rating: number
          city_id: string | null
          company_name_ar: string | null
          company_name_en: string | null
          company_profile_url: string | null
          cr_number: string | null
          created_at: string
          full_name: string
          id: string
          is_admin: boolean
          logo_url: string | null
          notification_preferences: Json
          onboarding_progress: Json
          pdpl_consent_at: string | null
          phone: string
          profile_type: Database["public"]["Enums"]["profile_type"]
          role: Database["public"]["Enums"]["user_role"]
          total_deals: number
          total_reviews: number
          updated_at: string
          vat_number: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string | null
        }
        Insert: {
          address_ar?: string | null
          address_en?: string | null
          avatar_url?: string | null
          average_rating?: number
          city_id?: string | null
          company_name_ar?: string | null
          company_name_en?: string | null
          company_profile_url?: string | null
          cr_number?: string | null
          created_at?: string
          full_name: string
          id: string
          is_admin?: boolean
          logo_url?: string | null
          notification_preferences?: Json
          onboarding_progress?: Json
          pdpl_consent_at?: string | null
          phone: string
          profile_type?: Database["public"]["Enums"]["profile_type"]
          role: Database["public"]["Enums"]["user_role"]
          total_deals?: number
          total_reviews?: number
          updated_at?: string
          vat_number?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Update: {
          address_ar?: string | null
          address_en?: string | null
          avatar_url?: string | null
          average_rating?: number
          city_id?: string | null
          company_name_ar?: string | null
          company_name_en?: string | null
          company_profile_url?: string | null
          cr_number?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_admin?: boolean
          logo_url?: string | null
          notification_preferences?: Json
          onboarding_progress?: Json
          pdpl_consent_at?: string | null
          phone?: string
          profile_type?: Database["public"]["Enums"]["profile_type"]
          role?: Database["public"]["Enums"]["user_role"]
          total_deals?: number
          total_reviews?: number
          updated_at?: string
          vat_number?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "saudi_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          category: string
          created_at: string
          file_name: string
          file_size: number
          file_url: string
          id: string
          mime_type: string
          project_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          file_name: string
          file_size: number
          file_url: string
          id?: string
          mime_type: string
          project_id: string
        }
        Update: {
          category?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          mime_type?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bid_count: number
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          city_id: string | null
          classification:
            | Database["public"]["Enums"]["project_classification"]
            | null
          created_at: string
          description_ar: string
          description_en: string
          id: string
          last_synced_at: string | null
          owner_id: string
          rejection_reason_ar: string | null
          rejection_reason_en: string | null
          source: Database["public"]["Enums"]["project_source"]
          status: Database["public"]["Enums"]["post_status"]
          timeline_end: string | null
          timeline_start: string | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bid_count?: number
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          city_id?: string | null
          classification?:
            | Database["public"]["Enums"]["project_classification"]
            | null
          created_at?: string
          description_ar: string
          description_en: string
          id?: string
          last_synced_at?: string | null
          owner_id: string
          rejection_reason_ar?: string | null
          rejection_reason_en?: string | null
          source?: Database["public"]["Enums"]["project_source"]
          status?: Database["public"]["Enums"]["post_status"]
          timeline_end?: string | null
          timeline_start?: string | null
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bid_count?: number
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          city_id?: string | null
          classification?:
            | Database["public"]["Enums"]["project_classification"]
            | null
          created_at?: string
          description_ar?: string
          description_en?: string
          id?: string
          last_synced_at?: string | null
          owner_id?: string
          rejection_reason_ar?: string | null
          rejection_reason_en?: string | null
          source?: Database["public"]["Enums"]["project_source"]
          status?: Database["public"]["Enums"]["post_status"]
          timeline_end?: string | null
          timeline_start?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "saudi_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_reply_templates: {
        Row: {
          content_ar: string
          content_en: string
          created_at: string
          id: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content_ar: string
          content_en: string
          created_at?: string
          id?: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content_ar?: string
          content_en?: string
          created_at?: string
          id?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_reply_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_clauses: {
        Row: {
          category: string
          content_ar: string
          content_en: string
          created_at: string
          id: string
          title_ar: string
          title_en: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content_ar: string
          content_en: string
          created_at?: string
          id?: string
          title_ar: string
          title_en: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content_ar?: string
          content_en?: string
          created_at?: string
          id?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_clauses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_sequences: {
        Row: {
          current_seq: number
          current_year: number
          user_id: string
        }
        Insert: {
          current_seq?: number
          current_year?: number
          user_id: string
        }
        Update: {
          current_seq?: number
          current_year?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_sequences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          accepted_at: string | null
          client_name: string | null
          created_at: string
          delivery_terms_ar: string | null
          delivery_terms_en: string | null
          hire_request_id: string | null
          id: string
          inquiry_id: string | null
          line_items: Json
          mode: Database["public"]["Enums"]["quotation_mode"]
          notes_ar: string | null
          notes_en: string | null
          number: string
          payment_terms_ar: string | null
          payment_terms_en: string | null
          pdf_url: string | null
          project_ref: string | null
          recipient_id: string | null
          revision_count: number
          rfq_response_id: string | null
          sender_id: string
          status: Database["public"]["Enums"]["quotation_status"]
          subtotal: number
          total: number
          updated_at: string
          validity_days: number
          vat_amount: number
        }
        Insert: {
          accepted_at?: string | null
          client_name?: string | null
          created_at?: string
          delivery_terms_ar?: string | null
          delivery_terms_en?: string | null
          hire_request_id?: string | null
          id?: string
          inquiry_id?: string | null
          line_items?: Json
          mode: Database["public"]["Enums"]["quotation_mode"]
          notes_ar?: string | null
          notes_en?: string | null
          number: string
          payment_terms_ar?: string | null
          payment_terms_en?: string | null
          pdf_url?: string | null
          project_ref?: string | null
          recipient_id?: string | null
          revision_count?: number
          rfq_response_id?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          validity_days?: number
          vat_amount?: number
        }
        Update: {
          accepted_at?: string | null
          client_name?: string | null
          created_at?: string
          delivery_terms_ar?: string | null
          delivery_terms_en?: string | null
          hire_request_id?: string | null
          id?: string
          inquiry_id?: string | null
          line_items?: Json
          mode?: Database["public"]["Enums"]["quotation_mode"]
          notes_ar?: string | null
          notes_en?: string | null
          number?: string
          payment_terms_ar?: string | null
          payment_terms_en?: string | null
          pdf_url?: string | null
          project_ref?: string | null
          recipient_id?: string | null
          revision_count?: number
          rfq_response_id?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["quotation_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          validity_days?: number
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotations_hire_request_id_fkey"
            columns: ["hire_request_id"]
            isOneToOne: false
            referencedRelation: "hire_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_rfq_response_id_fkey"
            columns: ["rfq_response_id"]
            isOneToOne: false
            referencedRelation: "rfq_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment_ar: string | null
          comment_en: string | null
          communication_rating: number | null
          created_at: string
          deal_id: string
          id: string
          is_hidden: boolean
          overall_rating: number
          quality_rating: number | null
          reviewee_id: string
          reviewer_id: string
          timeliness_rating: number | null
          updated_at: string
          would_recommend: boolean
        }
        Insert: {
          comment_ar?: string | null
          comment_en?: string | null
          communication_rating?: number | null
          created_at?: string
          deal_id: string
          id?: string
          is_hidden?: boolean
          overall_rating: number
          quality_rating?: number | null
          reviewee_id: string
          reviewer_id: string
          timeliness_rating?: number | null
          updated_at?: string
          would_recommend?: boolean
        }
        Update: {
          comment_ar?: string | null
          comment_en?: string | null
          communication_rating?: number | null
          created_at?: string
          deal_id?: string
          id?: string
          is_hidden?: boolean
          overall_rating?: number
          quality_rating?: number | null
          reviewee_id?: string
          reviewer_id?: string
          timeliness_rating?: number | null
          updated_at?: string
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_responses: {
        Row: {
          created_at: string
          delivery_terms_ar: string | null
          delivery_terms_en: string | null
          id: string
          notes_ar: string | null
          notes_en: string | null
          pricing: Json
          quotation_id: string | null
          rfq_id: string
          status: Database["public"]["Enums"]["rfq_response_status"]
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_terms_ar?: string | null
          delivery_terms_en?: string | null
          id?: string
          notes_ar?: string | null
          notes_en?: string | null
          pricing?: Json
          quotation_id?: string | null
          rfq_id: string
          status?: Database["public"]["Enums"]["rfq_response_status"]
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_terms_ar?: string | null
          delivery_terms_en?: string | null
          id?: string
          notes_ar?: string | null
          notes_en?: string | null
          pricing?: Json
          quotation_id?: string | null
          rfq_id?: string
          status?: Database["public"]["Enums"]["rfq_response_status"]
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_rfq_responses_quotation"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_responses_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_responses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          city_id: string | null
          created_at: string
          deadline: string | null
          description_ar: string
          description_en: string
          id: string
          last_synced_at: string | null
          poster_id: string
          product_id: string | null
          project_id: string | null
          quantity: number | null
          rejection_reason_ar: string | null
          rejection_reason_en: string | null
          response_count: number
          status: Database["public"]["Enums"]["post_status"]
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          deadline?: string | null
          description_ar: string
          description_en: string
          id?: string
          last_synced_at?: string | null
          poster_id: string
          product_id?: string | null
          project_id?: string | null
          quantity?: number | null
          rejection_reason_ar?: string | null
          rejection_reason_en?: string | null
          response_count?: number
          status?: Database["public"]["Enums"]["post_status"]
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          city_id?: string | null
          created_at?: string
          deadline?: string | null
          description_ar?: string
          description_en?: string
          id?: string
          last_synced_at?: string | null
          poster_id?: string
          product_id?: string | null
          project_id?: string | null
          quantity?: number | null
          rejection_reason_ar?: string | null
          rejection_reason_en?: string | null
          response_count?: number
          status?: Database["public"]["Enums"]["post_status"]
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "saudi_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      saudi_cities: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string
          region_ar: string
          region_en: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          region_ar: string
          region_en: string
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          region_ar?: string
          region_en?: string
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          new_tier: Database["public"]["Enums"]["subscription_tier"]
          previous_tier: Database["public"]["Enums"]["subscription_tier"] | null
          subscription_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          new_tier: Database["public"]["Enums"]["subscription_tier"]
          previous_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          subscription_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          new_tier?: Database["public"]["Enums"]["subscription_tier"]
          previous_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          base_price: number
          coupon_discount: number
          coupon_id: string | null
          created_at: string
          duration_discount: number
          duration_months: number
          expires_at: string
          final_price: number
          id: string
          is_active: boolean
          moyasar_payment_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          starts_at: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          base_price?: number
          coupon_discount?: number
          coupon_id?: string | null
          created_at?: string
          duration_discount?: number
          duration_months?: number
          expires_at: string
          final_price?: number
          id?: string
          is_active?: boolean
          moyasar_payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          starts_at?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          base_price?: number
          coupon_discount?: number
          coupon_id?: string | null
          created_at?: string
          duration_discount?: number
          duration_months?: number
          expires_at?: string
          final_price?: number
          id?: string
          is_active?: boolean
          moyasar_payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          starts_at?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_documents: {
        Row: {
          admin_notes_ar: string | null
          admin_notes_en: string | null
          created_at: string
          doc_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size: number
          file_url: string
          id: string
          mime_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["document_review_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes_ar?: string | null
          admin_notes_en?: string | null
          created_at?: string
          doc_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size: number
          file_url: string
          id?: string
          mime_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_review_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes_ar?: string | null
          admin_notes_en?: string | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          mime_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_review_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      bid_status: "pending" | "shortlisted" | "awarded" | "rejected"
      client_source:
        | "bid_award"
        | "rfq_response"
        | "direct_hire"
        | "product_inquiry"
        | "manual_entry"
      commission_status:
        | "pending"
        | "approved"
        | "paid"
        | "disputed"
        | "overdue"
      contract_status: "draft" | "sent" | "signed" | "archived"
      coupon_discount_type: "percentage" | "fixed"
      crm_pipeline_stage:
        | "lead"
        | "in_negotiation"
        | "active_deal"
        | "completed"
        | "repeat"
      deal_cancel_status: "pending" | "approved" | "rejected"
      deal_skip_status: "pending" | "approved" | "rejected"
      deal_status:
        | "active"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "disputed"
      deal_trigger_source:
        | "bid_award"
        | "inquiry_quotation"
        | "rfq_response"
        | "direct_hire"
      deal_type: "deal_project" | "deal_product"
      document_review_status: "pending" | "approved" | "rejected"
      document_type: "vat_certificate" | "commercial_license"
      hire_request_status:
        | "pending"
        | "quotation_sent"
        | "accepted"
        | "rejected"
        | "cancelled"
      inquiry_status: "pending" | "responded" | "closed"
      invoice_type: "commission" | "subscription"
      kanban_priority: "low" | "medium" | "high" | "critical"
      milestone_status: "pending" | "in_progress" | "completed"
      notification_type:
        | "bid_received"
        | "bid_awarded"
        | "bid_shortlisted"
        | "bid_rejected"
        | "inquiry_received"
        | "quotation_received"
        | "quotation_accepted"
        | "deal_created"
        | "deal_status_changed"
        | "deal_completed"
        | "payment_confirmed"
        | "commission_due"
        | "commission_overdue"
        | "review_received"
        | "subscription_expiring"
        | "subscription_expired"
        | "document_approved"
        | "document_rejected"
        | "post_approved"
        | "post_rejected"
        | "rfq_published"
        | "rfq_response_received"
        | "rfq_response_accepted"
        | "rfq_response_rejected"
        | "supplier_hire_request_received"
        | "supplier_hire_quotation_received"
        | "deal_flagged_review"
      payment_method: "card" | "bank_transfer" | "check"
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "cancelled"
        | "expired"
      post_status:
        | "draft"
        | "pending"
        | "published"
        | "rejected"
        | "awarded"
        | "completed"
        | "expired"
        | "closed"
      pricing_model: "fixed" | "variant"
      profile_type: "company" | "personal"
      project_classification: "a" | "b" | "c"
      project_source: "owner" | "subcontract"
      proof_status: "pending" | "confirmed" | "rejected" | "disputed"
      proof_type: "payment" | "work" | "supply" | "handover"
      quotation_mode: "inquiry_response" | "standalone"
      quotation_status:
        | "draft"
        | "sent"
        | "viewed"
        | "accepted"
        | "rejected"
        | "expired"
      rfq_response_status: "pending" | "accepted" | "rejected"
      subscription_tier: "starter" | "pro" | "business" | "enterprise"
      template_type: "construction_agreement" | "supply_agreement" | "custom"
      user_role: "project_owner" | "contractor" | "supplier" | "buyer"
      verification_status:
        | "pending_email"
        | "pending_payment"
        | "pending_documents"
        | "pending_approval"
        | "active"
        | "restricted"
        | "banned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      bid_status: ["pending", "shortlisted", "awarded", "rejected"],
      client_source: [
        "bid_award",
        "rfq_response",
        "direct_hire",
        "product_inquiry",
        "manual_entry",
      ],
      commission_status: ["pending", "approved", "paid", "disputed", "overdue"],
      contract_status: ["draft", "sent", "signed", "archived"],
      coupon_discount_type: ["percentage", "fixed"],
      crm_pipeline_stage: [
        "lead",
        "in_negotiation",
        "active_deal",
        "completed",
        "repeat",
      ],
      deal_cancel_status: ["pending", "approved", "rejected"],
      deal_skip_status: ["pending", "approved", "rejected"],
      deal_status: [
        "active",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      deal_trigger_source: [
        "bid_award",
        "inquiry_quotation",
        "rfq_response",
        "direct_hire",
      ],
      deal_type: ["deal_project", "deal_product"],
      document_review_status: ["pending", "approved", "rejected"],
      document_type: ["vat_certificate", "commercial_license"],
      hire_request_status: [
        "pending",
        "quotation_sent",
        "accepted",
        "rejected",
        "cancelled",
      ],
      inquiry_status: ["pending", "responded", "closed"],
      invoice_type: ["commission", "subscription"],
      kanban_priority: ["low", "medium", "high", "critical"],
      milestone_status: ["pending", "in_progress", "completed"],
      notification_type: [
        "bid_received",
        "bid_awarded",
        "bid_shortlisted",
        "bid_rejected",
        "inquiry_received",
        "quotation_received",
        "quotation_accepted",
        "deal_created",
        "deal_status_changed",
        "deal_completed",
        "payment_confirmed",
        "commission_due",
        "commission_overdue",
        "review_received",
        "subscription_expiring",
        "subscription_expired",
        "document_approved",
        "document_rejected",
        "post_approved",
        "post_rejected",
        "rfq_published",
        "rfq_response_received",
        "rfq_response_accepted",
        "rfq_response_rejected",
        "supplier_hire_request_received",
        "supplier_hire_quotation_received",
        "deal_flagged_review",
      ],
      payment_method: ["card", "bank_transfer", "check"],
      payment_status: [
        "pending",
        "completed",
        "failed",
        "cancelled",
        "expired",
      ],
      post_status: [
        "draft",
        "pending",
        "published",
        "rejected",
        "awarded",
        "completed",
        "expired",
        "closed",
      ],
      pricing_model: ["fixed", "variant"],
      profile_type: ["company", "personal"],
      project_classification: ["a", "b", "c"],
      project_source: ["owner", "subcontract"],
      proof_status: ["pending", "confirmed", "rejected", "disputed"],
      proof_type: ["payment", "work", "supply", "handover"],
      quotation_mode: ["inquiry_response", "standalone"],
      quotation_status: [
        "draft",
        "sent",
        "viewed",
        "accepted",
        "rejected",
        "expired",
      ],
      rfq_response_status: ["pending", "accepted", "rejected"],
      subscription_tier: ["starter", "pro", "business", "enterprise"],
      template_type: ["construction_agreement", "supply_agreement", "custom"],
      user_role: ["project_owner", "contractor", "supplier", "buyer"],
      verification_status: [
        "pending_email",
        "pending_payment",
        "pending_documents",
        "pending_approval",
        "active",
        "restricted",
        "banned",
      ],
    },
  },
} as const

