// Notification Adapter Interface
// Allows plugging in different notification providers (email, SMS, push, etc.)

export interface NotificationMessage {
  to: string | string[];
  subject?: string;
  body: string;
  templateId?: string;
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface INotificationAdapter {
  sendEmail(message: NotificationMessage): Promise<NotificationResult>;
  sendSMS(message: NotificationMessage): Promise<NotificationResult>;
  sendPushNotification(message: NotificationMessage): Promise<NotificationResult>;
}

// Default in-memory implementation (logs only)
export class ConsoleNotificationAdapter implements INotificationAdapter {
  async sendEmail(message: NotificationMessage): Promise<NotificationResult> {
    console.log("[EMAIL]", {
      to: message.to,
      subject: message.subject,
      body: message.body.substring(0, 100) + "...",
    });
    return { success: true, messageId: `email-${Date.now()}` };
  }

  async sendSMS(message: NotificationMessage): Promise<NotificationResult> {
    console.log("[SMS]", {
      to: message.to,
      body: message.body.substring(0, 100) + "...",
    });
    return { success: true, messageId: `sms-${Date.now()}` };
  }

  async sendPushNotification(message: NotificationMessage): Promise<NotificationResult> {
    console.log("[PUSH]", {
      to: message.to,
      body: message.body.substring(0, 100) + "...",
    });
    return { success: true, messageId: `push-${Date.now()}` };
  }
}

// Singleton instance
let notificationAdapter: INotificationAdapter = new ConsoleNotificationAdapter();

export function setNotificationAdapter(adapter: INotificationAdapter): void {
  notificationAdapter = adapter;
}

export function getNotificationAdapter(): INotificationAdapter {
  return notificationAdapter;
}
