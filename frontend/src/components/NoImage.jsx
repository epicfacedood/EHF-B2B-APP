import React from "react";
import PropTypes from "prop-types";

const NoImage = ({ pcode = "", name = "" }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
      <div className="text-center">
        <p className="text-xs">{pcode}</p>
        <p className="text-xs truncate">{name}</p>
      </div>
    </div>
  );
};

NoImage.propTypes = {
  pcode: PropTypes.string,
  name: PropTypes.string,
};

export default NoImage;
