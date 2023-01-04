from ibapi.client import EClient
from ibapi.wrapper import EWrapper
from ibapi.contract import Contract

import threading
import time
from datetime import datetime
import json
import os
import logging
import log


class MarketDataApp(EWrapper, EClient):
    def __init__(self):
        EClient.__init__(self, self)
        self.ab_price = {
            "ask_price": 0,
            "ask_size": 0,
            "bid_price": 0,
            "bid_size": 0,
            'date': datetime.now().strftime("%H:%M:%S")
        }

        self.symbol = ''

    def tickPrice(self, reqId, tickType, price, attrib):
        if tickType == 1 and reqId == 1:
            logging.info(f'The current {self.symbol} bid price is: {price}, {datetime.now()}')
            self.write_askbid_price('bid_price', price, f'{self.symbol.lower()}_ab.json')
        elif tickType == 2 and reqId == 1:
            logging.info(f'The current {self.symbol} ask price is: , {price}, {datetime.now()}')
            self.write_askbid_price('ask_price', price, f'{self.symbol.lower()}_ab.json')
        elif tickType == 4 and reqId == 1:
            logging.info(f'The current {self.symbol} last price is: , {price}, {datetime.now()}')
            self.write_price_json(price, datetime.now(), f"{self.symbol.lower()}_price.json")
    
    def tickSize(self, reqId, tickType, size):
        if tickType == 0 and reqId == 1:
            logging.info(f'The current {self.symbol} bid size is: , {size}, {datetime.now()}')
            self.write_askbid_price('bid_size', size, f'{self.symbol.lower()}_ab.json')
        elif tickType == 3 and reqId == 1:
            logging.info(f'The current {self.symbol} ask size is: , {size}, {datetime.now()}')
            self.write_askbid_price('ask_size', size, f'{self.symbol.lower()}_ab.json')
        elif tickType == 8 and reqId == 1:
            logging.info(f'The current {self.symbol} volume is: , {size}, {datetime.now()}')            
            self.write_price_json(size, datetime.now(), f"{self.symbol.lower()}_volume.json")
    
    def historicalData(self, reqId, bar):
        logging.info(f'Time: {bar.date} Close: {bar.close}')
    
    def write_askbid_price(self, tickType, value, file_name):
        path = f'json/{file_name}'
        self.ab_price['date'] = datetime.now().strftime("%H:%M:%S")
        self.ab_price[tickType] = value
        json_object = json.dumps(self.ab_price, indent=4)
        with open(path, "w") as outfile:
            outfile.write(json_object)

    
    def write_price_json(self, price, dateTime, file_name):
        # Data to be written
        dictionary = {
            "value": price,
            "date": dateTime.strftime("%H:%M:%S")
        }
        # Serializing json
        json_object = json.dumps(dictionary, indent=4)
        
        # Writing to sample.json
        with open(f"json/{file_name}", "w") as outfile:
            outfile.write(json_object)



def run_loop():
    app.run()

def make_contract(symbol: str, sec_type: str, currency: str, exchange: str):
    contract = Contract()
    contract.symbol = symbol
    contract.secType = sec_type
    contract.currency = currency
    contract.exchange = exchange
    return contract


def disconnect_iba():
    app.disconnect()
    time.sleep(1)
    

def market_data_process(symbol):
    global app
    app = MarketDataApp()
    app.connect('127.0.0.1', 4002, 123)
    app.symbol = symbol
    #Start the socket in a thread
    api_thread = threading.Thread(target=run_loop, daemon=True)
    api_thread.start()

    time.sleep(1) #Sleep interval to allow time for connection to server

    stock_contract = make_contract(symbol, 'STK', 'USD', 'SMART')

    #Request Market Data
    app.reqMktData(1, stock_contract, '', False, False, [])
    # app.reqHistoricalData(1, stock_contract, '', '900 S', '1 secs', 'BID', 0, 2, False, [])

    