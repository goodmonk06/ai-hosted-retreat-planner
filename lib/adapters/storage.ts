// Storage Adapter Interface
// Allows integration with file storage systems (S3, Azure Blob, local filesystem, etc.)

export interface UploadOptions {
  filename: string;
  contentType: string;
  buffer: Buffer;
  metadata?: Record<string, string>;
  isPublic?: boolean;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  error?: string;
}

export interface IStorageAdapter {
  upload(options: UploadOptions): Promise<UploadResult>;
  download(fileId: string): Promise<DownloadResult>;
  delete(fileId: string): Promise<{ success: boolean; error?: string }>;
  getPublicUrl(fileId: string): string;
}

// Default in-memory implementation
export class InMemoryStorageAdapter implements IStorageAdapter {
  private files: Map<
    string,
    {
      buffer: Buffer;
      contentType: string;
      metadata?: Record<string, string>;
      isPublic: boolean;
    }
  > = new Map();

  async upload(options: UploadOptions): Promise<UploadResult> {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.files.set(fileId, {
      buffer: options.buffer,
      contentType: options.contentType,
      metadata: options.metadata,
      isPublic: options.isPublic || false,
    });

    console.log("[STORAGE] File uploaded:", {
      fileId,
      filename: options.filename,
      size: options.buffer.length,
    });

    return {
      success: true,
      fileId,
      url: this.getPublicUrl(fileId),
    };
  }

  async download(fileId: string): Promise<DownloadResult> {
    const file = this.files.get(fileId);

    if (!file) {
      return {
        success: false,
        error: "File not found",
      };
    }

    console.log("[STORAGE] File downloaded:", { fileId });

    return {
      success: true,
      buffer: file.buffer,
      contentType: file.contentType,
    };
  }

  async delete(fileId: string): Promise<{ success: boolean; error?: string }> {
    const deleted = this.files.delete(fileId);

    console.log("[STORAGE] File deleted:", { fileId, success: deleted });

    return {
      success: deleted,
      error: deleted ? undefined : "File not found",
    };
  }

  getPublicUrl(fileId: string): string {
    return `https://storage.example.com/${fileId}`;
  }
}

// Singleton
let storageAdapter: IStorageAdapter = new InMemoryStorageAdapter();

export function setStorageAdapter(adapter: IStorageAdapter): void {
  storageAdapter = adapter;
}

export function getStorageAdapter(): IStorageAdapter {
  return storageAdapter;
}
