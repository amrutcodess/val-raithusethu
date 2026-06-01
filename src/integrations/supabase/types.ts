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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          acres: number | null
          crop_id: string | null
          id: string
          language: string
          problem_id: string | null
          product_id: string | null
          timestamp: string | null
        }
        Insert: {
          acres?: number | null
          crop_id?: string | null
          id?: string
          language: string
          problem_id?: string | null
          product_id?: string | null
          timestamp?: string | null
        }
        Update: {
          acres?: number | null
          crop_id?: string | null
          id?: string
          language?: string
          problem_id?: string | null
          product_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_problems: {
        Row: {
          created_at: string | null
          crop_id: string
          id: string
          problem_id: string
        }
        Insert: {
          created_at?: string | null
          crop_id: string
          id?: string
          problem_id: string
        }
        Update: {
          created_at?: string | null
          crop_id?: string
          id?: string
          problem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_problems_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_problems_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          name_en: string
          name_hi: string
          name_te: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name_en: string
          name_hi: string
          name_te: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name_en?: string
          name_hi?: string
          name_te?: string
        }
        Relationships: []
      }
      problems: {
        Row: {
          created_at: string | null
          crop_id: string
          description: string | null
          id: string
          image_url: string | null
          problem_type: string | null
          title_en: string
          title_hi: string
          title_te: string
        }
        Insert: {
          created_at?: string | null
          crop_id: string
          description?: string | null
          id?: string
          image_url?: string | null
          problem_type?: string | null
          title_en: string
          title_hi: string
          title_te: string
        }
        Update: {
          created_at?: string | null
          crop_id?: string
          description?: string | null
          id?: string
          image_url?: string | null
          problem_type?: string | null
          title_en?: string
          title_hi?: string
          title_te?: string
        }
        Relationships: [
          {
            foreignKeyName: "problems_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      product_problems: {
        Row: {
          created_at: string | null
          dosage_for_problem: string | null
          id: string
          problem_id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          dosage_for_problem?: string | null
          id?: string
          problem_id: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          dosage_for_problem?: string | null
          id?: string
          problem_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_problems_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_problems_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          crop_id: string | null
          description: string | null
          dosage_max: number
          dosage_min: number
          dosage_recommendation: string
          dosage_unit: string
          features: string[] | null
          id: string
          image_url: string | null
          mode_of_action: string | null
          name: string
          pack_sizes: string[]
          problem_id: string
          product_type: string | null
          safety_notes: string | null
          scientific_formula: string | null
          spray_interval: string | null
        }
        Insert: {
          created_at?: string | null
          crop_id?: string | null
          description?: string | null
          dosage_max: number
          dosage_min: number
          dosage_recommendation: string
          dosage_unit?: string
          features?: string[] | null
          id?: string
          image_url?: string | null
          mode_of_action?: string | null
          name: string
          pack_sizes: string[]
          problem_id: string
          product_type?: string | null
          safety_notes?: string | null
          scientific_formula?: string | null
          spray_interval?: string | null
        }
        Update: {
          created_at?: string | null
          crop_id?: string | null
          description?: string | null
          dosage_max?: number
          dosage_min?: number
          dosage_recommendation?: string
          dosage_unit?: string
          features?: string[] | null
          id?: string
          image_url?: string | null
          mode_of_action?: string | null
          name?: string
          pack_sizes?: string[]
          problem_id?: string
          product_type?: string | null
          safety_notes?: string | null
          scientific_formula?: string | null
          spray_interval?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          created_at: string | null
          id: string
          manager_id: string
          payload_json: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          manager_id: string
          payload_json: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          manager_id?: string
          payload_json?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          password_hash: string
          role: Database["public"]["Enums"]["app_role"]
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          password_hash: string
          role?: Database["public"]["Enums"]["app_role"]
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          password_hash?: string
          role?: Database["public"]["Enums"]["app_role"]
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "manager" | "guest"
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
      app_role: ["admin", "manager", "guest"],
    },
  },
} as const
