import { google } from "googleapis";
import googleConfig from "../config/google.js";

const oauth2Client = new google.auth.OAuth2(
  googleConfig.clientId,
  googleConfig.clientSecret,
  googleConfig.redirectUri
);

class GoogleOAuthService {
  getAuthUrl(state: string): string {
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: googleConfig.scopes,
      state,
      prompt: "consent",
    });
  }

  async getTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  }> {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      expiry_date: tokens.expiry_date!,
    };
  }

  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ access_token: string; expiry_date: number }> {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return {
      access_token: credentials.access_token!,
      expiry_date: credentials.expiry_date!,
    };
  }

  async revokeToken(accessToken: string): Promise<void> {
    await oauth2Client.revokeToken(accessToken);
  }

  // Método para obter informações do usuário (email, id) - opcional, pode ser usado para buscar o perfil.
  async getUserInfo(
    accessToken: string
  ): Promise<{ id: string; email: string }> {
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });
    oauth2Client.setCredentials({ access_token: accessToken });
    const res = await oauth2.userinfo.get();
    return { id: res.data.id!, email: res.data.email! };
  }
}

export default new GoogleOAuthService();
