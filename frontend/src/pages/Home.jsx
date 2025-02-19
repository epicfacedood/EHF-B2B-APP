import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller"; // Re-added BestSeller component
import OurPolicy from "../components/OurPolicy";
import NewsLetterBox from "../components/NewsLetterBox";
import WelcomeUser from "../components/WelcomeUser";
import BrandCarousel from "../components/BrandCarousel";

const Home = () => {
  const { name } = useContext(ShopContext); // Get the name from context

  return (
    <div className="home-container">
      <WelcomeUser />
      <Hero />
      <BrandCarousel />

      <LatestCollection />
      <BestSeller />
      <OurPolicy />
      <NewsLetterBox />
    </div>
  );
};

export default Home;
