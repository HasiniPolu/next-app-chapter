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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          relation: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          relation?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          relation?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hazard_votes: {
        Row: {
          created_at: string
          hazard_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hazard_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hazard_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hazard_votes_hazard_id_fkey"
            columns: ["hazard_id"]
            isOneToOne: false
            referencedRelation: "hazards"
            referencedColumns: ["id"]
          },
        ]
      }
      hazards: {
        Row: {
          category: Database["public"]["Enums"]["hazard_category"]
          city: string | null
          created_at: string
          description: string | null
          id: string
          lat: number
          lng: number
          location_label: string | null
          photo_url: string | null
          reporter_id: string | null
          severity: number
          status: Database["public"]["Enums"]["hazard_status"]
          updated_at: string
          upvotes: number
        }
        Insert: {
          category: Database["public"]["Enums"]["hazard_category"]
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lat: number
          lng: number
          location_label?: string | null
          photo_url?: string | null
          reporter_id?: string | null
          severity?: number
          status?: Database["public"]["Enums"]["hazard_status"]
          updated_at?: string
          upvotes?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["hazard_category"]
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lat?: number
          lng?: number
          location_label?: string | null
          photo_url?: string | null
          reporter_id?: string | null
          severity?: number
          status?: Database["public"]["Enums"]["hazard_status"]
          updated_at?: string
          upvotes?: number
        }
        Relationships: []
      }
      hotspots: {
        Row: {
          city: string
          created_at: string
          id: string
          incident_count: number
          kind: string
          lat: number
          lng: number
          name: string
          notes: string | null
          severity: number
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          incident_count?: number
          kind?: string
          lat: number
          lng: number
          name: string
          notes?: string | null
          severity?: number
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          incident_count?: number
          kind?: string
          lat?: number
          lng?: number
          name?: string
          notes?: string | null
          severity?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          currency: string
          display_name: string | null
          id: string
          plan: string
          safety_score: number
          stripe_customer_id: string | null
          theme: string
          updated_at: string
          vehicle: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          id: string
          plan?: string
          safety_score?: number
          stripe_customer_id?: string | null
          theme?: string
          updated_at?: string
          vehicle?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          currency?: string
          display_name?: string | null
          id?: string
          plan?: string
          safety_score?: number
          stripe_customer_id?: string | null
          theme?: string
          updated_at?: string
          vehicle?: string | null
        }
        Relationships: []
      }
      rides: {
        Row: {
          avg_speed: number
          distance_km: number
          ended_at: string | null
          harsh_brakes: number
          id: string
          max_speed: number
          risk_events: number
          score: number
          started_at: string
          user_id: string
        }
        Insert: {
          avg_speed?: number
          distance_km?: number
          ended_at?: string | null
          harsh_brakes?: number
          id?: string
          max_speed?: number
          risk_events?: number
          score?: number
          started_at?: string
          user_id: string
        }
        Update: {
          avg_speed?: number
          distance_km?: number
          ended_at?: string | null
          harsh_brakes?: number
          id?: string
          max_speed?: number
          risk_events?: number
          score?: number
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sos_events: {
        Row: {
          id: string
          lat: number
          lng: number
          location_label: string | null
          notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["sos_status"]
          triggered_at: string
          user_id: string
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          location_label?: string | null
          notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          triggered_at?: string
          user_id: string
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          location_label?: string | null
          notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          triggered_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
    }
    Enums: {
      app_role: "rider" | "admin"
      hazard_category:
        | "pothole"
        | "waterlog"
        | "broken_road"
        | "poor_lighting"
        | "accident_zone"
        | "construction"
        | "blind_turn"
      hazard_status: "active" | "resolved" | "spam"
      sos_status: "triggered" | "acknowledged" | "resolved" | "cancelled"
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
      app_role: ["rider", "admin"],
      hazard_category: [
        "pothole",
        "waterlog",
        "broken_road",
        "poor_lighting",
        "accident_zone",
        "construction",
        "blind_turn",
      ],
      hazard_status: ["active", "resolved", "spam"],
      sos_status: ["triggered", "acknowledged", "resolved", "cancelled"],
    },
  },
} as const
