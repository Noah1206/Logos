"use client";

import { useState } from "react";
import * as PortOne from "@portone/browser-sdk/v2";
import type { CreateOrderResponse, ConfirmPaymentResponse } from "@/types";

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
      // 1. 서버에 주문 생성
      const orderRes = await fetch("/api/payment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      const orderData: CreateOrderResponse = await orderRes.json();

      if (!orderData.success || !orderData.paymentId) {
        throw new Error(orderData.error ?? "PAYMENT_ORDER_FAILED");
      }

      // 2. PortOne V2 SDK 결제 요청 (Promise 기반)
      const response = await PortOne.requestPayment({
        storeId: orderData.storeId!,
        channelKey: orderData.channelKey!,
        paymentId: orderData.paymentId,
        orderName: orderData.orderName!,
        totalAmount: orderData.totalAmount!,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
      });

      // 3. V2 SDK 에러 체크 (code가 있으면 실패)
      if (response?.code) {
        throw new Error(response.message ?? "PAYMENT_CANCELLED");
      }

      // 4. 서버에서 결제 검증
      const confirmRes = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: orderData.paymentId }),
      });

      const confirmData: ConfirmPaymentResponse = await confirmRes.json();

      if (!confirmData.success) {
        throw new Error(confirmData.error ?? "PAYMENT_VERIFY_FAILED");
      }

      onSuccess?.(confirmData.credits ?? 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "PAYMENT_GENERIC_ERROR";
      onError?.(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return { purchasePackage, isProcessing };
}
