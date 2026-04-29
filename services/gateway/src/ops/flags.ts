import fs from "node:fs/promises";
import path from "node:path";

export type Flags = Record<string, boolean>;

export class FlagStore {
  private readonly file: string;
  private flags: Flags = {};
  private loaded = false;

  constructor(storeDir: string) {
    this.file = path.join(storeDir, "flags.json");
  }

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.file, "utf8");
      const json = JSON.parse(raw) as unknown;
      if (json && typeof json === "object") this.flags = json as Flags;
    } catch {
      this.flags = {
        growth_referral: true,
        growth_share_rewards: true,
        monetization_offers: true
      };
      await this.save();
    }
    this.loaded = true;
  }

  getAll(): Flags {
    return { ...this.flags };
  }

  isEnabled(key: string): boolean {
    return Boolean(this.flags[key]);
  }

  async set(key: string, value: boolean): Promise<void> {
    this.flags[key] = value;
    await this.save();
  }

  private async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(this.flags, null, 2) + "\n", "utf8");
    await fs.rename(tmp, this.file);
  }

  ensureLoaded() {
    if (!this.loaded) throw new Error("flags not loaded");
  }
}

