import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ExternalApiMode } from "@/lib/env";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "DATABASE_UNAVAILABLE"
  | "EXTERNAL_API_ERROR"
  | "INTERNAL_ERROR";

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  meta?: {
    mode?: ExternalApiMode;
    timestamp: string;
    [key: string]: unknown;
  };
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
  };
}

export function apiSuccess<T>(
  data: T,
  options?: {
    status?: number;
    meta?: Record<string, unknown>;
  }
) {
  const body: ApiSuccessBody<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...options?.meta,
    },
  };

  return NextResponse.json(body, { status: options?.status ?? 200 });
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  options?: {
    status?: number;
    details?: unknown;
  }
) {
  const body: ApiErrorBody = {
    success: false,
    error: {
      code,
      message,
      ...(options?.details !== undefined ? { details: options.details } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(body, { status: options?.status ?? 500 });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError("VALIDATION_ERROR", "ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง", {
      status: 400,
      details: error.flatten().fieldErrors,
    });
  }

  console.error("[API Error]", error);
  return apiError("INTERNAL_ERROR", "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง", {
    status: 500,
  });
}
