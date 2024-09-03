'use client'

import Image from 'next/image';
import { useState } from 'react';

// 搜索功能
export default function SearchInput({onSearch}) {

    const [searchQuery, setSearchQuery] = useState('');
    
    // 函数部分
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch(query);
    };

    const clearSearch = () => {
        setSearchQuery('');
        onSearch('');
    };
   
  
    return (
      <div className="flex-1 justify-between items-center h-10 flex rounded-lg border">
          <input 
              type="text"
              className="h-full border-none outline-none pl-3" 
              placeholder="搜索"
              value={searchQuery}
              onChange={handleSearchChange}
          />
          {searchQuery && (
              <span onClick={clearSearch} className="cursor-pointer mr-1">
                  ×
              </span>
          )}
          <Image 
              src="search.svg"
              className="w-5 h-5 mr-1" 
              width={20}
              height={20}
              alt="search-icon" 
          />
      </div>  
    )
}
