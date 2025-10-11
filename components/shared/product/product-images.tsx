"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

const ProductImages = ({ images }: { images: string[] }) => {
  const [current, setCurrent] = useState(0);

  return (
    <div className="space-y-4">
      <Image
        src={images[current]}
        alt="product image"
        width={500}
        height={500}
        priority={true}
        className="min-h-[300px] object-cover object-center"
      />
      <div className="flex">
        {images.map((image, index) => (
          <div
            key={index}
            className={cn(
              "border mr-2 hover:border-orange-600",
              current === index && "border-orange-600"
            )}
          >
            <Image
              src={image}
              alt="product image"
              width={100}
              height={100}
              priority={true}
              className="min-h-[50px] object-cover object-center cursor-pointer"
              onClick={() => setCurrent(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImages;
