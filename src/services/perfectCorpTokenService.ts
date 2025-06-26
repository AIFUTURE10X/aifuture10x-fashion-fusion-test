
import { supabase } from "@/integrations/supabase/client";

export interface TokenInfo {
  hasValidToken: boolean;
  tokenCount: number;
  nextExpiry: string | null;
  secondsUntilExpiry: number | null;
  expiredTokenCount: number;
}

export interface ValidToken {
  tokenId: string;
  accessToken: string;
  expiresAt: string;
  secondsUntilExpiry: number;
}

export interface CleanupResult {
  deletedCount: number;
  cleanupTimestamp: string;
}

export interface RefreshResult {
  invalidatedTokens: number;
  actionTimestamp: string;
}

class PerfectCorpTokenService {
  
  async getTokenInfo(): Promise<TokenInfo | null> {
    try {
      const { data, error } = await supabase.rpc('get_token_expiry_info');
      
      if (error) {
        console.error('Error getting token info:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        const info = data[0];
        return {
          hasValidToken: info.has_valid_token,
          tokenCount: info.token_count,
          nextExpiry: info.next_expiry,
          secondsUntilExpiry: info.seconds_until_expiry,
          expiredTokenCount: info.expired_token_count
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get token info:', error);
      return null;
    }
  }

  async getValidToken(): Promise<ValidToken | null> {
    try {
      const { data, error } = await supabase.rpc('get_valid_perfect_corp_token');
      
      if (error) {
        console.error('Error getting valid token:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        const token = data[0];
        return {
          tokenId: token.token_id,
          accessToken: token.access_token,
          expiresAt: token.expires_at,
          secondsUntilExpiry: token.seconds_until_expiry
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get valid token:', error);
      return null;
    }
  }

  async cleanupExpiredTokens(): Promise<CleanupResult | null> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_perfect_corp_tokens');
      
      if (error) {
        console.error('Error cleaning up expired tokens:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          deletedCount: result.deleted_count,
          cleanupTimestamp: result.cleanup_timestamp
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to cleanup expired tokens:', error);
      return null;
    }
  }

  async forceRefreshToken(): Promise<RefreshResult | null> {
    try {
      const { data, error } = await supabase.rpc('force_refresh_perfect_corp_token');
      
      if (error) {
        console.error('Error forcing token refresh:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          invalidatedTokens: result.invalidated_tokens,
          actionTimestamp: result.action_timestamp
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to force token refresh:', error);
      return null;
    }
  }

  // Utility method to format time until expiry
  formatTimeUntilExpiry(seconds: number): string {
    if (seconds <= 0) return 'Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }
}

export const perfectCorpTokenService = new PerfectCorpTokenService();
