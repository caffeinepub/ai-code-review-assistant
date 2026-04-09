import type { backendInterface } from "../backend";

export const mockBackend: backendInterface = {
  analyzeCode: async (_code: string, _language: string) => ({
    __kind__: "ok" as const,
    ok: {
      bugs: [
        { message: "Potential null pointer dereference on line 12", severity: "high" },
        { message: "Missing error handling in async block", severity: "medium" },
      ],
      improvements: [
        "Consider extracting the inner loop into a separate function for readability",
        "Use const instead of let where variables are not reassigned",
        "Add JSDoc comments to document function parameters and return types",
      ],
      explanation:
        "This code implements a sorting algorithm with O(n²) time complexity. It iterates over the array twice to compare and swap adjacent elements. The logic is correct but could benefit from early termination when no swaps occur.",
      bestPractices: [
        "Add input validation to handle edge cases such as empty arrays",
        "Use descriptive variable names instead of single letters",
        "Write unit tests to cover boundary conditions",
      ],
      qualityScore: BigInt(72),
    },
  }),
  transform: async (input) => ({
    status: input.response.status,
    body: input.response.body,
    headers: input.response.headers,
  }),
};
