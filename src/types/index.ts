// 변환 요청/응답 타입
export interface ConvertRequest {
  url: string;
}

export interface ConvertResponse {
  success: boolean;
  content?: string;
  error?: string;
}

// 사용자 타입
export interface User {
  id: string;
  email: string;
  credits: number;
  createdAt: Date;
}

// 크레딧 패키지 타입
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
}

// 변환 히스토리 타입
export interface ConversionHistory {
  id: string;
  userId: string;
  sourceUrl: string;
  platform: "youtube" | "instagram";
  resultContent: string;
  createdAt: Date;
}

// 결제 타입
export interface PaymentRequest {
  packageId: string;
  userId: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  error?: string;
}

// 주문 생성
export interface CreateOrderRequest {
  packageId: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  storeId?: string;
  channelKey?: string;
  orderName?: string;
  totalAmount?: number;
  error?: string;
}

// 결제 검증
export interface ConfirmPaymentRequest {
  paymentId: string;
  orderId: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  credits?: number;
  error?: string;
}
