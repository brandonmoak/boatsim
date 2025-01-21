from flask import Flask, render_template
from flask_socketio import SocketIO
import threading
import time
from boat_simulator import BoatState, BoatSimulator

app = Flask(__name__)
socketio = SocketIO(app)

# Global simulator instance
simulator = None

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('start_simulation')
def handle_start():
    global simulator
    if simulator is None:
        simulator = BoatSimulator(socketio)
        simulator.start()

@socketio.on('stop_simulation')
def handle_stop():
    global simulator
    if simulator:
        simulator.stop()
        simulator = None

if __name__ == "__main__":
    socketio.run(app, debug=True, host='0.0.0.0', port=5001, allow_unsafe_werkzeug=True)