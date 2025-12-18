import requests
import sys
from datetime import datetime
import json

class DicerAPITester:
    def __init__(self, base_url="https://admin-dicer.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
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
            "details": details
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test("API Health Check", "GET", "", 200)

    def test_login_valid(self):
        """Test login with valid credentials"""
        success, response = self.run_test(
            "Login - Valid Credentials",
            "POST",
            "auth/login",
            200,
            data={"email": "superadmin@gmail.com", "password": "LS@Super"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.log_test("Token Extraction", True, "JWT token received")
            return True
        else:
            self.log_test("Token Extraction", False, "No token in response")
            return False

    def test_login_invalid(self):
        """Test login with invalid credentials"""
        return self.run_test(
            "Login - Invalid Credentials",
            "POST",
            "auth/login",
            401,
            data={"email": "wrong@email.com", "password": "wrongpass"}
        )

    def test_verify_token(self):
        """Test token verification"""
        if not self.token:
            self.log_test("Token Verification", False, "No token available")
            return False
        
        return self.run_test("Token Verification", "GET", "auth/verify", 200)

    def test_get_users_count(self):
        """Test getting user count"""
        if not self.token:
            self.log_test("Get Users Count", False, "No token available")
            return False
        
        return self.run_test("Get Users Count", "GET", "users/count", 200)

    def test_get_users_list(self):
        """Test getting users list"""
        if not self.token:
            self.log_test("Get Users List", False, "No token available")
            return False
        
        success, response = self.run_test("Get Users List", "GET", "users", 200)
        
        if success:
            users = response.get('users', [])
            total = response.get('total', 0)
            self.log_test("Users List Structure", True, f"Found {total} users")
        
        return success

    def test_create_user(self):
        """Test creating a new user"""
        if not self.token:
            self.log_test("Create User", False, "No token available")
            return False, None
        
        test_user_data = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"testuser{datetime.now().strftime('%H%M%S')}@example.com",
            "role": "user"
        }
        
        success, response = self.run_test(
            "Create User",
            "POST",
            "users",
            200,
            data=test_user_data
        )
        
        user_id = response.get('id') if success else None
        return success, user_id

    def test_create_duplicate_user(self):
        """Test creating user with duplicate email"""
        if not self.token:
            self.log_test("Create Duplicate User", False, "No token available")
            return False
        
        duplicate_data = {
            "name": "Duplicate User",
            "email": "superadmin@gmail.com",  # Using admin email
            "role": "user"
        }
        
        return self.run_test(
            "Create Duplicate User",
            "POST",
            "users",
            400,
            data=duplicate_data
        )

    def test_delete_user(self, user_id):
        """Test deleting a user"""
        if not self.token:
            self.log_test("Delete User", False, "No token available")
            return False
        
        if not user_id:
            self.log_test("Delete User", False, "No user ID provided")
            return False
        
        return self.run_test(f"Delete User ({user_id})", "DELETE", f"users/{user_id}", 200)

    def test_delete_nonexistent_user(self):
        """Test deleting non-existent user"""
        if not self.token:
            self.log_test("Delete Non-existent User", False, "No token available")
            return False
        
        fake_id = "non-existent-user-id"
        return self.run_test(
            "Delete Non-existent User",
            "DELETE",
            f"users/{fake_id}",
            404
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Dicer Admin Panel API Tests")
        print("=" * 50)
        
        # Test API health
        self.test_health_check()
        
        # Test authentication
        self.test_login_invalid()
        login_success = self.test_login_valid()
        
        if login_success:
            self.test_verify_token()
            
            # Test user operations
            self.test_get_users_count()
            self.test_get_users_list()
            
            # Test user creation and deletion
            create_success, user_id = self.test_create_user()
            self.test_create_duplicate_user()
            
            if create_success and user_id:
                self.test_delete_user(user_id)
            
            self.test_delete_nonexistent_user()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check details above.")
            return 1

def main():
    tester = DicerAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())