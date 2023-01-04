from flask import Flask, render_template, request
from flask_socketio import SocketIO
from random import random
from threading import Lock
from datetime import datetime
import json
import chart
import logging
import log

"""
Background Thread
"""
thread = None
thread_lock = Lock()

ticker = "TSLA"

app = Flask(__name__)
app.config['SECRET_KEY'] = 'donsky!'
socketio = SocketIO(app, cors_allowed_origins='*')


def background_thread():
    while True:
        try:
            price_data = read_json(f'{ticker.lower()}_price.json')
        except:
            continue
        socketio.emit('updatePriceData', {'value': price_data['value'], "date": price_data['date']})
        socketio.emit('updateHistogramData', {'value': price_data['value'], "date": price_data['date']})
        
        try:
            volume_data = read_json(f'{ticker.lower()}_volume.json')
        except:
            continue
        socketio.emit('updateVolumeData', {'value': volume_data['value'], "date": volume_data['date']})

        try:
            ab_json = read_json(f'{ticker.lower()}_ab.json')
        except:
            continue
        
        if (ab_json['ask_size'] + ab_json['bid_size']) > 0:
            vwap = (ab_json['ask_price'] * ab_json['ask_size'] + ab_json['bid_price'] * ab_json['bid_size']) / (ab_json['ask_size'] + ab_json['bid_size'])
        else:
            vwap = (ab_json['ask_price'] + ab_json['bid_price']) / 2

        socketio.emit('updateVwapData', {'value': vwap, "date": ab_json['date']})
        socketio.emit('updateOrderbookData', {'value': ab_json})
        
        socketio.sleep(1)

def read_json(file_name):
    with open(f'json/{file_name}', 'r') as openfile:
        json_object = json.load(openfile)
        return json_object

"""
Serve root index file
"""
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/tickerChange', methods=['POST'])
def ticker_change():
    global ticker
    jsdata = request.form['ticker_search']
    ticker = json.loads(jsdata)['value']
    chart.disconnect_iba()
    chart.market_data_process(ticker)
    return {'value': True}

"""
Decorator for connect
"""
@socketio.on('connect')
def connect():
    global thread
    logging.warning('Client connected')

    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(background_thread)

"""
Decorator for disconnect
"""
@socketio.on('disconnect')
def disconnect():
    logging.warning('Client disconnected',  request.sid)

if __name__ == '__main__':
    chart.market_data_process('TSLA')
    socketio.run(app)