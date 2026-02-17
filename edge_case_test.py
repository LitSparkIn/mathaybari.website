#!/usr/bin/env python3
"""
Additional edge case tests for user activation flow
"""

import requests
import json
import sys
from datetime import datetime

class EdgeCaseTester:
    def __init__(self):
        self.base_url = "https://git-mirror-9.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def make_request(self, method, endpoint, data=None, params=None, expected_status=200):
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, params=params, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            return success, response_data, response.status_code

        except Exception as e:
            return False, {"error": str(e)}, 0

    def login_and_create_user(self):
        """Setup: Login and create test user"""
        # Login
        login_data = {"email": "superadmin@gmail.com", "password": "LS@Super"}
        success, response, _ = self.make_request('POST', 'auth/login', login_data)
        
        if success and response.get('data', {}).get('token'):
            self.token = response['data']['token']
        else:
            return False
        
        # Create user
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {"name": "Edge Test User", "phone": f"9876543{timestamp}"}
        success, response, _ = self.make_request('POST', 'users/signup', user_data, expected_status=201)
        
        if success and response.get('data', {}).get('user_id'):
            self.test_user_id = response['data']['user_id']
            return True
        return False

    def test_case_insensitive_device_id(self):
        """Test case-insensitive device ID handling"""
        print("\n🔍 Testing Case-Insensitive Device ID...")
        
        # First activation with lowercase device ID
        params = {"status": "Active", "device_id": "test_device_mixed"}
        success, response, _ = self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
        
        if not success:
            self.log_test("Case Insensitive Setup", False, "Failed initial activation")
            return False
        
        # Deactivate
        params = {"status": "Inactive"}
        self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
        
        # Re-activate with uppercase version of same device ID
        params = {"status": "Active", "device_id": "TEST_DEVICE_MIXED"}
        success, response, _ = self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
        
        if success:
            device_ids = response.get('data', {}).get('device_ids', [])
            # Should not duplicate if case-insensitive comparison works
            unique_devices = len(device_ids)
            if unique_devices == 1:
                self.log_test("Case Insensitive Device ID", True, f"No case duplication: {device_ids}")
                return True
            else:
                self.log_test("Case Insensitive Device ID", False, f"Case duplication occurred: {device_ids}")
                return False
        else:
            self.log_test("Case Insensitive Device ID", False, "Re-activation failed")
            return False

    def test_activation_without_device_id(self):
        """Test activation without device_id parameter"""
        print("\n🚫 Testing Activation Without Device ID...")
        
        # Deactivate first
        params = {"status": "Inactive"}
        self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
        
        # Try to activate without device_id
        params = {"status": "Active"}  # No device_id
        success, response, status_code = self.make_request('PATCH', f'users/{self.test_user_id}/status', 
                                                         params=params, expected_status=400)
        
        if success and status_code == 400:
            self.log_test("Activation Without Device ID", True, "Correctly rejected activation without device_id")
            return True
        else:
            self.log_test("Activation Without Device ID", False, f"Expected 400 error, got {status_code}")
            return False

    def test_multiple_device_cycle(self):
        """Test multiple activate/deactivate cycles with different devices"""
        print("\n🔄 Testing Multiple Device Activation Cycle...")
        
        devices_to_test = ["DEVICE_A", "DEVICE_B", "DEVICE_C"]
        expected_devices = []
        
        for device in devices_to_test:
            # Activate with new device
            params = {"status": "Active", "device_id": device}
            success, response, _ = self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
            
            if success:
                expected_devices.append(device)
                device_ids = response.get('data', {}).get('device_ids', [])
                if set(device_ids) == set(expected_devices):
                    continue
                else:
                    self.log_test("Multiple Device Cycle", False, f"Device list mismatch for {device}")
                    return False
            else:
                self.log_test("Multiple Device Cycle", False, f"Failed to activate with {device}")
                return False
        
        self.log_test("Multiple Device Cycle", True, f"All devices added correctly: {expected_devices}")
        return True

    def cleanup(self):
        """Clean up test user"""
        if self.test_user_id:
            self.make_request('DELETE', f'users/{self.test_user_id}')

    def run_edge_case_tests(self):
        """Run all edge case tests"""
        print("🔬 Starting Edge Case Tests for User Activation")
        print("=" * 50)
        
        if not self.login_and_create_user():
            print("❌ Failed to setup test environment")
            return False
        
        try:
            self.test_case_insensitive_device_id()
            self.test_activation_without_device_id()
            self.test_multiple_device_cycle()
        finally:
            self.cleanup()
        
        print(f"\n📊 Edge Case Summary: {self.tests_passed}/{self.tests_run} tests passed")
        return self.tests_passed == self.tests_run

def main():
    tester = EdgeCaseTester()
    success = tester.run_edge_case_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())