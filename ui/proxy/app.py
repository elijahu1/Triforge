import json
import boto3
from flask import Flask, jsonify, request
import os

app = Flask(__name__)

SECRET_NAME = os.getenv("SECRET_NAME", "my-app-config")
REGION = os.getenv("AWS_REGION", "us-east-1")

_secret_cache = None


def get_secret():
    client = boto3.client("secretsmanager", region_name=REGION)
    response = client.get_secret_value(SecretId=SECRET_NAME)

    # secret is a plain string, return it as-is.
    # Example: "my-sagemaker-endpoint-name"
    return response["SecretString"]


def get_config():
    global _secret_cache
    if _secret_cache:
        return _secret_cache
    _secret_cache = get_secret()
    return _secret_cache


@app.route("/invoke", methods=["POST"])
def invoke():
    endpoint_name = get_config()
    payload = request.get_json(silent=True) or {}
    
    # decode base64 back to raw audio bytes
    import base64
    audio_bytes = base64.b64decode(payload["audio"])
    
    runtime = boto3.client("sagemaker-runtime", region_name=REGION)
    response = runtime.invoke_endpoint(
        EndpointName=endpoint_name,
        ContentType="audio/wav",
        Accept="application/json",
        Body=audio_bytes,
    )
    result = json.loads(response["Body"].read().decode("utf-8"))
    transcript = result.get("text", "No transcription found")
    return jsonify({"transcript": transcript})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
