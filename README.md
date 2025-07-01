# Chat Application Module

This is a **chat application module** that is part of a larger application. It enables the chat feature within the main app.
[develeped on Android using Android studio]
## Getting Started

Follow these steps to set up and run the application:

### 1. Clone the Repository
```bash
git clone https://github.com/g-sat/Chat_app.git
cd .\chat_app\
```

---
## Backend setup

#### 2. Create a virtual Environment(python3.11)
```bash
pip install venv
cd .\bknd\
Remove-Item .\env\ -Recurse -Force
python3.11 -m venv env
.\env\Scripts\activate
```

#### 3. Installing Python packages
```shell
pip install .\requirments.txt
```

---
## Frontend setup

#### 4. React native setup
```bash
cd .\chat_app\
npm install
```

---
> [!NOTE]
> Configure SDKs in SDK Manager
>🔍 Open SDK Manager inside Android Studio
> 📌 Go to the SDK Platforms tab and select these versions: ✅ Android 13.0 ("Tiramisu") – API 33-ext4
> ✅ Android 12.0 ("S") – API 31
> ✅ Android 11.0 ("R") – API 30
>📌 Go to the SDK Tools tab and check these options: ✅ Android SDK Build-Tools 35
> ✅ Android SDK Command-line Tools
> ✅ Android Emulator
> ✅ Android Emulator Hypervisor Driver (Installer)
> ✅ Android SDK Platform-Tools
> ✅ Google Play Services

## Run the app
```bash























