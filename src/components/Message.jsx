import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism'
import Image from 'next/image'

export default function Message({ user, content }) {
  return (
    <div className={`flex ${user ? 'flex-row-reverse' : ''}`}>
      <div className='min-w-[40px] min-h-[40px]'>
        <Image 
          src={user ? '/me.png' : '/robot_ai.png'}
          className="rounded-full"
          width={40}
          height={40}
          alt="avatar"
        />
      </div>
  
      <div className={`flex flex-col ${user ? 'mr-3 ml-14' : 'mr-14 ml-3'}`}>
        <div className={`px-4 rounded-lg shadow-lg md:max-w-fit ${user ? 'bg-green-500 text-white' : 'bg-white text-black'}`}>
          <ReactMarkdown 
            className='markdown' 
            rehypePlugins={[rehypeRaw]} 
            remarkPlugins={[remarkGfm]} 
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    {...props}
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    wrapLongLines={true}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code {...props} className={className}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        <div className='mb-8'></div>
      </div>
    </div>
  )
}