'use client'

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';
import Image from "next/image";
import ChatHeader from '../components/ChatHeader';
import Message from '../components/Message';
import TextInput from '../components/TextInput';
import ChatItem from '../components/ChatItem';
import SearchInput from '../components/SearchInput';

// 1 全局变量
const bjtime = new Date().toLocaleString();

export default function Home() {

  // 2 ref部分
  const uuid = useRef(uuidv4());
  const sequenceRef = useRef(0);  // 使用 useRef 来跟踪序列号
  const titleCount = useRef(1);  // 使用 useRef 来跟踪标题

  // 2 state部分
  const [messages, setMessages] = useState([{ ssid:uuid.current, seq:sequenceRef.current, user: 'ai', content: "有什么可以帮你的？", timestamp: bjtime }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeChatId, setActiveChatId] = useState(uuid.current);
  const [activeTitle, setActiveTitle] = useState("对话1");  // 新增：跟踪当前活动对话的标题
  //搜索state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSSIDs, setFilteredSSIDs] = useState([]);

  // 3 function部分
  // 3.1 新建对话函数
  const startNewChat = () => {
    const newUuid = uuidv4();
    uuid.current = newUuid; // 更新uuid
    sequenceRef.current = 0;  // 重置序列号
    // 更新标题
    titleCount.current += 1;
    const newTitle = `对话${titleCount.current}`;
    setActiveTitle(newTitle); 
    // 更新消息
    const newInitialMessage = { 
      ssid: uuid.current, 
      seq: sequenceRef.current, 
      user: 'ai', 
      content: "有什么可以帮你的？", 
      timestamp: new Date().toLocaleString() 
    };
    setMessages(prevMessages => [...prevMessages, newInitialMessage]);
    setActiveChatId(newUuid);
  };


  // 3.2 获取AI回复
  const getAIResponse = async (content, chatHistory) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const chatHistoryStr = JSON.stringify(chatHistory);
      const response = await fetch("http://127.0.0.1:5328/api/python", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content, chatHistory: chatHistoryStr }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        accumulatedText += chunk;
        // 更新AI消息
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], content: accumulatedText };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error occurred while generating:", error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3.3 保存消息到数据库
  const saveMessageToDatabase = async (message) => {
    try {
      const response = await fetch("http://127.0.0.1:5328/api/save_message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save message to database');
      }
      
      // const result = await response.json();
      // console.log("Message saved to database:", result);
    } catch (error) {
      console.error("Error saving message to database:", error);
    }
  };

  // 3.4 用户发送消息
  const handleSendMessage = (text) => {
    sequenceRef.current += 1;  // 增加序列号
    const newUserMessage = { ssid:activeChatId, seq:sequenceRef.current, user: 'user', content: text, timestamp: bjtime };
    sequenceRef.current += 1;  // 再次增加序列号
    const newAiMessage = { ssid:activeChatId, seq:sequenceRef.current, user: 'ai', content: '', timestamp: bjtime };
    const updatedMessages = [...messages, newUserMessage, newAiMessage];
    setMessages(updatedMessages);
    console.log("after userInput, messages:", updatedMessages);

    // 保存用户消息到数据库
    saveMessageToDatabase(newUserMessage);
    saveMessageToDatabase(newAiMessage);

    // AI回复
    getAIResponse(text, updatedMessages);
  };

  // 3.5 搜索功能
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
        const filtered = uniqueSSIDs.filter(ssid => {
            const chatMessages = messages.filter(message => message.ssid === ssid);
            return chatMessages.some(message => 
                message.content.toLowerCase().includes(query.toLowerCase())
            );
        });
        setFilteredSSIDs(filtered);
    } else {
        setFilteredSSIDs([]);
    }
  };

  // 选择对话
  const switchChat = (ssid,title) => {
    setActiveChatId(ssid);
    setActiveTitle(title);  // 更新活动标题
  };

  // 获取所有唯一的 ssid
  const uniqueSSIDs = [...new Set(messages.map(message => message.ssid))];
  const displaySSIDs = searchQuery ? filteredSSIDs : uniqueSSIDs; //// 决定显示哪些 SSIDs

  // 4 UI部分
  return (
    <div className="flex h-screen">
      {/* 左侧区块 */}
      <div className="bg-white overflow-auto h-screen relative hidden md:block md:w-[300px]" id="leftSidebar">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-2">
          <h1 className="text-3xl font-bold text-pink-500">ChatFUN</h1>
          {/* 开始新对话 */}
          <button onClick={startNewChat}>
             <Image src="new.svg" width={20} height={20} alt="Start new chat"/>
          </button>
        </div>

        {/* 搜索框 */}
        <div className="px-4 flex items-center justify-between mb-4">
          <SearchInput onSearch={handleSearch} />
        </div>

        {/* 聊天列表 */}
        <div className="overflow-y-auto">
          {displaySSIDs.map((ssid) => {
            const chatMessages = messages.filter(message => message.ssid === ssid);
            const title = `对话${uniqueSSIDs.indexOf(ssid) + 1}`;
            return (
              <ChatItem
                key={ssid}
                ssid={ssid}
                title={title}
                messages={chatMessages}
                isActive={ssid === activeChatId}
                onClick={() => switchChat(ssid, title)}
              />
            );
          })}
        </div>
      </div>

      {/* 右侧区块 */}
      <div className="flex flex-1 flex-col bg-gray-100 h-screen">
        {/* 聊天标题 */}
        <div className='flex-shrink-0'>
          <ChatHeader chatTitle={activeTitle}/>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-auto p-4">
          {messages
            .filter(message => message.ssid === activeChatId)
            .map((message) => (
              <Message key={`${message.ssid}-${message.seq}`} user={message.user === 'user'} content={message.content} />
          ))}
        </div>

        {/* 底部输入框 */}
        <div className="w-full border-t p-4">
          <TextInput onSend={handleSendMessage} />
        </div>
      </div>
    </div>  
  );
}