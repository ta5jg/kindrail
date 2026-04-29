import { z } from "zod";
import { KrV1Envelope } from "./envelope.js";
import { HealthResponse } from "./health.js";
import { KrBattleSimRequest, KrBattleSimResult } from "./battle.js";

/**
 * Central schema registry for:
 * - JSON Schema emission
 * - docs
 * - future C# DTO generation
 */
export const KrV1Schemas = {
  KrV1Envelope,
  HealthResponse,
  KrBattleSimRequest,
  KrBattleSimResult
} satisfies Record<string, z.ZodTypeAny>;

