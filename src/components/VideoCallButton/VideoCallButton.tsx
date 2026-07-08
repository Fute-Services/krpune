import { FaVideo } from 'react-icons/fa6';

const VideoCallButton = () => {
  const handleClick = () => {
    window.location.href = 'https://teams.microsoft.com/';
  };

  return (
    <button
      onClick={handleClick}
      className="floating-btn"
    >
      <FaVideo className="text-white text-xl" />
    </button>
  );
};

export default VideoCallButton;

