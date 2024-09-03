# app.py
from flask import Flask, request, Response, jsonify
import os
from dotenv import load_dotenv
from flask_cors import CORS
from openai import OpenAI
import pymysql
from datetime import datetime
import json

load_dotenv()  # 加载 .env 文件中的变量

app = Flask(__name__)
CORS(app, origins="*")
apikey = os.getenv("OPENAI_API_KEY")  # 从环境变量中获取 API 密钥
client = OpenAI(api_key=apikey, base_url="https://api.siliconflow.cn/v1")

# 数据库连接函数
def get_db_connection():
    return pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),
        cursorclass=pymysql.cursors.DictCursor
    )

# 数据库更新AI回复函数
def update_ai_response(ssid, seq, content):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
            UPDATE chatfunv1 
            SET chat_content = %s
            WHERE ssid = %s AND sequence = %s AND user = 'ai'
            """
            cursor.execute(sql, (content, ssid, seq))
        conn.commit()
        print("AI response updated in database successfully")
    except Exception as e:
        print(f"Error updating AI response: {e}")
    finally:
        if conn:
            conn.close()

# 数据库插入函数
@app.route("/api/save_message", methods=["POST"])
def save_message():
    message = request.json
    
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
            INSERT INTO chatfunv1 (ssid, user, chat_content, sequence, timestamp)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                message['ssid'],
                message['user'],
                message['content'],
                message['seq'],
                datetime.strptime(message['timestamp'], '%Y/%m/%d %H:%M:%S')
            ))
        conn.commit()
        return jsonify({"status": "success", "message": "Message saved successfully"}), 200
    except Exception as e:
        print(f"Error saving message: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()

# AI 对话接口
@app.route("/api/python", methods=["POST"])
def generate():
    content = request.json.get('content')
    chatHistory = request.json.get('chatHistory')
    print("chatHistory: " + chatHistory)
    
    # 数据库中的chatHistory是字符串，需要转换为json对象
    chat_history_obj = json.loads(chatHistory)
    last_message = chat_history_obj[-1]

    content_with_chatHistory = f"""你的名字是G4，正在与对方沟通。
    之前的对话:
    {chatHistory}

    对方新提出的问题: {content}
    你的回复:"""

    def run_conversation():
        # Step 1: send the conversation and available functions to GPT
        messages = [{"role": "system", "content": "你是友好的AI助手"},
                    {"role": "user", "content": content_with_chatHistory}]

        # 这里full_response存储完整内容，用以数据库存储
        full_response = ""
        for res in client.chat.completions.create(
                model="alibaba/Qwen1.5-7B-Chat",
                messages=messages,
                stream=True
        ):
            delta = res.choices[0].delta
            print("delta: ")
            print(delta)
            print("====================")

            #if 'content' in delta:
            if delta.content:
                full_response += delta.content
                yield delta.content
        
        # 更新数据库中的AI回复
        update_ai_response(last_message['ssid'], last_message['seq'], full_response)


    return Response(run_conversation(), mimetype='text/event-stream')