
from flask import Flask, request, jsonify, send_file, render_template
import requests

app = Flask(__name__)

PC_IP = "192.168.1.26"

@app.route("/")
def home():
    # Esto carga el archivo desde la carpeta /templates/
    return render_template("index.html")

@app.route("/model.vrm")
def model():
    return send_file("HatsuneMikuNT.vrm")

@app.route("/chat", methods=["POST"])
def chat():
    msg = request.json["message"]
    try:
        response = requests.post(
            f"http://{PC_IP}:11434/api/generate",
            json={"model": "qwen2.5:14b", "prompt": msg, "stream": False}
        )
        return jsonify({"response": response.json()["response"]})
    except:
        return jsonify({"response": "Error: No pude conectar con Ollama."})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

##holaaaaaa