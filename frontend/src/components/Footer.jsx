import React from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <div>
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        <div>
          <img src={assets.logo} className="mb-5 w-32" alt="" />
          <p className="w-full md:w-2/3 text-gray-600">
            We are one of the leading food supply and distribution companies in
            Singapore, with over 17 years of dedicated expertise. Our expertise
            and experience in this field has allowed us to build an extensive
            catalogue of high quality ingredients to cater to your needs, and we
            pride ourselves on long term and strong partnerships with some of
            the world’s finest food suppliers and producers.
          </p>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <Link to={"/"}>
              <li>Home</li>
            </Link>
            <Link to={"/about"}>
              <li>About</li>
            </Link>
            <Link to={"/delivery"}>
              <li>Delivery</li>
            </Link>
            <Link to={"/privacy-policy"}>
              <li>Privacy Policy</li>
            </Link>
          </ul>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">Get in touch</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>+65 6779 1748</li>
            <li>5 Jalan Tepong Singapore 619325</li>
          </ul>
        </div>
      </div>
      <div>
        <hr />
        <p className="py-5 text-sm text-center">
          Copyright 2025 @ Eastern Harvest Pte Ltd - All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;
