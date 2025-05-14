import React from 'react';
import './LinearProgress.css';

interface LinearProgressProps {
  percentage: number;
}

const LinearProgress: React.FC<LinearProgressProps> = ({ percentage }) => {
  return (
    <div className="linear-progress">
      <div className="linear-progress__track">
        <div 
          className="linear-progress__dot"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default LinearProgress; 