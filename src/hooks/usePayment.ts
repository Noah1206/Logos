"use client";

import { useState } from "react";
import type { CreateOrderResponse, ConfirmPaymentResponse } from "@/types";

declare global {
  interface Window {
    IMP?: {
      init: (storeId: string) => void;
      request_pay: (
        params: Record<string, unknown>,
        callback: (response: {
          success: boolean;
          imp_uid: string;
          merchant_uid: string;
          error_msg?: string;
        }) => void
      ) => void;
    };
  }
}

interface UsePaymentOptions {
  onSuccess?: (credits: number) => void;
  onError?: (error: string) => void;
}

export function usePayment({ onSuccess, onError }: UsePaymentOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const purchasePackage = async (packageId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. IMP SDK 로드 확인
      if (!window.IMP) {
        throw new Error("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      }

      // 2. 서버에 주문 생성
      const orderRes = await fetch("/api/payment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      const orderData: CreateOrderResponse = await orderRes.json();

      if (!orderData.success || !orderData.paymentId) {
        throw new Error(orderData.error ?? "주문 생성에 실패했습니다.");
      }

      // 3. IMP 초기화 및 결제 요청
      window.IMP.init(orderData.storeId!);

      console.log("[Payment] storeId:", orderData.storeId);
      console.log("[Payment] channelKey:", orderData.channelKey);
      console.log("[Payment] amount:", orderData.totalAmount);

      window.IMP.request_pay(
        {
          pg: "html5_inicis",
          pay_method: "card",
          merchant_uid: orderData.paymentId,
          name: orderData.orderName,
          amount: orderData.totalAmount,
        },
        async (response) => {
          try {
            if (!response.success) {
              throw new Error(response.error_msg ?? "결제가 취소되었습니다.");
            }

            // 4. 서버에서 결제 검증
            const confirmRes = await fetch("/api/payment/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId: orderData.paymentId,
                impUid: response.imp_uid,
              }),
            });

            const confirmData: ConfirmPaymentResponse = await confirmRes.json();

            if (!confirmData.success) {
              throw new Error(confirmData.error ?? "결제 검증에 실패했습니다.");
            }

            onSuccess?.(confirmData.credits ?? 0);
          } catch (err) {
            const message = err instanceof Error ? err.message : "결제 처리 중 오류가 발생했습니다.";
            onError?.(message);
          } finally {
            setIsProcessing(false);
          }
        }
      );

      // V1은 콜백 기반이므로 여기서 return (finally는 콜백 안에서 처리)
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : "결제 처리 중 오류가 발생했습니다.";
      onError?.(message);
      setIsProcessing(false);
    }
  };

  return { purchasePackage, isProcessing };
}
