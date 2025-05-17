import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn(
      "User tried to access a page that isn't live yet:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-white px-4">
      <div className="text-center p-10 bg-white shadow-xl rounded-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-indigo-600 mb-4">
          🚧 Something exciting is on the way!
        </h1>
        <p className="text-lg text-gray-700 mb-2">
          The page <span className="font-mono text-indigo-500">{location.pathname}</span> isn’t ready just yet.
        </p>
        <p className="text-gray-500 mb-6">
          We're working hard behind the scenes to bring this to life. Stay tuned!
        </p>
        <a
          href="/"
          className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition duration-300"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
