# 1. 使用 Python 基础镜像
FROM python:3.9-slim

# 2. 设置工作目录
WORKDIR /app

# 3. 安装 Node.js (为了在服务器上编译前端)
RUN apt-get update && apt-get install -y nodejs npm

# 4. 复制依赖文件并安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 复制前端文件并构建
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# 6. 回到根目录，复制剩余所有文件 (包括后端代码和 stockinfo)
WORKDIR /app
COPY . .

# 7. 把前端生成的 dist 文件夹移动到根目录，方便 main.py 读取
RUN mv frontend/dist ./dist

# 8. 暴露端口 (Render 默认使用 10000，但我们可以通过环境变量控制)
EXPOSE 8000

# 9. 启动命令
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]