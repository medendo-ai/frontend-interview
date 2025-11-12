import os
import unittest
from unittest.mock import patch, AsyncMock
import httpx
from main import app, summarize, SummarizeRequest, API_URL, API_KEY
from fastapi.testclient import TestClient
from fastapi import HTTPException

SAMPLE_TRANSCRIPT = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. \
                    Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, \
                    when an unknown printer took a galley of type and scrambled it to make a type specimen book. \
                    It has survived not only five centuries, but also the leap into electronic typesetting, \
                    remaining essentially unchanged. It was popularised in the 1960s \
                    with the release of Letraset sheets containing Lorem Ipsum passages, \
                    and more recently with desktop publishing software like Aldus PageMaker \
                    including versions of Lorem Ipsum"

@patch('main.httpx.AsyncClient.post')
class TestSummarization(unittest.TestCase):

    def test_successful_api_call(self, mock_openai_api_post):
        
        mock_openai_api_post.return_value = httpx.Response(200, json={'choices': [{"message":{"content":"mocked response text from openai api"}}]})
        client = TestClient(app)

        response = client.post(
            "/summarize",
            json={"transcript": SAMPLE_TRANSCRIPT}
        )
        
        mock_openai_api_post.assert_called_once_with(
            API_URL,
            headers={'Authorization': f"Bearer {API_KEY}", 'Content-Type': 'application/json'},
            json={
                'messages': [
                    {
                        'role': 'user',
                        'content': "Please summarize the following content:\n\nLorem Ipsum is simply dummy text of the printing and typesetting industry. \
                    Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, \
                    when an unknown printer took a galley of type and scrambled it to make a type specimen book. \
                    It has survived not only five centuries, but also the leap into electronic typesetting, \
                    remaining essentially unchanged. It was popularised in the 1960s \
                    with the release of Letraset sheets containing Lorem Ipsum passages, \
                    and more recently with desktop publishing software like Aldus PageMaker \
                    including versions of Lorem Ipsum"
                    }
                ]
            }
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), "mocked response text from openai api")

    def test_missing_transcript_field(self, mock_openai_api_post):
        """Test when transcript field is missing"""
        client = TestClient(app)
        
        response = client.post(
            "/summarize",
            json={"transcript": ""}
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Bad request, text cannot be empty")


    def test_malformated_request(self, mock_openai_api_post):
        client = TestClient(app)
        
        response = client.post(
            "/summarize",
            json={"malformated_field": SAMPLE_TRANSCRIPT}
        )
        self.assertEqual(response.status_code, 422)

