import { ImageOff } from "lucide-react";
import { useState } from "react";

interface EditorialImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
}

export function EditorialImage({
  src,
  alt,
  className,
  imageClassName,
  loading = "lazy",
  fetchPriority,
}: EditorialImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={[
        "overflow-hidden bg-primary-dark",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {failed ? (
        <div
          className="flex h-full min-h-32 items-center justify-center bg-primary-dark text-white/75"
          role="img"
          aria-label={`${alt} image unavailable`}
        >
          <ImageOff aria-hidden="true" className="size-8" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={[
            "h-full w-full object-cover",
            imageClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
