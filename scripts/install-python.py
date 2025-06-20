#!/usr/bin/env python3
"""
Script to install the cloudscraper library
"""

import os
import subprocess
import sys
from pathlib import Path


def run_command(command):
    """Executes a command and returns the result"""
    try:
        result = subprocess.run(
            command, shell=True, check=True, capture_output=True, text=True
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr


def check_python_version():
    """Checks the Python version"""
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    return version.major >= 3


def install_cloudscraper():
    """Installs the cloudscraper library"""
    print("Installing cloudscraper...")

    # Try to install using pip
    pip_command = f"{sys.executable} -m pip install cloudscraper"
    success, output = run_command(pip_command)

    if success:
        print("✅ cloudscraper installed successfully!")
        return True
    else:
        print("⚠️  Global installation failed, trying with virtual environment...")
        return create_virtual_environment()


def create_virtual_environment():
    """Creates a virtual environment and installs cloudscraper"""
    print("🔧 Creating virtual environment...")

    # Create virtual environment
    venv_path = Path.cwd() / ".venv"
    venv_command = f"{sys.executable} -m venv {venv_path}"

    success, output = run_command(venv_command)
    if not success:
        print(f"❌ Error creating virtual environment: {output}")
        return False

    # Determine the pip command for the virtual environment
    if os.name == "nt":  # Windows
        pip_path = venv_path / "Scripts" / "pip"
    else:  # Unix/Linux/macOS
        pip_path = venv_path / "bin" / "pip"

    # Install cloudscraper in the virtual environment
    venv_pip_command = f"{pip_path} install cloudscraper"
    success, output = run_command(venv_pip_command)

    if success:
        print("✅ cloudscraper installed successfully in virtual environment!")
        print("📝 To activate the virtual environment manually:")
        if os.name == "nt":
            print(f"   {venv_path}\\Scripts\\activate.bat")
        else:
            print(f"   source {venv_path}/bin/activate")
        return True
    else:
        error_msg = f"❌ Error installing cloudscraper in virtual environment: {output}"
        print(error_msg)
        return False


def main():
    print("🚀 Checking and installing dependencies...")

    if not check_python_version():
        print("❌ Python 3 is required!")
        sys.exit(1)

    if install_cloudscraper():
        print("✅ All dependencies installed successfully!")
        sys.exit(0)
    else:
        print("❌ Failed to install dependencies!")
        sys.exit(1)


if __name__ == "__main__":
    main()
