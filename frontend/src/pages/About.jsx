import React from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";

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
          alt="About Us"
        />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600">
          <p>
            At Eastern Harvest, we are committed to providing the highest
            quality meats and seafood from around the globe. With over 17 years
            of dedicated expertise, we pride ourselves on our long-term
            partnerships with some of the world's finest food suppliers and
            producers.
          </p>
          <p>
            Our mission is to ensure that our customers receive the best quality
            assurance possible, while also providing tailored solutions to meet
            their culinary needs.
          </p>
          <b className="text-gray-800">Our Mission</b>
          <p>
            We strive to deliver exceptional quality and service, ensuring that
            every product meets our stringent quality control measures.
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
            We meticulously inspect all our products to ensure they meet the
            highest quality standards.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Convenience:</b>
          <p>
            Our integrated food supply, processing, and distribution services
            make it easy for you to access the best products.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Exceptional Customer Service:</b>
          <p>
            Our dedicated team is here to assist you with any inquiries and
            ensure a seamless experience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
