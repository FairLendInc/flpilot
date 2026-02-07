import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageUploadProps {
  onUpload?: (url: string) => void;
  uploadHandler?: (file: File, localUrl: string) => Promise<string>;
  onError?: (error: Error) => void;
}

export function useImageUpload({
  onUpload,
  uploadHandler,
  onError,
}: UseImageUploadProps = {}) {
  const previewRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Demo-only upload helper. Replace with real upload handler.
  const dummyUpload = async (file: File, localUrl: string): Promise<string> => {
    try {
      setUploading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate random upload errors (20% chance)
      if (Math.random() < 0.2) {
        throw new Error("Upload failed - This is a demo error");
      }
      
      setError(null);
      // In a real implementation, this would be the URL from the server
      return localUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleThumbnailClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setFileName(file.name);
        const localUrl = URL.createObjectURL(file);
        setPreviewUrl(localUrl);
        previewRef.current = localUrl;

        try {
          if (!uploadHandler && process.env.NODE_ENV === "production") {
            throw new Error("Image upload handler not configured");
          }
          const resolvedUpload =
            uploadHandler ??
            (process.env.NODE_ENV === "development" ? dummyUpload : null);
          if (!resolvedUpload) {
            throw new Error("Image upload handler not configured");
          }
          const uploadedUrl = await resolvedUpload(file, localUrl);
          onUpload?.(uploadedUrl);
        } catch (err) {
          URL.revokeObjectURL(localUrl);
          setPreviewUrl(null);
          setFileName(null);
          const error =
            err instanceof Error ? err : new Error("Upload failed");
          setError(error.message);
          onError?.(error);
          throw error;
        }
      }
    },
    [onError, onUpload, uploadHandler]
  );

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileName(null);
    previewRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError(null);
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  return {
    previewUrl,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
    uploading,
    error,
  };
}
