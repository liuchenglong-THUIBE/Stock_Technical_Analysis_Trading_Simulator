import os
import pandas as pd

def sort_csv_files():
    # 1. 获取当前脚本所在的文件夹路径
    current_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"正在扫描文件夹: {current_dir}")

    # 2. 获取所有 CSV 文件
    files = [f for f in os.listdir(current_dir) if f.endswith('.csv')]
    
    count = 0
    
    for filename in files:
        # 排除脚本文件自身
        if filename.endswith('.py'):
            continue

        file_path = os.path.join(current_dir, filename)
        
        try:
            # 3. 读取 CSV
            # 尝试 utf-8 和 gbk 两种编码，防止乱码
            try:
                df = pd.read_csv(file_path, encoding='utf-8', dtype=str)
            except UnicodeDecodeError:
                df = pd.read_csv(file_path, encoding='gbk', dtype=str)

            # 检查文件是否为空
            if df.empty:
                print(f"跳过空文件: {filename}")
                continue

            # 4. 获取第一列的列名 (假设第一列是日期)
            date_col_name = df.columns[0]

            # 5. 将第一列转换为 datetime 对象
            # 这一步非常重要！如果不转成时间对象，"2021/10/1" 可能会排在 "2021/2/1" 前面（字符串排序逻辑）
            # errors='coerce' 表示如果遇到无法解析的乱码日期，将其设为 NaT (空时间)
            df['__temp_sort_date__'] = pd.to_datetime(df[date_col_name], errors='coerce')

            # 6. 删除日期解析失败的行 (可选，为了数据干净)
            if df['__temp_sort_date__'].isna().any():
                print(f"警告: {filename} 中存在无法解析的日期，已自动过滤这些行。")
                df = df.dropna(subset=['__temp_sort_date__'])

            # 7. 执行排序 (ascending=True 表示升序，从旧到新)
            df = df.sort_values(by='__temp_sort_date__', ascending=True)

            # 8. 移除临时的排序辅助列
            df = df.drop(columns=['__temp_sort_date__'])

            # 9. 保存覆盖原文件
            # index=False 不保存行号
            df.to_csv(file_path, index=False, encoding='utf-8')
            
            count += 1
            if count % 100 == 0:
                print(f"已排序 {count} 个文件...")

        except Exception as e:
            print(f"处理文件 {filename} 时出错: {e}")

    print(f"\n全部完成！共排序了 {count} 个文件。")

if __name__ == "__main__":
    sort_csv_files()