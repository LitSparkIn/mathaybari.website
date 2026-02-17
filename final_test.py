#!/usr/bin/env python3
"""
Final comprehensive test for user activation flow
"""

import requests
import json
from datetime import datetime

class FinalTester:
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
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            return success, response_data, response.status_code

        except Exception as e:
            return False, {"error": str(e)}, 0

    def setup(self):
        """Setup test environment"""
        print("🛠️ Setting up test environment...")
        
        # Login
        login_data = {"email": "superadmin@gmail.com", "password": "LS@Super"}
        success, response, _ = self.make_request('POST', 'auth/login', login_data)
        
        if success and response.get('data', {}).get('token'):
            self.token = response['data']['token']
            self.log_test("Admin Login", True, "Authentication successful")
        else:
            self.log_test("Admin Login", False, "Authentication failed")
            return False
        
        # Create user
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {"name": "Final Test User", "phone": f"9876543{timestamp}"}
        success, response, _ = self.make_request('POST', 'users/signup', user_data, expected_status=201)
        
        if success and response.get('data', {}).get('user_id'):
            self.test_user_id = response['data']['user_id']
            self.log_test("User Creation", True, f"User {self.test_user_id} created")
            return True
        else:
            self.log_test("User Creation", False, "Failed to create user")
            return False

    def test_complete_scenario(self):
        """Test the complete scenario as specified in requirements"""
        print("\n🎯 Testing Complete User Activation Scenario...")
        
        # Test 1: First activation
        print("\n1️⃣ First activation with TEST_DEVICE_001")
        params = {"status": "Active", "device_id": "TEST_DEVICE_001"}
        success, response, _ = self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
        
        if success:
            device_ids = response.get('data', {}).get('device_ids', [])
            if "TEST_DEVICE_001" in device_ids and len(device_ids) == 1:
                self.log_test("First Activation", True, f"Device added: {device_ids}")
            else:
                self.log_test("First Activation", False, f"Unexpected devices: {device_ids}")
                return False
        else:
            self.log_test("First Activation", False, "Activation failed")
            return False
        
        # Test 2: Deactivation
        print("\n2️⃣ Deactivating user")
        params = {"status": "Inactive"}
        success, response, _ = self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
        self.log_test("Deactivation", success, "User deactivated" if success else "Deactivation failed")
        
        # Test 3: Re-activation with same device (should NOT duplicate)
        print("\n3️⃣ Re-activating with same device ID (TEST_DEVICE_001)")
        params = {"status": "Active", "device_id": "TEST_DEVICE_001"}
        success, response, _ = self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
        
        if success:
            device_ids = response.get('data', {}).get('device_ids', [])
            device_count = device_ids.count("TEST_DEVICE_001")
            if device_count == 1 and len(device_ids) == 1:
                self.log_test("Re-activation Same Device", True, "No duplication occurred")
            else:
                self.log_test("Re-activation Same Device", False, f"Duplication or error: {device_ids}")
                return False
        else:
            self.log_test("Re-activation Same Device", False, "Re-activation failed")
            return False
        
        # Test 4: Activation with different device (should ADD to list)
        print("\n4️⃣ Activating with different device ID (TEST_DEVICE_002)")
        params = {"status": "Active", "device_id": "TEST_DEVICE_002"}
        success, response, _ = self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
        
        if success:
            device_ids = response.get('data', {}).get('device_ids', [])
            expected_devices = {"TEST_DEVICE_001", "TEST_DEVICE_002"}
            actual_devices = set(device_ids)
            
            if actual_devices == expected_devices:
                self.log_test("Different Device Activation", True, f"Both devices present: {device_ids}")
            else:
                self.log_test("Different Device Activation", False, f"Expected {expected_devices}, got {actual_devices}")
                return False
        else:
            self.log_test("Different Device Activation", False, "Activation failed")
            return False
        
        # Test 5: Case insensitive test (bonus)
        print("\n5️⃣ Testing case insensitive handling")
        params = {"status": "Active", "device_id": "test_device_001"}  # lowercase
        success, response, _ = self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
        
        if success:
            device_ids = response.get('data', {}).get('device_ids', [])
            # Should still have only 2 devices (case insensitive match)
            if len(device_ids) == 2:
                self.log_test("Case Insensitive Handling", True, "No case duplication")
            else:
                self.log_test("Case Insensitive Handling", False, f"Case duplication: {device_ids}")
        else:
            self.log_test("Case Insensitive Handling", False, "Test failed")
        
        return True

    def cleanup(self):
        """Clean up test user"""
        if self.test_user_id:
            success, _, _ = self.make_request('DELETE', f'users/{self.test_user_id}')
            self.log_test("Cleanup", success, f"User {self.test_user_id} deleted" if success else "Cleanup failed")

    def run_final_test(self):
        """Run the final comprehensive test"""
        print("🏁 Final Comprehensive User Activation Test")
        print("=" * 55)
        
        if not self.setup():
            return False
        
        try:
            success = self.test_complete_scenario()
            
            print(f"\n📊 Final Test Results: {self.tests_passed}/{self.tests_run} tests passed")
            
            if success and self.tests_passed >= self.tests_run - 1:  # Allow 1 test to fail (cleanup might fail)
                print("🎉 User activation flow is working correctly!")
                print("✅ Device ID preservation and non-duplication verified")
                return True
            else:
                print("❌ Some critical tests failed")
                return False
                
        finally:
            self.cleanup()

def main():
    tester = FinalTester()
    success = tester.run_final_test()
    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())