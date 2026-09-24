export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      administrators: {
        Row: {
          user_id: string;
        };
        Insert: {
          user_id: string;
        };
        Update: {
          user_id?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
        };
        Relationships: [];
      };
      email_outbox: {
        Row: {
          attempts: number;
          body: string;
          dedupe_key: string;
          id: string;
          last_error: string | null;
          locked_until: string | null;
          next_attempt_at: string;
          recipient: string;
          sent_at: string | null;
          subject: string;
        };
        Insert: {
          attempts?: number;
          body: string;
          dedupe_key: string;
          id?: string;
          last_error?: string | null;
          locked_until?: string | null;
          next_attempt_at?: string;
          recipient: string;
          sent_at?: string | null;
          subject: string;
        };
        Update: {
          attempts?: number;
          body?: string;
          dedupe_key?: string;
          id?: string;
          last_error?: string | null;
          locked_until?: string | null;
          next_attempt_at?: string;
          recipient?: string;
          sent_at?: string | null;
          subject?: string;
        };
        Relationships: [];
      };
      images: {
        Row: {
          alt: string;
          id: string;
          position: number;
          product_id: string;
          url: string;
        };
        Insert: {
          alt: string;
          id?: string;
          position?: number;
          product_id: string;
          url: string;
        };
        Update: {
          alt?: string;
          id?: string;
          position?: number;
          product_id?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter: {
        Row: {
          confirmed_at: string | null;
          consent_at: string;
          consent_text: string;
          email: string;
          id: string;
          status: string;
          token_hash: string;
        };
        Insert: {
          confirmed_at?: string | null;
          consent_at?: string;
          consent_text: string;
          email: string;
          id?: string;
          status?: string;
          token_hash: string;
        };
        Update: {
          confirmed_at?: string | null;
          consent_at?: string;
          consent_text?: string;
          email?: string;
          id?: string;
          status?: string;
          token_hash?: string;
        };
        Relationships: [];
      };
      order_lines: {
        Row: {
          id: string;
          name: string;
          order_id: string;
          preorder: boolean;
          quantity: number;
          size: string;
          unit_price: number;
          variant_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          order_id: string;
          preorder?: boolean;
          quantity: number;
          size: string;
          unit_price: number;
          variant_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          order_id?: string;
          preorder?: boolean;
          quantity?: number;
          size?: string;
          unit_price?: number;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_lines_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_lines_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "variants";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          checkout_payload: Json | null;
          country: string;
          created_at: string;
          currency: string;
          email: string | null;
          expires_at: string;
          id: string;
          mode: string;
          paid_at: string | null;
          payment_intent: string | null;
          session_id: string | null;
          shipping: number;
          shipping_address: Json | null;
          status: string;
          token_hash: string;
          total: number;
        };
        Insert: {
          checkout_payload?: Json | null;
          country: string;
          created_at?: string;
          currency?: string;
          email?: string | null;
          expires_at: string;
          id?: string;
          mode: string;
          paid_at?: string | null;
          payment_intent?: string | null;
          session_id?: string | null;
          shipping: number;
          shipping_address?: Json | null;
          status?: string;
          token_hash: string;
          total?: number;
        };
        Update: {
          checkout_payload?: Json | null;
          country?: string;
          created_at?: string;
          currency?: string;
          email?: string | null;
          expires_at?: string;
          id?: string;
          mode?: string;
          paid_at?: string | null;
          payment_intent?: string | null;
          session_id?: string | null;
          shipping?: number;
          shipping_address?: Json | null;
          status?: string;
          token_hash?: string;
          total?: number;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          currency: string;
          id: string;
          order_id: string;
          refunded: number;
          status: string;
        };
        Insert: {
          amount: number;
          currency: string;
          id: string;
          order_id: string;
          refunded?: number;
          status: string;
        };
        Update: {
          amount?: number;
          currency?: string;
          id?: string;
          order_id?: string;
          refunded?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean;
          composition: string;
          created_at: string;
          description: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          active?: boolean;
          composition?: string;
          created_at?: string;
          description?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          active?: boolean;
          composition?: string;
          created_at?: string;
          description?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          hits: number;
          key: string;
          reset_at: string;
        };
        Insert: {
          hits?: number;
          key: string;
          reset_at: string;
        };
        Update: {
          hits?: number;
          key?: string;
          reset_at?: string;
        };
        Relationships: [];
      };
      shipments: {
        Row: {
          carrier: string | null;
          order_id: string;
          status: string;
          tracking_number: string | null;
          updated_at: string;
        };
        Insert: {
          carrier?: string | null;
          order_id: string;
          status?: string;
          tracking_number?: string | null;
          updated_at?: string;
        };
        Update: {
          carrier?: string | null;
          order_id?: string;
          status?: string;
          tracking_number?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      shipping_rates: {
        Row: {
          amount: number;
          country: string;
          enabled: boolean;
        };
        Insert: {
          amount: number;
          country: string;
          enabled?: boolean;
        };
        Update: {
          amount?: number;
          country?: string;
          enabled?: boolean;
        };
        Relationships: [];
      };
      store_settings: {
        Row: {
          contact_email: string | null;
          id: number;
          legal_copy: string | null;
          legal_verified: boolean;
          live_enabled: boolean;
          privacy_copy: string | null;
          returns_copy: string | null;
          seller_address: string | null;
          seller_name: string | null;
          seller_registration: string | null;
          shipping_copy: string | null;
          shipping_verified: boolean;
          tax_verified: boolean;
          terms_copy: string | null;
        };
        Insert: {
          contact_email?: string | null;
          id: number;
          legal_copy?: string | null;
          legal_verified?: boolean;
          live_enabled?: boolean;
          privacy_copy?: string | null;
          returns_copy?: string | null;
          seller_address?: string | null;
          seller_name?: string | null;
          seller_registration?: string | null;
          shipping_copy?: string | null;
          shipping_verified?: boolean;
          tax_verified?: boolean;
          terms_copy?: string | null;
        };
        Update: {
          contact_email?: string | null;
          id?: number;
          legal_copy?: string | null;
          legal_verified?: boolean;
          live_enabled?: boolean;
          privacy_copy?: string | null;
          returns_copy?: string | null;
          seller_address?: string | null;
          seller_name?: string | null;
          seller_registration?: string | null;
          shipping_copy?: string | null;
          shipping_verified?: boolean;
          tax_verified?: boolean;
          terms_copy?: string | null;
        };
        Relationships: [];
      };
      stripe_events: {
        Row: {
          created_at: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
        };
        Relationships: [];
      };
      variants: {
        Row: {
          currency: string;
          id: string;
          inventory_verified: boolean;
          preorder: boolean;
          preorder_limit: number;
          preorder_reserved: number;
          price: number;
          product_id: string;
          reserved: number;
          size: string;
          stock: number;
        };
        Insert: {
          currency?: string;
          id?: string;
          inventory_verified?: boolean;
          preorder?: boolean;
          preorder_limit?: number;
          preorder_reserved?: number;
          price: number;
          product_id: string;
          reserved?: number;
          size: string;
          stock?: number;
        };
        Update: {
          currency?: string;
          id?: string;
          inventory_verified?: boolean;
          preorder?: boolean;
          preorder_limit?: number;
          preorder_reserved?: number;
          price?: number;
          product_id?: string;
          reserved?: number;
          size?: string;
          stock?: number;
        };
        Relationships: [
          {
            foreignKeyName: "variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      apply_checkout_event: {
        Args: {
          p_address: Json;
          p_amount: number;
          p_currency: string;
          p_email: string;
          p_event: string;
          p_intent: string;
          p_kind: string;
          p_mail: string;
          p_order: string;
          p_session: string;
        };
        Returns: undefined;
      };
      claim_emails: {
        Args: never;
        Returns: {
          attempts: number;
          body: string;
          dedupe_key: string;
          id: string;
          last_error: string | null;
          locked_until: string | null;
          next_attempt_at: string;
          recipient: string;
          sent_at: string | null;
          subject: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "email_outbox";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      consume_rate: {
        Args: { p_key: string; p_limit: number; p_seconds: number };
        Returns: boolean;
      };
      record_refund: {
        Args: { p_event: string; p_intent: string; p_refunded: number };
        Returns: undefined;
      };
      reserve_order: {
        Args: {
          p_country: string;
          p_hash: string;
          p_items: Json;
          p_mode: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
