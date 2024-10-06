import axios, { AxiosResponse } from "axios";
import dotenv from "dotenv";

dotenv.config();

const { COLA_BASE_URI, COLA_OUTBOUND_USERNAME, COLA_OUTBOUND_PASSWORD } =
  process.env;

export class BaseAPIClient {
  public token: string | null = null;
  public tokenExpiration: Date | null = null;

  constructor(
    private baseUri: string = COLA_BASE_URI!,
    private getTokenPath: string = "/api/tokenbazaar",
    private username: string = COLA_OUTBOUND_USERNAME!,
    private password: string = COLA_OUTBOUND_PASSWORD!
  ) {}

  // Method to get a new token for the API
  public async getToken(): Promise<void> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUri}${this.getTokenPath}`,
        {
          username: this.username,
          pass: this.password,
        }
      );

      this.token = response.data.token;

      // Set token expiration to 30 minutes from now
      this.tokenExpiration = new Date();
      this.tokenExpiration.setMinutes(this.tokenExpiration.getMinutes() + 30);

      console.log("New token acquired:", this.token);
    } catch (error) {
      console.error("Error getting token:", error);
      throw new Error("Failed to get token");
    }
  }

  // Method to check if the token is valid
  private isTokenValid(): boolean {
    if (!this.token || !this.tokenExpiration) {
      return false;
    }
    return new Date() < this.tokenExpiration;
  }

  // Method to make an API call with token authorization
  public async post(path: string, data: any): Promise<AxiosResponse<any>> {
    // Check if the token is still valid, otherwise refresh it
    if (!this.isTokenValid()) {
      await this.getToken();
    }

    try {
      return await this.makeApiRequest(path, data);
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        // If a 401 is received, refresh the token and retry the request
        console.log("Received 401 Unauthorized, refreshing token...");
        await this.getToken();
        return this.makeApiRequest(path, data);
      }

      console.error("API request error:", error);
      throw error;
    }
  }

  // Helper method for making actual API requests
  private async makeApiRequest(
    path: string,
    data: any
  ): Promise<AxiosResponse<any>> {
    return await axios.post(`${this.baseUri}${path}`, data, {
      headers: { Authorization: `Bearer ${this.token}` },
      maxBodyLength: Infinity,
    });
  }
}
