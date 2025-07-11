export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      locadoras: {
        Row: {
          cep: string
          cidade: string
          cnpj: string
          created_at: string
          email: string
          endereco: string
          estado: string
          id: string
          nome: string
          plano: string
          razao_social: string
          responsavel: string
          status: string
          telefone: string
          updated_at: string
        }
        Insert: {
          cep: string
          cidade: string
          cnpj: string
          created_at?: string
          email: string
          endereco: string
          estado: string
          id?: string
          nome: string
          plano?: string
          razao_social: string
          responsavel: string
          status?: string
          telefone: string
          updated_at?: string
        }
        Update: {
          cep?: string
          cidade?: string
          cnpj?: string
          created_at?: string
          email?: string
          endereco?: string
          estado?: string
          id?: string
          nome?: string
          plano?: string
          razao_social?: string
          responsavel?: string
          status?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          locadora_id: string | null
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          locadora_id?: string | null
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locadora_id?: string | null
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano: number
          categoria: string
          caucao: number
          chassi: string
          combustivel: string
          cor: string
          created_at: string
          id: string
          limite_quilometragem: string
          locadora_id: string
          marca: string
          modelo: string
          numero_apolice: string | null
          placa: string
          proxima_revisao: string | null
          quilometragem: number
          renavam: string
          seguradora: string | null
          status: string
          taxa_administrativa: number | null
          ultima_revisao: string | null
          updated_at: string
          valor_limite_km: number | null
          valor_seguro_mensal: number | null
          valor_semanal: number
          vigencia_seguro: string | null
        }
        Insert: {
          ano: number
          categoria: string
          caucao: number
          chassi: string
          combustivel: string
          cor: string
          created_at?: string
          id?: string
          limite_quilometragem: string
          locadora_id: string
          marca: string
          modelo: string
          numero_apolice?: string | null
          placa: string
          proxima_revisao?: string | null
          quilometragem?: number
          renavam: string
          seguradora?: string | null
          status?: string
          taxa_administrativa?: number | null
          ultima_revisao?: string | null
          updated_at?: string
          valor_limite_km?: number | null
          valor_seguro_mensal?: number | null
          valor_semanal: number
          vigencia_seguro?: string | null
        }
        Update: {
          ano?: number
          categoria?: string
          caucao?: number
          chassi?: string
          combustivel?: string
          cor?: string
          created_at?: string
          id?: string
          limite_quilometragem?: string
          locadora_id?: string
          marca?: string
          modelo?: string
          numero_apolice?: string | null
          placa?: string
          proxima_revisao?: string | null
          quilometragem?: number
          renavam?: string
          seguradora?: string | null
          status?: string
          taxa_administrativa?: number | null
          ultima_revisao?: string | null
          updated_at?: string
          valor_limite_km?: number | null
          valor_seguro_mensal?: number | null
          valor_semanal?: number
          vigencia_seguro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_locadora_id_fkey"
            columns: ["locadora_id"]
            isOneToOne: false
            referencedRelation: "locadoras"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
