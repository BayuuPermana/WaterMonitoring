from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

# Load the model
model = joblib.load('D:\\porto\\app-web\\WaterMonitoring\\backend\\water_quality_model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True)
    # Assuming the input data is a list of feature values
    features = np.array(data['features']).reshape(1, -1)
    prediction = model.predict(features)
    # Convert prediction to a standard Python type
    output = int(prediction[0])
    return jsonify({'prediction': output})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
