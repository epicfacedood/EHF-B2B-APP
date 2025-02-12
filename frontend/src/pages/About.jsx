import React from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import NewsLetterBox from "../components/NewsLetterBox";

const About = () => {
  return (
    <div>
      <div className="text-2xl text-center pt-8 border-t">
        <Title text1={"ABOUT"} text2={"US"} />
      </div>
      <div className="my-10 flex flex-col md:flex-row gap-16">
        <img
          className="w-full md:max-w-[450px]"
          src={assets.about_img}
          alt=""
        />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600">
          <p>
            Yet in another life, I would still be here, wed keep all our
            promises, itd be us against the world.
          </p>
          <p>
            Oh to be free like a bird, to soar amongst the skies without a
            single bit of worry.
          </p>
          <b className="text-gray-800">Our Mission</b>
          <p>
            We want to provide the best quality assurance to our customers as
            possible.
          </p>
        </div>
      </div>

      <div className="text-4xl py-4">
        <Title text1={"WHY"} text2={"CHOOSE US"} />
      </div>
      <div className="flex flex-col md:flex-row text-sm mb-20">
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Quality Assurance:</b>
          <p>
            We iterate through all our products to make sure that it is up to
            the most stringent of quality control measures.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Convenience:</b>
          <p>
            We iterate through all our products to make sure that it is up to
            the most stringent of quality control measures.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Exceptional Customer Service</b>
          <p>
            We iterate through all our products to make sure that it is up to
            the most stringent of quality control measures.
          </p>
        </div>
      </div>

      <NewsLetterBox />
    </div>
  );
};

export default About;
