export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clothing_items: {
        Row: {
          brand: string | null
          colors: string[] | null
          created_at: string | null
          garment_category: string
          id: string
          name: string
          perfect_corp_ref_id: string | null
          price: number | null
          style_category: string | null
          supabase_image_url: string | null
        }
        Insert: {
          brand?: string | null
          colors?: string[] | null
          created_at?: string | null
          garment_category: string
          id?: string
          name: string
          perfect_corp_ref_id?: string | null
          price?: number | null
          style_category?: string | null
          supabase_image_url?: string | null
        }
        Update: {
          brand?: string | null
          colors?: string[] | null
          created_at?: string | null
          garment_category?: string
          id?: string
          name?: string
          perfect_corp_ref_id?: string | null
          price?: number | null
          style_category?: string | null
          supabase_image_url?: string | null
        }
        Relationships: []
      }
      perfect_corp_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      user_photos: {
        Row: {
          created_at: string
          id: string
          image_metadata: Json | null
          original_image_url: string
          perfect_corp_file_id: string | null
          updated_at: string
          upload_status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_metadata?: Json | null
          original_image_url: string
          perfect_corp_file_id?: string | null
          updated_at?: string
          upload_status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_metadata?: Json | null
          original_image_url?: string
          perfect_corp_file_id?: string | null
          updated_at?: string
          upload_status?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_perfect_corp_tokens: {
        Args: Record<PropertyKey, never>
        Returns: {
          deleted_count: number
          cleanup_timestamp: string
        }[]
      }
      force_refresh_perfect_corp_token: {
        Args: Record<PropertyKey, never>
        Returns: {
          invalidated_tokens: number
          action_timestamp: string
        }[]
      }
      get_token_expiry_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_valid_token: boolean
          token_count: number
          next_expiry: string
          seconds_until_expiry: number
          expired_token_count: number
        }[]
      }
      get_valid_perfect_corp_token: {
        Args: Record<PropertyKey, never>
        Returns: {
          token_id: string
          access_token: string
          expires_at: string
          seconds_until_expiry: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
