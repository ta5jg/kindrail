import { HealthResponse } from "@kindrail/protocol";

export type KindrailSdkOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

export class KindrailSdk {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: KindrailSdkOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async health(): Promise<HealthResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/health`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`health failed: ${res.status}`);
    const json = await res.json();
    return HealthResponse.parse(json);
  }
}

