from typing import List, Optional
from pydantic import BaseModel

class StockData(BaseModel):
    """
    单根K线的数据模型
    对应 CSV 文件中的每一行数据
    """
    date: str
    open: float
    close: float
    high: float
    low: float
    change_pct: float
    volume: float
    turnover_rate: float
    pe: float
    pb: float

class GameInitResponse(BaseModel):
    """
    游戏初始化时的响应模型
    包含一只股票的完整（或切片后）的历史数据，以及游戏的起始位置
    """
    ticker: str                 # 股票代码/文件名 (例如 "000001")
    data: List[StockData]       # K线数据列表
    start_index: int            # 关键字段：用户指定的 start_date 在 data 数组中的索引位置
                                # 前端应该从 data[start_index] 开始进行模拟交易
                                # data[0] 到 data[start_index-1] 是用于展示背景趋势的历史数据

    class Config:
        # 允许从 ORM 或 字典 转换
        from_attributes = True