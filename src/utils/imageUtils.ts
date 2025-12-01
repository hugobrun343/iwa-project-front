import { ImageDto } from '../types/api';

const DEFAULT_IMAGE_MIME = 'image/jpeg';

const buildDataUri = (base64?: string | null, mimeType?: string | null): string | null => {
  if (!base64) {
    return null;
  }

  if (base64.startsWith('data:')) {
    return base64;
  }

  const safeMime = mimeType || DEFAULT_IMAGE_MIME;
  return `data:${safeMime};base64,${base64}`;
};

const imageDtoToDataUri = (image?: ImageDto | null): string | null => {
  if (!image) {
    return null;
  }

  if (image.imageBlob) {
    return buildDataUri(image.imageBlob, image.contentType);
  }

  // Legacy support for URL-based payloads
  if (image.imageUrl) {
    return image.imageUrl;
  }

  return null;
};

const normalizeImageList = (images?: ImageDto[] | null): string[] =>
  images?.map(imageDtoToDataUri).filter((uri): uri is string => Boolean(uri)) ?? [];

const extractBase64 = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  if (value.startsWith('data:')) {
    const commaIndex = value.indexOf(',');
    if (commaIndex === -1) {
      return null;
    }
    return value.slice(commaIndex + 1);
  }

  return value;
};

const mapUrisToImagePayload = (
  uris: string[],
): Array<{ imageBlob: string }> | undefined => {
  const payload = uris
    .map((uri) => {
      const base64 = extractBase64(uri);
      if (!base64) {
        return null;
      }
      return { imageBlob: base64 };
    })
    .filter((entry): entry is { imageBlob: string } => Boolean(entry));

  return payload.length > 0 ? payload : undefined;
};

const normalizeImageValue = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  return buildDataUri(trimmed, undefined) ?? undefined;
};

export {
  buildDataUri,
  extractBase64,
  imageDtoToDataUri,
  mapUrisToImagePayload,
  normalizeImageList,
  normalizeImageValue,
};


