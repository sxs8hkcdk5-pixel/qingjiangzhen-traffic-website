#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清江镇交通安全网站 - 后端服务器 (无外部依赖版)
运行：python3 server.py
访问：http://127.0.0.1:8000
"""
import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import csv
import time

# 配置项
DATA_FILE = 'traffic_data.json'  # 数据存储文件
ADMIN_PASSWORD = 'qingjiang123456'      # **【重要】请务必修改这个初始密码！**
PORT = 8000                      # 服务器端口

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """处理GET请求：提供网页或数据查询"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # 1. 根路径 -> 主页
        if path == '/':
            self.serve_file('index.html', 'text/html')
        # 2. 管理员页面
        elif path == '/admin.html':
            self.serve_file('admin.html', 'text/html')
        # 3. 数据查询API
        elif path == '/api/data':
            self.handle_data_query(parsed_path.query)
        # 4. 数据导出API
        elif path == '/api/export':
            self.handle_data_export()
        # 5. 静态文件 (如CSS/JS，本例中已内联，此分支备用)
        else:
            self.send_error(404, "File not found")

    def do_POST(self):
        """处理POST请求：接收表单提交"""
        if self.path == '/api/submit':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(post_data)
                data['submit_time'] = data.get('submit_time', time.strftime('%Y-%m-%d %H:%M:%S'))
                self.save_data(data)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = json.dumps({'success': True, 'message': '提交成功'})
                self.wfile.write(response.encode('utf-8'))
            except Exception as e:
                self.send_error(500, f"数据处理错误: {str(e)}")
        else:
            self.send_error(404)

    def serve_file(self, filename, content_type):
        """读取并发送HTML文件"""
        try:
            with open(filename, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-type', content_type)
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404, f"文件 {filename} 不存在")

    def save_data(self, new_record):
        """将单条记录保存到JSON文件"""
        records = []
        # 读取现有数据
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    records = json.load(f)
            except json.JSONDecodeError:
                records = []
        # 追加新记录
        records.append(new_record)
        # 写回文件
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)

    def load_data(self):
        """从JSON文件加载所有数据"""
        if not os.path.exists(DATA_FILE):
            return []
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []

    def handle_data_query(self, query_string):
        """处理数据查询请求，支持关键词搜索"""
        records = self.load_data()
        # 解析查询参数
        params = parse_qs(query_string)
        search_term = params.get('search', [''])[0].lower()
        # 过滤数据
        if search_term:
            filtered = []
            for r in records:
                # 在多个字段中搜索关键词
                match_fields = [
                    str(r.get('inspector_name', '')),
                    str(r.get('plate_number', '')),
                    str(r.get('id_card', '')),
                    str(r.get('phone', ''))
                ]
                if any(search_term in field.lower() for field in match_fields):
                    filtered.append(r)
            records = filtered
        # 返回JSON
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(records, ensure_ascii=False).encode('utf-8'))

    def handle_data_export(self):
        """将数据导出为CSV格式文件供下载"""
        records = self.load_data()
        if not records:
            self.send_error(404, "No data to export")
            return
        # 创建CSV内容
        output = []
        # 表头
        if records:
            headers = records[0].keys()
            output.append(','.join(headers))
        # 数据行
        for r in records:
            row = [str(r.get(h, '')).replace(',', '，') for h in headers]  # 替换逗号避免冲突
            output.append(','.join(row))
        csv_content = '\n'.join(output)
        # 发送响应
        self.send_response(200)
        self.send_header('Content-type', 'text/csv')
        self.send_header('Content-Disposition', 'attachment; filename="traffic_data_export.csv"')
        self.end_headers()
        self.wfile.write(csv_content.encode('utf-8'))

    def log_message(self, format, *args):
        """重写日志方法，使输出更简洁"""
        # 可以取消下面一行的注释来查看访问日志
        # print(f"{self.address_string()} - {format % args}")
        pass

def main():
    """启动服务器"""
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f"服务器已启动，访问地址：http://127.0.0.1:{PORT}")
    print(f"数据文件：{DATA_FILE}")
    print(f"管理员初始密码：{ADMIN_PASSWORD} （请尽快在后台修改！）")
    print("按 Ctrl+C 停止服务器")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
        httpd.server_close()

if __name__ == '__main__':
    main()