import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

import manipalImg from "./images/manipal.jpeg";
import bangaloreImg from "./images/bangalore.jpeg";
import mumbaiImg from "./images/mumbai.jpg";
import goaImg from "./images/goa.jpeg";
import delhiImg from "./images/delhi.jpg";
import puneImg from "./images/pune.jpg";

const CITIES = [
  { name: "Manipal", lat: 13.3525, lon: 74.7934, img: manipalImg },
  { name: "Bangalore", lat: 12.9716, lon: 77.5946, img: bangaloreImg },
  { name: "Mumbai",lat: 19.0760, lon: 72.8777, img: mumbaiImg },
  { name: "Goa", lat: 15.2993, lon: 74.1240, img: goaImg },
  { name: "Delhi",lat: 28.6139, lon: 77.2090, img: delhiImg },
  { name: "Pune",lat: 18.5204, lon: 73.8567, img: puneImg },
];

function Cities() {
  const navigate = useNavigate();
  const savedCity = localStorage.getItem("selectedCity");

  const selectCity = (city) => {
    localStorage.setItem("selectedCity", JSON.stringify(city));
    navigate("/dashboard");
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <p className="page-eyebrow">Explore</p>
          <h1 className="page-title">Choose your city</h1>
          <p className="page-subtitle">
            Switch cities to discover places wherever you are.
          </p>
        </div>

        <div className="cities-grid">
          {CITIES.map((city) => {
            const isSelected =
              savedCity && JSON.parse(savedCity).name === city.name;
            return (
              <button
                key={city.name}
                className={`city-card ${isSelected ? "selected" : ""}`}
                style={{ backgroundImage: `url(${city.img})` }}
                onClick={() => selectCity(city)}
              >
                <span className="city-card-overlay">
                  
                  <span className="city-card-name">{city.name}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Cities;