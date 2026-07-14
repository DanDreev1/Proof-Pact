export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      accountability_pairs: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string;
          id: string;
          invite_code: string | null;
          status: "active" | "archived";
          timezone: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          invite_code?: string | null;
          status?: "active" | "archived";
          timezone?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          invite_code?: string | null;
          status?: "active" | "archived";
          timezone?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accountability_pairs_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_words: {
        Row: {
          created_at: string;
          id: string;
          proof_date: string;
          word: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          proof_date: string;
          word: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          proof_date?: string;
          word?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pair_members_pair_id_fkey";
            columns: ["pair_id"];
            isOneToOne: false;
            referencedRelation: "accountability_pairs";
            referencedColumns: ["id"];
          },
        ];
      };
      pair_members: {
        Row: {
          created_at: string;
          pair_id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          pair_id: string;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          pair_id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "proof_requests_daily_word_id_fkey";
            columns: ["daily_word_id"];
            isOneToOne: false;
            referencedRelation: "daily_words";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proof_requests_pair_id_fkey";
            columns: ["pair_id"];
            isOneToOne: false;
            referencedRelation: "accountability_pairs";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      proof_requests: {
        Row: {
          created_at: string;
          daily_word_id: string;
          decided_at: string | null;
          decision_comment: string | null;
          description: string | null;
          draft_expires_at: string;
          id: string;
          pair_id: string;
          proof_date: string;
          requester_id: string;
          reviewer_id: string;
          season: "spring" | "summer" | "autumn" | "winter";
          season_year: number;
          status: "draft" | "pending" | "approved" | "rejected" | "expired";
          submitted_at: string | null;
          title: string;
          video_expires_at: string;
          video_path: string | null;
        };
        Insert: {
          created_at?: string;
          daily_word_id: string;
          decided_at?: string | null;
          decision_comment?: string | null;
          description?: string | null;
          draft_expires_at: string;
          id?: string;
          pair_id: string;
          proof_date: string;
          requester_id: string;
          reviewer_id: string;
          season: "spring" | "summer" | "autumn" | "winter";
          season_year: number;
          status?: "draft" | "pending" | "approved" | "rejected" | "expired";
          submitted_at?: string | null;
          title: string;
          video_expires_at: string;
          video_path?: string | null;
        };
        Update: {
          created_at?: string;
          daily_word_id?: string;
          decided_at?: string | null;
          decision_comment?: string | null;
          description?: string | null;
          draft_expires_at?: string;
          id?: string;
          pair_id?: string;
          proof_date?: string;
          requester_id?: string;
          reviewer_id?: string;
          season?: "spring" | "summer" | "autumn" | "winter";
          season_year?: number;
          status?: "draft" | "pending" | "approved" | "rejected" | "expired";
          submitted_at?: string | null;
          title?: string;
          video_expires_at?: string;
          video_path?: string | null;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          last_used_at: string | null;
          p256dh: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          last_used_at?: string | null;
          p256dh: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          last_used_at?: string | null;
          p256dh?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_accountability_pair: {
        Args: {
          pair_timezone?: string;
        };
        Returns: {
          pair_id: string;
          invite_code: string;
        }[];
      };
      join_accountability_pair: {
        Args: {
          pair_invite_code: string;
        };
        Returns: {
          pair_id: string;
        }[];
      };
      get_or_create_daily_word: {
        Args: {
          target_proof_date: string;
        };
        Returns: {
          id: string;
          proof_date: string;
          word: string;
        }[];
      };
      user_has_active_pair: {
        Args: {
          user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
