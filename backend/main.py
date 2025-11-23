# backend/main.py

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # 新增
from fastapi.responses import FileResponse  # 新增
from .data_manager import StockService
from .schemas import GameInitResponse

app = FastAPI(title="Stock Simulator")

# CORS 配置保持不变 (开发环境需要)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化服务
try:
    # 注意：在Docker里，路径可能需要调整，但这里我们用相对路径保持兼容
    service = StockService(data_dir="stockinfo")
    print(f"成功初始化服务，发现 {len(service.csv_files)} 个文件")
except Exception as e:
    print(f"初始化失败: {e}")

# API 路由保持不变
@app.get("/api/new-game", response_model=GameInitResponse)
async def start_new_game():
    try:
        return service.get_random_stock()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- 新增：挂载前端静态文件 (必须放在 API 路由之后) ---
# 获取前端构建产物的路径 (假设部署时 dist 文件夹在根目录)
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")

if os.path.exists(frontend_dist):
    # 1. 挂载静态资源 (js, css, images)
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    # 2. 捕获所有其他路径，返回 index.html (SPA 单页应用必须这样做)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        return FileResponse(os.path.join(frontend_dist, "index.html"))