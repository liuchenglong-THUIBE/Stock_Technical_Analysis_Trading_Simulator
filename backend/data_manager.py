import os
import random
import pandas as pd
import numpy as np
from datetime import datetime
from .schemas import GameInitResponse

class StockService:
    def __init__(self, data_dir: str = "stockinfo"):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.data_dir = os.path.join(self.base_dir, data_dir)
        
        if not os.path.exists(self.data_dir):
            raise FileNotFoundError(f"数据文件夹不存在: {self.data_dir}")
            
        self.csv_files = [f for f in os.listdir(self.data_dir) if f.endswith('.csv')]
        if not self.csv_files:
            raise FileNotFoundError("没有找到CSV文件")

    def get_random_stock(self) -> GameInitResponse:
        """
        随机选股 + 随机选日期（满足约束条件）
        约束1: 日期 > 2016-01-01
        约束2: 该日期前至少有 60 条数据
        约束3: 该日期后至少有 500 条数据 (修改点：从250改为500)
        """
        max_retries = 100  # 保持较高的重试次数
        
        for _ in range(max_retries):
            filename = random.choice(self.csv_files)
            file_path = os.path.join(self.data_dir, filename)
            ticker = filename.replace(".csv", "")

            try:
                # 读取数据
                try:
                    df = pd.read_csv(file_path, encoding='utf-8')
                except UnicodeDecodeError:
                    df = pd.read_csv(file_path, encoding='gbk')

                # 清洗列名
                df.columns = [c.strip() for c in df.columns]
                if 'date' not in df.columns: continue

                # 处理日期
                df['date_dt'] = pd.to_datetime(df['date'], errors='coerce')
                df = df.dropna(subset=['date_dt']).reset_index(drop=True)
                
                # --- 核心随机逻辑 ---
                
                # 1. 找到 2016-01-01 的索引位置
                start_date_threshold = datetime(2016, 1, 1)
                valid_date_mask = df['date_dt'] > start_date_threshold
                
                if not valid_date_mask.any():
                    continue 

                first_valid_idx_by_date = df[valid_date_mask].index[0]

                # 2. 计算满足 "前60 后500" 的索引范围
                min_idx = max(first_valid_idx_by_date, 60) 
                
                # 最大索引 (Max Index): 总长度 - 500 (修改点：预留500个交易日)
                max_idx = len(df) - 500

                if min_idx >= max_idx:
                    # 这只股票数据长度不足以支撑 "前60+后500" 的玩法
                    continue

                # 3. 在合法范围内随机选一个索引作为 "游戏开始天"
                target_idx = random.randint(min_idx, max_idx)

                # --- 历史回溯切片 ---
                lookback_days = 300 
                slice_start_idx = max(0, target_idx - lookback_days)
                
                # 切片
                df_slice = df.iloc[slice_start_idx:].copy()
                
                # 计算前端开始的位置
                relative_start_index = target_idx - slice_start_idx

                # 数据清洗 (填补NaN)
                cols_to_numeric = ['open', 'close', 'high', 'low', 'volume', 'change_pct', 'pe', 'pb', 'turnover_rate']
                for col in cols_to_numeric:
                    if col in df_slice.columns:
                        df_slice[col] = pd.to_numeric(df_slice[col], errors='coerce').fillna(0)
                    else:
                        df_slice[col] = 0

                df_slice['date'] = df_slice['date_dt'].dt.strftime('%Y-%m-%d')
                if 'date_dt' in df_slice.columns:
                    df_slice = df_slice.drop(columns=['date_dt'])
                
                data_list = df_slice.to_dict(orient='records')
                
                print(f"✅ 选中股票: {ticker}, 开始日期: {data_list[relative_start_index]['date']}, 剩余数据量: {len(data_list) - relative_start_index}")
                
                return GameInitResponse(
                    ticker=ticker,
                    data=data_list,
                    start_index=relative_start_index
                )

            except Exception as e:
                print(f"❌ 读取 {filename} 错误: {e}")
                continue
        
        raise Exception("尝试多次未找到满足条件(2016后, 前60后500数据)的股票，请检查数据源是否充足。")