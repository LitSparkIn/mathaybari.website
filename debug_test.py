#!/usr/bin/env python3
"""
Debug test for multiple device activation issue
"""

import requests
import json
from datetime import datetime

class DebugTester:
    def __init__(self):
        self.base_url = "https://git-mirror-9.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.token = None
        self.test_user_id = None

    def make_request(self, method, endpoint, data=None, params=None, expected_status=200):
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            return response.status_code == expected_status, response_data, response.status_code

        except Exception as e:
            return False, {"error": str(e)}, 0

    def setup_user(self):
        """Setup test user"""
        # Login
        login_data = {"email": "superadmin@gmail.com", "password": "LS@Super"}
        success, response, _ = self.make_request('POST', 'auth/login', login_data)
        
        if success and response.get('data', {}).get('token'):
            self.token = response['data']['token']
        
        # Create user
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {"name": "Debug User", "phone": f"9876543{timestamp}"}
        success, response, _ = self.make_request('POST', 'users/signup', user_data, expected_status=201)
        
        if success and response.get('data', {}).get('user_id'):
            self.test_user_id = response['data']['user_id']
            print(f"Created test user with ID: {self.test_user_id}")
            return True
        return False

    def debug_multiple_devices(self):
        """Debug the multiple device activation issue"""
        print("🔍 Debugging Multiple Device Activation...")
        
        devices = ["DEVICE_A", "DEVICE_B", "DEVICE_C"]
        
        for i, device in enumerate(devices):
            print(f"\n--- Activating with {device} ---")
            
            # Activate with device
            params = {"status": "Active", "device_id": device}
            success, response, status_code = self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
            
            print(f"Status Code: {status_code}")
            print(f"Success: {success}")
            print(f"Response: {json.dumps(response, indent=2)}")
            
            if success:
                device_ids = response.get('data', {}).get('device_ids', [])
                print(f"Current device_ids: {device_ids}")
                expected_count = i + 1
                actual_count = len(device_ids)
                
                if actual_count != expected_count:
                    print(f"❌ Expected {expected_count} devices, got {actual_count}")
                else:
                    print(f"✅ Correct count: {actual_count}")

    def get_current_user_state(self):
        """Get current user state"""
        success, response, _ = self.make_request('GET', 'users')
        if success:
            users = response.get('data', {}).get('users', [])
            test_user = next((u for u in users if u['user_id'] == self.test_user_id), None)
            if test_user:
                print(f"Current user state: {json.dumps(test_user, indent=2)}")
                return test_user
        return None

    def cleanup(self):
        if self.test_user_id:
            self.make_request('DELETE', f'users/{self.test_user_id}')

def main():
    tester = DebugTester()
    
    if tester.setup_user():
        tester.debug_multiple_devices()
        print("\n--- Final User State ---")
        tester.get_current_user_state()
        tester.cleanup()
    else:
        print("Failed to setup user")

if __name__ == "__main__":
    main()