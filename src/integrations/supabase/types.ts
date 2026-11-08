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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string
          created_at: string
          id: string
          level: string
          module: string
          target: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          id?: string
          level?: string
          module?: string
          target?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          id?: string
          level?: string
          module?: string
          target?: string
        }
        Relationships: []
      }
      add_ons: {
        Row: {
          created_at: string
          group_name: string
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_name?: string
          id?: string
          is_active?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_name?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string
          created_at: string
          hours: string
          id: string
          is_active: boolean
          name: string
          phone: string
          sort_order: number
        }
        Insert: {
          address?: string
          created_at?: string
          hours?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string
          sort_order?: number
        }
        Update: {
          address?: string
          created_at?: string
          hours?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          sort_order?: number
        }
        Relationships: []
      }
      brand_settings: {
        Row: {
          id: number
          settings: Json
          updated_at: string
        }
        Insert: {
          id?: number
          settings?: Json
          updated_at?: string
        }
        Update: {
          id?: number
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          image_url: string | null
          is_visible: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          image_url?: string | null
          is_visible?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          image_url?: string | null
          is_visible?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      customer_notes: {
        Row: {
          customer_id: string
          note: string
          updated_at: string
        }
        Insert: {
          customer_id: string
          note?: string
          updated_at?: string
        }
        Update: {
          customer_id?: string
          note?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          created_at: string
          group: string
          id: string
          lowStockThreshold: number
          name: string
          quantity: number
          unit: string
          updatedAt: string
        }
        Insert: {
          created_at?: string
          group?: string
          id?: string
          lowStockThreshold?: number
          name: string
          quantity?: number
          unit?: string
          updatedAt?: string
        }
        Update: {
          created_at?: string
          group?: string
          id?: string
          lowStockThreshold?: number
          name?: string
          quantity?: number
          unit?: string
          updatedAt?: string
        }
        Relationships: []
      }
      maintenance_settings: {
        Row: {
          enabled: boolean
          eta: string
          id: number
          message: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          eta?: string
          id?: number
          message?: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          eta?: string
          id?: number
          message?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          customer_id: string
          id: string
          title: string
          type: string
          unread: boolean
        }
        Insert: {
          body?: string
          created_at?: string
          customer_id: string
          id?: string
          title: string
          type?: string
          unread?: boolean
        }
        Update: {
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
          title?: string
          type?: string
          unread?: boolean
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          cta: string
          id: string
          image_url: string | null
          is_active: boolean
          link_target: string
          link_type: string
          sort_order: number
          subtitle: string
          tag: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_target?: string
          link_type?: string
          sort_order?: number
          subtitle?: string
          tag?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_target?: string
          link_type?: string
          sort_order?: number
          subtitle?: string
          tag?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          addons: Json
          created_at: string
          id: string
          name: string
          order_id: string
          price: number
          product_id: string | null
          qty: number
        }
        Insert: {
          addons?: Json
          created_at?: string
          id?: string
          name: string
          order_id: string
          price: number
          product_id?: string | null
          qty: number
        }
        Update: {
          addons?: Json
          created_at?: string
          id?: string
          name?: string
          order_id?: string
          price?: number
          product_id?: string | null
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          delivery_fee: number
          discount: number
          id: string
          idempotency_key: string | null
          notes: string | null
          order_number: string
          payment: string
          payment_status: string
          phone: string | null
          placed_at: string
          promo_code: string | null
          source: string
          status: string
          subtotal: number
          tax: number
          total: number
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          delivery_fee?: number
          discount?: number
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number: string
          payment?: string
          payment_status?: string
          phone?: string | null
          placed_at?: string
          promo_code?: string | null
          source?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          delivery_fee?: number
          discount?: number
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_number?: string
          payment?: string
          payment_status?: string
          phone?: string | null
          placed_at?: string
          promo_code?: string | null
          source?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          cardEnabled: boolean
          codEnabled: boolean
          easypaisaEnabled: boolean
          easypaisaNumber: string
          id: number
          jazzcashEnabled: boolean
          jazzcashNumber: string
          updated_at: string
        }
        Insert: {
          cardEnabled?: boolean
          codEnabled?: boolean
          easypaisaEnabled?: boolean
          easypaisaNumber?: string
          id?: number
          jazzcashEnabled?: boolean
          jazzcashNumber?: string
          updated_at?: string
        }
        Update: {
          cardEnabled?: boolean
          codEnabled?: boolean
          easypaisaEnabled?: boolean
          easypaisaNumber?: string
          id?: number
          jazzcashEnabled?: boolean
          jazzcashNumber?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          badges: string[]
          category_id: string | null
          created_at: string
          description: string
          gallery: string[]
          id: string
          image_url: string | null
          ingredients: string[]
          is_available: boolean
          name: string
          nutrition: Json
          old_price: number | null
          popular: boolean
          price: number
          rating: number
          recommended: boolean
          review_count: number
          short_description: string
          slug: string
          updated_at: string
        }
        Insert: {
          badges?: string[]
          category_id?: string | null
          created_at?: string
          description?: string
          gallery?: string[]
          id?: string
          image_url?: string | null
          ingredients?: string[]
          is_available?: boolean
          name: string
          nutrition?: Json
          old_price?: number | null
          popular?: boolean
          price: number
          rating?: number
          recommended?: boolean
          review_count?: number
          short_description?: string
          slug: string
          updated_at?: string
        }
        Update: {
          badges?: string[]
          category_id?: string | null
          created_at?: string
          description?: string
          gallery?: string[]
          id?: string
          image_url?: string | null
          ingredients?: string[]
          is_available?: boolean
          name?: string
          nutrition?: Json
          old_price?: number | null
          popular?: boolean
          price?: number
          rating?: number
          recommended?: boolean
          review_count?: number
          short_description?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_blocked: boolean
          name: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_blocked?: boolean
          name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_blocked?: boolean
          name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          usage_count: number
          usage_limit: number | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          created_by_name: string
          format: string
          id: string
          range: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by_name?: string
          format: string
          id: string
          range: string
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          created_by_name?: string
          format?: string
          id?: string
          range?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author: string
          body: string
          created_at: string
          featured: boolean
          id: string
          product_name: string
          rating: number
          status: string
        }
        Insert: {
          author: string
          body: string
          created_at?: string
          featured?: boolean
          id?: string
          product_name?: string
          rating: number
          status?: string
        }
        Update: {
          author?: string
          body?: string
          created_at?: string
          featured?: boolean
          id?: string
          product_name?: string
          rating?: number
          status?: string
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          label: string
          line: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          label: string
          line: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string
          line?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          acceptingOrders: boolean
          address: string
          deliveryFee: number | null
          deliveryRadiusKm: number | null
          email: string
          hours: string
          id: number
          minOrder: number | null
          phone: string
          storeName: string
          taxRate: number | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          acceptingOrders?: boolean
          address?: string
          deliveryFee?: number | null
          deliveryRadiusKm?: number | null
          email?: string
          hours?: string
          id?: number
          minOrder?: number | null
          phone?: string
          storeName?: string
          taxRate?: number | null
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          acceptingOrders?: boolean
          address?: string
          deliveryFee?: number | null
          deliveryRadiusKm?: number | null
          email?: string
          hours?: string
          id?: number
          minOrder?: number | null
          phone?: string
          storeName?: string
          taxRate?: number | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      log_activity: {
        Args: {
          p_action: string
          p_level?: string
          p_module?: string
          p_target?: string
        }
        Returns: undefined
      }
      place_order: {
        Args: {
          p_address: string
          p_customer_name: string
          p_idempotency_key?: string
          p_items?: Json
          p_manual_discount_percent?: number
          p_notes?: string
          p_payment: string
          p_phone: string
          p_promo_code?: string
          p_source: string
          p_transaction_id?: string
        }
        Returns: {
          delivery_fee: number
          discount: number
          order_number: string
          subtotal: number
          tax: number
          total: number
        }[]
      }
      send_customer_message: {
        Args: { p_body: string; p_customer_id: string }
        Returns: undefined
      }
      track_order: {
        Args: { p_order_number: string; p_phone?: string }
        Returns: Json
      }
      validate_promo: {
        Args: { p_code: string }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
        }[]
      }
    }
    Enums: {
      app_role: "customer" | "manager" | "admin" | "developer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["customer", "manager", "admin", "developer"],
    },
  },
} as const
