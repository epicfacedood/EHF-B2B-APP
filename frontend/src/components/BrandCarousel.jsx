import React, { useEffect, useState } from "react";

const BrandCarousel = () => {
  const [position, setPosition] = useState(0);

  // Get all brand images from the public directory
  const brandImages = Array.from(
    { length: 10 },
    (_, i) => `/carouselImages/brand${i + 1}.png`
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => prev - 1);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-white py-16">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-semibold text-gray-800">Our Brands</h2>
      </div>
      <div className="max-w-[1200px] mx-auto overflow-hidden">
        <div
          className="flex gap-8"
          style={{
            transform: `translateX(${position}px)`,
            transition: "transform 0.03s linear",
          }}
        >
          {/* Repeat the images three times for smooth infinite scroll */}
          {[...Array(3)].map((_, setIndex) => (
            <div key={setIndex} className="flex gap-8 min-w-max">
              {brandImages.map((src, index) => (
                <div
                  key={`${setIndex}-${index}`}
                  className="w-[200px] flex-shrink-0"
                >
                  <img
                    src={src}
                    alt={`Brand ${index + 1}`}
                    className="h-40 w-full object-contain"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandCarousel;
