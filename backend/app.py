from flask import Flask
from flask_socketio import SocketIO
from boat_simulator import BoatSimulator
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Global simulator instance
simulator = None

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

@socketio.on('update_pgn')
def handle_pgn_update(data):
    global simulator
    if simulator:
        pgn_id = data.get('pgn_id')
        parameter = data.get('parameter')
        value = data.get('value')
        simulator.boat_state.update_pgn_value(pgn_id, parameter, value)

if __name__ == "__main__":
    socketio.run(app, debug=True, host='0.0.0.0', port=5001, allow_unsafe_werkzeug=True)