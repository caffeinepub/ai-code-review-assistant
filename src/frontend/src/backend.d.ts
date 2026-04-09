import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Bug {
    message: string;
    severity: string;
}
export interface CodeReview {
    bugs: Array<Bug>;
    improvements: Array<string>;
    explanation: string;
    bestPractices: Array<string>;
    qualityScore: bigint;
}
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface HttpHeader {
    value: string;
    name: string;
}
export interface TransformArgs {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface backendInterface {
    analyzeCode(code: string, language: string): Promise<{
        __kind__: "ok";
        ok: CodeReview;
    } | {
        __kind__: "err";
        err: string;
    }>;
    transform(input: TransformArgs): Promise<HttpRequestResult>;
}
