import { get, set, del } from 'idb-keyval';
import { refresh as refreshToken } from 'openauth-js';

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

const STORAGE_KEY = 'authTokens';

function encode(data: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(data);
  }
  return Buffer.from(data, 'utf-8').toString('base64');
}

function decode(data: string): string {
  if (typeof atob !== 'undefined') {
    return atob(data);
  }
  return Buffer.from(data, 'base64').toString('utf-8');
}

export class TokenManager {
  private tokens?: TokenSet;

  async load(): Promise<TokenSet | undefined> {
    const raw = await get(STORAGE_KEY);
    if (!raw) return undefined;
    try {
      const json = decode(raw as string);
      this.tokens = JSON.parse(json) as TokenSet;
      return this.tokens;
    } catch {
      return undefined;
    }
  }

  async save(tokens: TokenSet): Promise<void> {
    this.tokens = tokens;
    const encrypted = encode(JSON.stringify(tokens));
    await set(STORAGE_KEY, encrypted);
  }

  async getValidAccessToken(): Promise<string | null> {
    if (this.tokens && this.tokens.expiresAt > Date.now()) {
      return this.tokens.accessToken;
    }
    if (this.tokens?.refreshToken) {
      const res = await refreshToken(this.tokens.refreshToken);
      const next: TokenSet = {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        expiresAt: Date.now() + res.expires_in * 1000,
      };
      await this.save(next);
      return next.accessToken;
    }
    return null;
  }

  async clear(): Promise<void> {
    this.tokens = undefined;
    await del(STORAGE_KEY);
  }
}

export const tokenManager = new TokenManager();
