import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller"; // Re-added BestSeller component
import OurPolicy from "../components/OurPolicy";
import NewsLetterBox from "../components/NewsLetterBox";

const Home = () => {
  const { name } = useContext(ShopContext); // Get the name from context

  return (
    <div className="home-container">
      {name && <h1>Welcome, {name}!</h1>}{" "}
      {/* Display the welcome message if name exists */}
      <Hero />
      <LatestCollection />
      <BestSeller />
      <OurPolicy />
      <NewsLetterBox />
    </div>
  );
};

export default Home;
