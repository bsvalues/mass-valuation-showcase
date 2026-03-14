import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { parcels, appeals, sales, regressionModels } from "../drizzle/schema";
import { eq, count, desc } from "drizzle-orm";

/**
 * NeuralCore Router
 * Powers the AI assistant chat interface in the NeuralCore page.
 * Uses invokeLLM() with a rich IAAO-specialist system prompt and live DB context.
 */
export const neuralCoreRouter = router({
  /**
   * Multi-turn chat with the IAAO AI assistant.
   * Accepts full message history so the LLM maintains conversation context.
   */
  chat: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      })),
      countyName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Gather live context stats to inject into the system prompt
      let contextStats = "";
      if (db) {
        try {
          const [parcelCount, activeAppeals, recentSales, latestModel] = await Promise.allSettled([
            db.select({ count: count() }).from(parcels),
            db.select({ count: count() }).from(appeals)
              .where(eq(appeals.status, "pending")),
            db.select({ count: count() }).from(sales),
            db.select({
              id: regressionModels.id,
              name: regressionModels.name,
              rSquared: regressionModels.rSquared,
              isProduction: regressionModels.isProduction,
            })
              .from(regressionModels)
              .where(eq(regressionModels.isProduction, 1))
              .orderBy(desc(regressionModels.createdAt))
              .limit(1),
          ]);

          const pCount = parcelCount.status === "fulfilled" ? parcelCount.value[0]?.count ?? 0 : 0;
          const aCount = activeAppeals.status === "fulfilled" ? activeAppeals.value[0]?.count ?? 0 : 0;
          const sCount = recentSales.status === "fulfilled" ? recentSales.value[0]?.count ?? 0 : 0;
          const model = latestModel.status === "fulfilled" ? latestModel.value[0] : null;

          contextStats = `
LIVE SYSTEM CONTEXT (as of this request):
- Total parcels in database: ${pCount.toLocaleString()}
- Qualified sales records: ${sCount.toLocaleString()}
- Active pending appeals: ${aCount}
- Production regression model: ${model ? `"${model.name}" (R² = ${model.rSquared ?? "N/A"})` : "None deployed"}
${input.countyName ? `- Active county filter: ${input.countyName}` : ""}
`;
        } catch {
          // Non-fatal — proceed without context stats
          contextStats = "";
        }
      }

      const systemPrompt = `You are TerraFusion AI — an expert AI assistant embedded in the TerraFusion Mass Valuation Appraisal Suite.
You are an IAAO-certified mass appraisal specialist with deep expertise in:
- IAAO Standard on Ratio Studies (median ratio, COD, PRD, PRB targets and interpretation)
- Mass appraisal methodology: cost approach, sales comparison, income approach
- Regression analysis for property valuation: OLS, MRA, adaptive estimation
- Washington State assessment law and DOR guidelines
- Property tax appeal defense and hearing preparation
- GIS-based market analysis and neighborhood delineation
- Data quality, outlier detection, and sales qualification

You have access to live data from the TerraFusion database.
${contextStats}
When answering:
- Be precise and cite IAAO standards by name when relevant (e.g., "IAAO Standard on Ratio Studies §5.1")
- Use professional assessor terminology (A/S ratio, COD, PRD, PRB, time-adjusted sale price, etc.)
- When the user asks about their data, refer to the live context stats above
- For methodology questions, provide step-by-step guidance
- Keep responses concise but complete — assessors are busy professionals
- Format numbers clearly (e.g., "COD of 12.4%" not "0.124")`;

      // Build messages with system prompt injected at the start
      const clientMessages = input.messages.filter(m => m.role !== "system");
      const fullMessages = [
        { role: "system" as const, content: systemPrompt },
        ...clientMessages,
      ];

      const result = await invokeLLM({ messages: fullMessages });

      const responseContent = result.choices[0]?.message?.content;
      const responseText = typeof responseContent === "string"
        ? responseContent
        : "I encountered an issue generating a response. Please try again.";

      return {
        message: responseText,
        role: "assistant" as const,
      };
    }),

  /**
   * Get live system stats for the NeuralCore context panel.
   */
  getSystemStats: protectedProcedure
    .input(z.object({ countyName: z.string().optional() }))
    .query(async () => {
      const db = await getDb();
      if (!db) return { parcelCount: 0, appealCount: 0, salesCount: 0, productionModel: null };

      const [parcelResult, appealResult, salesResult, modelResult] = await Promise.allSettled([
        db.select({ count: count() }).from(parcels),
        db.select({ count: count() }).from(appeals)
          .where(eq(appeals.status, "pending")),
        db.select({ count: count() }).from(sales),
        db.select({
          id: regressionModels.id,
          name: regressionModels.name,
          rSquared: regressionModels.rSquared,
          isProduction: regressionModels.isProduction,
          createdAt: regressionModels.createdAt,
        })
          .from(regressionModels)
          .where(eq(regressionModels.isProduction, 1))
          .orderBy(desc(regressionModels.createdAt))
          .limit(1),
      ]);

      return {
        parcelCount: parcelResult.status === "fulfilled" ? parcelResult.value[0]?.count ?? 0 : 0,
        appealCount: appealResult.status === "fulfilled" ? appealResult.value[0]?.count ?? 0 : 0,
        salesCount: salesResult.status === "fulfilled" ? salesResult.value[0]?.count ?? 0 : 0,
        productionModel: modelResult.status === "fulfilled" ? modelResult.value[0] ?? null : null,
      };
    }),
});
