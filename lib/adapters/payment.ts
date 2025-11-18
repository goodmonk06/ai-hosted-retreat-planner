// Payment Adapter Interface
// Allows integration with payment processors (Stripe, PayPal, etc.)

export interface PaymentIntent {
  amount: number; // in cents
  currency: string;
  description: string;
  customerEmail: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status?: "pending" | "completed" | "failed";
  paymentUrl?: string;
  error?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number; // partial refund if specified
  reason?: string;
}

export interface IPaymentAdapter {
  createPaymentIntent(intent: PaymentIntent): Promise<PaymentResult>;
  capturePayment(transactionId: string): Promise<PaymentResult>;
  refundPayment(refund: RefundRequest): Promise<PaymentResult>;
  getPaymentStatus(transactionId: string): Promise<PaymentResult>;
}

// Default mock implementation
export class MockPaymentAdapter implements IPaymentAdapter {
  private payments: Map<string, PaymentIntent & { status: string }> = new Map();

  async createPaymentIntent(intent: PaymentIntent): Promise<PaymentResult> {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.payments.set(transactionId, {
      ...intent,
      status: "pending",
    });

    console.log("[PAYMENT] Payment intent created:", {
      transactionId,
      amount: intent.amount,
      currency: intent.currency,
    });

    return {
      success: true,
      transactionId,
      status: "pending",
      paymentUrl: `https://payment.example.com/checkout/${transactionId}`,
    };
  }

  async capturePayment(transactionId: string): Promise<PaymentResult> {
    const payment = this.payments.get(transactionId);

    if (!payment) {
      return {
        success: false,
        error: "Payment not found",
      };
    }

    payment.status = "completed";

    console.log("[PAYMENT] Payment captured:", { transactionId });

    return {
      success: true,
      transactionId,
      status: "completed",
    };
  }

  async refundPayment(refund: RefundRequest): Promise<PaymentResult> {
    const payment = this.payments.get(refund.transactionId);

    if (!payment) {
      return {
        success: false,
        error: "Payment not found",
      };
    }

    console.log("[PAYMENT] Refund processed:", {
      transactionId: refund.transactionId,
      amount: refund.amount,
      reason: refund.reason,
    });

    return {
      success: true,
      transactionId: refund.transactionId,
      status: "completed",
    };
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResult> {
    const payment = this.payments.get(transactionId);

    if (!payment) {
      return {
        success: false,
        error: "Payment not found",
      };
    }

    return {
      success: true,
      transactionId,
      status: payment.status as any,
    };
  }
}

// Singleton
let paymentAdapter: IPaymentAdapter = new MockPaymentAdapter();

export function setPaymentAdapter(adapter: IPaymentAdapter): void {
  paymentAdapter = adapter;
}

export function getPaymentAdapter(): IPaymentAdapter {
  return paymentAdapter;
}
