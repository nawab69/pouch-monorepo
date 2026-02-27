import Image from "next/image";

interface PhoneMockupProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export default function PhoneMockup({
  src,
  alt,
  className = "",
  priority = false,
}: PhoneMockupProps) {
  return (
    <div className={`phone-frame w-[260px] shrink-0 ${className}`}>
      <div className="phone-screen relative aspect-[9/19.5]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="260px"
          priority={priority}
        />
      </div>
    </div>
  );
}
