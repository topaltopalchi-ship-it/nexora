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
      matches: {
        Row: {
          created_at: string
          human_review_required: boolean
          id: string
          need_id: string
          provider_id: string
          requester_id: string
          resource_id: string
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          human_review_required?: boolean
          id?: string
          need_id: string
          provider_id: string
          requester_id: string
          resource_id: string
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          human_review_required?: boolean
          id?: string
          need_id?: string
          provider_id?: string
          requester_id?: string
          resource_id?: string
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      needs: {
        Row: {
          category: Database["public"]["Enums"]["need_category"]
          city: string
          created_at: string
          description: string
          id: string
          people_count: number
          preferred_language: string
          requester_id: string
          status: Database["public"]["Enums"]["need_status"]
          title: string
          updated_at: string
          urgency: number
        }
        Insert: {
          category: Database["public"]["Enums"]["need_category"]
          city?: string
          created_at?: string
          description: string
          id?: string
          people_count?: number
          preferred_language?: string
          requester_id: string
          status?: Database["public"]["Enums"]["need_status"]
          title: string
          updated_at?: string
          urgency?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["need_category"]
          city?: string
          created_at?: string
          description?: string
          id?: string
          people_count?: number
          preferred_language?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["need_status"]
          title?: string
          updated_at?: string
          urgency?: number
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          member_role: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          member_role: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          member_role?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          city: string
          created_at: string
          created_by: string
          id: string
          name: string
          organization_type: string
          verification_status: string
        }
        Insert: {
          city?: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          organization_type: string
          verification_status?: string
        }
        Update: {
          city?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          organization_type?: string
          verification_status?: string
        }
        Relationships: []
      }
      outcome_events: {
        Row: {
          actor_id: string
          created_at: string
          event_type: string
          id: string
          match_id: string
          note: string | null
        }
        Insert: {
          actor_id: string
          created_at?: string
          event_type: string
          id?: string
          match_id: string
          note?: string | null
        }
        Update: {
          actor_id?: string
          created_at?: string
          event_type?: string
          id?: string
          match_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outcome_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_reviewers: {
        Row: {
          active: boolean
          granted_at: string
          granted_by: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          granted_at?: string
          granted_by?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          granted_at?: string
          granted_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          created_at: string
          display_name: string | null
          id: string
          preferred_language: string
          updated_at: string
        }
        Insert: {
          account_type?: string
          created_at?: string
          display_name?: string | null
          id: string
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          account_type?: string
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      resource_reviews: {
        Row: {
          decision: string
          id: string
          note: string | null
          resource_id: string
          reviewed_at: string
          reviewer_id: string
        }
        Insert: {
          decision: string
          id?: string
          note?: string | null
          resource_id: string
          reviewed_at?: string
          reviewer_id: string
        }
        Update: {
          decision?: string
          id?: string
          note?: string | null
          resource_id?: string
          reviewed_at?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_reviews_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          available_until: string | null
          category: Database["public"]["Enums"]["need_category"]
          city: string
          created_at: string
          id: string
          organization_id: string | null
          provider_id: string
          public_summary: string
          quantity: number
          status: Database["public"]["Enums"]["resource_status"]
          title: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          available_until?: string | null
          category: Database["public"]["Enums"]["need_category"]
          city?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          provider_id: string
          public_summary: string
          quantity?: number
          status?: Database["public"]["Enums"]["resource_status"]
          title: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          available_until?: string | null
          category?: Database["public"]["Enums"]["need_category"]
          city?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          provider_id?: string
          public_summary?: string
          quantity?: number
          status?: Database["public"]["Enums"]["resource_status"]
          title?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_platform_reviewer: { Args: never; Returns: boolean }
      review_resource: {
        Args: { p_decision: string; p_note?: string; p_resource_id: string }
        Returns: Database["public"]["Enums"]["resource_status"]
      }
      suggest_resources_for_need: {
        Args: { p_need_id: string }
        Returns: {
          city: string
          public_summary: string
          quantity: number
          resource_id: string
          title: string
        }[]
      }
    }
    Enums: {
      match_status:
        | "proposed"
        | "accepted"
        | "rejected"
        | "cancelled"
        | "completed"
      need_category: "food" | "healthcare" | "housing" | "transport" | "other"
      need_status:
        | "open"
        | "reviewing"
        | "matched"
        | "in_progress"
        | "resolved"
        | "closed"
      resource_status:
        | "draft"
        | "pending_review"
        | "verified"
        | "reserved"
        | "fulfilled"
        | "expired"
        | "suspended"
        | "rejected"
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
      match_status: [
        "proposed",
        "accepted",
        "rejected",
        "cancelled",
        "completed",
      ],
      need_category: ["food", "healthcare", "housing", "transport", "other"],
      need_status: [
        "open",
        "reviewing",
        "matched",
        "in_progress",
        "resolved",
        "closed",
      ],
      resource_status: [
        "draft",
        "pending_review",
        "verified",
        "reserved",
        "fulfilled",
        "expired",
        "suspended",
        "rejected",
      ],
    },
  },
} as const
