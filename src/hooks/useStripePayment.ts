"use client";

import { useState } from "react";

interface UseStripePaymentOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useStripePayment({
  onSuccess,
  onError,
}: UseStripePaymentOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const purchasePackage = async (packageId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/payment/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      const data = await res.json();

      if (!data.success || !data.checkoutUrl) {
        throw new Error(data.error ?? "Failed to create checkout session.");
      }

      // Stripe Checkout 페이지로 리다이렉트
      window.location.href = data.checkoutUrl;
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Payment processing error.";
      onError?.(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return { purchasePackage, isProcessing };
}
