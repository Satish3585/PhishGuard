from flask import Flask, render_template, request, jsonify
import sqlite3
import datetime
from utils.url_checker import check_url
from utils.email_checker import check_email

app = Flask(__name__)
DATABASE = 'database.db'

def init_db():
    """Initialize the SQLite database."""
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                input_data TEXT NOT NULL,
                result TEXT NOT NULL,
                score INTEGER NOT NULL,
                timestamp TEXT NOT NULL
            )
        ''')
        conn.commit()

@app.route('/')
def index():
    """Serve the main dashboard."""
    return render_template('index.html')

@app.route('/check-url', methods=['POST'])
def api_check_url():
    """API endpoint to check a URL."""
    data = request.get_json()
    url = data.get('url', '')
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400
        
    result = check_url(url)
    save_scan('URL', url, result['status'], result['score'])
    return jsonify(result)

@app.route('/check-email', methods=['POST'])
def api_check_email():
    """API endpoint to check email content."""
    data = request.get_json()
    email_content = data.get('email', '')
    
    if not email_content:
        return jsonify({'error': 'Email content is required'}), 400
        
    result = check_email(email_content)
    save_scan('Email', email_content[:100] + '...' if len(email_content) > 100 else email_content, result['status'], result['score'])
    return jsonify(result)

@app.route('/history', methods=['GET'])
def api_history():
    """API endpoint to fetch recent scans."""
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT type, input_data, result, score, timestamp FROM scans ORDER BY id DESC LIMIT 10')
        rows = cursor.fetchall()
        
        history = []
        for row in rows:
            history.append({
                'type': row[0],
                'input': row[1],
                'result': row[2],
                'score': row[3],
                'timestamp': row[4]
            })
            
    return jsonify({'history': history})

def save_scan(scan_type, input_data, result, score):
    """Helper to save scan results to the database."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO scans (type, input_data, result, score, timestamp) VALUES (?, ?, ?, ?, ?)',
            (scan_type, input_data, result, score, timestamp)
        )
        conn.commit()

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=8080)
