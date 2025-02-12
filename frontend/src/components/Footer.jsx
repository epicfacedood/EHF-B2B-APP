import React from "react";
import { assets } from "../assets/assets";

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
            <li>Home</li>
            <li>About</li>
            <li>Delivery</li>
            <li>Privacy Policy</li>
          </ul>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">Get in touch</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>+65 6543 2322</li>
            <li>testcompany@gmail.com</li>
          </ul>
        </div>
      </div>
      <div>
        <hr />
        <p className="py-5 text-sm text-center">
          Copyright 2024 @ testcompany.com - All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;
