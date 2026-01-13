from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, Scale, AssessmentRecord
from config import Config
import google.generativeai as genai

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

db.init_app(app)

# 配置 Gemini
genai.configure(api_key=app.config['GEMINI_API_KEY'])
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/api/chat', methods=['POST'])
def chat():
    # TODO: 实现聊天逻辑
    return jsonify({"message": "Chat endpoint ready"})

@app.route('/api/submit', methods=['POST'])
def submit():
    # TODO: 实现提交逻辑
    return jsonify({"message": "Submit endpoint ready"})

@app.route('/api/scales/<int:scale_id>', methods=['GET'])
def get_scale(scale_id):
    scale = Scale.query.get_or_404(scale_id)
    return jsonify({
        "id": scale.id,
        "title": scale.title,
        "description": scale.description,
        "questions": scale.questions
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
