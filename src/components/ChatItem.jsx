import React from 'react';

const ChatItem = ({ ssid, title, messages, isActive, onClick }) => {
  const lastMessage = messages.length > 0 ? messages[messages.length - 1].content : "";

  return (
    <div 
      className={`p-3 cursor-pointer hover:bg-gray-100 ${isActive ? 'bg-gray-200' : ''}`}
      onClick={() => onClick(ssid)}
    >
      <h3 className="font-semibold text-gray-800 truncate">{title}</h3>
      <p className="text-sm text-gray-500 truncate">{lastMessage}</p>
    </div>
  );
};

export default ChatItem;