#!/usr/bin/env python3
"""
Comprehensive test for user activation flow in Dicer Admin Panel backend.
Tests the device ID preservation functionality during activate/deactivate cycles.
"""

import requests
import json
import sys
from datetime import datetime

class UserActivationTester:
    def __init__(self):
        # Use the frontend environment URL as specified
        self.base_url = "https://git-mirror-9.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def make_request(self, method, endpoint, data=None, params=None, expected_status=200):
        """Make HTTP request to API"""
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
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if not success:
                print(f"    Expected status: {expected_status}, Got: {response.status_code}")
                print(f"    Response: {response_data}")

            return success, response_data, response.status_code

        except Exception as e:
            print(f"    Request failed: {str(e)}")
            return False, {"error": str(e)}, 0

    def test_admin_login(self):
        """Step 1: Login to get JWT token"""
        print("\n🔐 Testing Admin Login...")
        
        login_data = {
            "email": "superadmin@gmail.com",
            "password": "LS@Super"
        }
        
        success, response, status_code = self.make_request('POST', 'auth/login', login_data)
        
        if success and response.get('data', {}).get('token'):
            self.token = response['data']['token']
            self.log_test("Admin Login", True, f"JWT token obtained successfully")
            return True
        else:
            self.log_test("Admin Login", False, f"Login failed: {response}")
            return False

    def test_create_test_user(self):
        """Step 2: Create a test user"""
        print("\n👤 Creating Test User...")
        
        if not self.token:
            self.log_test("Create Test User", False, "No authentication token")
            return False
        
        # Generate unique phone number to avoid conflicts
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "name": "Test User Activation",
            "phone": f"9876543{timestamp}"  # Unique phone number
        }
        
        success, response, status_code = self.make_request('POST', 'users/signup', user_data, expected_status=201)
        
        if success and response.get('data', {}).get('user_id'):
            self.test_user_id = response['data']['user_id']
            self.log_test("Create Test User", True, f"User created with ID: {self.test_user_id}")
            print(f"    Phone: {user_data['phone']}")
            print(f"    Password: {response['data'].get('password')}")
            return True
        else:
            self.log_test("Create Test User", False, f"Failed to create user: {response}")
            return False

    def test_first_activation(self):
        """Step 3: Activate user for the first time with device ID"""
        print("\n🟢 Testing First-Time Activation...")
        
        if not self.test_user_id:
            self.log_test("First Activation", False, "No test user ID available")
            return False
        
        params = {
            "status": "Active",
            "device_id": "TEST_DEVICE_001"
        }
        
        success, response, status_code = self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
        
        if success:
            device_ids = response.get('data', {}).get('device_ids', [])
            if "TEST_DEVICE_001" in device_ids:
                self.log_test("First Activation", True, f"User activated with device_ids: {device_ids}")
                return True
            else:
                self.log_test("First Activation", False, f"Device ID not found in response: {device_ids}")
                return False
        else:
            self.log_test("First Activation", False, f"Activation failed: {response}")
            return False

    def verify_user_device_ids(self, expected_devices, step_name):
        """Verify user's current device IDs"""
        print(f"\n🔍 Verifying Device IDs for {step_name}...")
        
        success, response, status_code = self.make_request('GET', 'users')
        
        if success:
            users = response.get('data', {}).get('users', [])
            test_user = next((u for u in users if u['user_id'] == self.test_user_id), None)
            
            if test_user:
                current_device_ids = test_user.get('device_ids', [])
                devices_match = set(current_device_ids) == set(expected_devices)
                
                if devices_match:
                    self.log_test(f"Verify Device IDs - {step_name}", True, f"Device IDs match: {current_device_ids}")
                    return True
                else:
                    self.log_test(f"Verify Device IDs - {step_name}", False, 
                                f"Expected: {expected_devices}, Got: {current_device_ids}")
                    return False
            else:
                self.log_test(f"Verify Device IDs - {step_name}", False, "Test user not found")
                return False
        else:
            self.log_test(f"Verify Device IDs - {step_name}", False, f"Failed to get users: {response}")
            return False

    def test_deactivation(self):
        """Step 5: Deactivate the user"""
        print("\n🔴 Testing User Deactivation...")
        
        params = {
            "status": "Inactive"
        }
        
        success, response, status_code = self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
        
        if success:
            self.log_test("User Deactivation", True, "User deactivated successfully")
            return True
        else:
            self.log_test("User Deactivation", False, f"Deactivation failed: {response}")
            return False

    def test_reactivation_same_device(self):
        """Step 6: Re-activate with the SAME device ID"""
        print("\n🔄 Testing Re-activation with Same Device ID...")
        
        params = {
            "status": "Active",
            "device_id": "TEST_DEVICE_001"  # Same device ID
        }
        
        success, response, status_code = self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
        
        if success:
            device_ids = response.get('data', {}).get('device_ids', [])
            # Should still have only one entry for TEST_DEVICE_001
            if device_ids.count("TEST_DEVICE_001") == 1 and len(device_ids) == 1:
                self.log_test("Re-activation Same Device", True, f"No duplication: {device_ids}")
                return True
            else:
                self.log_test("Re-activation Same Device", False, 
                            f"Device ID duplicated or unexpected devices: {device_ids}")
                return False
        else:
            self.log_test("Re-activation Same Device", False, f"Re-activation failed: {response}")
            return False

    def test_activation_different_device(self):
        """Step 8: Test activation with a DIFFERENT device ID"""
        print("\n📱 Testing Activation with Different Device ID...")
        
        params = {
            "status": "Active", 
            "device_id": "TEST_DEVICE_002"  # Different device ID
        }
        
        success, response, status_code = self.make_request('PATCH', f'users/{self.test_user_id}/status', params=params)
        
        if success:
            device_ids = response.get('data', {}).get('device_ids', [])
            # Should have both device IDs now
            expected_devices = ["TEST_DEVICE_001", "TEST_DEVICE_002"]
            if set(device_ids) == set(expected_devices):
                self.log_test("Activation Different Device", True, f"Both devices present: {device_ids}")
                return True
            else:
                self.log_test("Activation Different Device", False, 
                            f"Expected {expected_devices}, Got: {device_ids}")
                return False
        else:
            self.log_test("Activation Different Device", False, f"Activation failed: {response}")
            return False

    def test_cleanup(self):
        """Step 9: Clean up by deleting the test user"""
        print("\n🗑️ Cleaning Up Test User...")
        
        if not self.test_user_id:
            self.log_test("Cleanup", True, "No user to clean up")
            return True
        
        success, response, status_code = self.make_request('DELETE', f'users/{self.test_user_id}')
        
        if success:
            self.log_test("Cleanup", True, f"Test user {self.test_user_id} deleted successfully")
            return True
        else:
            self.log_test("Cleanup", False, f"Failed to delete user: {response}")
            return False

    def run_complete_activation_flow_test(self):
        """Run the complete user activation flow test"""
        print("🚀 Starting User Activation Flow Test")
        print("=" * 60)
        print(f"Backend URL: {self.api_url}")
        print("=" * 60)
        
        # Step 1: Login
        if not self.test_admin_login():
            return False
        
        # Step 2: Create test user
        if not self.test_create_test_user():
            return False
        
        # Step 3: First activation
        if not self.test_first_activation():
            return False
        
        # Step 4: Verify initial device ID
        if not self.verify_user_device_ids(["TEST_DEVICE_001"], "After First Activation"):
            return False
        
        # Step 5: Deactivate
        if not self.test_deactivation():
            return False
        
        # Step 6: Re-activate with same device ID
        if not self.test_reactivation_same_device():
            return False
        
        # Step 7: Verify no duplication
        if not self.verify_user_device_ids(["TEST_DEVICE_001"], "After Re-activation Same Device"):
            return False
        
        # Step 8: Activate with different device ID
        if not self.test_activation_different_device():
            return False
        
        # Step 9: Verify both devices present
        if not self.verify_user_device_ids(["TEST_DEVICE_001", "TEST_DEVICE_002"], "After Different Device Activation"):
            return False
        
        # Step 10: Cleanup
        self.test_cleanup()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All user activation tests passed!")
            print("✅ Device ID preservation is working correctly")
        else:
            print("⚠️ Some tests failed. Check details above.")
            
            # Print failed tests
            failed_tests = [t for t in self.test_results if not t['success']]
            if failed_tests:
                print("\n❌ Failed Tests:")
                for test in failed_tests:
                    print(f"  - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main function"""
    tester = UserActivationTester()
    success = tester.run_complete_activation_flow_test()
    tester.print_summary()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())