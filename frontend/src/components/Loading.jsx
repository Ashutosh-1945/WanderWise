const Loading = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-4 border border-gray-700">
          <div className="w-14 h-14 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-semibold text-gray-300">Loading, please wait...</p>
        </div>
      </div>
    );
  };
  
  export default Loading;
  