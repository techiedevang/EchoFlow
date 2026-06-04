from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.api_core.exceptions import GoogleAPICallError # Correct exception for reliable error handling
from pymongo import MongoClient
from datetime import datetime, UTC
from bson import json_util
import os
import logging
import time

# --- Configuration ---

# Set up logging (only log errors)
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# CORS Configuration for production
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://echoflow-frontend.onrender.com",
    "https://echoflow-backend.onrender.com"
]

CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "max_age": 3600
    }
})

app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
app.config['ENV'] = os.getenv("FLASK_ENV", "production")

# --- Global Variables for Retry Logic ---
MAX_RETRIES = 5
BASE_DELAY = 1  # Seconds to wait before first retry

# --- Database Connection (MongoDB) ---
try:
    MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
    MONGO_DB = os.getenv("MONGO_DB", "echoflow")
    
    if not MONGO_URI or not MONGO_DB:
        raise ValueError("MongoDB configuration missing")
    
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    user_progress_collection = db["user_progress"]
    
    client.admin.command('ping')
    logger.info("MongoDB connection successful.")

except Exception as e:
    logger.error(f"MongoDB connection failed: {str(e)}")
    raise

# --- Gemini API Configuration ---
try:
    GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise ValueError("Gemini API key missing")
    
    # Initialize the new Client
    client_gemini = genai.Client(api_key=GEMINI_API_KEY)
    
    MODEL_NAME = "gemini-2.5-flash"  # Default reliable model
    
    logger.info("Gemini API configured.")
except Exception as e:
    logger.error(f"Gemini API configuration failed: {str(e)}")
    raise

# --- Utility Function for Exponential Backoff ---
def call_gemini_with_retry(prompt: str):
    """
    Calls the Gemini API with exponential backoff for transient errors (like 503).
    """
    for i in range(MAX_RETRIES):
        try:
            response = client_gemini.models.generate_content(
                model=MODEL_NAME,
                contents=prompt
            )
            return response.text
        
        # Catch standard Google API call errors
        except GoogleAPICallError as e: 
            error_message = str(e)
            
            # Check for the 503 UNAVAILABLE status code (transient overload)
            if "503" in error_message or "UNAVAILABLE" in error_message:
                if i == MAX_RETRIES - 1:
                    logger.error(f"Gemini API failed after {MAX_RETRIES} retries. Last error: {error_message}")
                    raise 
                
                # Exponential backoff calculation
                delay = BASE_DELAY * (2**i) 
                logger.warning(f"Gemini model overloaded (503). Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                # For non-retryable errors (400, 404), raise immediately
                raise
        except Exception as e:
            # Catch other unexpected exceptions
            raise 
    
    return "" 


# --- API Routes ---

@app.route('/')
def home():
    return jsonify({"message": "EchoFlow API is running!"}), 200

@app.route('/api/voice-assistant', methods=['POST'])
def voice_assistant():
    try:
        data = request.json
        user_id = data.get("user_id")
        user_text = data.get("text", "")

        if not user_id or not user_text:
            return jsonify({"error": "User ID and text are required"}), 400

        prompt = f"""You are Alex, a friendly and supportive AI voice assistant created by Team EchoFlow for speech therapy. 
        Respond to: {user_text}

        Guidelines:
        - Be warm, encouraging, and patient
        - Give concise responses (under 50 words)
        - Help with speech therapy and communication improvement
        - Provide pronunciation practice and feedback
        - Be a supportive friend in the user's speech therapy journey"""

        ai_response = call_gemini_with_retry(prompt)

        user_progress_collection.update_one(
            {"user_id": user_id},
            {"$push": {"voice_assistant_conversations": {
                "user_text": user_text,
                "ai_response": ai_response,
                "timestamp": datetime.now(UTC),
            }}},
            upsert=True
        )

        return jsonify({
            "response": ai_response,
        }), 200

    except Exception as e:
        logger.error(f"Error in voice_assistant endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/voice-assistant/history/<user_id>', methods=['GET'])
def get_voice_assistant_history(user_id):
    try:
        user_data = user_progress_collection.find_one({"user_id": user_id})

        if not user_data or "voice_assistant_conversations" not in user_data:
            return jsonify({"message": "No conversations found", "conversations": []}), 200

        conversations = user_data.get("voice_assistant_conversations", [])
        return jsonify({"conversations": conversations}), 200

    except Exception as e:
        logger.error(f"Error fetching conversation history: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/word-repetition/progress', methods=['POST'])
def save_word_repetition_progress():
    data = request.json
    try:
        user_id = data.get("user_id")

        if not user_id:
            return jsonify({"error": "Missing required fields"}), 400

        progress_entry = {
            "accuracy": data.get("accuracy"),
            "words_attempted": data.get("words_attempted"),
            "correct_words": data.get("correct_words"),
            "user_speech": data.get("user_speech", ""),
            "target_words": data.get("target_words", []),
            "timestamp": datetime.now(UTC)
        }

        user_progress_collection.update_one(
            {"user_id": user_id},
            {"$push": { "word_repetition_progress": progress_entry }},
            upsert=True
        )
        return jsonify({"message": "Progress saved successfully"}), 200
    except Exception as e:
        logger.error(f"Error saving word repetition progress: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/progress/<user_id>', methods=['GET'])
def get_user_progress(user_id):
    try:
        if not user_id:
            return jsonify({"error": "User ID is missing"}), 400

        user_data = user_progress_collection.find_one({"user_id": user_id})

        if not user_data:
            return jsonify({"message": "No progress found for this user"}), 200

        return json_util.dumps(user_data), 200, {'Content-Type': 'application/json'}

    except Exception as e:
        logger.error(f"Error fetching user progress: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_response():
    data = request.json
    try:
        user_id = data.get("user_id")
        
        # Handle two types of requests:
        # 1. Scenario-based analysis (scenario, response)
        # 2. Progress-based analysis (progress array)
        
        scenario = data.get("scenario", {})
        response_text = data.get("response", "")
        progress_data = data.get("progress", [])

        if not user_id:
            return jsonify({"error": "User ID is required"}), 400

        # If progress data is provided, analyze overall progress
        if progress_data:
            progress_summary = f"User has completed {len(progress_data)} exercises/activities."
            if isinstance(progress_data, list) and len(progress_data) > 0:
                # Calculate some basic stats if data is available
                progress_summary += f"\nRecent activities: {str(progress_data[-5:])}"
            
            prompt_text = (
                f"Analyze the following user progress and provide personalized feedback and recommendations:\n"
                f"{progress_summary}\n"
                f"Provide encouraging and constructive feedback to help the user improve."
            )
        # Otherwise, analyze scenario-based response
        elif response_text and scenario:
            prompt_text = (
                f"Analyze the following response based on this scenario:\n"
                f"Scenario: {scenario.get('prompt')}\n"
                f"Difficulty: {scenario.get('difficulty')}\n"
                f"Word Limit: {scenario.get('wordLimit')}\n\n"
                f"Response: {response_text}\n"
                f"Provide constructive feedback."
            )
            
            progress_entry = {
                "scenario": scenario.get("prompt"),
                "difficulty": scenario.get("difficulty"),
                "response": response_text,
                "timestamp": datetime.now(UTC)
            }

            user_progress_collection.update_one(
                {"user_id": user_id},
                {"$push": { "scenario_progress": progress_entry }},
                upsert=True
            )
        else:
            return jsonify({"error": "Either progress data or (scenario and response) are required"}), 400

        feedback = call_gemini_with_retry(prompt_text)
        
        return jsonify({
            "feedback": feedback
        })
    except Exception as e:
        logger.error(f"Error in analyze_response: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(500)
def handle_500_error(e):
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Configuration for development vs production
    is_production = os.getenv("FLASK_ENV") == "production"
    debug_mode = not is_production
    port = int(os.getenv("PORT", 5000))
    host = "0.0.0.0" if is_production else "127.0.0.1"
    
    app.run(debug=debug_mode, port=port, host=host)