#!/usr/bin/env python3
"""
Deployment Verification Script
Checks if the backend is properly configured for deployment
"""

import os
import sys
from pathlib import Path

def check_env_file():
    """Check if .env file exists"""
    env_path = Path(".env")
    if not env_path.exists():
        print("❌ .env file not found")
        return False
    print("✅ .env file exists")
    return True

def check_env_variables():
    """Check if required environment variables are set"""
    from dotenv import load_dotenv
    load_dotenv()
    
    required_vars = ["MONGO_URI", "BACKEND_URL", "ALLOWED_ORIGINS"]
    missing = []
    
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing.append(var)
            print(f"❌ {var} is not set")
        else:
            # Mask sensitive values
            if "MONGO_URI" in var:
                display_value = value[:20] + "..." if len(value) > 20 else value
            else:
                display_value = value
            print(f"✅ {var} = {display_value}")
    
    return len(missing) == 0

def check_app_object():
    """Check if main app object is named 'app'"""
    try:
        from app.main import app
        print(f"✅ App object found: {app.title}")
        return True
    except ImportError as e:
        print(f"❌ Failed to import app: {e}")
        return False

def check_uploads_directory():
    """Check if uploads directory exists"""
    uploads_path = Path("uploads")
    if not uploads_path.exists():
        print("⚠️  uploads/ directory doesn't exist (will be created automatically)")
        return True
    print("✅ uploads/ directory exists")
    return True

def check_requirements():
    """Check if requirements.txt exists"""
    req_path = Path("requirements.txt")
    if not req_path.exists():
        print("❌ requirements.txt not found")
        return False
    print("✅ requirements.txt exists")
    return True

def check_cors_config():
    """Check CORS configuration"""
    from dotenv import load_dotenv
    load_dotenv()
    
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
    if allowed_origins == "*":
        print("⚠️  CORS allows all origins (*) - OK for development, update for production")
    else:
        print(f"✅ CORS configured for: {allowed_origins}")
    return True

def main():
    print("=" * 60)
    print("Backend Deployment Verification")
    print("=" * 60)
    print()
    
    checks = [
        ("Environment File", check_env_file),
        ("Environment Variables", check_env_variables),
        ("App Object", check_app_object),
        ("Uploads Directory", check_uploads_directory),
        ("Requirements File", check_requirements),
        ("CORS Configuration", check_cors_config),
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n{name}:")
        print("-" * 40)
        try:
            result = check_func()
            results.append(result)
        except Exception as e:
            print(f"❌ Error: {e}")
            results.append(False)
    
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Results: {passed}/{total} checks passed")
    print("=" * 60)
    
    if all(results):
        print("\n✅ Backend is ready for deployment!")
        return 0
    else:
        print("\n⚠️  Some checks failed. Please review the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
