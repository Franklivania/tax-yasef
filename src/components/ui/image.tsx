"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

/**
 * Image component with Next.js-like functionality
 *
 * @example
 * // Basic usage
 * <Image src="/image.jpg" alt="Description" width={500} height={300} />
 *
 * @example
 * // With lazy loading and blur placeholder
 * <Image
 *   src="/image.jpg"
 *   alt="Description"
 *   width={500}
 *   height={300}
 *   placeholder="blur"
 *   blurDataURL="data:image/jpeg;base64,..."
 * />
 *
 * @example
 * // Fill container
 * <div className="relative w-full h-64">
 *   <Image
 *     src="/image.jpg"
 *     alt="Description"
 *     fill
 *     objectFit="cover"
 *   />
 * </div>
 *
 * @example
 * // Priority loading (above the fold)
 * <Image
 *   src="/hero.jpg"
 *   alt="Hero"
 *   width={1920}
 *   height={1080}
 *   priority
 * />
 */
export type ImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet" | "loading" | "width" | "height"
> & {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Image width (number for pixels, string for other units) */
  width?: number | string;
  /** Image height (number for pixels, string for other units) */
  height?: number | string;
  /** Fill parent container (requires relative parent) */
  fill?: boolean;
  /** Load image with priority (no lazy loading) */
  priority?: boolean;
  /** Image quality (1-100, default: 75) */
  quality?: number;
  /** Placeholder type: 'blur' | 'empty' | 'skeleton' */
  placeholder?: "blur" | "empty" | "skeleton";
  /** Base64 encoded blur placeholder */
  blurDataURL?: string;
  /** Responsive image sizes attribute */
  sizes?: string;
  /** CSS object-fit property */
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  /** CSS object-position property */
  objectPosition?: string;
  /** Loading strategy: 'lazy' | 'eager' */
  loading?: "lazy" | "eager";
  /** Callback when image loads successfully */
  onLoadingComplete?: () => void;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Fallback UI when image fails to load */
  fallback?: React.ReactNode;
  /** Skip responsive srcset generation */
  unoptimized?: boolean;
};

// Generate a blur placeholder data URL
function generateBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Create a simple gradient blur
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#e5e7eb");
  gradient.addColorStop(1, "#d1d5db");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL();
}

// Generate responsive srcset
function generateSrcSet(
  src: string,
  widths: number[],
  quality: number = 75
): string {
  return widths
    .map((width) => {
      const params = new URLSearchParams();
      params.set("w", width.toString());
      if (quality !== 75) params.set("q", quality.toString());

      // If src already has query params, append; otherwise add
      const separator = src.includes("?") ? "&" : "?";
      return `${src}${separator}${params.toString()} ${width}w`;
    })
    .join(", ");
}

/**
 * Next.js-like Image component with lazy loading, responsive images, and placeholders
 */
const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      fill = false,
      priority = false,
      quality = 75,
      placeholder = "empty",
      blurDataURL,
      sizes,
      objectFit = "cover",
      objectPosition = "center",
      loading: loadingProp,
      className,
      style,
      onLoadingComplete,
      onError: onErrorProp,
      fallback,
      unoptimized = false,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);
    const [isInView, setIsInView] = React.useState(priority);
    const [blurPlaceholder, setBlurPlaceholder] = React.useState<string | null>(
      blurDataURL || (placeholder === "blur" ? generateBlurDataURL() : null)
    );
    const imgRef = React.useRef<HTMLImageElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => imgRef.current as HTMLImageElement);

    // Intersection Observer for lazy loading
    React.useEffect(() => {
      if (priority || isInView) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.disconnect();
            }
          });
        },
        {
          rootMargin: "50px", // Start loading 50px before entering viewport
        }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }, [priority, isInView]);

    // Handle image load
    const handleLoad = React.useCallback(() => {
      setIsLoading(false);
      setBlurPlaceholder(null);
      onLoadingComplete?.();
    }, [onLoadingComplete]);

    // Handle image error
    const handleError = React.useCallback(() => {
      setHasError(true);
      setIsLoading(false);
      const error = new Error(`Failed to load image: ${src}`);
      onErrorProp?.(error);
    }, [src, onErrorProp]);

    // Determine loading strategy
    const loading = loadingProp || (priority ? "eager" : "lazy");

    // Generate responsive srcset if not unoptimized
    const srcSet = React.useMemo(() => {
      if (unoptimized || !width || typeof width !== "number") return undefined;

      const widths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
        .filter((w) => w <= Number(width) * 2)
        .concat([Number(width)])
        .sort((a, b) => a - b);

      return generateSrcSet(src, widths, quality);
    }, [src, width, quality, unoptimized]);

    // Default sizes if not provided
    const defaultSizes =
      sizes || (fill ? "100vw" : width ? `${width}px` : undefined);

    // Container styles
    const containerStyle: React.CSSProperties = {
      position: fill ? "relative" : undefined,
      display: fill ? "block" : "inline-block",
      width: fill ? "100%" : width,
      height: fill ? "100%" : height,
      overflow: "hidden",
      ...style,
    };

    // Image styles
    const imageStyle: React.CSSProperties = {
      objectFit,
      objectPosition,
      width: fill ? "100%" : width,
      height: fill ? "100%" : height,
      transition: blurPlaceholder ? "opacity 0.3s ease-in-out" : undefined,
      opacity: isLoading && blurPlaceholder ? 0 : 1,
    };

    // If error and fallback provided
    if (hasError && fallback) {
      return <>{fallback}</>;
    }

    // If error and no fallback
    if (hasError) {
      return (
        <div
          className={cn(
            "flex items-center justify-center bg-muted text-muted-foreground",
            className
          )}
          style={containerStyle}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        >
          <span className="text-sm">Failed to load image</span>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={cn("relative", className)}
        style={containerStyle}
      >
        {/* Blur placeholder */}
        {blurPlaceholder && isLoading && (
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${blurPlaceholder})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(20px)",
              transform: "scale(1.1)",
            }}
            aria-hidden="true"
          />
        )}

        {/* Skeleton placeholder */}
        {placeholder === "skeleton" && isLoading && (
          <Skeleton className="absolute inset-0 z-0" />
        )}

        {/* Actual image */}
        {isInView && (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            width={typeof width === "number" ? width : undefined}
            height={typeof height === "number" ? height : undefined}
            srcSet={srcSet}
            sizes={defaultSizes}
            loading={loading}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "relative z-10",
              isLoading && blurPlaceholder && "opacity-0",
              !isLoading && "opacity-100"
            )}
            style={imageStyle}
            {...props}
          />
        )}

        {/* Loading overlay */}
        {isLoading && placeholder === "empty" && (
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-muted">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    );
  }
);

Image.displayName = "Image";

export { Image };
